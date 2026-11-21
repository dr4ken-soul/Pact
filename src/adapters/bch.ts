import { binToHex, cashAddressToLockingBytecode, createVirtualMachineBCH2023, decodeHdKeyUnchecked, decodeTransactionBCH, encodeDataPush, encodeTransactionBCH, hashTransaction, HdKeyVersion, hexToBin, publicKeyToP2pkhCashAddress, type Transaction } from '@bitauth/libauth';
import { sourceOutputToRelay } from '@wizardconnect/core/hdwalletv1-serialize';
import { chipnet, mainnet } from '@electrum-cash/checkpoint';
import { ElectrumClient, type ElectrumClientEvents } from '@electrum-cash/network';
import { chipnetServers, mainnetServers } from '@electrum-cash/servers';
import type { BchNetwork } from '../lib/config';
import { checkCashAddress, sameLockingBytecode } from '../lib/policy';
import { POLICY_FEE_SATS, type CovenantPolicy, type CovenantUtxo } from '../lib/covenant';

export interface WizardManager {
  getPubkey: (childIndex:number, addressIndex:bigint) => Uint8Array|undefined;
  getXpubNode: (childIndex:number) => unknown;
  getSessionPaths: () => { name:string; xpub:string }[];
  on: (event:'messagesent', listener:(message:{action?:string})=>void) => unknown;
  off: (event:'messagesent', listener:(message:{action?:string})=>void) => unknown;
  signTransaction: (request: { transaction:{ transaction:string; sourceOutputs:unknown[]; broadcast:boolean; userPrompt:string }; inputPaths:[number,string,number][] }, options?:{signal?:AbortSignal}) => Promise<{ signedTransaction:string; error?:string }>;
}
type SourceOutput = Transaction['inputs'][number] & Transaction['outputs'][number];
type ContractInfo = { abiFunction:{name:string;inputs:{name:string;type:string}[]}; redeemScript:Uint8Array; artifact:{contractName:string;[key:string]:unknown} };
type WizardSourceOutput = SourceOutput & { contract?:ContractInfo };
type NetworkUtxo = { tx_hash:string; tx_pos:number; value:string|number|bigint; height:number };
type NetworkHistoryEntry = { tx_hash?:unknown; height?:unknown };
type Candidate = { txid:string; vout:number; value:bigint; pathName:'receive'|'change'|'defi'; addressIndex:number; lockingBytecode:Uint8Array; height:number };
export interface PaymentPlan { network:BchNetwork; recipient:string; amountSats:bigint; feeSats:bigint; totalInputSats:bigint; availableBalanceSats:bigint; unsignedTransaction:string; sourceOutputs:WizardSourceOutput[]; inputPaths:[number,string,number][]; kind?:'payment'|'policy-funding'|'covenant-payment'|'covenant-recovery'; policy?:CovenantPolicy; }
export interface PaymentReceipt { txid:string; network:BchNetwork; explorerUrl:string; amountSats:bigint; feeSats:bigint; broadcastAt:string; kind?:PaymentPlan['kind']; }

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

