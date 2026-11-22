# Pact Product Overview

**Status:** Working hackathon prototype. Pact includes a wallet-funded Bitcoin Cash P2SH20 covenant flow, explicit WizardConnect signing, and a local BCH 2023 VM check before broadcast. An ordinary owner-approved 1,000 sat Mainnet send is confirmed in block 978164. Separately, the Mainnet covenant lifecycle is confirmed: 50,000 sats funded in block 978379; a 1,000 sat payment with a 29,000 sat continuation confirmed in block 978381; and owner recovery of 9,000 sats confirmed in block 978470. The app is not audited or production-certified.

## What Pact does

Pact lets an AI agent propose a Bitcoin Cash payment under a user-defined recipient and per-payment cap. The user funds the covenant, waits for the output to confirm, and reviews each spend in a connected BCH wallet. Pact shows the transaction and checks the wallet-returned spend against the BCH virtual machine before broadcasting it.

The wallet owner remains the signer. Pact does not receive wallet seed phrases or private keys, and it does not send a transaction without a wallet signature.

## On-chain policy behavior

The P2SH20 covenant commits to the owner's public key, one approved recipient, a per-payment cap, and an owner-recovery timestamp. For a payment, it requires one covenant input, token-free outputs, the committed recipient, a payment no greater than the cap, a continuation to the same policy script, and an exact 20,000 sat fee.

The covenant spends down the value in its current output. Separately funded covenant outputs are separate budgets; Pact does not claim a shared lifetime cumulative cap across them.

After the configured time, the owner can recover the remaining BCH to the committed owner address. BCH script cannot independently read current wall-clock time. The payment branch remains script-valid after that time, so this is an owner-recovery delay rather than an on-chain agent-spend expiry. Each payment also requires the owner wallet's signature.

The covenant builder and spend/recovery paths have local BCH 2023 VM checks for valid payments, recovery, wrong recipient, over-cap amount, changed fee, and early recovery. Mainnet now has confirmed evidence for covenant funding, an agent payment with same-script continuation, and owner recovery. The tested output lineage has been fully recovered and has no unspent continuation. See `contracts/evidence/mainnet-covenant.json` for the three transaction records.

## Who Pact is for

- **BCH agent developers** who need a BCH-native way to scope what an agent may propose.
- **BCH merchants and paid services** that want agent payments to a known destination under clear rules.
- **Protocol and operations teams** that need constrained machine payments and an understandable audit trail.

The initial customer segment is a hypothesis to validate with developers and BCH service operators.

## What Pact does not do

- It does not ask for wallet seed phrases or private keys.
- It does not give an agent autonomous wallet signing authority.
- It does not silently broadcast a transaction.
- It does not impose a shared lifetime cap across separately funded covenant outputs.
- It does not make the recovery timestamp a strict agent-spend expiry.
- It is not represented as audited, production-safe, or legally reviewed.

## Confirmed Mainnet wallet demo

On 20 November 2026, the owner approved an ordinary 1,000 sat BCH Mainnet payment through WizardConnect. It confirmed in block 978164 with a 226 sat fee. [View the transaction](https://blockchair.com/bitcoin-cash/transaction/3016046b74c212788c08d99b7637458edfaa2fcc1ab3b71682aa542182c19704).

This proves that the wallet approval, signing, broadcast, and confirmation path worked for that ordinary BCH payment. It is separate from the P2SH covenant flow.

## Submission note

The owner must submit the project in the [DoraHacks portal](https://dorahacks.io/hackathon/bchblaze2026/) and post the project confirmation in the [BCH BLAZE Telegram](https://t.me/bchblaze). EMBER2026 has not been issued and is optional organizer-controlled Community Choice material, not a Pact software requirement.
