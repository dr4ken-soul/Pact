import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { p2pkhTemplate } from '@xo-cash/templates';
import { generateTemplateIdentifier, parseTemplate } from '@xo-cash/utils';

const contractsDir = new URL('../contracts/', import.meta.url);
const policyPath = fileURLToPath(new URL('pact-policy.template.json', contractsDir));
const template = parseTemplate(JSON.parse(fs.readFileSync(policyPath, 'utf8')));
const walletTemplate = parseTemplate(p2pkhTemplate);
if (walletTemplate.name !== 'Wallet (P2PKH)') {
  throw new Error('The installed XO P2PKH wallet template did not pass schema validation.');
}
const pay = template.scripts.paymentChecks;
const reclaim = template.scripts.recoveryChecks;
const required = [
  ['one covenant input', 'OP_TXINPUTCOUNT OP_1 OP_NUMEQUALVERIFY'],
  ['two fixed outputs', 'OP_TXOUTPUTCOUNT OP_2 OP_NUMEQUALVERIFY'],
  ['fixed recipient locking bytecode', 'OP_0 OP_OUTPUTBYTECODE <recipientLockingBytecode> OP_EQUALVERIFY'],
  ['per-payment cap', '<perPaymentCapSatoshis> OP_GREATERTHAN OP_NOT OP_VERIFY'],
  ['no CashTokens on the contract input', 'OP_0 OP_UTXOTOKENCATEGORY OP_0 OP_EQUALVERIFY'],
  ['no CashTokens on either payment output', 'OP_0 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_1 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENAMOUNT OP_0 OP_NUMEQUALVERIFY OP_1 OP_OUTPUTTOKENAMOUNT OP_0 OP_NUMEQUALVERIFY'],
  ['same-script continuation', 'OP_1 OP_OUTPUTBYTECODE OP_INPUTINDEX OP_UTXOBYTECODE OP_EQUALVERIFY'],
  ['finite UTXO balance minus the committed fee', 'OP_0 OP_UTXOVALUE OP_0 OP_OUTPUTVALUE OP_SUB <policyFeeSatoshis> OP_SUB OP_1 OP_OUTPUTVALUE OP_NUMEQUALVERIFY'],
  ['dust floors', '<dustLimitSatoshis> OP_LESSTHAN OP_NOT OP_VERIFY'],
];
for (const [label, expected] of required) {
  if (!pay.includes(expected)) throw new Error(`Pact XO payment branch is missing ${label}.`);
}
for (const [label, expected] of [
  ['owner recovery locktime', '<expiryTimestamp> OP_CHECKLOCKTIMEVERIFY OP_DROP'],
  ['owner recovery destination', 'OP_0 OP_OUTPUTBYTECODE <ownerLockingBytecode> OP_EQUALVERIFY'],
  ['owner recovery fee', 'OP_0 OP_UTXOVALUE <policyFeeSatoshis> OP_SUB OP_0 OP_OUTPUTVALUE OP_NUMEQUALVERIFY'],
  ['no CashTokens on owner recovery output', 'OP_0 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENAMOUNT OP_0 OP_NUMEQUALVERIFY'],
]) {
  if (!reclaim.includes(expected)) throw new Error(`Pact XO recovery branch is missing ${label}.`);
}
if (template.outputs.policyContinuationOutput.valueSatoshis !== '$(<inputSatoshis> <policyFeeSatoshis> OP_SUB <paymentSatoshis> OP_SUB)') {
  throw new Error('Pact continuation must subtract the fee and payment in BCH VM order.');
}
if (!template.scripts.pactPolicy.endsWith('OP_ENDIF OP_1')) throw new Error('The covenant must leave a true result on the stack after successful validation.');
if (!pay.includes('OP_TXLOCKTIME OP_0 OP_NUMEQUALVERIFY')) throw new Error('The payment branch must require zero transaction locktime.');
const actionVariables = template.actions.pay.roles.agent.requirements.variables;
for (const identifier of ['inputSatoshis', 'paymentSatoshis', 'recipientLockingBytecode', 'ownerLockingBytecode', 'perPaymentCapSatoshis', 'expiryTimestamp', 'policyFeeSatoshis', 'dustLimitSatoshis']) {
  if (!actionVariables.includes(identifier)) throw new Error(`Pact XO pay action does not request ${identifier}.`);
}
console.log('Pact XO template schema and covenant policy passed:', template.name, template.version);
console.log('Template ID:', generateTemplateIdentifier(template));
console.log('Enforced: fixed recipient, per-payment cap, one input, CashTokens excluded, same-script value continuation, fixed fee, dust floors, zero payment locktime, and delayed owner recovery.');
console.log('Expiry limitation: the agent branch remains usable after the recovery time; the owner reclaim branch becomes available then.');
