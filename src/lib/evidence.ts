export const mainnetPaymentEvidence = {
  transactionId: '3016046b74c212788c08d99b7637458edfaa2fcc1ab3b71682aa542182c19704',
  explorerUrl: 'https://blockchair.com/bitcoin-cash/transaction/3016046b74c212788c08d99b7637458edfaa2fcc1ab3b71682aa542182c19704',
  blockHeight: 978164,
  amountSats: 1000,
  feeSats: 226,
  confirmedAt: '2026-11-20',
} as const;

export const mainnetCovenantEvidence = {
  fundingTxid: 'a8666f786627ad94fc0573d990edbc59c7b100af226f6d334baa16dbc445ef68',
  fundingExplorerUrl: 'https://blockexplorer.cash/mainnet/tx/a8666f786627ad94fc0573d990edbc59c7b100af226f6d334baa16dbc445ef68',
  fundingBlockHeight: 978379,
  fundingSats: 50000,
  fundingFeeSats: 226,
  spendTxid: 'f53a93a7177b7935cc0f57751a3b82aaad3e173e5c88cbf1b51ba6a53f386638',
  spendExplorerUrl: 'https://blockexplorer.cash/mainnet/tx/f53a93a7177b7935cc0f57751a3b82aaad3e173e5c88cbf1b51ba6a53f386638',
  spendBlockHeight: 978381,
  recipientSats: 1000,
  continuationSats: 29000,
  spendFeeSats: 20000,
} as const;
