import { binToHex, cashAddressToLockingBytecode, decodeHdKeyUnchecked, decodeTransactionBCH, HdKeyVersion, encodeTransactionBCH, hashTransaction, hexToBin, publicKeyToP2pkhCashAddress, type Transaction } from '@bitauth/libauth';
import { chipnet, mainnet } from '@electrum-cash/checkpoint';
import { ElectrumClient, type ElectrumClientEvents } from '@electrum-cash/network';
import { chipnetServers, mainnetServers } from '@electrum-cash/servers';
import type { BchNetwork } from '../lib/config';
import { checkCashAddress, sameLockingBytecode } from '../lib/policy';

export interface WizardManager {
  getPubkey: (childIndex:number, addressIndex:bigint) => Uint8Array|undefined;
  getXpubNode: (childIndex:number) => unknown;
  getSessionPaths: () => { name:string; xpub:string }[];
  signTransaction: (request: { transaction:{ transaction:string; sourceOutputs:SourceOutput[]; broadcast:boolean; userPrompt:string }; inputPaths:[number,string,number][] }) => Promise<{ signedTransaction:string; error?:string }>;
}
type SourceOutput = Transaction['inputs'][number] & Transaction['outputs'][number];
type NetworkUtxo = { tx_hash:string; tx_pos:number; value:string|number|bigint; height:number };
type NetworkHistoryEntry = { tx_hash?:unknown; height?:unknown };
type Candidate = { txid:string; vout:number; value:bigint; pathName:'receive'|'change'|'defi'; addressIndex:number; lockingBytecode:Uint8Array; height:number };
export interface PaymentPlan { network:BchNetwork; recipient:string; amountSats:bigint; feeSats:bigint; totalInputSats:bigint; availableBalanceSats:bigint; unsignedTransaction:string; sourceOutputs:SourceOutput[]; inputPaths:[number,string,number][]; }
export interface PaymentReceipt { txid:string; network:BchNetwork; explorerUrl:string; amountSats:bigint; feeSats:bigint; broadcastAt:string; }

const ADDRESS_GAP_LIMIT=20;
const MAX_ADDRESSES_PER_PATH=200;

function serverList(network:BchNetwork, hostOverride:string) {
  const defaults = network==='mainnet' ? mainnetServers : chipnetServers;
  if (!hostOverride) return defaults;
  const configured=defaults.find(server=>server.host===hostOverride)??{host:hostOverride,version:defaults[0].version,transports:{wss:50004}};
  return [configured,...defaults.filter(server=>server.host!==hostOverride)];
}
function checkpoint(network:BchNetwork) { return network==='mainnet' ? mainnet : chipnet; }
function expectedKeyVersion(network:BchNetwork) { return network==='mainnet' ? HdKeyVersion.mainnetPublicKey : HdKeyVersion.testnetPublicKey; }
function toErrorText(value:unknown) { return value instanceof Error ? value.message : String(value); }

async function withVerifiedElectrum<T>(network:BchNetwork, hostOverride:string, work:(client:ElectrumClient<ElectrumClientEvents>)=>Promise<T>):Promise<T> {
  const failures:string[]=[];
  for (const server of serverList(network,hostOverride)) {
    const client = new ElectrumClient('Pact','1.4.1',server.host,{port:server.transports.wss??50004,encrypted:true,timeoutInMilliSeconds:15000,verifyConnectionTimeoutInMilliSeconds:15000,useBigInt:true});
    try {
      await client.connect();
      const features = await client.request('server.features');
      if (features instanceof Error || !features || typeof features!=='object') throw new Error('The BCH provider did not return its network identity.');
      const reported = (features as {genesis_hash?:unknown}).genesis_hash;
      if (typeof reported!=='string' || reported.toLowerCase()!==checkpoint(network).genesis.blockHash.toLowerCase()) throw new Error('The BCH provider is on a different network.');
      return await work(client);
    } catch (error) {
      failures.push(server.host+': '+toErrorText(error));
    } finally {
      await client.disconnect().catch(()=>false);
    }
  }
  throw new Error(failures[0] || 'No BCH Electrum provider is available.');
}

