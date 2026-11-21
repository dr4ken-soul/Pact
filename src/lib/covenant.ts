import {
  encodeDataPush,
  encodeLockingBytecodeP2sh20,
  cashAddressToLockingBytecode,
  hash160,
  hexToBin,
  lockingBytecodeToCashAddress,
  OpcodesBch2023,
  publicKeyToP2pkhCashAddress,
  type CashAddressNetworkPrefix,
} from '@bitauth/libauth';

export const POLICY_FEE_SATS = 20_000n;
export const BCH_DUST_SATS = 546n;

export interface CovenantPolicy {
  network: 'mainnet' | 'chipnet';
  recipient: string;
  ownerAddress: string;
  ownerPublicKey: Uint8Array;
  capSats: bigint;
  recoveryTimestamp: number;
  address: string;
  lockingBytecode: Uint8Array;
  redeemScript: Uint8Array;
}

export interface CovenantUtxo {
  txid: string;
  vout: number;
  valueSats: bigint;
  height: number;
}

const op = (...names: (keyof typeof OpcodesBch2023)[]) => Uint8Array.from(names.map(name => Number(OpcodesBch2023[name])));

function concat(...items: Uint8Array[]) {
  const result = new Uint8Array(items.reduce((length, item) => length + item.length, 0));
  let offset = 0;
  for (const item of items) { result.set(item, offset); offset += item.length; }
  return result;
}

function pushNumber(value: bigint) {
  if (value === 0n) return op('OP_0');
  if (value >= 1n && value <= 16n) return op((`OP_${value}`) as keyof typeof OpcodesBch2023);
  const negative = value < 0n;
  let remaining = negative ? -value : value;
  const bytes: number[] = [];
  while (remaining > 0n) { bytes.push(Number(remaining & 0xffn)); remaining >>= 8n; }
  if ((bytes[bytes.length - 1] & 0x80) !== 0) bytes.push(negative ? 0x80 : 0);
  else if (negative) bytes[bytes.length - 1] |= 0x80;
  return encodeDataPush(Uint8Array.from(bytes));
}

function signatureGuard(ownerPublicKeyHash: Uint8Array) {
  return concat(
    // The unlocking stack is [owner pubkey, owner signature]. Check its hash;
    // CHECKSIG then consumes the signature with the verified pubkey beneath it.
    op('OP_SWAP', 'OP_DUP', 'OP_HASH160'), encodeDataPush(ownerPublicKeyHash),
    op('OP_EQUALVERIFY', 'OP_CHECKSIGVERIFY'),
  );
}

function paymentChecks(recipientLockingBytecode: Uint8Array, capSats: bigint) {
  const checkNoTokenAt = (index: 0 | 1) => concat(
    pushNumber(BigInt(index)), op('OP_OUTPUTTOKENCATEGORY'), pushNumber(0n), op('OP_EQUALVERIFY'),
    pushNumber(BigInt(index)), op('OP_OUTPUTTOKENAMOUNT'), pushNumber(0n), op('OP_NUMEQUALVERIFY'),
  );
  return concat(
    op('OP_INPUTINDEX'), pushNumber(0n), op('OP_NUMEQUALVERIFY'),
    op('OP_TXINPUTCOUNT'), pushNumber(1n), op('OP_NUMEQUALVERIFY'),
    op('OP_TXOUTPUTCOUNT'), pushNumber(2n), op('OP_NUMEQUALVERIFY'),
    op('OP_TXLOCKTIME'), pushNumber(0n), op('OP_NUMEQUALVERIFY'),
    pushNumber(0n), op('OP_UTXOTOKENCATEGORY'), pushNumber(0n), op('OP_EQUALVERIFY'),
    pushNumber(0n), op('OP_UTXOTOKENAMOUNT'), pushNumber(0n), op('OP_NUMEQUALVERIFY'),
    checkNoTokenAt(0), checkNoTokenAt(1),
    pushNumber(0n), op('OP_OUTPUTBYTECODE'), encodeDataPush(recipientLockingBytecode), op('OP_EQUALVERIFY'),
    pushNumber(0n), op('OP_OUTPUTVALUE'), pushNumber(capSats), op('OP_GREATERTHAN', 'OP_NOT', 'OP_VERIFY'),
    pushNumber(0n), op('OP_OUTPUTVALUE'), pushNumber(0n), op('OP_GREATERTHAN', 'OP_VERIFY'),
    pushNumber(0n), op('OP_OUTPUTVALUE'), pushNumber(BCH_DUST_SATS), op('OP_LESSTHAN', 'OP_NOT', 'OP_VERIFY'),
    pushNumber(1n), op('OP_OUTPUTBYTECODE'), op('OP_INPUTINDEX', 'OP_UTXOBYTECODE', 'OP_EQUALVERIFY'),
    pushNumber(0n), op('OP_UTXOVALUE'), pushNumber(0n), op('OP_OUTPUTVALUE', 'OP_SUB'),
    pushNumber(POLICY_FEE_SATS), op('OP_SUB'), pushNumber(1n), op('OP_OUTPUTVALUE', 'OP_NUMEQUALVERIFY'),
    pushNumber(1n), op('OP_OUTPUTVALUE'), pushNumber(BCH_DUST_SATS), op('OP_LESSTHAN', 'OP_NOT', 'OP_VERIFY'),
  );
}