function toSafeNonnegativeInteger(value:unknown):number|null {
  let integer:bigint;
  if (typeof value==='bigint') integer=value;
  else if (typeof value==='number'&&Number.isSafeInteger(value)) integer=BigInt(value);
  else if (typeof value==='string'&&/^\d+$/.test(value)) integer=BigInt(value);
  else return null;
  if (integer<0n||integer>BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Number(integer);
}

function sourceOutputToWizardRelay(sourceOutput:WizardSourceOutput) {
  const relayOutput=sourceOutputToRelay(sourceOutput);
  if(sourceOutput.contract) {
    relayOutput.contract={
      ...sourceOutput.contract,
      redeemScript:binToHex(sourceOutput.contract.redeemScript),
    };
  }
  return relayOutput;
}

function compareBytes(a:Uint8Array,b:Uint8Array) { return a.length===b.length&&a.every((byte,index)=>byte===b[index]); }
function concatenate(...parts:Uint8Array[]) { const result=new Uint8Array(parts.reduce((sum,part)=>sum+part.length,0));let offset=0;for(const part of parts){result.set(part,offset);offset+=part.length;}return result; }

function policyContractSourceOutput(utxo:CovenantUtxo,policy:CovenantPolicy):WizardSourceOutput {
  const signaturePlaceholder=encodeDataPush(new Uint8Array(65));
  const publicKeyPlaceholder=encodeDataPush(new Uint8Array(33));
  const selector=Uint8Array.of(0x51);
  const scriptPush=encodeDataPush(policy.redeemScript);
  const abiFunction={name:'Pay',inputs:[{name:'ownerPublicKey',type:'bytes'},{name:'ownerSignature',type:'bytes'},{name:'payBranch',type:'bool'}]};
  const artifact={
    contractName:'PactBoundedPayment',constructorInputs:[],abi:[abiFunction,{name:'Recover',inputs:[{name:'ownerPublicKey',type:'bytes'},{name:'ownerSignature',type:'bytes'},{name:'payBranch',type:'bool'}]}],
    bytecode:binToHex(policy.redeemScript),source:'Pact Bounded Payment covenant; generated by Pact from the owner key, approved recipient, per-payment cap, and recovery time.',
    compiler:{name:'pact-script-builder',version:'1'},updatedAt:new Date().toISOString(),
  };
  return {
    outpointIndex:utxo.vout,outpointTransactionHash:hexToBin(utxo.txid),sequenceNumber:0xffffffff,
    unlockingBytecode:concatenate(publicKeyPlaceholder,signaturePlaceholder,selector,scriptPush),
    lockingBytecode:policy.lockingBytecode,valueSatoshis:utxo.valueSats,
    contract:{abiFunction,redeemScript:policy.redeemScript,artifact},
  };
}

async function findCovenantUtxo(client:ElectrumClient<ElectrumClientEvents>,policy:CovenantPolicy,expectedOutpoint?:string):Promise<CovenantUtxo|null> {
  const scriptHash=await electrumScriptHash(policy.lockingBytecode);
  const response=await client.request('blockchain.scripthash.listunspent',scriptHash);
  if(response instanceof Error)throw response;
  if(!Array.isArray(response))throw new Error('The BCH provider returned an invalid covenant UTXO list.');
  const candidates=(response as NetworkUtxo[]).filter(item=>item&&typeof item==='object').sort((a,b)=>Number(b.height)-Number(a.height));
  for(const item of candidates){
    const candidate=await readCandidate(client,item,'receive',0,policy.lockingBytecode);
    if(!candidate)continue;
    if(expectedOutpoint&&candidate.txid+':'+candidate.vout!==expectedOutpoint)continue;
    return {txid:candidate.txid,vout:candidate.vout,valueSats:candidate.value,height:candidate.height};
  }
  return null;
}

export async function locateCovenantUtxo(args:{policy:CovenantPolicy;hostOverride:string;expectedOutpoint?:string}):Promise<CovenantUtxo|null> {
  return withVerifiedElectrum(args.policy.network,args.hostOverride,client=>findCovenantUtxo(client,args.policy,args.expectedOutpoint));
}

export async function preparePolicyFunding(args:{manager:WizardManager;network:BchNetwork;hostOverride:string;policy:CovenantPolicy;fundingSats:bigint;mainnetSendsEnabled:boolean}):Promise<PaymentPlan> {
  if(args.fundingSats<args.policy.capSats+POLICY_FEE_SATS+546n)throw new Error('Fund at least the payment cap plus the 20,000 sat covenant fee and a 546 sat continuation.');
  const plan=await prepareBchPayment({manager:args.manager,network:args.network,hostOverride:args.hostOverride,recipient:args.policy.address,amountSats:args.fundingSats,capSats:args.fundingSats,mainnetSendsEnabled:args.mainnetSendsEnabled});
  return {...plan,kind:'policy-funding',policy:args.policy};
}

export async function prepareCovenantPayment(args:{manager:WizardManager;policy:CovenantPolicy;utxo:CovenantUtxo;hostOverride:string;amountSats:bigint}):Promise<PaymentPlan> {
  if(args.utxo.height<=0)throw new Error('The policy funding must confirm before Pact can prepare a covenant payment.');
  if(args.amountSats<546n||args.amountSats>args.policy.capSats)throw new Error('Enter a payment from 546 sats up to the covenant per-payment cap.');
  const publicKey=args.manager.getPubkey(0,0n);
  if(!publicKey||!compareBytes(publicKey,args.policy.ownerPublicKey))throw new Error('Reconnect the owner wallet used to create this policy before spending it.');
  const checkedRecipient=checkCashAddress(args.policy.recipient,args.policy.network);
  if(!checkedRecipient.valid)throw new Error(checkedRecipient.message);
  const continuation=args.utxo.valueSats-args.amountSats-POLICY_FEE_SATS;
  if(continuation<546n)throw new Error('This payment would leave less than 546 sats in the covenant. Recover the remaining balance or choose a smaller payment.');
  const input:Transaction['inputs'][number]={outpointIndex:args.utxo.vout,outpointTransactionHash:hexToBin(args.utxo.txid),sequenceNumber:0xffffffff,unlockingBytecode:new Uint8Array()};
  const outputs:Transaction['outputs']=[
    {lockingBytecode:checkedRecipient.lockingBytecode,valueSatoshis:args.amountSats},
    {lockingBytecode:args.policy.lockingBytecode,valueSatoshis:continuation},
  ];
  const transaction:Transaction={version:2,inputs:[input],outputs,locktime:0};
  const covenantOutput=policyContractSourceOutput(args.utxo,args.policy);
  covenantOutput.unlockingBytecode=concatenate(encodeDataPush(new Uint8Array(33)),encodeDataPush(new Uint8Array(65)),Uint8Array.of(0x51),encodeDataPush(args.policy.redeemScript));
  input.unlockingBytecode=covenantOutput.unlockingBytecode;
  return {network:args.policy.network,recipient:args.policy.recipient,amountSats:args.amountSats,feeSats:POLICY_FEE_SATS,totalInputSats:args.utxo.valueSats,availableBalanceSats:args.utxo.valueSats,unsignedTransaction:binToHex(encodeTransactionBCH(transaction)),sourceOutputs:[covenantOutput],inputPaths:[[0,'receive',0]],kind:'covenant-payment',policy:args.policy};
}

export async function prepareCovenantRecovery(args:{manager:WizardManager;policy:CovenantPolicy;utxo:CovenantUtxo;hostOverride:string}):Promise<PaymentPlan> {
  if(args.utxo.height<=0)throw new Error('The covenant funds must confirm before recovery.');
  if(Math.floor(Date.now()/1000)<args.policy.recoveryTimestamp)throw new Error('Owner recovery is not available yet.');
  const publicKey=args.manager.getPubkey(0,0n);
  if(!publicKey||!compareBytes(publicKey,args.policy.ownerPublicKey))throw new Error('Reconnect the owner wallet used to create this policy before recovery.');
  const remaining=args.utxo.valueSats-POLICY_FEE_SATS;
  if(remaining<546n)throw new Error('The remaining covenant balance is too small for recovery after its fixed fee.');
  const input:Transaction['inputs'][number]={outpointIndex:args.utxo.vout,outpointTransactionHash:hexToBin(args.utxo.txid),sequenceNumber:0xfffffffe,unlockingBytecode:new Uint8Array()};
  const ownerDecoded=cashAddressToLockingBytecode(args.policy.ownerAddress);
  if(typeof ownerDecoded==='string')throw new Error('The stored owner recovery address is invalid.');
  const transaction:Transaction={version:2,inputs:[input],outputs:[{lockingBytecode:ownerDecoded.bytecode,valueSatoshis:remaining}],locktime:args.policy.recoveryTimestamp};
  const covenantOutput=policyContractSourceOutput(args.utxo,args.policy);
  covenantOutput.unlockingBytecode=concatenate(encodeDataPush(new Uint8Array(33)),encodeDataPush(new Uint8Array(65)),Uint8Array.of(0x00),encodeDataPush(args.policy.redeemScript));
  if(covenantOutput.contract)covenantOutput.contract.abiFunction={...covenantOutput.contract.abiFunction,name:'Recover'};
  input.unlockingBytecode=covenantOutput.unlockingBytecode;
  return {network:args.policy.network,recipient:args.policy.ownerAddress,amountSats:remaining,feeSats:POLICY_FEE_SATS,totalInputSats:args.utxo.valueSats,availableBalanceSats:args.utxo.valueSats,unsignedTransaction:binToHex(encodeTransactionBCH(transaction)),sourceOutputs:[covenantOutput],inputPaths:[[0,'receive',0]],kind:'covenant-recovery',policy:args.policy};
}

async function readCandidate(client:ElectrumClient<ElectrumClientEvents>,utxo:NetworkUtxo,pathName:'receive'|'change'|'defi',addressIndex:number,expectedScript:Uint8Array):Promise<Candidate|null> {
  const outputIndex=toSafeNonnegativeInteger(utxo.tx_pos);
  const height=toSafeNonnegativeInteger(utxo.height);
  let value:bigint;
  try { value=BigInt(String(utxo.value)); } catch { return null; }
  if (!/^[0-9a-f]{64}$/i.test(utxo.tx_hash)||outputIndex===null||height===null||value<=0n) return null;
  const raw=await client.request('blockchain.transaction.get',utxo.tx_hash);
  if (raw instanceof Error||typeof raw!=='string'||!/^(?:[0-9a-f]{2})+$/i.test(raw)) return null;
  const txBytes=hexToBin(raw);
  if (hashTransaction(txBytes).toLowerCase()!==utxo.tx_hash.toLowerCase()) return null;
  const decoded=decodeTransactionBCH(txBytes);
  if (typeof decoded==='string') return null;
  const output=decoded.outputs[outputIndex];
  if (!output||output.token||!sameLockingBytecode(output.lockingBytecode,expectedScript)) return null;
  const outputValue=BigInt(String(output.valueSatoshis));
  if (outputValue!==value) return null;
  return {txid:utxo.tx_hash.toLowerCase(),vout:outputIndex,value:outputValue,pathName,addressIndex,lockingBytecode:output.lockingBytecode,height};
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
        const [history,response]=await Promise.all([
          client.request('blockchain.scripthash.get_history',scriptHash),
          client.request('blockchain.scripthash.listunspent',scriptHash),
        ]);
        if (history instanceof Error) throw history;
        if (!Array.isArray(history)) throw new Error('The BCH provider returned an invalid address history.');
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
        if (canCoverPayment(candidatesByOutpoint.values(),args.amountSats)) return true;
        if (unusedAddressGap>=ADDRESS_GAP_LIMIT) break;
      }
      if (canCoverPayment(candidatesByOutpoint.values(),args.amountSats)) break;
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
  const sourceOutputs:WizardSourceOutput[]=selected.map(item=>({outpointIndex:item.vout,outpointTransactionHash:hexToBin(item.txid),sequenceNumber:0xffffffff,unlockingBytecode:new Uint8Array(),lockingBytecode:item.lockingBytecode,valueSatoshis:item.value}));
  return {network:args.network,recipient:args.recipient,amountSats:args.amountSats,feeSats:fee,totalInputSats:total,availableBalanceSats,unsignedTransaction:binToHex(encodeTransactionBCH(transaction)),sourceOutputs,inputPaths:selected.map((item,index)=>[index,item.pathName,item.addressIndex]),kind:'payment'};
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
  if(plan.kind==='covenant-payment'||plan.kind==='covenant-recovery') {
    const policy=plan.policy;
    const unlocking=decoded.inputs[0]?.unlockingBytecode;
    if(!policy||!unlocking||unlocking.length<policy.redeemScript.length||!compareBytes(unlocking.subarray(unlocking.length-policy.redeemScript.length),policy.redeemScript)) throw new Error('The wallet response did not retain the Pact covenant redeem script.');
  }
  const vmResult=createVirtualMachineBCH2023(true).verify({transaction:decoded,sourceOutputs:plan.sourceOutputs});
  if(vmResult!==true) throw new Error('The signed transaction did not pass local BCH 2023 validation: '+vmResult);
  return hexToBin(signedHex);
}

export async function signAndBroadcastPayment(args:{manager:WizardManager;plan:PaymentPlan;hostOverride:string;signal?:AbortSignal;onRequestSent?:()=>void;onSigned:()=>void;validateBeforeBroadcast:()=>string|null}):Promise<PaymentReceipt> {
  const requestSentListener=(message:{action?:string})=>{
    if(message.action==='sign_transaction_request') args.onRequestSent?.();
  };
  args.manager.on('messagesent',requestSentListener);
  let response:{signedTransaction:string;error?:string};
  try {
    response=await args.manager.signTransaction({transaction:{transaction:args.plan.unsignedTransaction,sourceOutputs:args.plan.sourceOutputs.map(sourceOutputToWizardRelay),broadcast:false,userPrompt:'Review the BCH amount, full recipient, and fee before approval.'},inputPaths:args.plan.inputPaths},{signal:args.signal});
  } finally {
    args.manager.off('messagesent',requestSentListener);
  }
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
  return {txid:providerTxid,network:args.plan.network,explorerUrl:base+providerTxid,amountSats:args.plan.amountSats,feeSats:args.plan.feeSats,broadcastAt:new Date().toISOString(),kind:args.plan.kind};
}
