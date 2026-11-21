# Pact Marketing Guide

**Status:** Copy-ready introduction drafted. Keep claims tied to the implemented code and public transaction evidence.

## Voice

- Builder voice, not company voice.
- One clear idea per post.
- Use short paragraphs with a blank line between them.
- Show what works; avoid hype, invented metrics, and unverified security claims.

## Copy-ready introduction

Meet Pact, a Bitcoin Cash payment prototype for AI agents.

Pact lets an agent propose a payment to one approved BCH recipient under a per-payment cap. The owner funds the policy with a BCH wallet, reviews each covenant spend, and approves it through WizardConnect. The covenant restricts the recipient and payment amount, while the remaining balance returns to the same policy output.

Pact keeps wallet keys with the owner and makes the transaction and its on-chain rules visible. Its recovery time opens the owner's recovery path; it is not an automatic cutoff for agent payments.

## Core narrative

AI agents need a narrower way to request payments than unrestricted wallet access. Pact combines an owner-authorized BCH covenant with a wallet review step, and shows which payment conditions are enforced by the contract.

## Honest product boundaries

- The owner wallet signs each covenant payment through WizardConnect. Pact does not collect a seed phrase or silently authorize a spend.
- The covenant enforces one committed recipient, a per-payment cap, a token-free one-input spend, same-script balance continuation, and a fixed 20,000 sat fee.
- Each covenant output spends down its own balance. Separately funded outputs do not share one lifetime allowance.
- The recovery timestamp makes owner recovery available. It does not make the payment branch expire on-chain.
- The confirmed 1,000 sat Mainnet transaction is an ordinary BCH wallet payment. It is separate evidence from the XO Chipnet invitation and does not prove the covenant has been funded or spent on Mainnet.
- EMBER2026 has not been issued. Its receive address is organizer-controlled and is not required for Pact's ordinary BCH payment flow or the Mainnet-track demo.

## Public proof before posting

- Link the live app and source repository.
- Show the completed Widget Factory-based presentation.
- Link the confirmed Mainnet wallet payment as proof of the ordinary BCH send flow.
- Describe the covenant as an integrated prototype unless a covenant funding and spend transaction has also been confirmed on the network being claimed.
- State the actual enforcement rules and the recovery-time limitation.

## Demo walkthrough

1. Open the Pact app and select Chipnet or Mainnet.
2. Connect the policy owner's WizardConnect-compatible BCH wallet.
3. Set the approved recipient, per-payment cap, recovery time, and funding amount.
4. Review and approve the covenant funding transaction in the wallet, then wait for confirmation.
5. Prepare a payment from the confirmed covenant output, inspect recipient, amount, and fixed fee, then approve it in the wallet.
6. Show the transaction result and explain that the next covenant spend waits for the continuation output to confirm.

Keep a clearly labeled Chipnet fallback. Never present a pending transaction as confirmed or a video as a live transaction.

## Submission package

- Live app URL.
- Source repository URL.
- Completed Widget Factory-based presentation.
- Short product description and optional demo recording.
- DoraHacks project submission and project-real confirmation in the BCH BLAZE Telegram.

The owner must complete the event form and Telegram confirmation from their authenticated accounts.

The event details and direct action links are maintained in `BUILD_GUIDE.md` and `SUBMISSION_STATUS.md`.
