import {
  createVirtualMachineBCH2023,
  cashAddressToLockingBytecode,
  encodeDataPush,
  encodeLockingBytecodeP2pkh,
  generateSigningSerializationBCH,
  hash160,
  hash256,
  instantiateSecp256k1,
} from '@bitauth/libauth';
import { createCovenantPolicy } from '../../src/lib/covenant.ts';

const bytes = (...items) => {
  const result = new Uint8Array(items.reduce((length, item) => length + item.length, 0));
  let offset = 0;
  for (const item of items) { result.set(item, offset); offset += item.length; }
  return result;
};
const requireTrue = (condition, message) => { if (!condition) throw new Error(message); };

const secp256k1 = await instantiateSecp256k1();
const privateKey = new Uint8Array(32);
privateKey[31] = 1;
const publicKey = secp256k1.derivePublicKeyCompressed(privateKey);
if (typeof publicKey === 'string') throw new Error(publicKey);
const recipientAddress = 'bchtest:qqfearn0e2aexaqds6v4umrjccjnqrufwylppjrl8c';
const recipient = cashAddressToLockingBytecode(recipientAddress);
if (typeof recipient === 'string') throw new Error(recipient);
const recipientLockingBytecode = recipient.bytecode;
const recoveryTimestamp = 2_000_000_000;
const policy = createCovenantPolicy({ network: 'chipnet', recipient: recipientAddress, ownerPublicKey: publicKey, capSats: 1_000n, recoveryTimestamp });
requireTrue(policy.redeemScript.length <= 520, 'The covenant redeem script exceeds the BCH script element limit.');

const sourceOutput = { lockingBytecode: policy.lockingBytecode, valueSatoshis: 100_000n };
const txid = new Uint8Array(32);
txid[0] = 9;
const unsignedPayment = {
  version: 2,
  inputs: [{ outpointIndex: 0, outpointTransactionHash: txid, sequenceNumber: 0xffffffff, unlockingBytecode: new Uint8Array() }],
  outputs: [
    { lockingBytecode: recipientLockingBytecode, valueSatoshis: 1_000n },
    { lockingBytecode: policy.lockingBytecode, valueSatoshis: 79_000n },
  ],
  locktime: 0,
};

function signedTransaction(transaction, branch, selectedPolicy = policy, selectedSourceOutput = sourceOutput) {
  const context = { transaction, sourceOutputs: [selectedSourceOutput], inputIndex: 0 };
  const serialization = generateSigningSerializationBCH(context, {
    coveredBytecode: selectedPolicy.redeemScript,
    signingSerializationType: Uint8Array.of(0x61),
  });
  // Paytaca/WizardConnect contract placeholders use a 65-byte BCH Schnorr signature.
  const schnorrSignature = secp256k1.signMessageHashSchnorr(privateKey, hash256(serialization));
  if (typeof schnorrSignature === 'string') throw new Error(schnorrSignature);
  const signature = bytes(schnorrSignature, Uint8Array.of(0x61));
  transaction.inputs[0].unlockingBytecode = bytes(
    encodeDataPush(publicKey), encodeDataPush(signature), Uint8Array.of(branch ? 0x51 : 0),
    encodeDataPush(selectedPolicy.redeemScript),
  );
  return transaction;
}

const vm = createVirtualMachineBCH2023(true);
const validPayment = signedTransaction(structuredClone(unsignedPayment), true);
const validResult = vm.verify({ transaction: validPayment, sourceOutputs: [sourceOutput] });
if (validResult !== true) {
  const trace = vm.debug({ transaction: validPayment, sourceOutputs: [sourceOutput], inputIndex: 0 });
  const failed = trace.find(state => state.error);
  if (failed) console.error('VM failure at instruction', failed.ip - 1, failed.instructions.slice(Math.max(0,failed.ip-6),failed.ip+2), 'stack:', failed.stack.map(item => Buffer.from(item).toString('hex')));
}
requireTrue(validResult === true, `A valid owner-approved covenant payment failed BCH VM validation: ${validResult}`);

const wrongRecipient = structuredClone(unsignedPayment);
wrongRecipient.outputs[0].lockingBytecode = policy.lockingBytecode;
const wrongRecipientResult = vm.verify({ transaction: signedTransaction(wrongRecipient, true), sourceOutputs: [sourceOutput] });
requireTrue(wrongRecipientResult !== true, 'The covenant accepted a payment to an unapproved recipient.');

const overCap = structuredClone(unsignedPayment);
overCap.outputs[0].valueSatoshis = 1_001n;
overCap.outputs[1].valueSatoshis = 78_999n;
const overCapResult = vm.verify({ transaction: signedTransaction(overCap, true), sourceOutputs: [sourceOutput] });
requireTrue(overCapResult !== true, 'The covenant accepted a payment above its committed cap.');

const feeChanged = structuredClone(unsignedPayment);
feeChanged.outputs[1].valueSatoshis = 80_000n;
const changedFeeResult = vm.verify({ transaction: signedTransaction(feeChanged, true), sourceOutputs: [sourceOutput] });
requireTrue(changedFeeResult !== true, 'The covenant accepted a transaction with a fee other than 20,000 satoshis.');

const ownerLockingBytecode = encodeLockingBytecodeP2pkh(hash160(publicKey));
const validRecovery = {
  version: 2,
  inputs: [{ outpointIndex: 0, outpointTransactionHash: txid, sequenceNumber: 0xfffffffe, unlockingBytecode: new Uint8Array() }],
  outputs: [{ lockingBytecode: ownerLockingBytecode, valueSatoshis: 80_000n }],
  locktime: recoveryTimestamp,
};
const recoveryResult = vm.verify({ transaction: signedTransaction(validRecovery, false), sourceOutputs: [sourceOutput] });
requireTrue(recoveryResult === true, `A correctly locked owner recovery failed BCH VM validation: ${recoveryResult}`);

const earlyRecovery = structuredClone(validRecovery);
earlyRecovery.locktime = recoveryTimestamp - 1;
const earlyRecoveryResult = vm.verify({ transaction: signedTransaction(earlyRecovery, false), sourceOutputs: [sourceOutput] });
requireTrue(earlyRecoveryResult !== true, 'The covenant accepted owner recovery before its configured locktime.');

const pastRecoveryPolicy = createCovenantPolicy({ network: 'chipnet', recipient: recipientAddress, ownerPublicKey: publicKey, capSats: 1_000n, recoveryTimestamp: Math.floor(Date.now() / 1000) - 1 });
const pastRecoverySource = { lockingBytecode: pastRecoveryPolicy.lockingBytecode, valueSatoshis: 100_000n };
const paymentAfterRecoveryTime = structuredClone(unsignedPayment);
paymentAfterRecoveryTime.outputs[1].lockingBytecode = pastRecoveryPolicy.lockingBytecode;
const afterRecoveryResult = vm.verify({ transaction: signedTransaction(paymentAfterRecoveryTime, true, pastRecoveryPolicy, pastRecoverySource), sourceOutputs: [pastRecoverySource] });
requireTrue(afterRecoveryResult === true, `The payment branch's documented post-recovery-time behavior changed: ${afterRecoveryResult}`);

console.log('Live-app covenant VM checks passed.');
console.log(`Policy address: ${policy.address}`);
console.log(`Redeem script: ${policy.redeemScript.length} bytes; valid payment/recovery, wrong-recipient, over-cap, fixed-fee, and early-recovery behavior verified.`);
