# Pact App Blueprint

**Status:** The current source includes a wallet-funded P2SH20 covenant flow and passes local BCH 2023 VM checks for payment, recovery, and invalid-spend cases. On Mainnet, the full exercised covenant lifecycle is confirmed: 50,000 sats funded in block 978379; a 1,000 sat payment with 29,000 sats continued to the same covenant in block 978381; then 9,000 sats were recovered to the committed owner address in block 978470. A separate 1,000 sat ordinary wallet payment confirmed in block 978164. The recovery time opens owner recovery but is not a strict agent-spend expiry, and separately funded outputs have separate balances rather than a shared lifetime cap. Pact is a hackathon prototype, not an audited release. Event submission and Telegram confirmation are owner account actions; EMBER2026 remains organizer-controlled optional Community Choice material.

## 1. Executive summary

Pact is a bounded-permission payment layer for AI agents on Bitcoin Cash. The owner funds a covenant that commits to one recipient and a per-payment cap, then reviews each wallet-signed spend. The recovery timestamp opens owner recovery and is not a strict on-chain payment expiry.

The product is designed for a short judge review: open the live app, understand the boundary, connect a BCH wallet, review a real payment, approve it, and see the real transaction result. The first screen is the app itself, not a marketing splash.

## 2. Product principles

1. **Bounded authority:** the agent must never have access to wallet seed material or unrestricted signing authority.
2. **Visible rules:** cap, recipient, owner-recovery time, network, fee, and transaction status are visible before a payment is approved.
3. **Truthful enforcement:** label a rule as on-chain enforced only when a contract condition has been implemented and verified. A client-side check is not a covenant.
4. **Human control:** no transaction broadcasts without a user-visible review and explicit wallet authorization.
5. **Judge-ready:** the first screen provides a clear demo path and no confusing setup wizard.
6. **Minimal mainnet exposure:** build and test on Chipnet first. Use only minimal mainnet funds and only where recovery is understood.
7. **Plug-and-play:** keep wallet, XO template, network provider, and explorer integrations behind small adapters.

## 3. Users and primary jobs

### Judge or first-time reviewer

- Understand in seconds what is bounded and why it matters.
- Try the payment path without reading the entire page.
- See whether the app is on Mainnet or Chipnet.
- Verify a real transaction from its actual transaction ID.

### User / policy owner

- Set the per-payment cap, approved recipient, owner-recovery time, and funding amount.
- Connect a BCH wallet without exposing seed material.
- Review the precise transaction and any fee before approving.
- Revoke or recover funds only through a verified contract path.

### AI agent / payment proposer

- Submit a payment intent to Pact.
- Receive a clear allowed or rejected result and reason.
- Never receive the policy owner's private key or permission to bypass the covenant.

## 4. Scope

### Hackathon MVP

- Live responsive web app.
- Mandatory WizardConnect integration for the BCH BLAZE 2026 Mainnet track. XO templates are a separate contract/template integration and do not replace WizardConnect.
- At least one useful BCH Mainnet transaction possible through the app, with explicit amount, destination, network, fee, wallet review, and user signature.
- XO template integration as the preferred policy/contract path, using current official resources and a pinned, tested package version. XO is additional to, not a replacement for, WizardConnect.
- Chipnet-first contract test and a visible distinction between Chipnet contract validation and any Mainnet payment.
- One funded policy output demonstrating a per-payment cap, approved destination, continuation balance, and owner recovery. Do not call the recovery timestamp an agent-spend expiry or imply separate outputs share one budget.
- Actual transaction receipt and explorer link, only after a real transaction is returned by the provider.
- Widget Factory-based presentation, source repository, and top-of-homepage banner. An official EMBER2026 receive address is for Community Choice once the token is issued; do not block Mainnet-track readiness on an unavailable token address.

### Explicitly out of scope unless separately approved

