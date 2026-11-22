# Pact Build Guide

**Status:** implementation and release reference for the built prototype. The app includes the wallet-funded covenant flow and local BCH 2023 VM validation. Use the status and evidence sections to distinguish code verification, network confirmation, and owner account actions.

## 1. Build requirements and current release values

1. Read `FRONTEND_SPEC.md`, `APP_BLUEPRINT.md`, and `CLAUDE.md` fully.
2. Guide the project owner through obtaining the release values using Section 1.1. Do not expect the owner to know these values already or simply hand them an unresolved checklist.
3. Do not create fake values. Missing account-specific values do not block planning or implementation of unrelated components. They do block publishing the affected feature until the user has been guided through setup and the value has been verified.
4. Read the current official XO Stack getting-started documentation, template repository, engine package versions, CashScript/covenant docs, and WizardConnect docs. The event resource page states the XO engine is actively developing and asks participants to use the latest `0.1.0-next.xxx` release. Check the current release, test it, then pin the exact version. Do not copy an old version string into the build.
5. Record the selected dependency versions and wallet/browser matrix in `README.md` after implementation starts.

## 1.1 Guided setup with direct links

The build agent must actively guide the user to obtain each release value. Do not leave the user with a list of missing values or send them to a documentation page as the primary action. Ask one item at a time, provide the direct action link, describe the exact click path, state what to copy, validate its format, then continue. Use clickable questions when a choice is needed. The user must perform authenticated actions in their own accounts. The agent must not pretend it created a deck, repository, or wallet address if it did not.

### Widget Factory deck URL

- Direct template: https://docs.google.com/presentation/d/1Yfuk9CJkf4U9M_WukcELhumWgj3Ak6345Ewy8hSp-Hk/edit?slide=id.p#slide=id.p
- Guide the user to open the template, make their own copy in Google Slides, rename it to include Pact, fill in the project slides, then copy the URL of their copy. Never use the unedited template URL as the final project deck URL.

### Source repository URL

- Direct GitHub creation page: https://github.com/new
- Guide the user to sign in, create a public repository named `pact-bch` or another approved name, and copy the new repository's browser URL. The code agent may prepare local files after build approval, but must not claim the remote repository exists until it has been created and verified.
- If the user prefers GitLab, use the direct project creation page: https://gitlab.com/projects/new

### EMBER2026 CashTokens receive address

- Direct BCH wallet choices: Paytaca wallet at https://www.paytaca.com/applications/wallet or Electron Cash at https://electroncash.org/ . Use only an official wallet download page and verify the current app supports CashTokens and receiving the specific EMBER2026 token.
- BLAZE says EMBER2026 is not yet issued, so an address cannot be verified to receive it now. Wait for official token and receive details, then verify the address with organizers before publishing it.
- Never ask for a seed phrase, private key, wallet file, PIN, or recovery phrase. Never paste a secret into chat. Never copy another team's address.

### Mainnet demo recipient and amount

- This is separate from the EMBER2026 donation address. Ask whether the user wants a project-controlled receive address or a recipient they choose for a useful demo payment.
- Give direct wallet setup links above and explain how to open the recipient wallet's `Receive` screen and copy its public BCH Mainnet address. Ask the owner to choose an amount they are comfortable spending. Do not set an amount or destination without their confirmation.
- Validate the address/network, then show the exact amount, destination, fees, policy constraints, and wallet confirmation before any broadcast.

### Event confirmation and hosting

- Event page and submission entry: https://dorahacks.io/hackathon/bchblaze2026/
- BCH BLAZE Telegram: https://t.me/bchblaze
- Direct hosting project page, if the user chooses Vercel: https://vercel.com/new . Offer a direct alternative if the user chooses another host. Do not send the user to a generic docs index to create an account or project.

## 2. Suggested implementation phases

### Phase A: App shell and visual system

- Set up the app using the stack confirmed by the user after approval.
- Implement global palette, fonts, responsive app shell, required BLAZE banner, and A2 navigation from `FRONTEND_SPEC.md`.
- Implement the product-first bento hero. Do not use a static screenshot in place of the live policy/payment surface.
- Add semantic labels, keyboard focus, accessible dialog behavior, and reduced-motion fallback from the start.
- Keep all network and Mainnet send actions disabled while the shell is being built.