function recoveryChecks(ownerLockingBytecode: Uint8Array, recoveryTimestamp: number) {
  return concat(
    op('OP_INPUTINDEX'), pushNumber(0n), op('OP_NUMEQUALVERIFY'),
    op('OP_TXINPUTCOUNT'), pushNumber(1n), op('OP_NUMEQUALVERIFY'),
    op('OP_TXOUTPUTCOUNT'), pushNumber(1n), op('OP_NUMEQUALVERIFY'),
    pushNumber(BigInt(recoveryTimestamp)), op('OP_CHECKLOCKTIMEVERIFY', 'OP_DROP'),
    pushNumber(0n), op('OP_UTXOTOKENCATEGORY'), pushNumber(0n), op('OP_EQUALVERIFY'),
    pushNumber(0n), op('OP_UTXOTOKENAMOUNT'), pushNumber(0n), op('OP_NUMEQUALVERIFY'),
    pushNumber(0n), op('OP_OUTPUTTOKENCATEGORY'), pushNumber(0n), op('OP_EQUALVERIFY'),
    pushNumber(0n), op('OP_OUTPUTTOKENAMOUNT'), pushNumber(0n), op('OP_NUMEQUALVERIFY'),
    pushNumber(0n), op('OP_OUTPUTBYTECODE'), encodeDataPush(ownerLockingBytecode), op('OP_EQUALVERIFY'),
    pushNumber(0n), op('OP_UTXOVALUE'), pushNumber(POLICY_FEE_SATS), op('OP_SUB'),
    pushNumber(0n), op('OP_OUTPUTVALUE', 'OP_NUMEQUALVERIFY'),
    pushNumber(0n), op('OP_OUTPUTVALUE'), pushNumber(BCH_DUST_SATS), op('OP_LESSTHAN', 'OP_NOT', 'OP_VERIFY'),
  );
}

export function createCovenantPolicy(args: {
  network: 'mainnet' | 'chipnet';
  recipient: string;
  ownerPublicKey: Uint8Array;
  capSats: bigint;
  recoveryTimestamp: number;
}): CovenantPolicy {
  if (args.ownerPublicKey.length !== 33) throw new Error('The connected wallet must provide a compressed 33-byte public key.');
  if (!Number.isInteger(args.recoveryTimestamp) || args.recoveryTimestamp < 500_000_000 || args.recoveryTimestamp > 4_294_967_295) {
    throw new Error('The owner recovery time must be a Unix timestamp within the BCH locktime range.');
  }
  if (args.capSats < BCH_DUST_SATS) throw new Error('The per-payment cap must be at least 546 satoshis.');
  const prefix = (args.network === 'mainnet' ? 'bitcoincash' : 'bchtest') as CashAddressNetworkPrefix;
  const ownerAddressResult = publicKeyToP2pkhCashAddress({ publicKey: args.ownerPublicKey, prefix });
  if (typeof ownerAddressResult === 'string') throw new Error('The wallet public key could not be encoded as an owner address.');
  const ownerLockingBytecode = hexToBin('76a914' + Array.from(hash160(args.ownerPublicKey), byte => byte.toString(16).padStart(2, '0')).join('') + '88ac');
  const recipientDecoded = args.recipient.trim() === args.recipient ? cashAddressToLockingBytecode(args.recipient) : null;
  if (!recipientDecoded || typeof recipientDecoded === 'string' || recipientDecoded.prefix !== prefix || recipientDecoded.bytecode.length !== 25) {
    throw new Error(args.network === 'mainnet' ? 'Choose a valid BCH Mainnet P2PKH recipient.' : 'Choose a valid Chipnet P2PKH recipient.');
  }
  const ownerHash = hash160(args.ownerPublicKey);
  const redeemScript = concat(
    op('OP_IF'), signatureGuard(ownerHash), paymentChecks(recipientDecoded.bytecode, args.capSats),
    op('OP_ELSE'), signatureGuard(ownerHash), recoveryChecks(ownerLockingBytecode, args.recoveryTimestamp),
    op('OP_ENDIF', 'OP_1'),
  );
  const lockingBytecode = encodeLockingBytecodeP2sh20(hash160(redeemScript));
  const encodedAddress = lockingBytecodeToCashAddress({ prefix, bytecode: lockingBytecode });
  if (typeof encodedAddress === 'string') throw new Error('The covenant address could not be encoded.');
  return {
    network: args.network,
    recipient: args.recipient,
    ownerAddress: ownerAddressResult.address,
    ownerPublicKey: args.ownerPublicKey,
    capSats: args.capSats,
    recoveryTimestamp: args.recoveryTimestamp,
    address: encodedAddress.address,
    lockingBytecode,
    redeemScript,
  };
}
