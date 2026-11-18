import xoEvidence from '../../contracts/evidence/chipnet-transaction.json';

export type BchNetwork = 'mainnet' | 'chipnet';
const env = import.meta.env;
export const projectConfig = {
  deckUrl: env.VITE_PROJECT_DECK_URL?.trim() ?? '',
  repositoryUrl: env.VITE_PROJECT_REPOSITORY_URL?.trim() || 'https://github.com/dr4ken-soul/Pact',
  donationAddress: env.VITE_EMBER2026_CASHTOKENS_ADDRESS?.trim() ?? '',
  donationAddressVerified: env.VITE_EMBER2026_VERIFIED === 'true',
  network: (env.VITE_BCH_NETWORK === 'mainnet' ? 'mainnet' : 'chipnet') as BchNetwork,
  mainnetSendsEnabled: env.VITE_ENABLE_MAINNET_SENDS === 'true',
  demoRecipient: env.VITE_DEMO_RECIPIENT?.trim() ?? '',
  demoAmountBch: env.VITE_DEMO_AMOUNT_BCH?.trim() ?? '',
  mainnetElectrumHost: env.VITE_MAINNET_ELECTRUM_HOST?.trim() ?? '',
  chipnetElectrumHost: env.VITE_CHIPNET_ELECTRUM_HOST?.trim() ?? '',
  xoTransactionUrl: xoEvidence.transactionUrl,
  xoTransactionStatus: xoEvidence.status,
  xoPolicyFeeSatoshis: xoEvidence.policyFeeSatoshis,
};
export function releaseConfigurationIssues(): string[] {
  const issues: string[] = [];
  if (!projectConfig.deckUrl) issues.push('The final project deck URL is missing.');
  if (!projectConfig.donationAddress) issues.push('The EMBER2026 CashTokens address is missing.');
  else if (!projectConfig.donationAddressVerified) issues.push('The EMBER2026 address is supplied but has not been confirmed by the Pact team.');
  if (!projectConfig.demoRecipient) issues.push('The Chipnet demo recipient is missing.');
  if (!projectConfig.demoAmountBch) issues.push('The owner-approved demo amount is missing.');
  if (!projectConfig.xoTransactionUrl) issues.push('The Chipnet XO transaction proof is missing.');
  if (projectConfig.network === 'mainnet' && !projectConfig.mainnetSendsEnabled) issues.push('Mainnet sends remain disabled until Chipnet checks and explicit approval are complete.');
  return issues;
}
