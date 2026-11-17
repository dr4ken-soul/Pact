# Pact App Blueprint

**Status:** Planning artifact. No application code has been approved.

## 1. Executive summary

Pact is a bounded-permission payment layer for AI agents on Bitcoin Cash. A user defines a spending cap, an approved recipient, and an expiry. Pact turns that policy into an explicit payment path, makes the resulting transaction legible, and distinguishes wallet approval from contract-enforced constraints.

The product is designed for a short judge review: open the live app, understand the boundary, connect a BCH wallet, review a real payment, approve it, and see the real transaction result. The first screen is the app itself, not a marketing splash.

## 2. Product principles

1. **Bounded authority:** the agent must never have access to wallet seed material or unrestricted signing authority.
2. **Visible rules:** cap, recipient, expiry, network, fee, and transaction status are visible before a payment is approved.
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

- Set the maximum amount, recipient, and expiry.
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
- One bounded policy flow demonstrating spending limit, approved destination, and expiry. Avoid claiming that a single payment cap proves an unrestricted cumulative budget.
- Actual transaction receipt and explorer link, only after a real transaction is returned by the provider.
- Required Widget Factory deck, source repository, top-of-homepage banner, and project EMBER2026 CashTokens donation address.

### Explicitly out of scope unless separately approved

- Agent-held wallet seed phrases or private keys.
- Unreviewed autonomous Mainnet broadcasting.
- Multi-recipient, recurring, or multi-agent policies unless the selected template proves them.
- A claim of production security, audit, or guaranteed recovery without evidence.
- Token issuance or use of the EMBER2026 donation address for Pact's payment demo.

## 5. Core user journey

### A. Define a policy

1. User opens Pact and immediately sees the policy form and demo card.
2. User sets cap in BCH or satoshis, chooses an approved BCH recipient, and selects expiry.
3. Pact validates address/network, precision, amount, available policy mode, and expiry.
4. Pact previews the exact boundary and labels its enforcement status: `UI preview`, `Chipnet contract verified`, or `Mainnet contract active` as appropriate.
5. User creates the policy. If funding is needed, Pact shows the funding transaction details and asks for explicit wallet approval.

### B. Submit a payment intent

1. Agent submits a payment intent with policy ID, destination, and amount.
2. Pact checks it against policy configuration and passes it to the selected XO/contract adapter.
3. Contract validation is the source of truth for on-chain limits. UI validation is an early explanation and convenience only.
4. If a check fails, Pact rejects the request with a field-level reason. It does not silently rewrite amount or destination.
5. If allowed, Pact presents the full transaction review to the policy owner.

### C. Authorize and verify

1. User reviews network, amount, recipient, fee, policy state, and expiry.
2. The connected wallet signs and, if applicable, broadcasts the transaction.
3. Pact waits for a real provider response and records the actual txid.
4. Pact displays pending/confirmed state based on provider data and links to the correct network explorer.
5. A rejected or failed transaction remains visibly rejected/failed, never a simulated success.

### D. Revoke or recover

- The UI may offer revoke/reclaim only if a real contract branch or protocol operation supports it.
- For an expiry-based refund, show the exact height/time semantics and expected delay.
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
- expiry basis and threshold, such as a tested block height or timestamp condition;
- allowed agent/public key or other explicit authorization condition;
- exact fee and change behavior;
- owner recovery path after expiry;
- any state transition required to represent remaining allowance.

This is a candidate model, not an already-proven contract. CashScript documentation shows how BCH covenants can inspect and restrict outputs and how local state may be preserved in CashTokens NFT commitments. The selected XO template's semantics must be validated against the desired constraints.

### 6.3 Cumulative spending cap caveat

A maximum on one payment is not automatically a maximum across many payments. The total cap must be enforced by the value/state of the remaining capability UTXO or another proven on-chain state transition. Every spend must return only valid remaining value to the same constrained covenant, or use an explicitly reviewed alternative. Tests must cover repeated spends, multiple contract inputs, fee subtraction, change outputs, and re-funding. Do not present a UI counter as an on-chain cumulative cap.

### 6.4 Expiry caveat

A UI expiry timer is not an on-chain expiry. Confirm which chain field/contract rule is used, test boundary conditions on Chipnet, and document the refund/reclaim path. Wallet and provider clocks do not establish consensus expiry.

### 6.5 Mainnet demo choice

The product must make at least one useful Mainnet BCH transaction possible through the app. Keep the path simple and safe:

- use a project-controlled, configured demo recipient or a judge-selected destination;
- require user-entered or clearly disclosed amount and destination;
- validate BCH Mainnet and all policy bounds;
- show fees and full destination before wallet approval;
- require wallet signature and user confirmation;
- never use the EMBER2026 CashTokens donation address as a BCH demo recipient unless it is separately verified for that purpose;
- do not send funds automatically to an arbitrary prefilled destination.

If the transaction path is wallet-signed but policy enforcement is only UI-side, label that honestly. Demonstrate contract enforcement on Chipnet until Mainnet contract behavior is independently verified. A later Mainnet covenant demo requires an explicit user decision and minimal recoverable funds.

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
- `expiryType`: documented enum such as `blockHeight` or `timestamp`.
- `expiryValue`: integer validated against chosen expiry type.
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

