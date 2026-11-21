# Pact submission and implementation status

**Checked:** 21 November 2026. The BLAZE submission deadline is listed as 22 November at 14:00 UTC.

## BLAZE Mainnet track

Pact has the listed software demo components: a hosted app, source repository, WizardConnect, a confirmed BCH Mainnet payment, and an editable Widget Factory-based presentation.

- The app is deployed at https://pact-bch.vercel.app.
- A user-approved 1,000 sat Mainnet wallet payment confirmed in block 978164 with a 226 sat fee. [Inspect the transaction](https://blockchair.com/bitcoin-cash/transaction/3016046b74c212788c08d99b7637458edfaa2fcc1ab3b71682aa542182c19704).
- The presentation file is [Pact_Pitch_Deck.pptx](https://github.com/dr4ken-soul/Pact/raw/refs/heads/main/Pact_Pitch_Deck.pptx). It is an editable PowerPoint file, not a Google Slides copy.
- The owner previously confirmed DoraHacks registration.

The owner must still submit the project through the authenticated [DoraHacks portal](https://dorahacks.io/hackathon/bchblaze2026/) and post the project-real confirmation in the [BCH BLAZE Telegram](https://t.me/bchblaze). These are event-account actions, not product implementation blockers.

## Covenant integration

The exact owner-wallet sequence for funding and exercising this integration is in [COVENANT_SPENDING_GUIDE.md](COVENANT_SPENDING_GUIDE.md).

The app now includes a wallet-funded P2SH20 covenant flow. The owner sets one recipient, a per-payment cap, a recovery time, and a funding amount; approves funding through WizardConnect; waits for the covenant output to confirm; and then approves each covenant spend in the wallet. Pact validates the wallet-returned transaction with the BCH 2023 virtual machine before broadcasting it.

The contract enforces one covenant input, the committed recipient, the per-payment cap, no CashTokens in the spent policy input or outputs, an exact same-script continuation, and a fixed 20,000 sat fee. The remaining balance is limited by the value of the tracked covenant output. Separately funded outputs do not share a lifetime cumulative allowance.

The recovery timestamp makes owner recovery available. BCH script does not read the current wall clock independently, so the payment branch remains script-valid after that timestamp. The app describes this as an owner-recovery time, not an on-chain agent-spend expiry. The owner wallet signs each payment; this integration does not give an agent autonomous signing authority.

The app covenant builder and spend/recovery branches pass local BCH 2023 VM checks for valid payment and recovery, repeated value reductions, an exhausted balance, rejected extra inputs or change outputs, an independently funded output, an incorrect recipient, an above-cap payment, a changed fee, and recovery before the configured locktime. This is code-level validation. The prior confirmed Mainnet transaction is an ordinary wallet payment, not a covenant transaction. No covenant funding or spend transaction has been confirmed on Mainnet yet.

## What is required to submit

The project software and demo evidence are prepared. To complete the event entry, the owner needs to:

1. Submit the project in the DoraHacks portal with the hosted demo, repository, presentation, and required description.
2. Post the project confirmation in the BCH BLAZE Telegram and retain its link or screenshot.

A Google Slides copy does not exist; submit the editable PPTX if the form accepts it.

## EMBER2026

BCH BLAZE told the owner that EMBER2026 has not yet been minted or distributed, so there is no official Mainnet receive address or token category. This is organizer-controlled and optional for Community Choice; it is not a Pact software defect or a Mainnet-track submission prerequisite. The owner-supplied address remains marked unverified. Keep `VITE_EMBER2026_VERIFIED=false` until the token is issued and the team confirms its details.

## Separate XO bounty

The separate XO invitation has confirmed Chipnet evidence. Its public transaction is [da7d089a…](https://explorer.selene.cash/tx/da7d089a14e5bc9206535013ce20c7b5048d0303a1fe5b64e3a9769f1aec3aa6?network=chipnet). The developer-feedback file is a review draft. The owner should personally verify and rewrite any first-person feedback before submitting it to a bounty that requires personally written comments.

## Configuration and evidence

- `VITE_PROJECT_DECK_URL` links to the editable PPTX in GitHub, not to Google Slides.
- `VITE_EMBER2026_CASHTOKENS_ADDRESS` is owner-supplied and unverified; it is not required for ordinary BCH payments.
- `VITE_DEMO_RECIPIENT` is a separate Chipnet recipient.
- `VITE_DEMO_AMOUNT_BCH=0.00001` is the 1,000 sat demo amount.
- `VITE_XO_TRANSACTION_URL` links to the confirmed Chipnet XO invitation.
- `VITE_BCH_NETWORK=chipnet` keeps Chipnet as the default; `VITE_ENABLE_MAINNET_SENDS=true` enables the Mainnet wallet path.
- The app verifies BCH network identity against the selected network's checkpoint.

Evidence:

- Mainnet wallet payment: [Blockchair](https://blockchair.com/bitcoin-cash/transaction/3016046b74c212788c08d99b7637458edfaa2fcc1ab3b71682aa542182c19704)
- Mainnet evidence snapshot: `contracts/evidence/mainnet-payment.json`
- XO Chipnet covenant payment: [Selene explorer](https://explorer.selene.cash/tx/da7d089a14e5bc9206535013ce20c7b5048d0303a1fe5b64e3a9769f1aec3aa6?network=chipnet)
- Live app: https://pact-bch.vercel.app
- GitHub: https://github.com/dr4ken-soul/Pact
- Presentation: https://github.com/dr4ken-soul/Pact/raw/refs/heads/main/Pact_Pitch_Deck.pptx
- DoraHacks portal: https://dorahacks.io/hackathon/bchblaze2026/
- BLAZE Telegram: https://t.me/bchblaze
