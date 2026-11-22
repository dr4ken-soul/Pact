# Pact Project Rules and Reference Integration

**Status:** persistent instructions for future AI coding agents. The owner explicitly approved the initial implementation, which is now built. Continue to require a specific user request for new implementation work, as directed below.

## 1. The user's setup should be guided, not bounced back

When a value requires the user's account or wallet, the build agent must guide them through obtaining it. Do not merely list missing values as blockers. Ask one focused question at a time, use clickable options where a decision is needed, provide a direct action link, explain the exact clicks and the exact value to copy, then verify the result format.

Use task pages rather than a docs index as the user's primary route. Current direct setup links are recorded in `BUILD_GUIDE.md`: Google Slides Widget Factory template, GitHub new repository, GitLab project creation, Paytaca wallet, Electron Cash official download, BCH BLAZE event, Telegram, and hosting project creation.

The user may need to perform private or authenticated steps. Do not pretend to create a deck, repository, or wallet address unless the tool actually did so. Never ask the user to share a seed phrase, private key, PIN, wallet file, or recovery phrase.

## 2. Writing and copy rules

Apply these rules to every visible string, planning document, code comment, JSDoc comment, README, error, empty state, toast, helper, tooltip, onboarding step, and demo script.

### Language and voice

- Use British English spelling and vocabulary throughout.
- Keep one consistent voice per page. Pact is a calm, direct, technically credible product for BCH builders and operators.
- Use short, direct sentences, but vary sentence rhythm. Do not turn every idea into a clipped sentence.
- Write the product's actual behavior. Do not assemble copy from decorative fragments or forced metaphors.
- Use plain words that explain what happened and what the user can do next.

### Punctuation

- No em dashes anywhere in generated output.
- Labels, buttons, eyebrows, badges, and short stats have no trailing punctuation.
- A complete status sentence uses a full stop, for example `Connected.`
- Use periods and commas only where meaning requires them.
- Join related clauses with a conjunction or semicolon. Never create a comma splice.
- Use a parenthetical aside in a field label only when it helps a user complete the field. Keep the aside lowercase and normally tracked.
- A sentence fragment is acceptable when it is complete as a message, for example `Chipnet only.`

### Copy quality

- Ban generic AI filler in headlines and subheadings, including `Elevate`, `Seamless`, `Unleash`, `Unlock`, `Next-Gen`, `Empower`, `Revolutionize`, `Cutting-edge`, `State-of-the-art`, and `Supercharge`.
- Do not use empty claims such as `The future of payments`, `reimagining payments`, or `payments made simple`.
- No generic hype or filler such as `powerful`, `seamlessly`, `best-in-class`, or `revolutionary` unless a specific, verifiable claim is being made.
- No lorem ipsum, fake person/company names, sample transaction IDs, fake balances, fake confirmation counts, or fabricated social proof.
- Use a marketing number only when it is measured, believable, appropriate, and formatted consistently. Never invent adoption, security, uptime, savings, or revenue numbers.
- Do not duplicate CTA intent. Use one clear label for each action, such as connect, create a policy, review a payment, or view source.
- Ensure the UI does not mix technical data jargon, editorial prose, and promotional punch without a deliberate reason.
- Audit all text on all states before release. A string reused across screens is audited at its source.

## 3. Frontend quality rules

- Follow the confirmed gate decisions and `FRONTEND_SPEC.md`. Do not silently restyle or skip design gates.
- Use exact Tailwind classes, responsive breakpoints, animation initial/animate states, duration, easing, delays, and z-index values from the specification.
- Use composition recipes from `COMPOSITION_RECIPES.md` where applicable. Do not paraphrase their exact values.
- The hero must communicate the real product and key action. Keep policy bounds and the payment demo visible immediately.
- No more than one use of a layout family per page. The hero is the one bento grid. Do not add another bento grid or repeat equal feature-card layouts.
- A page may have at most six bento cells. Do not use more than two consecutive zigzag split sections. Use at most one eyebrow per three sections. Keep the hero to a short, focused hierarchy and one primary CTA plus at most one secondary CTA.
- Do not make the right side of a section header a filler paragraph. Use a stacked heading unless the second column has an actual visual or interactive purpose.
- Avoid AI visual tells: purple/blue gradient glow by default, meaningless floating orbs, generic three equal feature cards, Inter as a display font, gradient H1 text, generic glass everywhere, decorative metrics, fake partner strips, or invented geometric mascots.
- Bento structure uses CSS Grid with named areas, asymmetric modules, single-pixel borders, procedural noise, no decorative card shadows, and no card scaling on hover.
- Keep design responsive, keyboard operable, readable at 320px, and usable by touch. Interactive targets are at least 44 x 44px.
- Use one approved icon system only: custom inline SVG or Google Material Icons. Do not add Lucide, Heroicons, Font Awesome, emoji, or raster icons without explicit approval.
- Hide the visual scrollbar using the CSS rules in `FRONTEND_SPEC.md`, while preserving ordinary scrolling and orientation cues.
- Respect WCAG AA contrast and `prefers-reduced-motion`. Main content must remain visible without animation or JavaScript.
- Every scroll-triggered reveal must replay on each viewport entry in both scroll directions. Never use `viewport={{ once: true }}`. Use `viewport={{ once: false, amount: 0.1 }}` for Framer Motion. For IntersectionObserver, reset the revealed state when the element leaves above the viewport. Do not use CSS keyframes with `animation-fill-mode: forwards` or `both` for scroll reveals.
- Avoid inline JavaScript hover handlers. Use CSS transition states.
- Loading states use skeletons only when loading is real and meaningful. Do not add spinners or decorative loading sequences.

