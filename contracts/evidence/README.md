# Chipnet invitation evidence

The current public invitation uses template version 0.1.7 and policy template ID `a1248b8f4bb968c21072e930324a5e69b73cc642444d7807abf2456cccbd8321`.

The 100,000 sat funding transaction was accepted from the Chipnet faucet. Pact's 429-byte spend pays 20,000 sats in miner fees (46.62 sat/B), sends 1,000 sats to the policy recipient, and returns 79,000 sats to the same covenant. The signed invitation passed the BCH 2023 VM check and was accepted by Electrum.

The 100,000 sat funding transaction confirmed at block 337675 ([explorer](https://explorer.selene.cash/tx/de224c17c6693883786a3a091ff96964fb8648dca71e96bd3a5dc364abdc3eb1?network=chipnet)). The Pact spend then confirmed at block 337884 ([explorer](https://explorer.selene.cash/tx/da7d089a14e5bc9206535013ce20c7b5048d0303a1fe5b64e3a9769f1aec3aa6?network=chipnet)). The 429-byte spend pays 20,000 sats in fees (46.62 sat/B), sends 1,000 sats to the policy recipient, and returns 79,000 sats to the covenant. The signed transaction passed the BCH 2023 VM check. Before confirmation, rebroadcasting the same signed transaction through the second configured Electrum server was accepted. The previous 1,000 sat fee transaction is preserved in [`archive/v0.1.6-pending/`](archive/v0.1.6-pending/).

Refresh evidence from the local Windows account that holds the encrypted Chipnet test profile:

```powershell
node contracts/scripts/verify-chipnet-transaction.mjs
```

The verifier reads the live transaction, the funding transaction history, and both script histories from Chipnet Electrum. The mnemonic and engine database remain local; the public proof bundle contains only the signed invitation, raw transaction, transaction ID, and verified output values.