async function withVerifiedElectrumUntil(network:BchNetwork,hostOverride:string,work:(client:ElectrumClient<ElectrumClientEvents>)=>Promise<boolean>):Promise<void> {
  const failures:string[]=[];
  let scannedProvider=false;
  for (const server of serverList(network,hostOverride)) {
    const client=new ElectrumClient('Pact','1.4.1',server.host,{port:server.transports.wss??50004,encrypted:true,timeoutInMilliSeconds:15000,verifyConnectionTimeoutInMilliSeconds:15000,useBigInt:true});
    try {
      await client.connect();
      const features=await client.request('server.features');
      if (features instanceof Error||!features||typeof features!=='object') throw new Error('The BCH provider did not return its network identity.');
      const reported=(features as {genesis_hash?:unknown}).genesis_hash;
      if (typeof reported!=='string'||reported.toLowerCase()!==checkpoint(network).genesis.blockHash.toLowerCase()) throw new Error('The BCH provider is on a different network.');
      const enough=await work(client);
      scannedProvider=true;
      if (enough) return;
    } catch (error) {
      failures.push(server.host+': '+toErrorText(error));
    } finally {
      await client.disconnect().catch(()=>false);
    }
  }
  if (!scannedProvider) throw new Error(failures[0]||'No BCH Electrum provider is available.');
}

export async function verifyBchProvider(network:BchNetwork, hostOverride:string):Promise<void> {
  await withVerifiedElectrum(network,hostOverride,async()=>undefined);
}

function deriveAddress(manager:WizardManager,index:number,network:BchNetwork,childIndex:number) {
  const publicKey=manager.getPubkey(childIndex,BigInt(index));
  if (!publicKey) throw new Error('The connected wallet did not provide a receive public key.');
  const encoded=publicKeyToP2pkhCashAddress({publicKey,prefix:network==='mainnet'?'bitcoincash':'bchtest'});
  if (typeof encoded==='string') throw new Error('The connected wallet public key could not be encoded as a BCH address.');
  const decoded=cashAddressToLockingBytecode(encoded.address);
  if (typeof decoded==='string') throw new Error('The connected wallet address could not be decoded.');
  return { address:encoded.address, lockingBytecode:decoded.bytecode };
}

async function electrumScriptHash(lockingBytecode:Uint8Array) {
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(lockingBytecode).buffer as ArrayBuffer));
  return binToHex(digest.reverse());
}

async function readCandidate(client:ElectrumClient<ElectrumClientEvents>,utxo:NetworkUtxo,pathName:'receive'|'change'|'defi',addressIndex:number,expectedScript:Uint8Array):Promise<Candidate|null> {
  if (!/^[0-9a-f]{64}$/i.test(utxo.tx_hash)||!Number.isInteger(utxo.tx_pos)||utxo.tx_pos<0||!Number.isInteger(utxo.height)||utxo.height<0||BigInt(String(utxo.value))<=0n) return null;
  const raw=await client.request('blockchain.transaction.get',utxo.tx_hash);
  if (raw instanceof Error||typeof raw!=='string'||!/^(?:[0-9a-f]{2})+$/i.test(raw)) return null;
  const txBytes=hexToBin(raw);
  if (hashTransaction(txBytes).toLowerCase()!==utxo.tx_hash.toLowerCase()) return null;
  const decoded=decodeTransactionBCH(txBytes);
  if (typeof decoded==='string') return null;
  const output=decoded.outputs[utxo.tx_pos];
  if (!output||output.token||!sameLockingBytecode(output.lockingBytecode,expectedScript)) return null;
  const outputValue=BigInt(String(output.valueSatoshis));
  if (outputValue!==BigInt(String(utxo.value))) return null;
  return {txid:utxo.tx_hash.toLowerCase(),vout:utxo.tx_pos,value:outputValue,pathName,addressIndex,lockingBytecode:output.lockingBytecode,height:utxo.height};
}

