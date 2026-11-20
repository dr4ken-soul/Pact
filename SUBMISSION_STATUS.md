# Submission status

## Built and verified

- Pact web app with WizardConnect wallet pairing, proposal checks, transaction review, and Chipnet-first configuration.
- XO template version 0.1.7 and invitation transaction confirmed on Chipnet at block 337884. Its 100,000 sat funding transaction confirmed at block 337675. The 429-byte payment pays 1,000 sats, returns 79,000 sats to the covenant, and pays a fixed 20,000 sat fee. BCH 2023 VM validation passed.
- Public transaction and invitation evidence are in contracts/evidence/.
- Production build passes template validation, TypeScript compilation, and Vite bundling.
- GitHub and Vercel are linked. The production site is https://pact-bch.vercel.app; Mainnet sends are enabled, with Chipnet remaining the default network. A user-approved Mainnet payment of 1,000 sats was confirmed in block 978164; the fee was 226 sats. The app's Mainnet wallet-approval and broadcast path therefore has an end-to-end successful payment. This does not turn Pact's app-level spending checks into on-chain enforcement.
- Pact_Pitch_Deck.pptx is the editable PowerPoint deck derived from the Widget Factory template. It is not a Google Slides file stored in Drive.

## Real .env and Vercel settings

All VITE values are public browser configuration; the app needs no private API credentials.

- VITE_PROJECT_DECK_URL points to the Pact PowerPoint file in GitHub. It can be replaced by a native Google Slides copy URL if one is made.
- VITE_EMBER2026_CASHTOKENS_ADDRESS contains the address supplied by the owner. BCH BLAZE has stated that EMBER2026 has not yet been minted or distributed and that no official receive address or token category is available. The supplied address is not an official EMBER2026 address.
- VITE_EMBER2026_VERIFIED remains false.
- VITE_DEMO_RECIPIENT is a separate Chipnet address used for the XO proof.
- VITE_DEMO_AMOUNT_BCH is 0.00001 BCH (1,000 sats).
- VITE_XO_TRANSACTION_URL points to the confirmed Chipnet payment.
- VITE_BCH_NETWORK remains chipnet by default; VITE_ENABLE_MAINNET_SENDS is true in local .env and Vercel. Choose Mainnet in the app to use a bitcoincash recipient and a Mainnet-connected WizardConnect wallet.
- Mainnet and Chipnet Electrum host overrides are blank, so the app uses its packaged server list.

## Event and community status

- BLAZE roll call: MISSED / CLOSED. The BLAZE chat notice shown by the owner says late entrants can still compete and do not need to complete roll call.
- Event entry: not submitted yet. The CompeteHub mirror of the DoraHacks listing says Mainnet-track entries need an original project, a feature sending BCH Mainnet, a live demo, WizardConnect, a short Widget Factory-based presentation, and project confirmation in the BCH BLAZE Telegram. The Mainnet-send feature now has a confirmed end-to-end payment proof (see below). The event form and Telegram confirmation still need to be completed by the owner.
- Telegram: the CompeteHub mirror of the DoraHacks track listing says projects must confirm they are real in the BCH BLAZE Telegram channel. The screenshot available here shows an EMBER question, not a clear Pact project confirmation. Post the project name, demo/repository links, and an explicit confirmation; keep the post link or screenshot. My earlier statement that no confirmation was required was incorrect.
- EMBER2026: BLAZE says the token is not minted or distributed and no official address/category exists. The CompeteHub mirror of the DoraHacks track listing places a receive-capable EMBER2026 CashTokens address under Community Choice, not the Mainnet-track requirements. The supplied address therefore cannot qualify the project for Community Choice; wait for the official token details. It is not needed to make Pact send ordinary BCH.
- XO template limitations remain documented: the cap is per spend, not cumulative across separate outputs, and the agent payment branch remains usable after the owner recovery time.
- The XO developer feedback draft is local for owner review and has not been submitted.

## Google Slides copy

No connected Google Slides session is available here. The editable PowerPoint deck is derived from the Widget Factory template, but the requested native Slides copy and URL are still outstanding. This does not prevent building the app; verify the accepted presentation format in the live DoraHacks form.

## Mainnet payment proof

- Transaction: `3016046b74c212788c08d99b7637458edfaa2fcc1ab3b71682aa542182c19704`
- Network and status: Bitcoin Cash Mainnet, confirmed in block `978164` on 2026-11-20. At the live check on 2026-11-20 18:30:57 UTC, the provider reported 35 confirmations (tip height 978198); this count naturally increases as blocks are added.
- Payment: 1,000 sats (0.00001 BCH) to the selected recipient; 94,334 sats returned as change; 226 sat network fee.
- Explorer: https://blockchair.com/bitcoin-cash/transaction/3016046b74c212788c08d99b7637458edfaa2fcc1ab3b71682aa542182c19704
- A machine-readable snapshot is in `contracts/evidence/mainnet-payment.json`.
- This is a separate WizardConnect wallet payment, not the Chipnet XO covenant transaction. It proves this Mainnet send worked and confirmed; it does not prove an on-chain spending cap, cumulative budget, or expiry for the browser rule.

## Links

- GitHub: https://github.com/dr4ken-soul/Pact
- PowerPoint deck: https://github.com/dr4ken-soul/Pact/raw/refs/heads/main/Pact_Pitch_Deck.pptx
- Vercel demo: https://pact-bch.vercel.app
- Confirmed Chipnet payment: https://explorer.selene.cash/tx/da7d089a14e5bc9206535013ce20c7b5048d0303a1fe5b64e3a9769f1aec3aa6?network=chipnet
- Confirmed Mainnet wallet payment: https://blockchair.com/bitcoin-cash/transaction/3016046b74c212788c08d99b7637458edfaa2fcc1ab3b71682aa542182c19704
- Widget Factory Google Slides template: https://docs.google.com/presentation/d/1Yfuk9CJkf4U9M_WukcELhumWgj3Ak6345Ewy8hSp-Hk/edit?slide=id.p#slide=id.p
- DoraHacks event: https://dorahacks.io/hackathon/bchblaze2026/
- BLAZE schedule and roll call: https://bchblaze.cash/live/
- BLAZE Telegram community: https://t.me/bchblaze

## Event-listing research

- DoraHacks is the authoritative submission portal, but its page returned HTTP 405 to the read-only web reader. The explicit requirements above come from a CompeteHub mirror of the DoraHacks listing; verify the current track text and form fields in the logged-in DoraHacks page before submitting.
- The mirror lists an EMBER-capable CashTokens address under Community Choice, while its Mainnet-track requirements list a live Mainnet BCH feature and WizardConnect but not the EMBER address.
- Examples visible publicly: the owner-provided screenshot shows a Vouch Telegram post with a concise description, live demo, repository, and wallet integration. The BLAZE account also linked a Spirits of Bitcoin demo on 17 November. These demonstrate how projects are being presented publicly; I could not verify that either is a final DoraHacks BUIDL submission, and web search did not expose a public submission roster.
