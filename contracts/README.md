# XO template status

Pact currently integrates the published XO P2PKH template and validates that it parses with the installed XO SDK. This is a standard pay-to-public-key-hash wallet template. It does not encode Pact's recipient, per-payment cap, or expiry rules as an on-chain covenant.

The spending rules in the web app are interface-level pre-checks. A person must inspect and approve each wallet prompt. They do not enforce cumulative spend, expiry, or policy on-chain.

No seed phrase or private key is generated, stored, or requested by Pact. The XO engine API currently creates an engine from a mnemonic, so this repository does not pass wallet secrets into it. A submission claiming enforceable Pact covenants requires a separately audited XO contract/template and Chipnet deployment with reproducible transaction evidence.

The inspected @xo-cash/engine release was 0.1.1-next.18029697917. Its public engine creation API requires a mnemonic. Pact does not import or call it because the product rules prohibit collecting or handling a wallet seed phrase. WizardConnect remains the wallet-signing path. The app currently does not create an XO invitation, contract UTXO, or covenant transaction.