- Agent-held wallet seed phrases or private keys.
- Unreviewed autonomous Mainnet broadcasting.
- Multi-recipient, recurring, or multi-agent policies unless the selected template proves them.
- A claim of production security, audit, or guaranteed recovery without evidence.
- Token issuance or use of the EMBER2026 donation address for Pact's payment demo.

## 5. Core user journey

### A. Define a policy

1. User opens Pact and sees the covenant policy form and payment panel.
2. User connects the owner wallet, chooses one recipient, a per-payment cap, an owner-recovery time, and a BCH funding amount.
3. Pact builds a P2SH20 covenant that commits to the public key, recipient, cap, and recovery time.
4. The owner reviews and signs funding through WizardConnect; Pact waits until the covenant output confirms.

### B. Submit a payment intent

1. Agent submits a payment intent with policy ID, destination, and amount.
2. Pact checks the intent for clear user feedback and builds a transaction spending the confirmed covenant output.
3. The covenant is the source of truth for the committed recipient, per-payment cap, token exclusion, same-script continuation, and exact fee.
4. If a check fails, Pact rejects the request with a field-level reason. It does not silently rewrite amount or destination.
5. If allowed, Pact presents the full transaction review to the policy owner.

### C. Authorize and verify

1. User reviews network, amount, recipient, fee, confirmed covenant balance, and policy state.
2. The connected wallet signs and, if applicable, broadcasts the transaction.
3. Pact waits for a real provider response and records the actual txid.
4. Pact checks the signed BCH 2023 transaction locally before broadcast, then displays the transaction ID and explorer link.
5. A rejected or failed transaction remains visibly rejected/failed, never a simulated success.

### D. Revoke or recover

- The UI may offer revoke/reclaim only if a real contract branch or protocol operation supports it.
- The configured time makes owner recovery available. It does not disable the payment branch, because BCH script cannot independently inspect current wall-clock time.
- Never imply instant cancellation of a transaction already broadcast.

## 6. Mainnet and contract architecture

### 6.1 System boundary

```text
Pact UI
  -> Policy service / local policy state
  -> XO template adapter
  -> Contract validation and transaction construction
  -> BCH wallet connection and explicit signature
  -> BCH network provider
  -> Explorer / receipt display
```

Keep network, template engine, wallet, and explorer adapters separate. Do not place keys or private key material in the browser application. If an agent signing key is required by the selected contract, scope it to the constrained capability and document how it is generated, stored, revoked, and destroyed. This mechanism must not expand to unrestricted owner wallet authority.

### 6.2 Candidate on-chain policy model

Use a covenant/capability UTXO or XO template that commits to:

- approved recipient locking bytecode or an equally strong canonical destination commitment;
- maximum authorized value, represented in integer satoshis;
- owner-recovery locktime and the limits of its CLTV semantics;
- allowed agent/public key or other explicit authorization condition;
- exact fee and change behavior;
- an owner recovery path after the configured locktime;
- any state transition required to represent remaining allowance.

The web app creates, funds, and spends a wallet-authorized P2SH20 covenant. Its script enforces a fixed recipient, per-payment cap, one covenant input, no CashTokens, same-script continuation, exact 20,000 sat fee, dust floors, and an owner recovery branch. The browser requires the owner wallet to sign each spend and locally validates the signed transaction with the BCH 2023 VM. Local VM checks cover allowed payment/recovery and rejection cases. The exercised Mainnet lifecycle is confirmed: 50,000 sats funded in block 978379; the spend in block 978381 paid 1,000 sats, returned 29,000 sats to the same covenant, and paid the fixed fee; owner recovery in block 978470 then returned 9,000 sats to the committed owner address, less the same fixed fee. Transaction IDs and explorer records are in `contracts/evidence/mainnet-covenant.json`.

### 6.3 Cumulative spending cap caveat

A maximum on one payment is not automatically a shared lifetime maximum. Each spend returns only the remaining value to the same constrained covenant, so one tracked output lineage is finite and spends down. Separately funded covenant outputs have separate balances. Do not present them as a single cumulative allowance.

