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

## Copy-ready ordinary Mainnet payment proof

Pact's WizardConnect flow completed an owner-approved 1,000 sat BCH Mainnet payment. It confirmed in block 978164 with a 226 sat network fee.

This demonstrates the ordinary wallet-send path. The app covenant has separate funding, payment, continuation, and recovery transactions.

Transaction: https://blockchair.com/bitcoin-cash/transaction/3016046b74c212788c08d99b7637458edfaa2fcc1ab3b71682aa542182c19704

## Copy-ready Mainnet proof

Pact has completed a confirmed BCH Mainnet covenant cycle. The owner funded a policy with 50,000 sats, approved a capped 1,000 sat payment to its committed recipient, and the covenant returned 29,000 sats to the same policy output. The owner then used the recovery branch to return the remaining 9,000 sats. All three transactions confirmed on Mainnet.

This demonstrates the exercised funding, payment, continuation, and owner-recovery paths. Pact remains a hackathon prototype: the recovery time does not disable agent payments, and separately funded policy outputs have separate balances.

Funding: https://blockexplorer.cash/mainnet/tx/a8666f786627ad94fc0573d990edbc59c7b100af226f6d334baa16dbc445ef68

Payment and continuation: https://blockexplorer.cash/mainnet/tx/f53a93a7177b7935cc0f57751a3b82aaad3e173e5c88cbf1b51ba6a53f386638

Owner recovery: https://blockexplorer.cash/mainnet/tx/25d22cab6bc19f89bfd5a2a98560f0e43c2ac7e42553e57f1fe59adde0600c2c

## Core narrative

AI agents need a narrower way to request payments than unrestricted wallet access. Pact combines an owner-authorized BCH covenant with a wallet review step, and shows which payment conditions are enforced by the contract.

## Honest product boundaries

- The owner wallet signs each covenant payment through WizardConnect. Pact does not collect a seed phrase or silently authorize a spend.
- The covenant enforces one committed recipient, a per-payment cap, a token-free one-input spend, same-script balance continuation, and a fixed 20,000 sat fee.
- Each covenant output spends down its own balance. Separately funded outputs do not share one lifetime allowance.
- The recovery timestamp makes owner recovery available. It does not make the payment branch expire on-chain.
- Pact has separate, confirmed Mainnet proof for the ordinary 1,000 sat wallet send and for the app covenant lifecycle. Covenant funding (50,000 sats), a capped 1,000 sat payment with 29,000 sat same-script continuation, and owner recovery (9,000 sats returned) confirmed in blocks 978379, 978381, and 978470. See `contracts/evidence/mainnet-covenant.json`. Keep these app transactions distinct from the separate XO Chipnet invitation.
- The covenant output used in that proof has since been recovered and is no longer funded. A fresh live covenant demo needs a new funding transaction.
- EMBER2026 has not been issued. Its receive address is organizer-controlled and is not required for Pact's ordinary BCH payment flow or the Mainnet-track demo.

## Public proof before posting

- Link the live app and source repository.
- Show the completed Widget Factory-based presentation.
- Link the confirmed Mainnet wallet payment as proof of the ordinary BCH send flow, and link the three confirmed covenant transactions as proof of the exercised app covenant lifecycle.
- Describe what these transactions demonstrate. Do not imply an exhaustive adversarial audit, a strict expiry of the payment branch, or one shared cumulative limit across separately funded outputs.
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