function feeFor(inputs:number,outputs:number) { return BigInt(10+148*inputs+34*outputs); }

function canCoverPayment(candidates:Iterable<Candidate>,amountSats:bigint) {
  const sorted=[...candidates].sort((a,b)=>a.value===b.value?0:a.value>b.value?-1:1);
  let total=0n;
  for (let index=0;index<sorted.length;index++) {
    total+=sorted[index].value;
    if (total>=amountSats+feeFor(index+1,1)) return true;
  }
  return false;
}

export async function prepareBchPayment(args:{manager:WizardManager;network:BchNetwork;hostOverride:string;recipient:string;amountSats:bigint;capSats:bigint;mainnetSendsEnabled:boolean}):Promise<PaymentPlan> {
  if (args.network==='mainnet'&&!args.mainnetSendsEnabled) throw new Error('Mainnet sends are disabled by configuration.');
  if (args.amountSats>args.capSats) throw new Error('The payment is above the per-payment cap.');
  if (args.amountSats<546n) throw new Error('The payment is below the BCH standard dust limit.');
  const walletPaths=args.manager.getSessionPaths();
  const pathsToScan=([{name:'receive',childIndex:0},{name:'change',childIndex:1},{name:'defi',childIndex:7}] as const).filter(path=>walletPaths.some(walletPath=>walletPath.name===path.name));
  if (!pathsToScan.some(path=>path.name==='receive')) throw new Error('The connected wallet did not share a receive public key.');
  for(const path of pathsToScan){
    const xpub=walletPaths.find(walletPath=>walletPath.name===path.name)?.xpub;
    const decodedXpub=xpub?decodeHdKeyUnchecked(xpub):'The wallet did not share this public key.';
    if(typeof decodedXpub==='string'||decodedXpub.version!==expectedKeyVersion(args.network)) throw new Error(args.network==='mainnet'?'Connect a BCH Mainnet wallet.':'Connect a BCH test-network wallet. The selected Chipnet provider is checked separately.');
  }
  const destination=checkCashAddress(args.recipient,args.network);
  if (!destination.valid) throw new Error(destination.message);

  const candidatesByOutpoint=new Map<string,Candidate>();
  const unconfirmedByOutpoint=new Map<string,Candidate>();
  await withVerifiedElectrumUntil(args.network,args.hostOverride,async client=>{
    for (const path of pathsToScan) {
      let unusedAddressGap=0;
      for (let index=0;index<MAX_ADDRESSES_PER_PATH;index++) {
        const derived=deriveAddress(args.manager,index,args.network,path.childIndex);
        const scriptHash=await electrumScriptHash(derived.lockingBytecode);
        const history=await client.request('blockchain.scripthash.get_history',scriptHash);
        if (history instanceof Error) throw history;
        if (!Array.isArray(history)) throw new Error('The BCH provider returned an invalid address history.');
        const response=await client.request('blockchain.scripthash.listunspent',scriptHash);
        if (response instanceof Error) throw response;
        if (!Array.isArray(response)) throw new Error('The BCH provider returned an invalid unspent-output list.');
        const hasActivity=(history as NetworkHistoryEntry[]).length>0||response.length>0;
        unusedAddressGap=hasActivity?0:unusedAddressGap+1;
        for (const entry of response) {
          if (!entry||typeof entry!=='object') continue;
          const candidate=await readCandidate(client,entry as NetworkUtxo,path.name,index,derived.lockingBytecode);
          if (!candidate) continue;
          const key=candidate.txid+':'+candidate.vout;
          if (candidate.height>0) { candidatesByOutpoint.set(key,candidate);unconfirmedByOutpoint.delete(key); }
          else if (!candidatesByOutpoint.has(key)) unconfirmedByOutpoint.set(key,candidate);
        }
        if (unusedAddressGap>=ADDRESS_GAP_LIMIT) break;
      }
    }
    return canCoverPayment(candidatesByOutpoint.values(),args.amountSats);
  });

  const candidates=[...candidatesByOutpoint.values()];
  const unconfirmedCandidates=[...unconfirmedByOutpoint.values()];
  const availableBalanceSats=candidates.reduce((sum,candidate)=>sum+candidate.value,0n);
  if (!canCoverPayment(candidates,args.amountSats)) {
    const possibleInputs=[...candidates,...unconfirmedCandidates].sort((a,b)=>a.value===b.value?0:a.value>b.value?-1:1);
    let possibleTotal=0n;
    let possibleCount=0;
    let includesUnconfirmed=false;
    for (const candidate of possibleInputs) {
      possibleTotal+=candidate.value;
      possibleCount++;
      if (candidate.height<=0) includesUnconfirmed=true;
      if (possibleTotal>=args.amountSats+feeFor(possibleCount,1)) break;
    }
    if (includesUnconfirmed&&possibleTotal>=args.amountSats+feeFor(possibleCount,1)) throw new Error('Your wallet has enough BCH only when an unconfirmed payment is included. Pact waits for confirmed BCH; try again after the incoming transaction confirms.');
    throw new Error('Pact connected to your wallet but did not find enough confirmed BCH in the receive, change, or DeFi address paths shared by that wallet. Check that Paytaca has the account holding the funds selected when it connects.');
  }

  candidates.sort((a,b)=>a.value===b.value?0:a.value>b.value?-1:1);
  const selected:Candidate[]=[];
  let total=0n;
  for (const candidate of candidates) {
    selected.push(candidate);
    total+=candidate.value;
    const withChange=feeFor(selected.length,2);
    if (total>=args.amountSats+withChange) break;
  }
  const noChangeFee=feeFor(selected.length,1);
  if (total<args.amountSats+noChangeFee) throw new Error('Pact found confirmed BCH, but the available amount does not cover this payment and its network fee.');
  const estimatedWithChange=feeFor(selected.length,2);
  let outputs:Transaction['outputs'];
  let fee=estimatedWithChange;
  const changeValue=total-args.amountSats-estimatedWithChange;
  if (changeValue>=546n) {
    const changeKey=args.manager.getPubkey(1,0n)||args.manager.getPubkey(0,0n);
    if (!changeKey) throw new Error('The connected wallet did not provide a change public key.');
    const changeAddress=publicKeyToP2pkhCashAddress({publicKey:changeKey,prefix:args.network==='mainnet'?'bitcoincash':'bchtest'});
    if (typeof changeAddress==='string') throw new Error('The wallet change address could not be encoded.');
    const changeDecoded=cashAddressToLockingBytecode(changeAddress.address);
    if (typeof changeDecoded==='string') throw new Error('The wallet change address could not be decoded.');
    outputs=[{lockingBytecode:destination.lockingBytecode,valueSatoshis:args.amountSats},{lockingBytecode:changeDecoded.bytecode,valueSatoshis:changeValue}];
  } else {
    fee=total-args.amountSats;
    outputs=[{lockingBytecode:destination.lockingBytecode,valueSatoshis:args.amountSats}];
  }
  const inputs:Transaction['inputs']=selected.map(item=>({outpointIndex:item.vout,outpointTransactionHash:hexToBin(item.txid),sequenceNumber:0xffffffff,unlockingBytecode:new Uint8Array()}));
  const transaction:Transaction={version:2,inputs,outputs,locktime:0};
  const sourceOutputs:SourceOutput[]=selected.map(item=>({outpointIndex:item.vout,outpointTransactionHash:hexToBin(item.txid),sequenceNumber:0xffffffff,unlockingBytecode:new Uint8Array(),lockingBytecode:item.lockingBytecode,valueSatoshis:item.value}));
  return {network:args.network,recipient:args.recipient,amountSats:args.amountSats,feeSats:fee,totalInputSats:total,availableBalanceSats,unsignedTransaction:binToHex(encodeTransactionBCH(transaction)),sourceOutputs,inputPaths:selected.map((item,index)=>[index,item.pathName,item.addressIndex])};
}

