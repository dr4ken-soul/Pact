# Chipnet invitation evidence

The current public invitation uses template version 0.1.7 and policy template ID `a1248b8f4bb968c21072e930324a5e69b73cc642444d7807abf2456cccbd8321`.

The 100,000 sat funding transaction was accepted from the Chipnet faucet. Pact's 429-byte spend pays 20,000 sats in miner fees (46.62 sat/B), sends 1,000 sats to the policy recipient, and returns 79,000 sats to the same covenant. The signed invitation passed the BCH 2023 VM check and was accepted by Electrum.

The 100,000 sat funding transaction confirmed at block 337675 ([explorer](https://explorer.selene.cash/tx/de224c17c6693883786a3a091ff96964fb8648dca71e96bd3a5dc364abdc3eb1?network=chipnet)). The Pact spend then confirmed at block 337884 ([explorer](https://explorer.selene.cash/tx/da7d089a14e5bc9206535013ce20c7b5048d0303a1fe5b64e3a9769f1aec3aa6?network=chipnet)). The 429-byte spend pays 20,000 sats in fees (46.62 sat/B), sends 1,000 sats to the policy recipient, and returns 79,000 sats to the covenant. The signed transaction passed the BCH 2023 VM check. Before confirmation, rebroadcasting the same signed transaction through the second configured Electrum server was accepted. The previous 1,000 sat fee transaction is preserved in [`archive/v0.1.6-pending/`](archive/v0.1.6-pending/).

Refresh evidence from the local Windows account that holds the encrypted Chipnet test profile:

```powershell
node contracts/scripts/verify-chipnet-transaction.mjs
```

The verifier reads the live transaction, the funding transaction history, and both script histories from Chipnet Electrum. The mnemonic and engine database remain local; the public proof bundle contains only the signed invitation, raw transaction, transaction ID, and verified output values.

## Mainnet wallet and covenant evidence

Pact's WizardConnect browser flow completed a user-approved 1,000 sat ordinary BCH Mainnet payment, confirmed in block 978164 with a 226 sat fee. See [`mainnet-payment.json`](mainnet-payment.json). That transaction proves the ordinary wallet send path.

The separate live P2SH20 covenant flow is now confirmed on Mainnet:

- Funding tx [`a8666f…c445ef68`](https://blockexplorer.cash/mainnet/tx/a8666f786627ad94fc0573d990edbc59c7b100af226f6d334baa16dbc445ef68) confirmed in block 978379. It funded 50,000 sats to the covenant and paid a 226 sat miner fee.
- Covenant payment [`f53a93…3f386638`](https://blockexplorer.cash/mainnet/tx/f53a93a7177b7935cc0f57751a3b82aaad3e173e5c88cbf1b51ba6a53f386638) confirmed in block 978381. It spent that covenant output, paid 1,000 sats to the committed recipient, returned 29,000 sats to the same covenant, and paid the fixed 20,000 sat covenant fee.

The transaction details and confirmation counts at verification time are recorded in [`mainnet-covenant.json`](mainnet-covenant.json). Mainnet evidence now shows confirmed covenant funding, a payment with same-script continuation, and owner recovery to the committed owner address. The recovery time opens the owner branch and does not disable the payment branch.