## 4. BCH and agent-payment rules

- This project is both an on-chain product and an AI-agent product. Do not apply EVM assumptions such as Solidity, Hardhat, wagmi, or viem unless a verified BCH-specific reason requires them.
- WizardConnect is a mandatory integration for the current BCH BLAZE 2026 Mainnet track. XO templates are a separate contract/transaction integration and are not an alternative to WizardConnect.
- Use Chipnet for contract and wallet testing first. Use current official XO packages and pin the version actually tested.
- Never request, log, store, transmit, or expose an end-user wallet seed phrase or private key. The separate development-only Chipnet XO account may store its generated mnemonic only as current-user DPAPI ciphertext under ignored `contracts/.xo-state/`; never log, commit, upload, or use that account on Mainnet.
- A user's model prompt is not an enforcement boundary. A UI check is not a covenant.
- A per-payment maximum is not a cumulative spending cap. Prove the remaining-allowance state transition, including fees, change, repeated spends, multiple inputs, and re-funding.
- A UI expiry timer is not an on-chain expiry. Specify and test the actual time/height rule and reclaim path.
- Mainnet requires full address, network, amount, fee, policy, and wallet review. No hidden approval or automatic broadcast.
- Chain/contract/provider confirmation is the source of truth for on-chain records. Never write or display a confirmed transaction before actual evidence exists.
- Use minimal Mainnet funds. Claim recovery only for the exact path that has been tested and confirmed; Pact's Mainnet owner recovery is recorded in `contracts/evidence/mainnet-covenant.json`. Every new Mainnet transaction still requires explicit user approval.
- Keep the project CashTokens donation address separate from the BCH demo recipient. Verify the EMBER2026 token identity before publishing the donation address.
- Do not introduce a treasury wallet, protocol fee, managed agent key, or paid service without a separate design and user approval.

## 5. Visual asset and image-generation rules

No external image, video, 3D model, or logo is required by the approved design. Do not generate or source decorative assets just to fill space. The procedural canvas, noise, and small UI symbols are code-generated.

If the user later requests an image, follow `IMAGEGEN_SKILL.md`: ask/offer image options when required by its rules, generate each requested image as a separate image rather than a collage, write a precise asset brief, preserve continuity and composition anchors, and never invent a logo or hardcoded brand symbol without asking first.

## 6. Research, source, and claim rules

- Verify current hackathon requirements on the official BCH BLAZE event pages before submission.
- Keep source links and dates for time-sensitive claims such as submission dates, package versions, supported wallets, and pricing.
- Distinguish facts from hypotheses. Do not state competitor pricing or market size when it was not verified.
- Use official product pages for feature claims and direct task links for user setup. Technical docs can support engineering details but should not be the only route provided for the user's account setup.
- Do not copy another team's address, deck, repository, project name, logo, or demo evidence.

## 7. Reference integration map

The uploaded references were read in full. Their relevant rules are carried into the project files as follows:

- `FRONTEND_SKILL.md`: gates, dials, fingerprint, bento structure, anti-default rules, copy quality, responsive/accessibility rules, repeatable scroll animation, icon system, exact spec output, and no-code-until-approved workflow.
- `COMPOSITION_RECIPES.md`: exact bento and architecture-layer composition references in `FRONTEND_SPEC.md`.
- `DESIGN_TRENDS_SKILL.md`: Bento is the base system; the only two accent trends are restrained Signal Graphics and Grainy Blur/procedural texture. The subtle motion is functional product feedback, not a third visual trend.
- `CRYPTO_SKILL.md`: BCH on-chain + AI-agent classification, wallet boundary, testnet-first plan, additional PRODUCT/TEAM_OPS/WHITEPAPER/FAQ files, audit/recovery requirements, and no inappropriate EVM stack assumptions.
- `SKILL.md`: expanded market validation, alternatives, monetization hypothesis, stack, data/API decisions, user flow, launch, distribution, and milestone plan in `APP_BLUEPRINT.md`.
- `IMAGEGEN_SKILL.md`: no external images are currently needed; rules are retained above for any future request.
- `MARKETING.md`: public copy must show working proof, stay in a builder voice, and avoid claims before a real demo exists. This is translated into `BUILD_GUIDE.md` and `APP_BLUEPRINT.md`.
- Uploaded example `FRONTEND_SPEC.md`, `APP_BLUEPRINT.md`, `CLAUDE.md`, and `BUILD_GUIDE.md`: used as structure and quality references, not copied as project facts or unrelated technology choices.
