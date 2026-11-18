import fs from 'node:fs';
import { parseTemplate } from '@xo-cash/utils';

const template = JSON.parse(fs.readFileSync(new URL('../pact-policy.template.json', import.meta.url), 'utf8'));
const parsed = parseTemplate(template);
const pay = parsed.scripts.paymentChecks;
const reclaim = parsed.scripts.recoveryChecks;
const required = [
  ['single policy input', 'OP_TXINPUTCOUNT OP_1 OP_NUMEQUALVERIFY'],
  ['CashTokens excluded from both payment outputs', 'OP_0 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_1 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENAMOUNT OP_0 OP_NUMEQUALVERIFY OP_1 OP_OUTPUTTOKENAMOUNT OP_0 OP_NUMEQUALVERIFY'],
  ['immediate pay transaction', 'OP_TXLOCKTIME OP_0 OP_NUMEQUALVERIFY'],
  ['approved recipient', '<recipientLockingBytecode> OP_EQUALVERIFY'],
  ['per-payment cap', '<perPaymentCapSatoshis> OP_GREATERTHAN OP_NOT OP_VERIFY'],
  ['same-script continuation', 'OP_UTXOBYTECODE OP_EQUALVERIFY'],
  ['finite funded balance', 'OP_UTXOVALUE OP_0 OP_OUTPUTVALUE OP_SUB'],
];
for (const [label, expected] of required) {
  if (!pay.includes(expected)) throw new Error(`Pact XO payment branch is missing ${label}.`);
}
if (!parsed.scripts.pactPolicy.endsWith('OP_ENDIF OP_1')) throw new Error('The covenant must leave a true result on the stack after successful validation.');
if (!reclaim.includes('OP_0 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENAMOUNT OP_0 OP_NUMEQUALVERIFY')) throw new Error('Pact XO owner recovery output must exclude CashTokens.');
if (!reclaim.includes('OP_CHECKLOCKTIMEVERIFY')) throw new Error('Pact XO owner recovery branch is missing its locktime check.');
if (parsed.outputs.policyContinuationOutput.valueSatoshis !== '$(<inputSatoshis> <policyFeeSatoshis> OP_SUB <paymentSatoshis> OP_SUB)') {
  throw new Error('Pact XO continuation value must subtract the committed fee and payment from the policy input.');
}
console.log(`Pact XO template schema and policy checks passed: ${parsed.name} ${parsed.version}`);
console.log('Enforced: fixed recipient, per-payment cap, one input, same-script continuation, finite funded balance, and owner recovery after locktime.');
console.log('The agent payment branch remains available after recovery time.');
