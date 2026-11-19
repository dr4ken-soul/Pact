# Pact

Pact is a Bitcoin Cash agent-payment prototype. The web app connects through WizardConnect and asks the wallet owner to review every payment before signing. Its browser-side recipient, amount, and time checks are interface checks; the browser payment path does not spend from the XO policy address.

A separate Chipnet XO template is included under `contracts/`. It commits one recipient, a per-payment cap, one policy input, a same-script balance continuation, a fixed fee, dust floors, no CashTokens, and a timestamped owner recovery branch. The template and executed invitation have public evidence in [contracts/evidence](contracts/evidence/). See the contract README for the exact boundary and expiry limitation.

## Run locally

Requirements: Node.js 22 or later and npm.

1. Use the actual root `.env` file. Its `VITE_*` values are public client configuration, not credentials.
2. Run `npm ci --cache .npm-cache`.
3. Run `npm run dev` and open the local Vite URL.
4. Use a WizardConnect-compatible BCH wallet. Chipnet is the prefilled demo network; Mainnet is available when enabled in `.env` and requires a Mainnet wallet, recipient, and user signature.

The production build runs the XO schema checks, TypeScript compilation, and Vite bundle:

```powershell
$env:NPM_CONFIG_CACHE = 'S:\Hackathon\Pact\.npm-cache'
npm run build
```

## XO Chipnet flow

The isolated `contracts/` package pins the XO Engine used for the executable template and invitation. See [contracts/README.md](contracts/README.md) for the setup commands and public transaction proof.

The XO Engine creates its account from a mnemonic. For this development integration only, the Chipnet scripts generate a separate test account and encrypt its mnemonic with Windows current-user DPAPI under the ignored `contracts/.xo-state/` directory. It is never placed in `.env`, committed, uploaded to Vercel, or used on Mainnet. The Pact web app continues to use WizardConnect and never requests an end-user wallet recovery phrase.

## Honest boundaries

- Browser proposals are app-checked; they are not signed by an agent or enforced by the XO policy.
- The XO template enforces a maximum per payment and preserves a finite balance for each policy UTXO. It does not establish a global cumulative cap across separately funded UTXOs.
- The recovery timestamp makes the owner's reclaim branch available. It does not disable the agent payment branch.
- The EMBER2026 address in `.env` was supplied by the owner, but BCH BLAZE says EMBER2026 has not been minted or distributed and no official receive address or token category is available yet. It is not an official EMBER2026 address.
- Mainnet sends are enabled behind WizardConnect review and signature. The app defaults to Chipnet; no Mainnet payment has been broadcast by the project. Mainnet requires a valid bitcoincash recipient and a funded Mainnet wallet.

## Pinned integration versions

The root lockfile pins React 19.3.1, Vite 8.3.8, TypeScript 7.0.2, WizardConnect React 0.2.6, `@bitauth/libauth` 3.1.0-next.8, and the BCH network packages. The separate contract lockfile pins `@xo-cash/engine` 0.1.1-next.18029697917 and its dependencies.