### 6.4 Owner-recovery time caveat

The configured timestamp opens an owner-recovery branch. CLTV checks transaction locktime; it does not independently read current wall-clock time. The owner can recover once the BCH consensus locktime condition is met, but the payment branch remains script-valid afterward. Pact must not call this a strict on-chain agent-spend expiry.

### 6.5 Mainnet demo choice

The product must make at least one useful Mainnet BCH transaction possible through the app. Keep the path simple and safe:

- use a project-controlled, configured demo recipient or a judge-selected destination;
- require user-entered or clearly disclosed amount and destination;
- validate BCH Mainnet and all policy bounds;
- show fees and full destination before wallet approval;
- require wallet signature and user confirmation;
- never use the EMBER2026 CashTokens donation address as a BCH demo recipient unless it is separately verified for that purpose;
- do not send funds automatically to an arbitrary prefilled destination.

The app validates wallet-returned covenant transactions locally before broadcast. Mainnet covenant behavior has confirmed funding, a payment with same-script continuation, and owner recovery; inspect the three transactions in `contracts/evidence/mainnet-covenant.json`.

## 7. Data model, conceptual only

All money values are integer satoshis. Avoid floating-point arithmetic for policy checks.

### Policy

- `policyId`: local identifier or contract/template-derived identifier.
- `network`: `chipnet` or `mainnet`.
- `ownerAddress`: public receive/owner address, not a secret.
- `agentPublicKey`: only if the selected contract design requires it.
- `recipientLockingBytecode` or canonical BCH address.
- `maxAuthorizedSats`: integer.
- `remainingAuthorizedSats`: authoritative contract-derived value where supported; otherwise do not imply it is authoritative.
- `recoveryTimestamp`: Unix timestamp committed to the owner-recovery branch and constrained to the BCH locktime range.
- `templateId` and `templateVersion`.
- `fundingOutpoint`, contract address, and policy state when applicable.
- `enforcementLevel`: `ui-only`, `chipnet-verified`, or `mainnet-verified`.

### PaymentIntent

- `intentId`, `policyId`, `amountSats`, `recipient`, `network`, `createdAt`, `decision`, `decisionReason`.
- No private key, seed phrase, or secret token.

### TransactionReceipt

- `txid`, `network`, `broadcastAt`, `providerStatus`, `confirmations` only from provider data, `explorerUrl`, and actual fee if available.
- A receipt may not be marked confirmed without network/provider evidence.

## 8. Security and privacy boundaries

- Never request, log, store, transmit, or include an end-user wallet seed phrase or private key. The isolated development-only Chipnet XO harness may store its generated mnemonic only as current-user DPAPI ciphertext under ignored `contracts/.xo-state/`; never log, commit, upload, or reuse it on Mainnet.
- Never put secrets in frontend environment variables or public repository files.
- Do not send policy details to an external AI API without an explicit privacy review and user consent.
- Treat wallet return data, addresses, remote APIs, and transaction status as untrusted inputs.
- Verify network identity at every wallet/session boundary. Mainnet/Chipnet mismatches block signing.
- Display the complete recipient during final review and provide a copy action.
- Make the active enforcement level visible and accurate.
- Use minimal funds for any Mainnet trial. Claim recovery only for a path that has been tested and confirmed; Pact's tested Mainnet owner-recovery transaction is recorded in `contracts/evidence/mainnet-covenant.json`.
- Keep contracts and dependencies pinned and review the current XO engine release before integrating because the event resources say the engine is actively developing.

## 9. Empty, loading, and error states

Every asynchronous operation needs explicit states:

- wallet disconnected: explain how to connect;
- wallet connecting: progress state and cancel path;
- wrong network: block transaction and offer network guidance;
- invalid address or amount: field-level error before wallet prompt;
- policy funding pending: do not show active until actual result;
- contract rejection: show the failed constraint by name;
- provider unavailable: retain draft, do not imply broadcast;
- wallet rejection: show `Not approved. No transaction was broadcast.` only if confirmed by wallet result;
- transaction pending: show actual txid when available and an honest pending state;
- transaction confirmed: use provider confirmation data;
- empty activity: explain the next action;
- recovery locktime error: state the actual BCH consensus condition and next step.