### Phase B: Policy UI and local validation

- Implement integer-satoshi parsing and formatting. Do not use floating-point comparisons for BCH limits.
- Validate network-specific address format, recipient, payment cap, owner-recovery timestamp, amount precision, and explicit policy mode.
- Make UI-only policy checks visibly distinct from contract-enforced state.
- Add empty, connecting, invalid, rejected, pending, confirmed, provider-error, and network-mismatch states.
- Ensure content remains visible if JavaScript or animation support is absent.

### Phase C: XO template and Chipnet enforcement

- Inspect official XO template docs and the current template package before choosing a template.
- Use the simplest template that can prove the policy conditions. Document exactly what is enforced by the transaction script and what remains a UI or wallet-level check.
- Build and test on Chipnet before any Mainnet deployment or funding.
- Verify recipient locking bytecode, per-payment cap, output-lineage balance reduction, owner-recovery locktime, continuation script, fixed fee, and dust floors.
- Test adversarial cases: multiple contract inputs, repeated spends from one lineage, separately funded outputs, rounding, fee and dust edges, wrong recipient, over-cap amount, early recovery, token-bearing inputs/outputs, and contract-state mismatch. Do not claim a global cap across separate outputs or a strict agent-expiry after the recovery timestamp.
- Preserve test vectors and transaction results. Do not write `mainnet-verified` until Mainnet behavior has actually been verified.

### Phase D: Wallet connection

- Implement WizardConnect because the current official BCH BLAZE 2026 Mainnet track requires it. Verify current wallet support and protocol behavior. Do not treat XO templates as a substitute for this wallet integration.
- Follow the official protocol docs and event requirements. Do not substitute generic EVM WalletConnect without confirming BCH compatibility.
- Never request a seed phrase or private key.
- Verify returned network identity and transaction fields before presenting the wallet authorization request.
- Test connect, disconnect, wrong network, user rejection, provider loss, address change, and wallet reload.

### Phase E: Payment review and transaction receipts

- Build the review screen with network, full destination, amount, fee, confirmed policy balance, per-payment cap, owner-recovery time, and relevant covenant funding.
- Require explicit user confirmation and wallet signature for every Mainnet transaction.
- Display txid and explorer URL only from actual provider output. Never create fake transaction rows.
- Distinguish wallet-approved, broadcast, pending, and confirmed states.
- Ensure the configured demo destination and amount are visible to the judge before approval.

### Mainnet and covenant evidence

Ordinary BCH Mainnet sending is enabled, and an owner-approved 1,000 sat wallet payment is confirmed. Separately, Pact's owner-approved P2SH20 covenant was funded with 50,000 sats in block 978379 and its first 1,000 sat payment confirmed in block 978381, returning 29,000 sats to the same covenant with the fixed 20,000 sat fee. This is live Mainnet funding-to-spend evidence. The owner-recovery branch is implemented and locally VM-validated but has not been exercised on Mainnet. Keep all Mainnet actions low-value, fully reviewed, and explicitly wallet-approved.

## 3. QA and accessibility checklist

- [ ] 320px, 375px, tablet, laptop, and desktop layout.
- [ ] Keyboard-only navigation, visible focus, logical DOM order, dialog focus trap and restore.
- [ ] Screen reader names for every form control and status.
- [ ] Contrast checked against WCAG AA for text and controls.
- [ ] `prefers-reduced-motion` disables canvas movement, SVG drawing, and scroll reveals.
- [ ] Touch actions are at least 44 x 44px.
- [ ] Invalid address, wrong network, empty activity, rejected wallet, unavailable provider, insufficient funds, and contract rejection are actionable.
- [ ] No fake addresses, balances, txids, confirmations, success metrics, or transaction activity.
- [ ] Page loads without an external image or font network dependency; font fallback remains legible.
- [ ] No horizontal overflow and no content hidden behind the banner or nav.

