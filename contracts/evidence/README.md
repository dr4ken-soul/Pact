# Chipnet invitation evidence

The current public invitation uses template version 0.1.6 and policy template ID `2ca390e32b03143ffabff70041773ae182e7299f77af6e3f499aa2487240c862`.

The transaction was accepted by Electrum and appears in both the recipient and covenant script histories. Its current status is **mempool (height -1)**, so it has not yet been confirmed in a Chipnet block. The proof bundle contains the signed invitation, raw transaction bytes, and `chipnet-transaction.json` with the transaction ID and verified output values.

The expected transition is 10,000 sats from one policy input: 1,000 sats to the fixed recipient, 8,000 sats back to the same covenant, and a fixed 1,000 sat miner fee. The retrieved transaction also passed the BCH 2023 virtual machine check.

Refresh the evidence from the local Windows account that holds the encrypted Chipnet test profile:

```powershell
node contracts/scripts/verify-chipnet-transaction.mjs
```

This verifier reads the live transaction and both script histories from the Chipnet Electrum server. The test wallet mnemonic and engine database are local only; they are not included in this public proof bundle.
