# Pact Team Operations and Safety

**Status:** operational plan for the prototype. No treasury wallet or automated Mainnet operations are approved.

## Wallet and address separation

Pact must keep three concepts distinct:

1. **Owner wallet:** user-controlled wallet connected through WizardConnect.
2. **Demo recipient:** a project-controlled or user-selected BCH receive address for the useful payment demo.
3. **EMBER2026 receive address:** a verified CashTokens receive address for Community Choice voting once the token is issued; it does not make ordinary BCH Mainnet sends work.

Do not reuse one address for another purpose without explicit owner approval and a clear verification. Never publish an address copied from another project.

## Key handling

- End-user seed phrases, private keys, PINs, or recovery phrases never enter Pact, source code, issue tracker, logs, AI prompts, or chat. The isolated development-only Chipnet XO account may store its generated mnemonic only as current-user DPAPI ciphertext under ignored `contracts/.xo-state/`; never log, commit, upload, or reuse it on Mainnet.
- The build agent may help the user create a wallet and copy a public receiving address but never asks for secrets.
- If a future agent signing key is required by a contract design, it needs a separate threat model, restricted authority, secure key management, rotation, revocation, and explicit owner approval. It is not part of the first prototype by default.

## Mainnet change control

Before any Mainnet transaction:

1. Confirm the wallet is on Bitcoin Cash Mainnet.
2. Confirm the recipient and amount with the owner.
3. Show the fee estimate, policy state, and exact transaction details.
4. Confirm that the owner approves the wallet request.
5. Record a transaction only from a real provider response.
6. Start with a low amount the owner explicitly agrees to risk.

Do not claim the user can recover funds unless the recovery path has passed Chipnet tests and has been reviewed for Mainnet conditions.

## Contract release gate

- Chipnet tests come first.
- Test permitted and rejected recipients, over-cap amount, repeated spends, multiple inputs, fee/change behavior, expiry boundary, reclaim path, and network mismatch.
- Keep the contract/template version, test results, and source commit together.
- Label the enforcement state accurately as UI-only, Chipnet-verified, or Mainnet-verified.
- Independent contract review is required before production use. Hackathon participation does not equal a security audit.

## No treasury or fees in MVP

The MVP has no protocol fee and no Pact treasury wallet. Mainnet demo payments must go only to the clearly disclosed recipient. The EMBER2026 donation address is for community-choice voting and is not a treasury or fee recipient.

Any future fee model requires an explicit user decision, a public fee policy, a reviewed contract path, and a separate treasury operations plan.

## Incident and support response

- If a user reports an unexpected transaction, immediately stop further transaction actions and preserve the public txid and relevant non-secret logs.
- Never ask the user to send a seed phrase or wallet backup for troubleshooting.
- Pause affected Mainnet functionality if a policy bypass, wrong-network send, or incorrect recipient is suspected.
- Explain what is known, what is unknown, and what the user can do next. Do not promise reversal of a broadcast transaction.
- Record incidents and resolutions in a private operational log. Do not publish private user information.

## Event operations checklist

- Roll call status: missed/closed. The BLAZE chat notice shown by the owner says late entrants can still compete and do not need to complete roll call.
- Submit the project through the final Build form on the official DoraHacks event page. Registration alone is not a project submission. Include the repository, working demo, and short project description; check DoraHacks for the exact required fields and deadline.
- The CompeteHub mirror of the DoraHacks track listing says projects must confirm they are real in the BCH BLAZE Telegram channel. Post a clear Pact project confirmation with the live demo and repository links, then keep proof. A general introduction or EMBER question may not satisfy this.
- Mainnet sends are enabled in the current live app. One owner-approved 1,000 sat payment was confirmed in block 978164 with a 226 sat fee; see `contracts/evidence/mainnet-payment.json`. This confirms the wallet-signed Mainnet send path for that payment. Continue to require an owner-selected recipient, confirmed wallet funds, exact amount/fee review, and wallet signature for every payment. The EMBER address remains unverified and is only relevant to Community Choice after token issuance. This payment is not evidence of XO covenant enforcement on Mainnet.
- Recheck the official event page before submission because dates and requirements can change.