- Never request, log, store, transmit, or include seed phrases or wallet private keys.
- Never put secrets in frontend environment variables or public repository files.
- Do not send policy details to an external AI API without an explicit privacy review and user consent.
- Treat wallet return data, addresses, remote APIs, and transaction status as untrusted inputs.
- Verify network identity at every wallet/session boundary. Mainnet/Chipnet mismatches block signing.
- Display the complete recipient during final review and provide a copy action.
- Make the active enforcement level visible and accurate.
- Use minimal funds for any Mainnet trial. Never suggest that funds can be recovered until the recovery path is tested.
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
- expiry or reclaim error: state the actual contract condition and next step.

## 10. Judge demo script

Target: under 90 seconds, without a narrated tour.

1. Open the hosted app. The first screen shows the cap, recipient, expiry, and payment demo.
2. Point to the visible policy boundary and the current enforcement level.
3. Connect a BCH wallet and verify the network label.
4. Use the configured demo profile or enter a destination and amount. The full values remain visible.
5. Review the fee and policy match, then explicitly approve in the wallet.
6. Show the real transaction status and explorer receipt.
7. Open the boundary explainer or technical section to show the XO template and what is enforced on-chain.

The demo must not depend on typing a long prompt, creating an account, fake balances, simulated txids, or a broken third-party service. Provide a Chipnet fallback clearly marked as Chipnet.

## 11. Hackathon compliance checklist

- [ ] Live hosted version loads directly into the working app.
- [ ] At least one useful BCH Mainnet transaction can be initiated and completed through Pact with explicit wallet approval.
- [ ] WizardConnect integration is present and tested as required by the Mainnet track.
- [ ] XO template integration, if selected for policy enforcement, is separately documented and pinned to the tested version.
- [ ] Build and contract testing start on Chipnet.
- [ ] Project uses only minimal Mainnet funds and only with a tested recovery understanding.
- [ ] Widget Factory short presentation is copied and completed.
- [ ] Top-of-homepage banner links to final deck and source repository and displays the project-controlled EMBER2026 CashTokens donation address.
- [ ] Roll call and any required Telegram confirmation are completed according to the current official event instructions. Save proof/links in the submission checklist.
- [ ] Submission is made within the official submission window and judging notes are ready.
- [ ] No logo mark is added unless the user requests one.

Official current resources: https://dorahacks.io/hackathon/bchblaze2026/resources

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| An XO template does not enforce all three boundaries | Choose the smallest template that can be proven. Document gaps; do not label UI checks as covenant enforcement. |
| Repeated spends bypass a cumulative cap | Make remaining allowance a contract-controlled state transition and test repeated/multi-input cases. |
| Expiry/recovery semantics are misunderstood | Test exact boundary and reclaim behavior on Chipnet before any Mainnet use. |
| Wallet connection support differs across wallets | Verify the chosen WizardConnect path against current wallet and protocol docs, and provide a clear fallback. |
| Event engine API changes | Re-check latest official XO engine version and pin the tested release. |
| Demo destination/address is missing | Block release readiness; do not fabricate or reuse an unrelated address. |
| Judges cannot quickly understand the product | Keep the actual app and demo action above the fold; remove generic marketing content. |
| Mainnet funds at risk | Require explicit user confirmation, low limits, full review, and tested recovery. |

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
| Circle Agent Wallets | Agent wallets with user-defined transfer policies, allowlists, and supported stablecoin/multichain assets. [Circle](https://developers.circle.com/agent-stack/agent-wallets) | Pact is BCH-native and aims to demonstrate an XO/covenant-enforced recipient, cap, and expiry. |
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

The defensible wedge is not merely an AI prompt that says not to overspend. Pact aims to make the scope of the authorization visible and to bind recipient, amount, and expiry to BCH-native transaction conditions. The demo must prove which conditions are actually enforced. If XO/contract behavior cannot prove all three constraints, narrow the claim rather than presenting UI checks as cryptographic protection.

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
3. Ask testers to evaluate recipient, amount, expiry, recovery, and wallet usability.
4. Publish the Widget Factory deck, live app, and source link in the hackathon submission.
5. Do not announce metrics, users, revenue, security audit, or successful policy guarantees unless measured and verified.

### Milestone-based build sequence

- **Milestone 1:** app shell, required banner, responsive product-first screen, and empty/error states.
- **Milestone 2:** WizardConnect connection and network verification.
- **Milestone 3:** Chipnet XO template and adversarial constraint tests.
- **Milestone 4:** wallet-reviewed payment flow, real receipt, and judge walkthrough.
- **Milestone 5:** Mainnet readiness gate, actual deck/repository/address setup, hosted demo, and submission proof.

This order prioritizes a working, legible judge demo over a calendar-driven feature list.

## 19. Open decisions to guide in clickable setup

Before implementation, the build agent should ask only the choices that affect the next step, using clickable questions when practical:

- preferred coding agent, platform, and builder experience;
- preferred hosting provider and whether a public GitHub repository is acceptable;
- whether the user has a BCH wallet that supports CashTokens and WizardConnect;
- whether the demo destination should be a project-controlled address or a judge-chosen recipient;
- maximum demo amount the user is willing to risk;
- whether any paid service or LLM should be used.

The agent must provide direct action links and step-by-step instructions for account-specific values as set out in `BUILD_GUIDE.md`.