function assertReturnedTransaction(plan:PaymentPlan,signedHex:string) {
  if (!/^(?:[0-9a-f]{2})+$/i.test(signedHex)) throw new Error('The wallet returned an invalid signed transaction.');
  const decoded=decodeTransactionBCH(hexToBin(signedHex));
  if (typeof decoded==='string') throw new Error('The wallet returned a transaction that could not be decoded.');
  const expected=decodeTransactionBCH(hexToBin(plan.unsignedTransaction));
  if (typeof expected==='string'||decoded.inputs.length!==expected.inputs.length||decoded.outputs.length!==expected.outputs.length||decoded.version!==expected.version||decoded.locktime!==expected.locktime) throw new Error('The signed transaction no longer matches the reviewed transaction.');
  for(let index=0;index<expected.inputs.length;index++) {
    const a=expected.inputs[index],b=decoded.inputs[index];
    if(a.outpointIndex!==b.outpointIndex||binToHex(a.outpointTransactionHash)!==binToHex(b.outpointTransactionHash)||a.sequenceNumber!==b.sequenceNumber) throw new Error('The wallet changed a reviewed transaction input.');
  }
  for(let index=0;index<expected.outputs.length;index++) {
    const a=expected.outputs[index],b=decoded.outputs[index];
    if(BigInt(String(a.valueSatoshis))!==BigInt(String(b.valueSatoshis))||binToHex(a.lockingBytecode)!==binToHex(b.lockingBytecode)) throw new Error('The wallet changed a reviewed transaction output.');
  }
  const actualFee=plan.totalInputSats-decoded.outputs.reduce((sum,output)=>sum+BigInt(String(output.valueSatoshis)),0n);
  if(actualFee!==plan.feeSats) throw new Error('The signed transaction fee differs from the reviewed fee.');
  return hexToBin(signedHex);
}

