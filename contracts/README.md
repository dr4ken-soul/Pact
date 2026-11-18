# Pact XO Chipnet policy

Pact provides a custom XO wallet template in `pact-policy.template.json` (version 0.1.6, template ID `2ca390e32b03143ffabff70041773ae182e7299f77af6e3f499aa2487240c862`). The template was compiled with the pinned XO Engine and executed as an invitation on BCH Chipnet.

## What the covenant enforces

- Exactly one input and two outputs for an agent payment.
- Payment output goes to the fixed recipient in the policy state.
- Payment output is positive, at least 546 sats, and no more than 100,000 sats.
- No CashTokens in the policy input, payment outputs, or owner recovery output.
- The second output returns to the exact policy locking bytecode and is exactly input value minus payment and the fixed 1,000 sat policy fee.
- The continuation remains at least 546 sats.
- Agent payment transactions require `nLockTime = 0`.
- The owner can reclaim the remaining BCH after the configured timestamp, less the fixed 1,000 sat fee.

The timestamp is a recovery delay, not an agent-spend expiry: the agent payment branch remains usable after the timestamp. The covenant also limits each payment and each funded UTXO balance; it does not track a shared cumulative cap across separate UTXOs or refills. The browser WizardConnect payment path does not use this covenant.

## Public Chipnet proof

The executed policy transaction spends a 10,000 sat policy output, sends 1,000 sats to the committed recipient, returns 8,000 sats to the same policy script, and pays the fixed 1,000 sat fee. The transaction and invitation are in [`evidence/`](evidence/), with an explorer link in `evidence/chipnet-transaction.json`.

The invitation runner validates the transaction shape and exact outputs, then verifies the signed transaction with the installed BCH 2023 virtual machine before broadcasting. Chipnet funding and transaction records are public data; the generated account mnemonic and local engine database remain excluded from Git.

## Reproduce on Windows

Run these commands from the repository root. The npm cache stays under the repository:

```powershell
$env:NPM_CONFIG_CACHE = 'S:\Hackathon\Pact\.npm-cache'
npm ci --prefix contracts --cache .npm-cache
npm run validate --prefix contracts
npm run compile --prefix contracts
npm run profile --prefix contracts
npm run fund:chipnet --prefix contracts
npm run invitation:chipnet --prefix contracts
node contracts/scripts/verify-chipnet-transaction.mjs
```

The account wrapper encrypts a separate generated Chipnet test mnemonic with current-user DPAPI and stores it only in the ignored `contracts/.xo-state/chipnet-mnemonic.dpapi` file. It sends the decrypted phrase to the local Node process through stdin; it does not print it. This file is tied to the same Windows user and machine. It is not an end-user wallet and must never be reused on Mainnet.

The public profile and invitation evidence can be regenerated from that local account. Do not delete `.xo-state` before the invitation is complete; it holds the encrypted test-account state and uncommitted local sync data.
