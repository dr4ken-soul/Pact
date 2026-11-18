# Chipnet invitation evidence

The current public invitation uses template version 0.1.7 and policy template ID `a1248b8f4bb968c21072e930324a5e69b73cc642444d7807abf2456cccbd8321`.

The 100,000 sat funding transaction was accepted from the Chipnet faucet. Pact's 429-byte spend pays 20,000 sats in miner fees (46.62 sat/B), sends 1,000 sats to the policy recipient, and returns 79,000 sats to the same covenant. The signed invitation passed the BCH 2023 VM check and was accepted by Electrum.

The latest live check lists the transaction as **mempool / unconfirmed**; both script histories currently report height -1. It is visible in the explorer, but it has not yet been included in a Chipnet block. The higher fee improves miner priority; it cannot guarantee when Chipnet miners include it. The previous 1,000 sat fee transaction is preserved in [`archive/v0.1.6-pending/`](archive/v0.1.6-pending/).

Refresh evidence from the local Windows account that holds the encrypted Chipnet test profile:

```powershell
node contracts/scripts/verify-chipnet-transaction.mjs
```

The verifier reads the live transaction and both script histories from Chipnet Electrum. The mnemonic and engine database remain local; the public proof bundle contains only the signed invitation, raw transaction, transaction ID, and verified output values.
