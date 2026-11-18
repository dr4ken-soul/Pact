import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Engine, XO_SUPPORTED_NETWORKS } from '@xo-cash/engine';
import { chipnetServersWithBlockchain } from '@electrum-cash/servers';
import { binToHex, createVirtualMachineBCH2023, decodeTransaction, hexToBin } from '@bitauth/libauth';
import { StorageType } from '@xo-cash/state';
import { serializeInvitation } from '@xo-cash/utils';

const contractsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stateDir = path.join(contractsDir, '.xo-state');
const profile = JSON.parse(fs.readFileSync(path.join(stateDir, 'public-profile.json'), 'utf8'));
const faucetClaim = JSON.parse(fs.readFileSync(path.join(stateDir, `faucet-claim-${profile.templateIdentifier.slice(0, 12)}.json`), 'utf8'));
const template = JSON.parse(fs.readFileSync(path.join(contractsDir, 'pact-policy.template.json'), 'utf8'));
const proofPath = path.join(stateDir, `chipnet-invitation-${profile.templateIdentifier.slice(0, 12)}.json`);
const invitationPath = path.join(stateDir, `chipnet-invitation-used-${profile.templateIdentifier.slice(0, 12)}.json`);
const evidencePath = path.join(stateDir, `chipnet-transaction-${profile.templateIdentifier.slice(0, 12)}.json`);
const paymentSatoshis = 1_000;
const minimumContinuationSatoshis = profile.dustLimitSatoshis;

if (profile.network !== 'chipnet' || faucetClaim.network !== 'chipnet' || faucetClaim.address !== profile.policyTokenAddress) {
  throw new Error('Invitation stopped: the saved faucet claim and Pact policy profile do not match on Chipnet.');
}
if (fs.existsSync(evidencePath)) {
  const previous = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  if (previous.templateIdentifier === profile.templateIdentifier && previous.policyAddress === profile.policyAddress) {
    throw new Error('A Chipnet transaction is already recorded for this policy address. Refusing to spend its remaining balance again.');
  }
}

