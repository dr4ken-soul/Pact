# Pact Technical Note

**Status:** design hypothesis, not an audited protocol specification.

## 1. Problem

An AI agent's instruction to "stay under budget" is not a security boundary. If signing authority is broader than the task requires, a model failure, prompt injection, compromised tool, or integration bug can propose an unintended payment. Pact explores whether BCH-native transaction constraints can limit delegated payment authority to a defined amount, recipient, and period.

## 2. Proposed solution

Pact presents a user-created policy and a structured payment intent. The wallet owner retains control of their wallet. A selected XO template or covenant should validate the transaction conditions independently of the AI model and frontend. A wallet signature is still required for the user-approved Mainnet demo.

Pact separates four layers:

1. **Intent:** an agent asks to pay a destination and amount.
2. **Policy preview:** the app explains whether the intent appears to match the policy.
3. **Transaction constraint:** the BCH template/contract enforces only those conditions it can prove from transaction data and contract state.
4. **Owner authorization:** WizardConnect carries the wallet interaction required by the BCH BLAZE Mainnet track and the user explicitly approves the transaction.

## 3. Candidate policy state

A policy may need to commit to:

- canonical recipient locking bytecode;
- total funded allowance in integer satoshis;
- remaining allowance and any state transition;
- agent authorization key or permitted spend path;
- expiry condition and whether it is timestamp- or height-based;
- fee budget, change output, and contract continuation rules;
- owner reclaim path after expiry.

This list is a design target. It is not proof that an XO template currently implements these conditions.

## 4. Critical invariants to prove

- A payment to any non-approved recipient fails.
- A payment above the allowed transaction amount fails.
- Repeated payments cannot exceed the original cumulative funded allowance.
- Fees and change cannot create a bypass or overspend.
- Multiple inputs cannot bypass the policy.
- Re-funding does not silently expand authority unless the owner creates a new, reviewed allowance.
- The expiry condition uses the chosen BCH consensus field and works at its exact boundary.
- The owner can reclaim only through the documented recovery branch and only when its conditions are satisfied.
- A Mainnet wallet signature cannot make a contract-invalid spend valid.

## 5. Cumulative cap caveat

A per-transaction upper bound does not automatically cap total spend across multiple transactions. To claim a cumulative cap, the contract must preserve a remaining-allowance state, for example through a correctly constrained continuing UTXO or a reviewed CashTokens NFT commitment. The contract must constrain every continuation and fee/change path. If the selected template cannot prove this, narrow the MVP claim to the actual property it enforces.

## 6. Expiry caveat

A frontend countdown is informational only. A time-limited covenant must validate the relevant transaction/contract time or height rule and document the owner recovery path. Test before, at, and after expiry on Chipnet. Do not imply instant revocation of a transaction already broadcast.

## 7. Wallet and network model

WizardConnect integration is mandatory for the current BCH BLAZE 2026 Mainnet track. XO templates are a separate integration for policy construction and do not substitute for wallet connection. Keep Mainnet and Chipnet state explicit. Do not handle a seed phrase or private key in Pact.

## 8. Fee model

The MVP has no protocol fee. The user sees the BCH miner fee before authorization. Future hosted tooling or integration fees are business hypotheses and must not be embedded in a contract until separately reviewed and approved.

## 9. Phased roadmap

- **Phase A, Chipnet:** build and test the policy template, wallet flow, invalid cases, and recovery path with test BCH.
- **Phase B, guarded Mainnet demo:** enable one explicitly reviewed, low-value BCH payment through Pact. Do not enable contract funding unless its Mainnet behavior and recovery path have been verified.
- **Phase C, post-hackathon:** independent contract review, user research, policy monitoring, broader agent adapters, and any hosted business model.

## 10. Audit and disclosure

This prototype is not an audit. Before production use, obtain an independent review of the selected template, transaction construction, wallet boundary, and recovery path. Public copy must list the actual enforcement level and known limitations. Do not say funds are guaranteed safe, recoverable, or impossible to overspend unless a specific tested invariant supports the exact statement.

## 11. Reference implementation sources

- BCH BLAZE resources and XO templates: https://dorahacks.io/hackathon/bchblaze2026/resources
- XO template repository: https://gitlab.com/GeneralProtocols/xo/templates
- CashScript covenant examples: https://cashscript.org/docs/guides/covenants
- CashTokens: https://cashtokens.org/
- WizardConnect: https://docs.riftenlabs.com/wizardconnect/
