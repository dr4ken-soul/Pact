# Fund and spend the Pact covenant

This guide follows the live Pact app. The covenant must be funded separately; a normal BCH payment does not create or activate one.

## Before you start

- Open https://pact-bch.vercel.app and choose **BCH Mainnet** in the network control.
- Connect the Paytaca wallet that owns the funds using WizardConnect. The wallet itself must also be on BCH Mainnet.
- The approved recipient can be a new, empty BCH Mainnet wallet. Enter its public P2PKH BCH Mainnet address; the connected wallet is the owner and funder.
- Choose a per-payment cap and a recovery time in the future. Recovery time means when owner recovery becomes available. It does not stop the payment branch on-chain.
- The app defaults to **0.0005 BCH** funding. Its minimum is the cap plus **0.00020546 BCH** (20,000 sats for the covenant fee and 546 sats for a remaining continuation output). The separate wallet funding transaction also pays its estimated network fee.

## Fund the covenant

1. In **Set the boundary**, enter the recipient, cap, recovery time, and funding amount.
2. Click **Review covenant funding**. Check that the network says Bitcoin Cash Mainnet, the amount is the amount you chose, and the destination shown is the generated covenant address.
3. Click **Open wallet to approve**. That button sends the WizardConnect request; it may not launch the phone app from the desktop. Open Paytaca on your phone and approve the pending request there.
4. Keep Pact open and wait until the policy state says **FUNDED · CONFIRMED**. A broadcast receipt alone is not confirmation.

## Spend from the confirmed covenant

1. In **Prepare a payment**, enter an amount no greater than the cap. The approved recipient is locked to the address committed when you created the covenant.
2. Click **Review covenant payment** and inspect the full recipient, BCH amount, confirmed covenant balance, and fixed **20,000 sat** covenant fee.
3. Click **Open wallet to approve**, then open Paytaca on your phone and approve the pending WizardConnect request.
4. Pact validates the signed transaction with the BCH 2023 virtual machine, then broadcasts it. Wait for the continuation output to confirm before attempting another spend.

For example, with 0.0005 BCH funding and a 0.00001 BCH cap, one covenant output can cover at most two maximum-size payments: each spend deducts both the payment and the fixed 20,000 sat fee. The wallet also pays a separate fee for the initial funding transaction.

The Mainnet covenant path has now been exercised end to end: 50,000 sats were funded and confirmed in block 978379; one 1,000 sat covenant payment confirmed in block 978381, returned 29,000 sats to the same covenant, and paid the fixed 20,000 sat covenant fee; then owner recovery spent that continuation and returned 9,000 sats to the committed owner address in confirmed block 978470, paying the same fixed fee. The three transaction IDs and explorer records are in [`contracts/evidence/mainnet-covenant.json`](contracts/evidence/mainnet-covenant.json). The covenant output used for this proof has been recovered and is no longer funded; to repeat the demo, create and fund a new policy. For an active policy, Pact stores its settings and current outpoint in the same browser's local storage, so reconnecting the same owner wallet does not itself require another funding transaction. Wait for each continuation output to confirm before the next spend. The separate 1,000 sat ordinary Mainnet wallet payment is recorded in [`contracts/evidence/mainnet-payment.json`](contracts/evidence/mainnet-payment.json).

The recovery branch can return the remaining balance to the owner after the configured locktime, less the fixed fee. It is not an on-chain expiry of the payment branch. BCH Script exposes transaction locktime for contract checks, but cannot independently read the current wall-clock time; see the [CashScript covenant introspection reference](https://cashscript.org/docs/design/covenants).