let mnemonic = await new Promise((resolve, reject) => {
  let value = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => value += chunk);
  process.stdin.on('end', () => resolve(value.trim()));
  process.stdin.on('error', reject);
});
if (typeof mnemonic !== 'string' || mnemonic.split(/\s+/).length < 12) throw new Error('The local Chipnet account phrase could not be read.');
const engine = await Engine.create(mnemonic, {
  network: XO_SUPPORTED_NETWORKS.chipnet,
  electrumServers: chipnetServersWithBlockchain,
  storageType: StorageType.INDEXEDDB,
  databasePath: stateDir,
  databaseFilename: 'pact-chipnet',
});
mnemonic = null;
try {
  const { templateIdentifier } = await engine.importTemplate(template);
  if (templateIdentifier !== profile.templateIdentifier) throw new Error('The saved profile was generated from a different XO policy template. Recreate it only before funding.');
  const trackedPolicy = (await engine.listScriptHashes()).find((script) => script.lockingBytecode === profile.policyLockingBytecode);
  if (!trackedPolicy) throw new Error('The encrypted Chipnet account does not track the funded policy script. No invitation was created.');

  const invitations = await engine.listInvitations();
  let stored = invitations.find(({ invitation, archived }) =>
    archived !== true &&
    invitation.actionIdentifier === 'pay' &&
    invitation.result?.transactions?.payTransaction === undefined &&
    invitation.commits.some((commit) => commit.data.inputs?.some((input) =>
      input.inputIdentifier === 'policyPayInput' &&
      input.outpointTransactionHash instanceof Uint8Array &&
      binToHex(input.outpointTransactionHash) === faucetClaim.txid.toLowerCase(),
    )),
  );

  let inputUtxo;
  if (stored !== undefined) {
    const invitation = stored.invitation;
    const committedInput = invitation.commits.flatMap((commit) => commit.data.inputs ?? []).find((input) => input.inputIdentifier === 'policyPayInput');
    if (committedInput === undefined) throw new Error('The saved pay invitation lost its policy input.');
    const inputHash = binToHex(committedInput.outpointTransactionHash);
    const knownOutputs = await engine.listUnspentOutputs({ scriptHash: trackedPolicy.scriptHash });
    inputUtxo = knownOutputs.find((output) => output.outpointTransactionHash === inputHash && output.outpointIndex === committedInput.outpointIndex);
    if (inputUtxo === undefined) throw new Error('The policy UTXO reserved by the saved invitation is no longer tracked.');
    const committedOutputs = invitation.commits.flatMap((commit) => commit.data.outputs ?? []);
    if (invitation.templateIdentifier !== templateIdentifier || committedOutputs.length === 0) {
      await engine.archiveInvitation(invitation.invitationIdentifier);
      stored = undefined;
      console.log('Discarded the earlier incomplete local invitation; no transaction was broadcast.');
    } else {
      console.log(`Resuming saved Chipnet invitation ${invitation.invitationIdentifier}.`);
    }
  }

  if (inputUtxo === undefined) {
    let policyOutputs = [];
    const deadline = Date.now() + 180_000;
    do {
      policyOutputs = await engine.listSpendableUnspentOutputs();
      policyOutputs = policyOutputs.filter((output) => output.tokenCategory === undefined && output.valueSatoshis >= paymentSatoshis + profile.policyFeeSatoshis + minimumContinuationSatoshis && output.scriptHash === trackedPolicy.scriptHash);
      if (policyOutputs.length > 0) break;
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    } while (Date.now() < deadline);
    if (policyOutputs.length === 0) {
      throw new Error('No spendable BCH-only policy UTXO was seen on Chipnet after three minutes. Confirm the faucet transaction in the explorer, then rerun the invitation command.');
    }
    inputUtxo = policyOutputs.sort((left, right) => right.valueSatoshis - left.valueSatoshis)[0];
  }
  if (inputUtxo.tokenCategory !== undefined) throw new Error('The Pact policy UTXO unexpectedly contains CashTokens.');
  if (inputUtxo.valueSatoshis < paymentSatoshis + profile.policyFeeSatoshis + minimumContinuationSatoshis) {
    throw new Error('The policy UTXO cannot cover the payment, fixed fee, and continuation dust floor.');
  }
  const continuationSatoshis = inputUtxo.valueSatoshis - paymentSatoshis - profile.policyFeeSatoshis;
  if (continuationSatoshis < minimumContinuationSatoshis) throw new Error('The continuation would be below the committed dust floor.');

  if (stored === undefined) {
    const variables = [
      ['inputSatoshis', inputUtxo.valueSatoshis],
      ['paymentSatoshis', paymentSatoshis],
      ['recipientLockingBytecode', profile.recipientLockingBytecode],
      ['ownerLockingBytecode', profile.ownerLockingBytecode],
      ['perPaymentCapSatoshis', profile.perPaymentCapSatoshis],
      ['expiryTimestamp', profile.expiryTimestamp],
      ['policyFeeSatoshis', profile.policyFeeSatoshis],
      ['dustLimitSatoshis', profile.dustLimitSatoshis],
    ].map(([identifier, value]) => ({ variableIdentifier: identifier, value }));
    stored = await engine.createInvitation({
      templateIdentifier,
      actionIdentifier: 'pay',
      roleIdentifier: 'agent',
      variables,
      inputs: [{
        inputIdentifier: 'policyPayInput',
        transactionIndex: 0,
        roleIdentifier: 'agent',
        outpointTransactionHash: hexToBin(inputUtxo.outpointTransactionHash),
        outpointIndex: inputUtxo.outpointIndex,
        sequenceNumber: 0,
      }],
      outputs: [
        { outputIdentifier: 'recipientOutput', transactionIndex: 0, roleIdentifier: 'agent', valueSatoshis: BigInt(paymentSatoshis), lockingBytecode: hexToBin(profile.recipientLockingBytecode) },
        { outputIdentifier: 'policyContinuationOutput', transactionIndex: 1, roleIdentifier: 'agent', valueSatoshis: BigInt(continuationSatoshis), lockingBytecode: hexToBin(profile.policyLockingBytecode) },
      ],
    });
  }

  const invitationIdentifier = stored.invitation.invitationIdentifier;
  const hasSignature = stored.invitation.commits.some((commit) => commit.data.inputs?.some((input) =>
    input.unlockingBytecode instanceof Uint8Array && input.unlockingBytecode.byteLength > 0,
  ));
  const signed = hasSignature ? stored : await engine.signInvitation(invitationIdentifier, 0);
  const built = await engine.buildInvitationTransactionFromMergedCommit(invitationIdentifier);
  const decoded = decodeTransaction(hexToBin(built.serializedTransaction));
  if (typeof decoded === 'string') throw new Error(`XO Engine transaction could not be decoded: ${decoded}`);
  const transaction = decoded;
  if (transaction.inputs.length !== 1 || transaction.outputs.length !== 2) throw new Error('The Pact transaction must have exactly one input and two outputs.');
  const [recipientOutput, continuationOutput] = transaction.outputs;
  if (binToHex(recipientOutput.lockingBytecode) !== profile.recipientLockingBytecode || recipientOutput.valueSatoshis !== BigInt(paymentSatoshis)) {
    throw new Error('XO Engine transaction recipient output differs from the policy-bound recipient and payment amount.');
  }
  if (binToHex(continuationOutput.lockingBytecode) !== profile.policyLockingBytecode || continuationOutput.valueSatoshis !== BigInt(continuationSatoshis)) {
    throw new Error('Continuation mismatch: lockingBytecode=' + binToHex(continuationOutput.lockingBytecode) + ', valueSatoshis=' + String(continuationOutput.valueSatoshis) + ', expectedLockingBytecode=' + profile.policyLockingBytecode + ', expectedValueSatoshis=' + continuationSatoshis + '.');
  }
  if (recipientOutput.token !== undefined || continuationOutput.token !== undefined) throw new Error('The Pact BCH-only policy transaction unexpectedly contains CashTokens.');
  if (inputUtxo.valueSatoshis - Number(recipientOutput.valueSatoshis) - Number(continuationOutput.valueSatoshis) !== profile.policyFeeSatoshis) {
    throw new Error('The transaction does not pay the exact policy-committed fee.');
  }
  const vmResult = createVirtualMachineBCH2023().verify({
    sourceOutputs: [{ valueSatoshis: BigInt(inputUtxo.valueSatoshis), lockingBytecode: hexToBin(profile.policyLockingBytecode) }],
    transaction,
  });
  if (vmResult !== true) throw new Error(`BCH VM validation failed: ${String(vmResult)}`);
  console.log('BCH 2023 VM preflight passed.');

  const pending = {
    network: 'chipnet', templateIdentifier, invitationIdentifier,
    policyAddress: profile.policyAddress,
    sourceTransactionId: inputUtxo.outpointTransactionHash,
    sourceOutputIndex: inputUtxo.outpointIndex,
    inputSatoshis: inputUtxo.valueSatoshis,
    paymentSatoshis, recipientAddress: profile.recipientAddress,
    continuationSatoshis, policyFeeSatoshis: profile.policyFeeSatoshis,
    transactionId: built.transactionHash,
    transactionHex: built.serializedTransaction,
    expiresAtTimestamp: profile.expiryTimestamp,
  };
  fs.writeFileSync(proofPath, serializeInvitation(signed.invitation) + '\n');
  fs.writeFileSync(invitationPath, serializeInvitation(signed.invitation) + '\n');
  console.log(`Built and signed the Chipnet Pact pay invitation ${invitationIdentifier}.`);
  console.log(`Recipient output: ${paymentSatoshis} sats to ${profile.recipientAddress}.`);
  console.log(`Covenant continuation: ${continuationSatoshis} sats remain in ${profile.policyAddress}.`);
  console.log(`Fixed contract fee: ${profile.policyFeeSatoshis} sats.`);
  console.log('XO Engine broadcast is next.');

  const executed = await engine.executeAction(invitationIdentifier, { broadcastTransaction: true });
  if (executed.builtTransaction.transactionHash !== built.transactionHash) throw new Error('The broadcast transaction hash differs from the signed preview.');
  fs.writeFileSync(invitationPath, serializeInvitation(executed.storedInvitation.invitation) + '\n');
  const evidence = {
    network: 'chipnet', templateIdentifier, invitationIdentifier,
    policyAddress: profile.policyAddress,
    sourceTransactionId: inputUtxo.outpointTransactionHash,
    sourceOutputIndex: inputUtxo.outpointIndex,
    faucetFundingTransactionId: faucetClaim.txid,
    inputSatoshis: inputUtxo.valueSatoshis,
    paymentSatoshis, recipientAddress: profile.recipientAddress,
    continuationSatoshis, policyFeeSatoshis: profile.policyFeeSatoshis,
    transactionId: built.transactionHash,
    transactionUrl: `https://explorer.selene.cash/tx/${built.transactionHash}?network=chipnet`,
    invitationFile: 'contracts/evidence/chipnet-invitation.json',
    bch2023VmValidation: 'passed',
    templateFile: 'contracts/pact-policy.template.json',
    broadcastAt: new Date().toISOString(),
  };
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2) + '\n');
  console.log('Chipnet invitation transaction broadcast successfully.');
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  try { await engine.stop(); }
  catch { console.warn('Engine shutdown could not finish every Chipnet Electrum subscription.'); }
}
await new Promise((resolve) => process.stdout.write('', resolve));
process.exit(process.exitCode ?? 0);
