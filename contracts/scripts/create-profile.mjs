import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Engine, XO_SUPPORTED_NETWORKS } from '@xo-cash/engine';
import { chipnetServersWithBlockchain } from '@electrum-cash/servers';
import { hexToBin, lockingBytecodeToCashAddress } from '@bitauth/libauth';
import { StorageType } from '@xo-cash/state';
import { p2pkhTemplate } from '@xo-cash/templates';

process.on('unhandledRejection', (error) => {
  if (error instanceof AggregateError) {
    console.warn('Chipnet Electrum background sync ended during local engine shutdown.');
    return;
  }
  console.error('XO Engine background error:', error);
  process.exitCode = 1;
});

const here = path.dirname(fileURLToPath(import.meta.url));
const contractsDir = path.resolve(here, '..');
const stateDir = path.join(contractsDir, '.xo-state');
const profilePath = path.join(stateDir, 'public-profile.json');
const template = JSON.parse(fs.readFileSync(path.join(contractsDir, 'pact-policy.template.json'), 'utf8'));
const toChipnetAddress = (lockingBytecode, tokenSupport = false) => {
  const result = lockingBytecodeToCashAddress({ prefix: 'bchtest', bytecode: hexToBin(lockingBytecode), tokenSupport });
  if (typeof result === 'string') throw new Error(result);
  return result.address;
};
const readProfile = () => {
  if (!fs.existsSync(profilePath)) return undefined;
  try { return JSON.parse(fs.readFileSync(profilePath, 'utf8')); }
  catch { throw new Error('The local public XO profile is invalid. Keep the encrypted account state; do not generate a replacement after funding.'); }
};

let mnemonic = await new Promise((resolve, reject) => {
  let value = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => value += chunk);
  process.stdin.on('end', () => resolve(value.trim()));
  process.stdin.on('error', reject);
});
if (typeof mnemonic !== 'string' || mnemonic.split(/\s+/).length < 12) throw new Error('The local Chipnet account phrase could not be read.');

const engine = await Engine.create(mnemonic, {
  network: XO_SUPPORTED_NETWORKS.chipnet,
  electrumServers: chipnetServersWithBlockchain,
  storageType: StorageType.INDEXEDDB,
  databasePath: stateDir,
  databaseFilename: 'pact-chipnet',
});
mnemonic = null;
try {
  const { templateIdentifier: walletTemplateIdentifier } = await engine.importTemplate(p2pkhTemplate);
  const { templateIdentifier } = await engine.importTemplate(template);
  const existingProfile = readProfile();

  if (existingProfile?.templateIdentifier === templateIdentifier) {
    if (typeof existingProfile.policyLockingBytecode !== 'string') {
      throw new Error('The local XO profile predates the safe resume format. Do not regenerate it after funding; migrate its existing script first.');
    }
    const scripts = await engine.listScriptHashes();
    if (!scripts.some((entry) => entry.lockingBytecode === existingProfile.policyLockingBytecode)) {
      throw new Error('The encrypted account database no longer tracks this policy script. Do not generate a replacement after funding.');
    }
    console.log(JSON.stringify(existingProfile, null, 2));
    console.log('Reused the existing profile and tracked Chipnet policy script.');
  } else {
    if (existingProfile !== undefined) {
      const archivePath = path.join(stateDir, `public-profile-${existingProfile.templateIdentifier.slice(0, 12)}.json`);
      if (!fs.existsSync(archivePath)) fs.writeFileSync(archivePath, JSON.stringify(existingProfile, null, 2) + '\n');
      console.log(`Archived the prior public profile at ${path.basename(archivePath)}; its tracked script remains in the local XO database.`);
    }
    await engine.setDefaultPolicies({ address: { templateIdentifier: walletTemplateIdentifier } });
    const ownerLockingBytecode = await engine.generateLockingBytecodeFromDefaultPolicy('address');
    const recipientLockingBytecode = await engine.generateLockingBytecodeFromDefaultPolicy('address');
    const ownerAddress = toChipnetAddress(ownerLockingBytecode);
    const recipientAddress = toChipnetAddress(recipientLockingBytecode);

    await engine.setDefaultPolicies({ address: { templateIdentifier } });
    const expiryTimestamp = Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60;
    const policyFeeSatoshis = 20_000;
    const dustLimitSatoshis = 546;
    const perPaymentCapSatoshis = 100_000;
    const policyLockingBytecode = await engine.generateLockingBytecodeFromDefaultPolicy('address', {
      recipientLockingBytecode,
      ownerLockingBytecode,
      perPaymentCapSatoshis,
      expiryTimestamp,
      policyFeeSatoshis,
      dustLimitSatoshis,
    });
    const profile = {
      network: 'chipnet', ownerAddress, recipientAddress,
      ownerLockingBytecode, recipientLockingBytecode,
      policyAddress: toChipnetAddress(policyLockingBytecode),
      policyTokenAddress: toChipnetAddress(policyLockingBytecode, true),
      policyLockingBytecode,
      perPaymentCapSatoshis, policyFeeSatoshis, dustLimitSatoshis, expiryTimestamp,
      templateIdentifier, templateVersion: template.version,
      generatedAt: new Date().toISOString(),
    };
    fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2) + '\n');
    console.log(JSON.stringify(profile, null, 2));
    console.log('Created a local Chipnet test profile; its mnemonic remains encrypted in the ignored local state folder.');
  }
} finally {
  try { await engine.stop(); }
  catch { console.warn('Engine shutdown could not finish every Chipnet Electrum subscription.'); }
}
await new Promise((resolve) => process.stdout.write('', resolve));
process.exit(process.exitCode ?? 0);