## 10. Judge demo script

Target: under 90 seconds, without a narrated tour.

1. Open the hosted app and select the BCH network.
2. Connect the owner wallet, set the recipient, cap, recovery time, and funding amount.
3. Review and approve covenant funding, then wait for confirmation.
4. Prepare a payment from the confirmed covenant output and inspect the exact recipient, amount, continuation, and fee.
5. Approve the covenant spend in the wallet and show its actual transaction status.
6. Explain that the recovery time opens owner recovery and does not disable the payment branch.

The demo must not depend on typing a long prompt, creating an account, fake balances, simulated txids, or a broken third-party service. Provide a Chipnet fallback clearly marked as Chipnet.

## 11. BLAZE Mainnet track and product checklist

- [x] Live hosted version loads directly into the working app. The production URL is recorded in `SUBMISSION_STATUS.md`.
- [x] At least one useful BCH Mainnet transaction can be initiated and completed through Pact with explicit wallet approval. Confirmed transaction: `3016046b74c212788c08d99b7637458edfaa2fcc1ab3b71682aa542182c19704`, block 978164.
- [x] WizardConnect integration is present and exercised on Mainnet by the confirmed transaction above.
- [x] A useful BCH Mainnet payment was initiated through WizardConnect, approved by the owner, broadcast, and confirmed in block 978164.
- [x] The Pact-app P2SH20 covenant lifecycle was funded, used for a capped payment with same-script continuation, and recovered to the committed owner; all three Mainnet transactions confirmed in blocks 978379, 978381, and 978470.
- [x] The live website is usable as a demo and the source repository is available.
- [x] WizardConnect has been exercised on Mainnet by the confirmed payment.
- [x] A short Widget Factory-based presentation is available as `Pact_Pitch_Deck.pptx`. It is not a native Google Slides copy; confirm the DoraHacks form accepts PPTX.
- [x] The owner previously confirmed DoraHacks registration.
- [ ] Submit the project in DoraHacks with the live demo, source, and presentation before the deadline.
- [ ] Confirm the project in the BCH BLAZE Telegram and keep proof.

The ordinary Mainnet payment and the Mainnet covenant funding, payment-continuation, and owner-recovery cycle are confirmed. These software proofs are separate from the two owner event-account actions and are not an EMBER address issue.

The covenant output used for this proof has since been fully recovered. No balance remains in that specific policy output; a fresh live demo requires funding a new covenant.

The standalone XO bounty is separate from the Mainnet-track app. Its invitation transaction is confirmed on Chipnet; BCH BLAZE's Build with XO bounty accepts Chipnet or Mainnet and recommends Chipnet, so a Mainnet XO deployment is not a missing Mainnet-track feature. The XO template's per-payment cap, independent balances for separate funding outputs, and recovery-time behavior must be described accurately. The bounty package should only be called complete after checking whether another continuation spend is applicable to its follow-up criterion and the owner has personally written the requested developer feedback. These package requirements do not leave the demonstrated Mainnet app paths unbuilt.
- [ ] No logo mark is added unless the user requests one.