export async function signAndBroadcastPayment(args:{manager:WizardManager;plan:PaymentPlan;hostOverride:string;onSigned:()=>void;validateBeforeBroadcast:()=>string|null}):Promise<PaymentReceipt> {
  const response=await args.manager.signTransaction({transaction:{transaction:args.plan.unsignedTransaction,sourceOutputs:args.plan.sourceOutputs,broadcast:false,userPrompt:'Review the BCH amount, full recipient, and fee before approval.'},inputPaths:args.plan.inputPaths});
  if(response.error) throw new Error(response.error);
  const signedHex=response.signedTransaction;
  const signedBytes=assertReturnedTransaction(args.plan,signedHex);
  const refusal=args.validateBeforeBroadcast();
  if(refusal) throw new Error('The wallet signed this transaction, but the rule no longer allows it. Pact did not broadcast it. '+refusal);
  args.onSigned();
  const txid=hashTransaction(signedBytes);
  const providerTxid=await withVerifiedElectrum(args.plan.network,args.hostOverride,async client=>{
    const result=await client.request('blockchain.transaction.broadcast',signedHex);
    if(result instanceof Error) throw result;
    if(typeof result!=='string'||!/^[0-9a-f]{64}$/i.test(result)) throw new Error('The BCH provider did not return a transaction ID.');
    if(result.toLowerCase()!==txid.toLowerCase()) throw new Error('The provider transaction ID did not match the signed transaction.');
    return result.toLowerCase();
  });
  const base=args.plan.network==='mainnet'?'https://blockchair.com/bitcoin-cash/transaction/':'https://chipnet.imaginary.cash/tx/';
  return {txid:providerTxid,network:args.plan.network,explorerUrl:base+providerTxid,amountSats:args.plan.amountSats,feeSats:args.plan.feeSats,broadcastAt:new Date().toISOString()};
}
