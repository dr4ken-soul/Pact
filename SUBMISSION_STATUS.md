# Pact submission and implementation status

**Checked:** 22 November 2026, 12:07 UTC. At this check, BlockExplorer.cash showed chain tip 978471 and confirmed counts of 93 for funding, 91 for the covenant payment, and 2 for owner recovery. The official schedule says submissions and judging begin 22 November at 14:00 UTC (15:00 Lagos); check the logged-in DoraHacks form for its closing time.

## BLAZE Mainnet track

Pact has the listed software demo components: a hosted app, source repository, WizardConnect, a confirmed BCH Mainnet wallet payment, a confirmed live covenant funding, payment, continuation, and owner-recovery cycle, and an editable Widget Factory-based presentation.

The Mainnet-track app implementation is built and its advertised demo paths are confirmed: an ordinary WizardConnect BCH payment, plus the app covenant's funding, capped payment, same-script continuation, and owner recovery. There is no missing Mainnet implementation step for those paths. This does not mean the prototype has been independently audited or that the covenant enforces a strict agent-payment expiry or a shared lifetime cap across separately funded outputs; those are explicit design boundaries.

- The app is deployed at https://pact-bch.vercel.app.
- A user-approved 1,000 sat ordinary Mainnet wallet payment confirmed in block 978164 with a 226 sat fee. [Inspect it](https://blockchair.com/bitcoin-cash/transaction/3016046b74c212788c08d99b7637458edfaa2fcc1ab3b71682aa542182c19704).
- The live P2SH20 covenant was funded with 50,000 sats in block 978379, then spent in block 978381: 1,000 sats to the committed recipient, 29,000 sats back to the same covenant, and a 20,000 sat fee. [Funding transaction](https://blockexplorer.cash/mainnet/tx/a8666f786627ad94fc0573d990edbc59c7b100af226f6d334baa16dbc445ef68) · [Confirmed covenant spend](https://blockexplorer.cash/mainnet/tx/f53a93a7177b7935cc0f57751a3b82aaad3e173e5c88cbf1b51ba6a53f386638).
- Owner recovery then spent the 29,000 sat continuation, returned 9,000 sats to the committed owner address, and paid the fixed 20,000 sat fee. It confirmed in block 978470. [Confirmed owner recovery](https://blockexplorer.cash/mainnet/tx/25d22cab6bc19f89bfd5a2a98560f0e43c2ac7e42553e57f1fe59adde0600c2c).
- The covenant output used for this proof was fully recovered; it no longer holds a covenant balance. To repeat the live demo, fund a new policy.
- The presentation file is [Pact_Pitch_Deck.pptx](https://github.com/dr4ken-soul/Pact/raw/refs/heads/main/Pact_Pitch_Deck.pptx). It is an editable PowerPoint file, not a Google Slides copy.
- The owner previously confirmed DoraHacks registration.

The owner must still submit the project through the authenticated [DoraHacks portal](https://dorahacks.io/hackathon/bchblaze2026/) and post the project-real confirmation in the [BCH BLAZE Telegram](https://t.me/bchblaze). These are event-account actions, not product implementation blockers.

## Covenant integration

The exact owner-wallet sequence for funding and exercising this integration is in [COVENANT_SPENDING_GUIDE.md](COVENANT_SPENDING_GUIDE.md).

The app now includes a wallet-funded P2SH20 covenant flow. The owner sets one recipient, a per-payment cap, a recovery time, and a funding amount; approves funding through WizardConnect; waits for the covenant output to confirm; and then approves each covenant spend in the wallet. Pact validates the wallet-returned transaction with the BCH 2023 virtual machine before broadcasting it.

The contract enforces one covenant input, the committed recipient, the per-payment cap, no CashTokens in the spent policy input or outputs, an exact same-script continuation, and a fixed 20,000 sat fee. The remaining balance is limited by the value of the tracked covenant output. Separately funded outputs do not share a lifetime cumulative allowance.

The recovery timestamp makes owner recovery available. BCH script does not read the current wall clock independently, so the payment branch remains script-valid after that timestamp. The app describes this as an owner-recovery time, not an on-chain agent-spend expiry. The owner wallet signs each payment; this integration does not give an agent autonomous signing authority.

The app covenant builder and spend/recovery branches pass local BCH 2023 VM checks for valid payment and recovery, repeated value reductions, an exhausted balance, rejected extra inputs or change outputs, an independently funded output, an incorrect recipient, an above-cap payment, a changed fee, and recovery before the configured locktime. Mainnet evidence now covers funding, an agent payment with same-script continuation, and owner recovery in confirmed transactions. The recovery timestamp opens owner recovery; it does not disable the agent-payment branch.

## What is required to submit

The project software and demo evidence are prepared. To complete the event entry, the owner needs to:

1. Submit the project in the DoraHacks portal with the hosted demo, repository, presentation, and required description.
2. Post the project confirmation in the BCH BLAZE Telegram and retain its link or screenshot.

A Google Slides copy does not exist; submit the editable PPTX if the form accepts it.

## EMBER2026

BCH BLAZE told the owner that EMBER2026 has not yet been minted or distributed, so there is no official Mainnet receive address or token category. This is organizer-controlled and optional for Community Choice; it is not a Pact software defect or a Mainnet-track submission prerequisite. The owner-supplied address remains marked unverified. Keep `VITE_EMBER2026_VERIFIED=false` until the token is issued and the team confirms its details.

## Separate XO bounty

The XO Engine template and invitation are a separate integration from the app's Mainnet P2SH20 covenant. The invitation has confirmed Chipnet evidence: [da7d089a…](https://explorer.selene.cash/tx/da7d089a14e5bc9206535013ce20c7b5048d0303a1fe5b64e3a9769f1aec3aa6?network=chipnet). A Mainnet XO deployment is not required by BCH BLAZE's Build with XO bounty: its rules accept an executed invitation on Chipnet or Mainnet and specifically recommend Chipnet testing.

The current XO evidence demonstrates a payment and covenant continuation. Its rules are per-payment, each separately funded output has its own balance, and the recovery timestamp does not disable the agent-payment branch. These are design limits to disclose when describing the XO template; if the bounty's requested contract semantics require a lifetime shared cap or strict agent-payment expiry, this template does not implement those stronger properties. Do not describe the separate XO bounty package as fully verified against requirements until the owner checks whether another continuation spend is applicable to its follow-up criterion and personally writes the required developer feedback. These XO-specific items do not make the Mainnet-track app implementation incomplete.

## Configuration and evidence

- `VITE_PROJECT_DECK_URL` links to the editable PPTX in GitHub, not to Google Slides.
- `VITE_EMBER2026_CASHTOKENS_ADDRESS` is owner-supplied and unverified; it is not required for ordinary BCH payments.
- `VITE_DEMO_RECIPIENT` is a separate Chipnet recipient.
- `VITE_DEMO_AMOUNT_BCH=0.00001` is the 1,000 sat demo amount.
- `VITE_XO_TRANSACTION_URL` links to the confirmed Chipnet XO invitation.
- `VITE_BCH_NETWORK=chipnet` keeps Chipnet as the default; `VITE_ENABLE_MAINNET_SENDS=true` enables the Mainnet wallet path.
- The app verifies BCH network identity against the selected network's checkpoint.

Evidence:

- Mainnet ordinary wallet payment: [Blockchair](https://blockchair.com/bitcoin-cash/transaction/3016046b74c212788c08d99b7637458edfaa2fcc1ab3b71682aa542182c19704)
- Mainnet covenant lifecycle: [`mainnet-covenant.json`](contracts/evidence/mainnet-covenant.json) · [Funding](https://blockexplorer.cash/mainnet/tx/a8666f786627ad94fc0573d990edbc59c7b100af226f6d334baa16dbc445ef68) · [Payment](https://blockexplorer.cash/mainnet/tx/f53a93a7177b7935cc0f57751a3b82aaad3e173e5c88cbf1b51ba6a53f386638) · [Owner recovery](https://blockexplorer.cash/mainnet/tx/25d22cab6bc19f89bfd5a2a98560f0e43c2ac7e42553e57f1fe59adde0600c2c)
- Mainnet ordinary-payment evidence snapshot: `contracts/evidence/mainnet-payment.json`
- XO Chipnet covenant payment: [Selene explorer](https://explorer.selene.cash/tx/da7d089a14e5bc9206535013ce20c7b5048d0303a1fe5b64e3a9769f1aec3aa6?network=chipnet)
- Live app: https://pact-bch.vercel.app
- GitHub: https://github.com/dr4ken-soul/Pact
- Presentation: https://github.com/dr4ken-soul/Pact/raw/refs/heads/main/Pact_Pitch_Deck.pptx
- DoraHacks portal: https://dorahacks.io/hackathon/bchblaze2026/
- BLAZE Telegram: https://t.me/bchblaze