Official current resources: https://dorahacks.io/hackathon/bchblaze2026/resources. The track requirements were cross-checked against the listing mirror at https://www.competehub.dev/en/competitions/dorahacksbchblaze2026 because the DoraHacks page did not load in the read-only viewer.

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| An XO template does not enforce all three boundaries | Choose the smallest template that can be proven. Document gaps; do not label UI checks as covenant enforcement. |
| Separately funded outputs have independent balances | State clearly that each output follows its own continuation balance; do not claim a shared lifetime cap. The app tests repeated reductions and rejects spends that cannot cover payment, fee, and continuation. |
| Recovery semantics are misunderstood | Test the owner locktime branch and disclose that payment remains script-valid after it. |
| Wallet connection support differs across wallets | Verify the chosen WizardConnect path against current wallet and protocol docs, and provide a clear fallback. |
| Event engine API changes | Re-check latest official XO engine version and pin the tested release. |
| Mainnet recipient is not prefilled | The owner enters a chosen BCH Mainnet recipient when creating the policy; the app validates its network and script type before funding. |
| Judges cannot quickly understand the product | Keep the actual app and demo action above the fold; remove generic marketing content. |
| Mainnet funds at risk | Use a low funding amount, explicit wallet review, and the owner-recovery branch demonstrated on Mainnet; show the fixed fee and do not call recovery a spend expiry. |

## 13. Reference links

- BCH BLAZE 2026: https://dorahacks.io/hackathon/bchblaze2026/
- Mainnet track: https://dorahacks.io/hackathon/bchblaze2026/tracks
- Official resources and Widget Factory template: https://dorahacks.io/hackathon/bchblaze2026/resources
- XO Stack and getting started: https://stack.xo.cash/ and https://stack.xo.cash/getting-started.html
- XO template repository: https://gitlab.com/GeneralProtocols/xo/templates
- XO engine versions: https://www.npmjs.com/package/@xo-cash/engine?activeTab=versions
- CashScript covenants: https://cashscript.org/docs/guides/covenants
- CashTokens: https://cashtokens.org/
- WizardConnect technical reference: https://docs.riftenlabs.com/wizardconnect/
- Direct Paytaca wallet page for user setup: https://www.paytaca.com/applications/wallet
- Direct Electron Cash wallet download page: https://electroncash.org/
- WCAG reduced-motion technique: https://www.w3.org/WAI/WCAG22/Techniques/css/C39

## 14. Market validation and competitive landscape

### Customer segments to validate

1. **BCH agent builders:** developers adding a payment tool to an AI workflow who need a non-custodial, bounded way to authorize payments.
2. **BCH merchants and paid services:** providers who want agents to pay a clearly authorized amount to a verified destination.
3. **BCH protocol and operations teams:** teams delegating narrowly scoped treasury or service payments and needing a visible audit trail.

The first beachhead should be developer-facing BCH agent builders because WizardConnect, XO templates, and the on-chain permission model are core to the value proposition. This is a hypothesis to validate with interviews, not a proven demand claim.

### Adjacent alternatives

These are adjacent products or infrastructure, not proven direct competitors to Pact:

| Product | What its public product information shows | Pact distinction to validate |
|---|---|---|
| Circle Agent Wallets | Agent wallets with user-defined transfer policies, allowlists, and supported stablecoin/multichain assets. [Circle](https://developers.circle.com/agent-stack/agent-wallets) | Pact is BCH-native and demonstrates a covenant-enforced recipient, per-payment cap, continuation balance, and owner-recovery branch. |
| Coinbase Agentic Wallet CLI | Agent wallet, payment and trading tools with spending limits in Coinbase's supported network ecosystem. [Coinbase](https://docs.cdp.coinbase.com/agentic-wallet/cli/welcome) | Pact targets BCH Mainnet and BCH-specific wallet connection and transaction construction. |
| Openfort | Agent wallet tooling and scoped permissions in EVM-focused environments. [Openfort](https://www.openfort.io/) | Pact's proof target is Bitcoin Cash, not EVM session permissions. |
| Paytaca Wallet | BCH and CashTokens wallet infrastructure. [Paytaca](https://www.paytaca.com/applications/wallet) | Paytaca is a BCH wallet, not evidence of an equivalent Pact policy product. It may be a wallet/integration route, subject to WizardConnect compatibility tests. |
| XO templates and CashScript | BCH contract and transaction-building infrastructure. [XO templates](https://gitlab.com/GeneralProtocols/xo/templates) and [CashScript](https://cashscript.org/) | These are implementation building blocks, not standalone customer-facing substitutes for Pact. |

Do not claim these products lack a capability unless their current product pages and actual behavior have been checked. Public pricing was not established during this planning research, so do not invent competitor prices.

### Validation plan and market size

No defensible TAM/SAM/SOM figure is available from the references reviewed. Do not put a fabricated market-size number in the Widget Factory deck. Validate the market bottom-up:

- Interview at least 5 BCH agent builders, 5 BCH service/merchant operators, and 3 protocol/treasury operators.
- Ask how they authorize machine payments today, what amount and destination rules they need, what must be enforced on-chain, and what integrations they already use.
- Record whether a real BCH Mainnet payment and BCH-native contract boundary change willingness to try the product.
- Estimate reachable demand from a verified count of interested builders and integrations, with explicit assumptions and source links. Only then derive TAM/SAM/SOM.

### Differentiation hypothesis

The defensible wedge is not merely an AI prompt that says not to overspend. Pact makes the scope of authorization visible and binds a recipient, per-payment amount, continuation balance, and owner-recovery branch to BCH transaction conditions. The demo must prove which conditions are enforced. Do not present the recovery timestamp as a strict payment expiry.

## 15. Monetization hypothesis

- **MVP:** no protocol fee and no paid tier. Keep the payment feature focused on the BCH Mainnet requirement and make any fee explicit before approval.
- **Possible post-hackathon model:** hosted developer tooling or business plans for policy monitoring, audit exports, and managed integration support. This is a hypothesis only.
- Do not introduce a treasury wallet, automatic protocol fee, subscription provider, or revenue-share in the MVP without a separate user decision, legal/operations review, and security model.
- Pricing and conversion assumptions remain unvalidated. Test willingness to pay with the customer interviews above rather than writing assumed dollar amounts into the pitch.

## 16. Proposed stack and operating model

These are proposals for the build agent to confirm with the user before scaffolding, not user-approved code choices:

- **Frontend:** React + TypeScript + Tailwind CSS, using the exact classes from `FRONTEND_SPEC.md`. A Vite SPA is sufficient for a wallet-centered operational app; avoid SSR complexity unless a real SEO requirement emerges.
- **Wallet:** WizardConnect, mandatory for the Mainnet track. Confirm target wallet support and current SDK/package behavior before implementation.
- **BCH templates:** XO template stack where its current API supports the selected policy. Pin the tested package versions. Use CashScript or other BCH tooling only where needed and verified.
- **Network:** Chipnet first. Mainnet is guarded behind explicit user configuration and wallet review.
- **Backend:** no first-party backend in the initial demo unless the selected XO/WizardConnect architecture requires one. Do not add a hosted LLM or database just to make the product appear more agentic.
- **AI:** the MVP can accept a structured payment intent from an agent adapter. LLM choice, model cost, and remote data handling remain undecided; the policy evaluator must be deterministic and independent of an LLM.
- **Persistence:** chain/contract state is authoritative for on-chain facts. Keep only the minimum local UI state required. Never persist secrets. If server-side user data is later added, define retention, access controls, and deletion before launch.
- **Hosting:** propose Vercel only if the user chooses it. Direct project creation page: https://vercel.com/new. Offer a direct alternate host if preferred. Do not claim a free tier or cost without checking current terms.

### Cost control

No recurring paid service is required by the current plan. The cost model depends on the hosting provider, wallet/network services, and whether an AI API is added. The build agent must show the user any paid service, account requirement, or Mainnet funding need before enabling it. Keep a measured list of actual costs in the README after deployment.

## 17. Data, API, and project structure

### Database decision

No database is required for the MVP. Contract/chain state is authoritative for transaction and enforcement facts. UI preferences and unsent drafts may remain in memory until persistence is explicitly designed. Do not build an off-chain database that claims a payment happened before the corresponding chain/provider result.

### API decision

No custom public API is required for the initial demo. Use a small typed adapter boundary for:

- `WalletAdapter`: connect, disconnect, report network/address, request signature, return actual transaction status.
- `PolicyAdapter`: create policy, inspect active state, validate a payment intent, expose enforcement level.
- `NetworkAdapter`: query required BCH data and broadcast only wallet-approved transactions.
- `ExplorerAdapter`: produce links from a real txid and a verified network mapping.

If an endpoint is introduced later, document method, path, request/response, authentication, rate limit, error schema, and secret boundary before implementation. Do not create example endpoints as if deployed.

### Proposed project tree

```text
pact/
  src/
    app/                 # app shell and routes
    components/          # accessible UI components
    features/
      policy/             # policy form, state, and validation
      payment/            # intent, review, send, receipt
      wallet/             # WizardConnect adapter and network state
      activity/           # real records and empty states
    adapters/
      xo/                  # pinned XO template adapter
      bch/                 # provider and explorer adapters
    lib/                   # integer BCH formatting, validation, copy helpers
    styles/                # palette, reduced motion, procedural texture
  contracts/               # selected XO/CashScript sources and tests
  tests/                   # unit, wallet-flow, contract, and e2e checks
  public/                  # no logo until user approves one
  .env.example             # keys and descriptions only, never secrets
  README.md
  PRODUCT.md
  APP_BLUEPRINT.md
  FRONTEND_SPEC.md
  BUILD_GUIDE.md
  CLAUDE.md
  TEAM_OPS.md
  WHITEPAPER.md
  FAQ.md
```

This is a proposed tree. Revisit it after the user approves a stack and implementation.

## 18. Launch, distribution, and build milestones

### Launch checklist

- Public HTTPS demo opens directly to the live product flow.
- Basic metadata, social preview image, and sitemap are produced only if a public marketing page exists. Do not invent imagery or logos.
- Error monitoring and analytics are added only after privacy and data-retention decisions. No event should log wallet secrets or sensitive recipient history.
- Terms, privacy, and risk disclosures are reviewed before a broader public launch. Do not present the prototype as audited or production-safe.
- DNS and hosting are verified with direct setup guidance and user approval.

### First users and distribution

1. Start with BCH agent builders from the BLAZE workshops and relevant BCH developer communities.
2. Show a real, short, reproducible demo rather than claiming planned capabilities.
3. Ask testers to evaluate recipient, per-payment amount, owner recovery, and wallet usability.
4. Publish the Widget Factory deck, live app, and source link in the hackathon submission.
5. Do not announce metrics, users, revenue, security audit, or successful policy guarantees unless measured and verified.

### Delivery record — 22 November 2026

- The app shell, WizardConnect wallet connection, network verification, wallet-reviewed BCH payment, and owner-funded P2SH20 covenant lifecycle are implemented.
- The production build runs XO template validation, BCH 2023 VM covenant cases, TypeScript checks, and the Vite build.
- The hosted app, GitHub repository, and editable Widget Factory-based PPTX are available.
- A 1,000 sat ordinary Mainnet wallet payment is confirmed in block 978164. Separately, the live Pact-app covenant funding, capped payment with same-script continuation, and owner recovery are confirmed in blocks 978379, 978381, and 978470. Evidence and exact outpoints are in `contracts/evidence/mainnet-covenant.json`.
- The XO invitation payment is a separate Chipnet demonstration. It is not the Pact-app Mainnet covenant and its status should be described independently.
- The user-facing event actions are to submit the project through DoraHacks and post the project-real confirmation in the BCH BLAZE Telegram. These do not change the app build or require an EMBER2026 address.

## 19. Resolved release configuration

The project uses Vercel, the public GitHub repository, WizardConnect, Paytaca, Chipnet as the default network, and an enabled BCH Mainnet send path. The app uses no managed agent signing key and never asks for a wallet seed phrase. The owner supplies the desired recipient and approves each wallet transaction. Mainnet covenant funding, payment/continuation, and owner recovery have been exercised and confirmed; each future transaction still requires the owner's wallet authorization before broadcast.
