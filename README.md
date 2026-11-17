# Pact

Pact is a Bitcoin Cash agent-payment prototype. A person defines an approved recipient, a per-payment cap, and an expiry. An agent can submit a proposal for an app-level check. The person reviews the complete transaction in a WizardConnect wallet and approves each signature.

## Run locally

Requirements: Node.js 22 or later and npm.

1. Keep the supplied \`.env\` file in the project root. Fill its public project values as described in [SUBMISSION_STATUS.md](SUBMISSION_STATUS.md). It contains no secrets.
2. Run \`npm install\`.
3. Run \`npm run dev\` and open the local URL printed by Vite.
4. For a real Chipnet payment, use a WizardConnect-compatible BCH wallet with confirmed Chipnet funds and a Chipnet recipient. Review the full destination and fee in your wallet before approving.

The production build runs the XO template schema validation, TypeScript check, and Vite bundle: \`npm run build\`.

## Product boundary

The current policy is an app-level check. It does not provide an on-chain covenant, cumulative spending control, or expiry enforcement. The published XO P2PKH template is schema-validated but does not encode Pact rules. Read [contracts/README.md](contracts/README.md) before making claims about contract enforcement.

Pact does not request or store seed phrases or private keys. Wallet pairing is ephemeral in the browser. Mainnet sends are disabled by default and require local opt-in after Chipnet review.

## Project documents

The original product, UX, team, and event planning documents are retained in this repository. See [SUBMISSION_STATUS.md](SUBMISSION_STATUS.md) for outstanding owner-supplied values and external release steps.

## Pinned integration versions and verification

The lockfile records these exact direct package versions:

- React 19.3.1, Vite 8.3.8, TypeScript 7.0.2, Tailwind CSS 4.3.5
- WizardConnect React 0.2.6
- @electrum-cash/network 4.4.8, @electrum-cash/servers 4.2.0, @electrum-cash/checkpoint 0.7.2
- @bitauth/libauth 3.1.0-next.8
- @xo-cash/templates 0.0.12 and @xo-cash/utils 0.0.11

The published XO engine was inspected at 0.1.1-next.18029697917. It is not included in the app dependencies: its engine creation API requires a mnemonic, which is outside Pact's no-seed-handling design. The app validates the published P2PKH template schema only. See [contracts/README.md](contracts/README.md).

Verification performed here: the production build runs XO schema parsing, strict TypeScript compilation, and Vite bundling. No live wallet session, Chipnet payment, Mainnet payment, desktop/mobile browser matrix, or contract covenant has been verified from this workspace.
