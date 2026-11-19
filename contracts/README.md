# Pact XO Chipnet policy

Pact provides a custom XO wallet template in `pact-policy.template.json` (version 0.1.7, template ID `a1248b8f4bb968c21072e930324a5e69b73cc642444d7807abf2456cccbd8321`). The template compiles with the pinned XO Engine and has a broadcast invitation on BCH Chipnet. Its latest Chipnet invitation is confirmed at block 337884. See the public evidence in evidence/README.md.

## What the covenant enforces

- Exactly one input and two outputs for an agent payment.
- Payment output goes to the fixed recipient in the policy state.
- Payment output is positive, at least 546 sats, and no more than 100,000 sats.
- No CashTokens in the policy input, payment outputs, or owner recovery output.
- The second output returns to the exact policy locking bytecode and is exactly input value minus payment and the fixed 20,000 sat policy fee.
- The continuation remains at least 546 sats.
- Agent payment transactions require `nLockTime = 0`.
- The owner can reclaim the remaining BCH after the configured timestamp, less the fixed 20,000 sat fee.

The timestamp is an owner-recovery delay, not an agent-spend expiry: the agent payment branch remains usable after the timestamp. The covenant caps each payment and spends down each funded UTXO; separately funded UTXOs do not share a cumulative allowance. The browser WizardConnect payment path does not use this covenant.

## Public Chipnet proof

The latest confirmed policy transaction spends a 100,000 sat policy output, sends 1,000 sats to the committed recipient, returns 79,000 sats to the same policy script, and pays the fixed 20,000 sat miner fee. This gives a 46.62 sat/B fee rate for the 429-byte transaction. The signed invitation and raw transaction are in [`evidence/`](evidence/); the explorer link and latest verification status are in `evidence/chipnet-transaction.json`.

The invitation runner checks the transaction structure and exact outputs, then verifies the signed transaction with the BCH 2023 virtual machine before broadcasting. The earlier version 0.1.6, which used a 1,000 sat fee and remains pending, is preserved under `evidence/archive/v0.1.6-pending/`.

Chipnet funding and transaction records are public. The generated test-account mnemonic and local engine database remain excluded from Git and stored only in ignored local state. Mainnet sends remain disabled.

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

The account wrapper encrypts the separate generated Chipnet test mnemonic with current-user DPAPI in `contracts/.xo-state/chipnet-mnemonic.dpapi`. It passes the decrypted phrase to the local Node process through stdin and never prints it. This test account is not an end-user wallet and must never be reused on Mainnet. Keep `.xo-state` until the invitation is complete; it holds the encrypted account state and local sync data.
