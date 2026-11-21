# Pact

Pact is a Bitcoin Cash payment prototype for AI agents. An agent proposes a payment; the wallet owner funds a recipient-and-cap covenant, reviews each spend, and signs it through WizardConnect. Pact checks the signed transaction with the BCH 2023 virtual machine before broadcasting.

## Covenant flow

1. Connect the policy owner's WizardConnect-compatible BCH wallet.
2. Choose a BCH recipient, per-payment cap, recovery time, and covenant funding amount.
3. Review and approve funding in the wallet. Wait for the covenant output to confirm.
4. Enter a payment amount and review the covenant transaction, recipient, continuation, and fixed fee.
5. Approve the spend in the wallet. Pact broadcasts only after the wallet returns a signature and local VM validation passes.
6. Wait for the continuation output to confirm before preparing another spend.

The covenant enforces one recipient, a per-payment ceiling, one covenant input, token-free outputs, a same-script continuation, and an exact 20,000 sat fee. Each output has its own finite balance; separate funding outputs do not share one lifetime cap. The recovery timestamp opens the owner's recovery branch but does not disable the payment branch. The owner wallet signs every payment.

The confirmed 1,000 sat Mainnet transaction listed below was an ordinary wallet payment, not a covenant spend. The live covenant interface is implemented for Chipnet and Mainnet, but no Mainnet covenant transaction is claimed as confirmed.

## WizardConnect reconnection

Pact restores its WizardConnect pairing after a page refresh using an app-specific browser storage entry. That entry contains the app-side pairing credentials and wallet public key, not a wallet seed phrase or wallet signing key. On a shared device, disconnect from Pact to clear the stored pairing.

If Paytaca shows an old Pact entry as “reconnecting” with “Subscription closed”, remove that stale entry in Paytaca. Then use **Try other relay** in Pact to generate a new QR/link through the alternate official endpoint. Remove the failed entry in Paytaca before scanning the replacement.

## Run locally

Requirements: Node.js 22.12 or later and npm.

1. Use the actual root `.env` file. Its `VITE_*` values are public client configuration, not credentials.
2. Run `npm ci --cache .npm-cache`.
3. Run `npm run dev` and open the local Vite URL.
4. Select Chipnet or Mainnet, connect a wallet on the same network, and review every wallet request.

The production build validates the XO template, runs BCH 2023 covenant VM cases, type-checks the app, and builds the Vite bundle:

```powershell
$env:NPM_CONFIG_CACHE = 'S:\Hackathon\Pact\.npm-cache'
npm run build
```

## Contract packages

- `src/lib/covenant.ts` constructs the app's owner-authorized P2SH20 policy.
- `src/adapters/bch.ts` funds the policy, finds its confirmed output, prepares pay/recovery transactions, asks WizardConnect to sign, validates the returned transaction locally, and broadcasts it.
- `contracts/pact-policy.template.json` and `contracts/evidence/` contain the separate XO Engine Chipnet invitation and transaction proof.

The XO Engine demo uses its own generated Chipnet test account. Its mnemonic is encrypted locally with Windows DPAPI under ignored `contracts/.xo-state/`; it is not placed in `.env`, committed, uploaded to Vercel, or used on Mainnet. The web app never requests an end-user recovery phrase.

## Confirmed Mainnet wallet payment

An owner-approved 1,000 sat ordinary BCH Mainnet payment confirmed in block 978164 on 20 November 2026 with a 226 sat fee. [View the transaction](https://blockchair.com/bitcoin-cash/transaction/3016046b74c212788c08d99b7637458edfaa2fcc1ab3b71682aa542182c19704). This is evidence for the ordinary WizardConnect send path; it is not proof of a Mainnet covenant spend.

## Project links

- Live demo: https://pact-bch.vercel.app
- Source: https://github.com/dr4ken-soul/Pact
- Editable presentation: https://github.com/dr4ken-soul/Pact/raw/refs/heads/main/Pact_Pitch_Deck.pptx
- Submission status: [SUBMISSION_STATUS.md](SUBMISSION_STATUS.md)
- Product overview: [PRODUCT.md](PRODUCT.md)
- Marketing guide and copy: [MARKETING_GUIDE.md](MARKETING_GUIDE.md)
- Covenant details: [contracts/README.md](contracts/README.md)
- How to fund and spend the live-app covenant: [COVENANT_SPENDING_GUIDE.md](COVENANT_SPENDING_GUIDE.md)
