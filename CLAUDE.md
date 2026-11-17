# Pact Agent Context

## Project status

Pact is a BCH BLAZE 2026 bounded-permission AI payments project. Planning is approved. The design gates, name, palette, fingerprint, and frontend specification are confirmed. No application code or build has been approved yet.

**Stop before writing or modifying application code.** Wait for the user to explicitly approve the build step. Reading references, updating planning documents, and discussing implementation are permitted. Do not create a scaffold, install dependencies, or start a dev server without that approval.

## Source of truth

Read these project documents before implementation:

1. `PROJECT_RULES.md` for the complete writing, design, BCH security, and reference-derived constraints.
2. `FRONTEND_SPEC.md` for exact visual and interaction requirements.
3. `APP_BLUEPRINT.md` for product behavior, market hypotheses, architecture, and security boundaries.
4. `PRODUCT.md` for the plain-language product promise.
5. `TEAM_OPS.md` for wallet, transaction, event, and release operations.
6. `WHITEPAPER.md` for proposed technical invariants and explicit limitations.
7. `FAQ.md` and `MARKETING_GUIDE.md` for truthful public-facing messaging.
8. `BUILD_GUIDE.md` for direct-link setup, order of work, and verification.

The user-provided reference files are in `/home/user/uploads`. `FRONTEND_SKILL.md` and `COMPOSITION_RECIPES.md` are mandatory for frontend work. Do not paraphrase recipe class values when a recipe applies.

## Product in one sentence

Pact gives an AI agent a BCH payment capability bounded by a user-defined spending cap, approved recipient, and expiry, with honest separation between UI validation, XO/contract enforcement, wallet approval, and on-chain transaction outcome.

## Persistent must-haves

- The opening screen must communicate immediate product value and expose a judge-usable BCH payment path without a marketing detour.
- A real useful BCH Mainnet transaction must be possible through the app. Require full review and explicit wallet authorization. Never auto-broadcast.
- WizardConnect integration is mandatory for the BCH BLAZE 2026 Mainnet track according to the current official Tracks page. XO templates are a separate contract/template path and do not replace the wallet integration requirement. Use both where appropriate. Chipnet testing comes first.
- Use the official Widget Factory presentation template for the project deck.
- The homepage top banner must link to the finished deck and actual source repository and display the actual project-controlled CashTokens address for EMBER2026 donations.
- Roll call and required Telegram confirmation must be completed per current official instructions.
- Keep the project minimal, original, plug-and-play, judge-friendly, useful, and ambitious in technical clarity rather than decorative complexity.

## Security and truthfulness

- Never ask for or handle wallet seed phrases or private keys.
- Never commit secrets or put secrets in browser-exposed environment variables.
- Never fabricate a BCH address, CashTokens address, transaction ID, balance, confirmation count, explorer link, benchmark, or contract proof.
- A UI check is not a covenant. Label enforcement as `ui-only`, `chipnet-verified`, or `mainnet-verified` accurately.
- A per-payment ceiling is not a cumulative spending cap. Prove the remaining allowance state transition and test repeated spends, multiple inputs, fees, change, expiry, and reclaim behavior.
- Use minimal Mainnet funds only after Chipnet tests and with the user's explicit approval.
- Verify the wallet network before signing and broadcasting.

## Design contract

- Name: Pact. Text-only wordmark. Do not invent a logo mark or brand symbol without asking the user.
- Aesthetic: Bento Grid Operational, 12-column asymmetric grid, one-pixel borders, no decorative shadows, CSS noise texture.
- Font system: Sora / IBM Plex Sans / IBM Plex Mono.
- Palette: Graphite + signal mint as defined in `FRONTEND_SPEC.md`.
- Navigation: A2 scroll-morph pill.
- Motion: restrained canvas entry, localized SVG state detail, restrained viewport reveals. Respect `prefers-reduced-motion`. No forced scroll, autoplay video, or decorative animation loop.
- The top-level layout uses CSS Grid, not Flexbox.
- Follow exact Tailwind classes, breakpoints, animation timings, and z-index values in the frontend specification.
- Use British English throughout. Do not use em dashes in generated docs, UI copy, code comments, or JSDoc.
- Apply the full copy contract in `PROJECT_RULES.md`: concise, natural sentences; punctuation that reflects meaning; no comma splices; no trailing punctuation on labels or buttons; no AI filler or banned headline words; no duplicate CTA intent; one consistent voice; no unverified marketing numbers; and a final audit of every visible string.
- Never ship lorem ipsum, fake user names, fake addresses, fake transaction history, fake balances, fake success states, or unverified brand assets. Configuration values may be marked as unresolved in planning files, but must not appear as fake user-facing data.

## Guided setup responsibility

The build agent is responsible for helping the user obtain required release values, not merely listing them as blockers. When a value is needed, ask one focused question, give a direct action link and short click-by-click steps, explain what to copy, verify the format, and never ask the user to reveal a seed phrase or private key. Use direct task pages such as the Widget Factory copy link, GitHub's new-repository form, and official wallet download pages. Documentation links may be included as secondary technical references, not as the user's primary route to obtaining a value. The user may need to perform authenticated actions; the agent must guide rather than pretend to create or access private accounts.

## Working protocol after build approval

1. Re-open the project specs and confirm all unresolved configuration values.
2. Check the current official XO engine/API and WizardConnect docs. Pin versions actually tested.
3. Build the UI without enabling Mainnet sends.
4. Implement and verify contract/policy behavior on Chipnet.
5. Test wrong network, invalid address, amount precision, fees, multiple inputs, repeated spends, expiry boundaries, reclaim, wallet rejection, provider errors, and reduced motion.
6. Only enable Mainnet flows after explicit user sign-off, verified demo configuration, low-value limits, and a visible review/approval step.
7. Run the acceptance checklist in `BUILD_GUIDE.md` and keep the project banner values real.

Do not claim completion when a checklist item is still a placeholder or untested.
