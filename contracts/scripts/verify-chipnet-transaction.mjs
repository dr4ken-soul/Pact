import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { binToHex, createVirtualMachineBCH2023, decodeTransaction, hashTransaction, hexToBin } from '@bitauth/libauth';

const contractsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stateDir = path.join(contractsDir, '.xo-state');
const evidenceDir = path.join(contractsDir, 'evidence');
const profile = JSON.parse(fs.readFileSync(path.join(stateDir, 'public-profile.json'), 'utf8'));
const templatePrefix = profile.templateIdentifier.slice(0, 12);
const localEvidence = JSON.parse(fs.readFileSync(path.join(stateDir, `chipnet-transaction-${templatePrefix}.json`), 'utf8'));
const faucetClaim = JSON.parse(fs.readFileSync(path.join(stateDir, `faucet-claim-${templatePrefix}.json`), 'utf8'));
const invitationPath = path.join(stateDir, `chipnet-invitation-used-${templatePrefix}.json`);
const txid = (process.argv[2] ?? localEvidence.transactionId).toLowerCase();
if (!/^[0-9a-f]{64}$/.test(txid) || txid !== localEvidence.transactionId.toLowerCase()) throw new Error('The requested transaction does not match this saved Pact Chipnet invitation.');
if (profile.network !== 'chipnet' || localEvidence.templateIdentifier !== profile.templateIdentifier || faucetClaim.address !== profile.policyTokenAddress) throw new Error('The saved profile, funding claim, and transaction evidence do not match.');
const scriptHash = (lockingBytecode) => createHash('sha256').update(hexToBin(lockingBytecode)).digest().reverse().toString('hex');
const requests = [
  [1, 'blockchain.transaction.get', [txid, true]],
  [2, 'blockchain.scripthash.get_history', [scriptHash(profile.recipientLockingBytecode)]],
  [3, 'blockchain.scripthash.get_history', [scriptHash(profile.policyLockingBytecode)]],
];
const responses = await new Promise((resolve, reject) => {
  const socket = new WebSocket('wss://chipnet.bch.ninja:50004');
  const found = new Map();
  const timer = setTimeout(() => { socket.close(); reject(new Error('Electrum verification timed out.')); }, 15000);
  socket.addEventListener('open', () => requests.forEach(([id, method, params]) => socket.send(JSON.stringify({ jsonrpc: '2.0', id, method, params }))));
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (!requests.some(([id]) => id === message.id)) return;
    if (message.error) found.set(message.id, { error: message.error });
    else found.set(message.id, message.result);
    if (found.size === requests.length) { clearTimeout(timer); socket.close(); resolve(found); }
  });
  socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Electrum WebSocket connection failed.')); });
});
const remote = responses.get(1);
const hex = typeof remote === 'string' ? remote : remote?.hex;
if (typeof hex !== 'string' || !/^(?:[0-9a-f]{2})+$/i.test(hex)) throw new Error('Electrum did not return the transaction bytes.');
const computedTxid = hashTransaction(hexToBin(hex)).toLowerCase();
if (computedTxid !== txid || remote?.txid?.toLowerCase() !== txid) throw new Error(`Electrum returned unexpected transaction data for ${txid}.`);
const transaction = decodeTransaction(hexToBin(hex));
if (typeof transaction === 'string') throw new Error(`Could not decode the transaction returned by Electrum: ${transaction}`);
if (transaction.inputs.length !== 1 || transaction.outputs.length !== 2) throw new Error('The retrieved transaction does not have the expected one-input, two-output shape.');
const input = transaction.inputs[0];
if (binToHex(input.outpointTransactionHash).toLowerCase() !== localEvidence.sourceTransactionId.toLowerCase() || input.outpointIndex !== localEvidence.sourceOutputIndex) throw new Error('The retrieved transaction does not spend the saved Pact policy outpoint.');
const [recipientOutput, continuationOutput] = transaction.outputs;
if (binToHex(recipientOutput.lockingBytecode) !== profile.recipientLockingBytecode || recipientOutput.valueSatoshis !== BigInt(localEvidence.paymentSatoshis)) throw new Error('The retrieved recipient output differs from Pact policy.');
if (binToHex(continuationOutput.lockingBytecode) !== profile.policyLockingBytecode || continuationOutput.valueSatoshis !== BigInt(localEvidence.continuationSatoshis)) throw new Error('The retrieved continuation differs from Pact policy.');
if (recipientOutput.token !== undefined || continuationOutput.token !== undefined) throw new Error('The retrieved transaction unexpectedly contains CashTokens.');
const vmResult = createVirtualMachineBCH2023().verify({
  sourceOutputs: [{ valueSatoshis: BigInt(localEvidence.inputSatoshis), lockingBytecode: hexToBin(profile.policyLockingBytecode) }],
  transaction,
});
if (vmResult !== true) throw new Error(`BCH 2023 VM rejected the retrieved transaction: ${String(vmResult)}`);
const historyFor = (id) => {
  const history = responses.get(id);
  if (!Array.isArray(history)) return { found: false, height: null, issue: history?.error?.message ?? 'not listed' };
  const match = history.find((item) => item.tx_hash?.toLowerCase() === txid);
  return { found: match !== undefined, height: match?.height ?? null };
};
const recipientHistory = historyFor(2);
const continuationHistory = historyFor(3);
const policyHistory = responses.get(3);
const sourceFundingHistoryEntry = Array.isArray(policyHistory) ? policyHistory.find((item) => item.tx_hash?.toLowerCase() === localEvidence.sourceTransactionId.toLowerCase()) : undefined;
const sourceFundingHistoryHeight = sourceFundingHistoryEntry?.height ?? null;
const status = recipientHistory.height > 0 && continuationHistory.height > 0 ? 'confirmed' : recipientHistory.found && continuationHistory.found ? 'mempool' : 'retrieved-from-electrum';
const publicInvitationPath = path.join(evidenceDir, 'chipnet-invitation.json');
const rawTransactionPath = path.join(evidenceDir, 'chipnet-payment-transaction.hex');
const publicEvidencePath = path.join(evidenceDir, 'chipnet-transaction.json');
fs.mkdirSync(evidenceDir, { recursive: true });
fs.copyFileSync(invitationPath, publicInvitationPath);
fs.writeFileSync(rawTransactionPath, hex.toLowerCase() + '\n');
const evidence = {
  network: 'chipnet', status, templateIdentifier: profile.templateIdentifier, templateVersion: profile.templateVersion,
  invitationIdentifier: localEvidence.invitationIdentifier, policyAddress: profile.policyAddress,
  sourceTransactionId: localEvidence.sourceTransactionId, sourceTransactionUrl: `https://explorer.selene.cash/tx/${localEvidence.sourceTransactionId}?network=chipnet`, sourceOutputIndex: localEvidence.sourceOutputIndex,
  faucetFundingTransactionId: faucetClaim.txid, inputSatoshis: localEvidence.inputSatoshis,
  paymentSatoshis: localEvidence.paymentSatoshis, recipientAddress: profile.recipientAddress,
  continuationSatoshis: localEvidence.continuationSatoshis, policyFeeSatoshis: localEvidence.policyFeeSatoshis,
  transactionId: txid, transactionUrl: `https://explorer.selene.cash/tx/${txid}?network=chipnet`,
  sourceFundingHistoryHeight, recipientHistoryHeight: recipientHistory.height, continuationHistoryHeight: continuationHistory.height,
  bch2023VmValidation: 'passed', electrumEndpoint: 'wss://chipnet.bch.ninja:50004',
  invitationFile: 'contracts/evidence/chipnet-invitation.json',
  rawTransactionFile: 'contracts/evidence/chipnet-payment-transaction.hex',
  templateFile: 'contracts/pact-policy.template.json', broadcastAt: localEvidence.broadcastAt,
  verifiedAt: new Date().toISOString(),
};
fs.writeFileSync(publicEvidencePath, JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ status, transactionId: txid, transactionUrl: evidence.transactionUrl, sourceFundingHistoryHeight, recipientHistory, continuationHistory, bch2023VmValidation: true, publicEvidence: 'contracts/evidence/chipnet-transaction.json' }, null, 2));
