# Pact FAQ

## What is Pact?

Pact is a Bitcoin Cash payment prototype for AI agents. It lets an agent propose a payment under an on-chain recipient and per-payment limit, while the wallet owner reviews and signs each spend through WizardConnect.

## Can the AI agent spend my BCH without asking me?

No. In the current integration, the owner wallet signs each covenant payment. Pact does not receive the wallet seed phrase or private key and does not silently authorize transactions.

## Are the limits enforced on-chain?

The P2SH covenant enforces the approved recipient, a per-payment cap, one policy input, no CashTokens, a same-script balance continuation, and an exact 20,000 sat fee. Pact checks the returned signed transaction with the BCH 2023 virtual machine before broadcasting.

The covenant limits each funded output separately. Separately funded policy outputs do not share one lifetime cap.

## What happens at the recovery time?

After the configured timestamp, the owner recovery branch can return the remaining balance to the committed owner address. The payment branch remains script-valid after that time. BCH script cannot independently inspect the current wall clock, so Pact describes this field as an owner-recovery time, not an agent-spend expiry.

## Does Pact require a BCH wallet?

Yes. The owner connects a WizardConnect-compatible BCH wallet, reviews the network and transaction, and signs in the wallet.

## Is the Mainnet payment proof a covenant payment?

No. The confirmed 1,000 sat Mainnet transaction was an ordinary BCH wallet send. It demonstrates that wallet approval, signing, broadcast, and confirmation worked for that send. It is separate from the covenant flow.

## Can I test it without risking real BCH?

Use Chipnet to exercise covenant funding, payment, recovery, and wallet approval. Chipnet coins have no Mainnet value. A Mainnet transaction uses real BCH and must be reviewed and explicitly approved in the wallet.

## Is Pact audited?

No audit is claimed for this prototype. Independent contract and transaction-flow review is required before production use.

## Does Pact charge a protocol fee?

Pact has no protocol fee. The covenant currently fixes the miner fee at 20,000 satoshis for each covenant spend. Funding transactions have a separate wallet-estimated BCH network fee, shown before approval.

## Is EMBER2026 required?

No. BCH BLAZE told the owner that EMBER2026 has not yet been issued, so no official receive address or token category exists. That organizer-controlled token is not required for ordinary BCH payments or the Mainnet-track demo.
