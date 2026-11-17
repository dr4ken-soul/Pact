# Pact FAQ

**Status:** draft for a project concept and prototype. Update answers to match verified implementation before publication.

## What is Pact?

Pact is a planned Bitcoin Cash payment layer that aims to constrain an AI agent's payment authority by amount, recipient, and expiry.

## Can the AI agent spend my BCH without asking me?

The planned judge demo requires a visible review and explicit wallet approval. Pact must not receive your wallet seed phrase or private key. Any future autonomous mode would require a separate, restricted contract and security design.

## Are the limits enforced on-chain?

Only when the active XO template or covenant actually enforces the specific condition. A frontend check alone is not on-chain enforcement. Pact must label its state honestly and publish the exact tested limits.

## Does a payment cap also limit total lifetime spending?

Not automatically. A per-payment limit and a cumulative allowance are different. A cumulative cap requires the contract to preserve and constrain remaining allowance across repeated spends, fees, change, and additional inputs.

## What happens when a policy expires?

The answer depends on the selected contract's verified expiry and recovery branch. A visual countdown alone does not lock a transaction or recover funds. The final app must state whether expiry uses block height or time and what the owner can do after expiry.

## Does Pact require a BCH wallet?

Yes. The planned Mainnet path uses WizardConnect, which the current BCH BLAZE Mainnet track requires. The user connects a supported wallet and authorizes the transaction there.

## Can I test it without risking real BCH?

Contract and wallet behavior should be tested on Chipnet first. Any Mainnet demo is a separate, explicit decision and uses only an amount the owner agrees to risk.

## Is Pact audited?

No audit is claimed for this prototype. A production launch requires independent contract and transaction-flow review.

## Is Pact charging a fee?

The MVP plan has no Pact protocol fee. The BCH network fee is shown before the user authorizes a transaction. Any future fee model would be disclosed and reviewed separately.

## Where does my data go?

The planned MVP avoids a user account and avoids storing secrets. The final answer must be updated if the implementation adds an AI API, hosted database, analytics, or transaction indexing service.
