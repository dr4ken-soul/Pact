# Submission status

## Completed in this checkout

- Pact web app with WizardConnect wallet pairing, proposal checks, transaction review, and Chipnet-first configuration.
- A custom XO template, pinned dependencies, local BCH VM validation, and a Chipnet invitation accepted by Electrum. Public invitation and transaction evidence are in `contracts/evidence/`. Current chain status: mempool, awaiting confirmation.
- Production build passes template validation, TypeScript compilation, and Vite bundling.
- The Vercel project and GitHub repository are linked; mainnet sends remain disabled.
- A Pact pitch deck was created from the Widget Factory template and saved as `Pact_Pitch_Deck.pptx` in this repository. The current public URL points to the downloadable PowerPoint file, not a Google Slides copy.

## Values in the real root `.env`

All `VITE_*` values are public browser configuration. Do not put a private key, seed phrase, API secret, or wallet backup in `.env` or Vercel environment variables.

- `VITE_PROJECT_DECK_URL`: currently links to the public PPTX file in GitHub. Replace it with the Google Slides copy URL if a Google Slides copy is created.
- `VITE_PROJECT_REPOSITORY_URL`: `https://github.com/dr4ken-soul/Pact`.
- `VITE_EMBER2026_CASHTOKENS_ADDRESS`: set to the address supplied by the owner. It is labelled unverified in the app until the Pact team confirms it.
- `VITE_EMBER2026_VERIFIED`: keep `false` until the team confirms the address and token category.
- `VITE_DEMO_RECIPIENT`: a generated, separate `bchtest:` Chipnet recipient used by the public XO proof.
- `VITE_DEMO_AMOUNT_BCH`: `0.00001` BCH (1,000 sats).
- `VITE_XO_TRANSACTION_URL`: direct Chipnet explorer link for the executed XO payment.
- `VITE_BCH_NETWORK`: `chipnet`.
- `VITE_ENABLE_MAINNET_SENDS`: `false`.
- `VITE_MAINNET_ELECTRUM_HOST` and `VITE_CHIPNET_ELECTRUM_HOST`: blank to use package defaults.

There are no API credentials required for the static Vite app or the WizardConnect browser flow. Do not upload the local XO test-account mnemonic to Vercel.

## What still needs a human confirmation or external submission

1. Ask the Pact team to verify the EMBER2026 CashTokens receive address and token category. Send a short message in the [BCH BLAZE Telegram community](https://t.me/bchblaze); set `VITE_EMBER2026_VERIFIED=true` only after confirmation.
2. If the event requires a native Google Slides URL, make a Google Slides copy of the included PPTX/template and replace `VITE_PROJECT_DECK_URL` with that copy's URL. The presentation file itself is already in the repository.
3. Complete the BLAZE roll call and event submission, then provide any requested Telegram confirmation. Keep the actual confirmation links with the project.
4. Run the public wallet demo with a funded Chipnet-compatible wallet if a judge-facing WizardConnect transaction walkthrough is needed. The separate XO invitation is already executed and evidenced.
5. Keep Mainnet payments disabled until the team verifies the EMBER address and the project owner separately approves a Mainnet release.

## Direct links

- GitHub repository: https://github.com/dr4ken-soul/Pact
- Pact pitch deck file: https://github.com/dr4ken-soul/Pact/blob/main/Pact_Pitch_Deck.pptx
- Vercel demo: https://pact-bch.vercel.app
- Widget Factory Slides template: https://docs.google.com/presentation/d/1Yfuk9CJkf4U9M_WukcELhumWgj3Ak6345Ewy8hSp-Hk/edit?slide=id.p#slide=id.p
- BLAZE roll call: https://bchblaze.cash/live/
- BLAZE Telegram: https://t.me/bchblaze
- Paytaca wallet: https://www.paytaca.com/applications/wallet
- Electron Cash download page: https://electroncash.org/
- Chipnet faucet: https://chipnet.bch.ninja/
