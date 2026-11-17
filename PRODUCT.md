# Pact Product Overview

**Status:** concept and prototype plan. Pact is not yet a released product.

## What Pact does

Pact lets a user give an AI agent a limited BCH payment capability instead of unrestricted access to a wallet. The user defines an amount boundary, approved recipient, and expiry. Pact makes the rule visible, checks each payment intent, and only describes a condition as on-chain enforced when the selected contract/template has actually proved it.

The user remains in control of the wallet approval. The app shows the destination, amount, network, fees, policy, and expiry before the user authorizes a transaction.

## Who Pact is for

- **BCH agent developers** who need a BCH-native way to scope what an agent may pay.
- **BCH merchants and paid services** that want agents to pay a known destination under clear rules.
- **Protocol and operations teams** that need constrained machine payments and an understandable audit trail.

The initial customer segment is a hypothesis. The team should validate it with developers and BCH service operators before making market-size or revenue claims.

## How it works

1. The policy owner connects a BCH wallet through WizardConnect.
2. The owner sets a cap, recipient, and expiry.
3. Pact prepares the selected XO template or contract policy and clearly reports its enforcement level.
4. An AI agent proposes a structured payment intent.
5. Pact rejects out-of-policy intents and explains the failed condition.
6. For an allowed payment, the user reviews and authorizes the transaction in the wallet.
7. Pact shows the actual transaction status and receipt.

## What Pact does not do

- Pact does not ask for wallet seed phrases or private keys.
- The AI model does not decide whether the payment policy is valid.
- Pact does not silently broadcast a Mainnet transaction.
- A policy shown in the UI is not described as a covenant unless the contract actually enforces it.
- A one-payment limit is not presented as a cumulative cap without a verified state transition.
- The prototype is not represented as audited, production-safe, or legally reviewed.

## Demo promise

A judge can open the app, understand the three bounds, connect a wallet, inspect a real BCH payment, explicitly approve it, and verify the actual result. The demo must use a real configured address and amount, never fake activity.
