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

The timestamp is an owner-recovery delay, not an agent-spend expiry: the payment branch remains script-valid after the timestamp. The covenant caps each payment and spends down the specific funded output; separately funded outputs do not share a cumulative allowance.

The web app has a separate owner-authorized P2SH20 covenant flow in `src/lib/covenant.ts` and `src/adapters/bch.ts`. It creates and funds the policy through WizardConnect, finds the confirmed covenant output, prepares payment or recovery transactions, and checks the wallet-returned transaction with the BCH 2023 VM before broadcast. The app covenant flow does not use this XO test account or its agent key. Mainnet funding, a covenant payment, and owner recovery are confirmed; see [`evidence/mainnet-covenant.json`](evidence/mainnet-covenant.json). This is a separate app integration from the XO test account and invitation.

## Public Chipnet proof

The latest confirmed policy transaction spends a 100,000 sat policy output, sends 1,000 sats to the committed recipient, returns 79,000 sats to the same policy script, and pays the fixed 20,000 sat miner fee. This gives a 46.62 sat/B fee rate for the 429-byte transaction. The signed invitation and raw transaction are in [`evidence/`](evidence/); the explorer link and latest verification status are in `evidence/chipnet-transaction.json`.

The invitation runner checks the transaction structure and exact outputs, then verifies the signed transaction with the BCH 2023 virtual machine before broadcasting. The earlier version 0.1.6, which used a 1,000 sat fee and remains pending, is preserved under `evidence/archive/v0.1.6-pending/`.

Chipnet funding and transaction records are public. The generated test-account mnemonic and local engine database remain excluded from Git and stored only in ignored local state. XO deployment and invitation execution remain Chipnet-only. The separate web app has a WizardConnect BCH Mainnet send path enabled by VITE_ENABLE_MAINNET_SENDS and uses the owner wallet; it does not use this test account.

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
