# Submission status

The interface and BCH wallet flow are implemented in this repository. The source must not be described as a completed, enforced XO covenant: the current published P2PKH template does not implement Pact's recipient, cap, or expiry policy.

## Values to supply in the root .env

All \`VITE_*\` values are public browser configuration. Do not put private keys, seed phrases, API secrets, or wallet recovery material in this file.

- \`VITE_PROJECT_DECK_URL\`: the team's final Widget Factory presentation link.
- \`VITE_EMBER2026_CASHTOKENS_ADDRESS\`: the official token address verified by the team.
- \`VITE_DEMO_RECIPIENT\`: an owner-approved BCH address. Use a Chipnet address while testing.
- \`VITE_DEMO_AMOUNT_BCH\`: the owner-approved test amount in BCH.
- \`VITE_BCH_NETWORK\`: keep \`chipnet\` for testing.
- \`VITE_ENABLE_MAINNET_SENDS\`: keep \`false\` until Chipnet review and explicit owner approval.
- \`VITE_MAINNET_ELECTRUM_HOST\`, \`VITE_CHIPNET_ELECTRUM_HOST\`: optional host overrides; leave blank to use the package's public defaults.
- \`VITE_PROJECT_REPOSITORY_URL\`: already set to the Pact GitHub repository.

Restart Vite after editing .env. Vite embeds public values in the built client bundle.

## Required before calling the release submission-ready

- Confirm the deck and token address with the project owner.
- Configure an approved Chipnet recipient and amount; fund the wallet from a Chipnet faucet.
- Connect a compatible wallet, prepare a Chipnet payment, review it in the wallet, sign, broadcast, and retain the actual transaction ID.
- Build and publish a Pact XO template that enforces the advertised policy, then validate an invitation and transaction on Chipnet. The current generic P2PKH template is not this contract.
- Deploy a public demo and verify its URL. Do not enable Mainnet payments until the Chipnet evidence is reviewed and the owner explicitly opts in.
- Complete the event's deck, project, demonstration, roll-call, and community submission steps, and retain actual proof URLs.

## Direct project links

- Widget Factory deck template: https://docs.google.com/presentation/d/1Yfuk9CJkf4U9M_WukcELhumWgj3Ak6345Ewy8hSp-Hk/edit?slide=id.p#slide=id.p
- BCH BLAZE hackathon: https://dorahacks.io/hackathon/bchblaze2026/
- BCH BLAZE roll call: https://bchblaze.cash/live/
- BCH BLAZE community: https://t.me/bchblaze
- Paytaca wallet: https://www.paytaca.com/applications/wallet
- Electron Cash: https://electroncash.org/
- Chipnet faucet: https://chipnet.bch.ninja/
- Vercel project creation (if using Vercel): https://vercel.com/new
