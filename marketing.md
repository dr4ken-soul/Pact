# Pact Marketing Copy

The canonical positioning and proof guide is [MARKETING_GUIDE.md](MARKETING_GUIDE.md).

## Copy-ready introduction

Meet Pact, a Bitcoin Cash payment prototype for AI agents.

Pact lets an agent propose a payment to one approved BCH recipient under a per-payment cap. The owner funds the policy with a BCH wallet, reviews each covenant spend, and approves it through WizardConnect. The covenant restricts the recipient and payment amount, while the remaining balance returns to the same policy output.

Pact keeps wallet keys with the owner and makes the transaction and its on-chain rules visible. Its recovery time opens the owner's recovery path; it is not an automatic cutoff for agent payments.

## Confirmed Mainnet wallet-payment proof

Pact's WizardConnect browser flow completed an owner-approved 1,000 sat BCH Mainnet payment. It confirmed in block 978164 with a 226 sat network fee. [View the transaction](https://blockchair.com/bitcoin-cash/transaction/3016046b74c212788c08d99b7637458edfaa2fcc1ab3b71682aa542182c19704).

This is proof of the ordinary BCH wallet-payment flow. It is separate from the XO Chipnet invitation and is not a Mainnet covenant-spend proof.

## Confirmed Mainnet covenant lifecycle

Pact's app covenant lifecycle has also been exercised and confirmed on BCH Mainnet. A 50,000 sat policy funding transaction confirmed in block 978379. The covenant payment confirmed in block 978381, sent 1,000 sats to the committed recipient, returned 29,000 sats to the same covenant, and paid the fixed 20,000 sat covenant fee. Owner recovery then confirmed in block 978470, returning 9,000 sats to the committed owner address and paying the fixed fee.

[Funding transaction](https://blockexplorer.cash/mainnet/tx/a8666f786627ad94fc0573d990edbc59c7b100af226f6d334baa16dbc445ef68) · [Covenant payment and continuation](https://blockexplorer.cash/mainnet/tx/f53a93a7177b7935cc0f57751a3b82aaad3e173e5c88cbf1b51ba6a53f386638) · [Owner recovery](https://blockexplorer.cash/mainnet/tx/25d22cab6bc19f89bfd5a2a98560f0e43c2ac7e42553e57f1fe59adde0600c2c) · [Evidence record](contracts/evidence/mainnet-covenant.json)

This confirms the exercised covenant lifecycle. The recovery time opens owner recovery but does not disable the payment branch, and separately funded covenant outputs have separate balances.

The covenant output used for this proof has been fully recovered, so it has no active balance. Repeating the live demo requires funding a new covenant.