## 4. Judge readiness and submission

### Live demo

- Host the app on a stable public URL that opens directly to the working app.
- Keep the first-screen rule editor and payment path visible.
- Provide one concise, tested demo path. Keep a Chipnet fallback clearly labelled.
- Keep a short manual demo script and backup screenshots/recording, but do not present a recording as a live transaction.

### Widget Factory deck and banner

- The project presentation is the editable `Pact_Pitch_Deck.pptx`, built from the supplied Widget Factory template. It is not a Google Slides copy. Do not submit the template URL as Pact’s deck.
- The homepage banner links to the deck and source. Show an official EMBER2026 address only after the token is issued and the address is verified; the CompeteHub mirror of the DoraHacks track listing associates that address with Community Choice.
- Verify the address can receive the relevant token. Do not copy an address from another project.
- Verify all links on desktop and mobile before submission.

### Community and deadlines

- Submit the final project through the BCH BLAZE DoraHacks Build page. The CompeteHub mirror of the DoraHacks track listing says to confirm the project is real in the BCH BLAZE Telegram channel; post the project/demo/repository links and keep proof.
- The BLAZE schedule says hacking ends and submissions/judging begin Sunday 22 November 2026 at 14:00 UTC (15:00 Lagos). A mirrored DoraHacks listing gives a November 14–22 submission period. Confirm the closing time and required fields in the logged-in DoraHacks form before submitting.
- Submit to the correct track and verify all required fields in DoraHacks.

### Judge-facing narrative

Keep the explanation short and evidence-led:

1. Problem: AI payment authority is risky when it is broader than necessary.
2. Product: Pact commits a per-payment cap and recipient to a BCH covenant; the configured time opens owner recovery.
3. Proof: show the exact conditions and where each one is enforced.
4. Demo: execute a real, explicitly approved BCH Mainnet payment through the app.
5. BCH-native value: explain the XO/CashTokens/covenant path and tested boundary behavior.
6. Business: state the target customer and integration path only when supported by the prototype and user research.

## 5. Current completion status

- The production build validates the XO template, runs BCH 2023 VM cases for the app covenant, type-checks TypeScript, and produces the Vite bundle.
- Ordinary Mainnet wallet sending is enabled and has one confirmed owner-approved payment.
- Covenant funding and one covenant payment have been wallet-approved and confirmed on Mainnet (blocks 978379 and 978381). Owner recovery is implemented and passes local BCH 2023 VM checks, but has not been exercised on Mainnet.
- The hosted app, public GitHub repository, and editable Widget Factory-based PPTX are available. No Google Slides copy exists.
- The owner must submit the project in DoraHacks and confirm it in the BCH BLAZE Telegram from their authenticated accounts.
- EMBER2026 is optional organizer-controlled Community Choice material until the team issues the token and confirms its details.

## 6. Official and technical references

- BCH BLAZE 2026: https://dorahacks.io/hackathon/bchblaze2026/
- Tracks: https://dorahacks.io/hackathon/bchblaze2026/tracks
- Official resources, Widget Factory template, XO templates, Chipnet guidance: https://dorahacks.io/hackathon/bchblaze2026/resources
- XO Stack: https://stack.xo.cash/
- XO getting started: https://stack.xo.cash/getting-started.html
- XO template repository: https://gitlab.com/GeneralProtocols/xo/templates
- XO engine versions: https://www.npmjs.com/package/@xo-cash/engine?activeTab=versions
- CashScript covenant guide: https://cashscript.org/docs/guides/covenants
- CashTokens: https://cashtokens.org/
- WizardConnect technical reference: https://docs.riftenlabs.com/wizardconnect/
- Direct BCH wallet setup page: https://www.paytaca.com/applications/wallet
- Direct Electron Cash download page: https://electroncash.org/
- W3C reduced-motion technique: https://www.w3.org/WAI/WCAG22/Techniques/css/C39
- 2026 motion design research: https://innerwebsolutions.com/blog/web-design-trends-the-summer-of-2026 and https://www.grafdom.com/web-design-trends-whats-in-whats-out-and-whats-essential/
