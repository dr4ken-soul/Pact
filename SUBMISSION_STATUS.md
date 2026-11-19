# Submission status

## Built and verified

- Pact web app with WizardConnect wallet pairing, proposal checks, transaction review, and Chipnet-first configuration.
- XO template version 0.1.7 and invitation transaction confirmed on Chipnet at block 337884. Its 100,000 sat funding transaction confirmed at block 337675. The 429-byte payment pays 1,000 sats, returns 79,000 sats to the covenant, and pays a fixed 20,000 sat fee. BCH 2023 VM validation passed.
- Public transaction and invitation evidence are in contracts/evidence/.
- Production build passes template validation, TypeScript compilation, and Vite bundling.
- GitHub and Vercel are linked. The production site is https://pact-bch.vercel.app and mainnet sends are disabled.
- Pact_Pitch_Deck.pptx is the editable PowerPoint deck derived from the Widget Factory template. It is not a Google Slides file stored in Drive.

## Real .env and Vercel settings

All VITE values are public browser configuration; the app needs no private API credentials.

- VITE_PROJECT_DECK_URL points to the Pact PowerPoint file in GitHub. It can be replaced by a native Google Slides copy URL if one is made.
- VITE_EMBER2026_CASHTOKENS_ADDRESS contains the address supplied by the owner. BCH BLAZE has stated that EMBER2026 has not yet been minted or distributed and that no official receive address or token category is available. The supplied address is not an official EMBER2026 address.
- VITE_EMBER2026_VERIFIED remains false.
- VITE_DEMO_RECIPIENT is a separate Chipnet address used for the XO proof.
- VITE_DEMO_AMOUNT_BCH is 0.00001 BCH (1,000 sats).
- VITE_XO_TRANSACTION_URL points to the confirmed Chipnet payment.
- VITE_BCH_NETWORK is chipnet; VITE_ENABLE_MAINNET_SENDS is false.
- Mainnet and Chipnet Electrum host overrides are blank, so the app uses its packaged server list.

## Event and community status

- BLAZE roll call: MISSED / CLOSED. The BLAZE chat notice shown by the owner says late entrants can still compete and do not need to complete roll call.
- DoraHacks registration and project submission are separate. The event submission is the final Build entry on the BCH BLAZE DoraHacks page, with the repository, demo, and project description. The official schedule says submissions and judging begin Sunday 22 November at 14:00 UTC (15:00 Lagos time); use the deadline shown on DoraHacks.
- Telegram: the official Getting Started page encourages joining the group and introducing yourself. I found no separate mandatory Telegram confirmation step. The earlier wording that implied one was required was inaccurate.
- EMBER2026: wait until the token is issued. Then ask BLAZE for the official BCH Mainnet receive address and token category ID; keep the supplied address marked not official until then.
- XO template limitations remain documented: the cap is per spend, not cumulative across separate outputs, and the agent payment branch remains usable after the owner recovery time.
- The XO developer feedback draft is local for owner review and has not been submitted.

## Google Slides copy

No connected Google Slides session is available here. The existing PowerPoint deck is the completed editable file; a native Google Slides copy must be made in Drive from the Widget Factory template, then its URL can replace VITE_PROJECT_DECK_URL in local .env and Vercel.

## Links

- GitHub: https://github.com/dr4ken-soul/Pact
- PowerPoint deck: https://github.com/dr4ken-soul/Pact/raw/refs/heads/main/Pact_Pitch_Deck.pptx
- Vercel demo: https://pact-bch.vercel.app
- Confirmed Chipnet payment: https://explorer.selene.cash/tx/da7d089a14e5bc9206535013ce20c7b5048d0303a1fe5b64e3a9769f1aec3aa6?network=chipnet
- Widget Factory Google Slides template: https://docs.google.com/presentation/d/1Yfuk9CJkf4U9M_WukcELhumWgj3Ak6345Ewy8hSp-Hk/edit?slide=id.p#slide=id.p
- DoraHacks event: https://dorahacks.io/hackathon/bchblaze2026/
- BLAZE schedule and roll call: https://bchblaze.cash/live/
- BLAZE Telegram community: https://t.me/bchblaze
