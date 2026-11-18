import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Engine, XO_SUPPORTED_NETWORKS } from '@xo-cash/engine';
import { chipnetServersWithBlockchain } from '@electrum-cash/servers';
import { StorageType } from '@xo-cash/state';
import { generateBip39Mnemonic } from '@bitauth/libauth';

process.on('unhandledRejection', (error) => {
  if (error instanceof AggregateError) {
    console.warn('Chipnet Electrum is unavailable to this local compile check.');
    return;
  }
  console.error('XO Engine background error:', error);
  process.exitCode = 1;
});

const template = JSON.parse(fs.readFileSync(new URL('../pact-policy.template.json', import.meta.url), 'utf8'));
const engine = await Engine.create(generateBip39Mnemonic(), {
  network: XO_SUPPORTED_NETWORKS.chipnet,
  electrumServers: chipnetServersWithBlockchain,
  storageType: StorageType.INDEXEDDB,
  databasePath: fileURLToPath(new URL('../.xo-state/', import.meta.url)),
  databaseFilename: 'pact-compile-check',
});
let succeeded = false;
try {
  const { templateIdentifier } = await engine.importTemplate(template);
  await engine.setDefaultPolicies({ address: { templateIdentifier } });
  const lockingBytecode = await engine.generateLockingBytecodeFromDefaultPolicy('address', {
    recipientLockingBytecode: '76a914' + '11'.repeat(20) + '88ac',
    ownerLockingBytecode: '76a914' + '22'.repeat(20) + '88ac',
    perPaymentCapSatoshis: 100_000,
    expiryTimestamp: 2_000_000_000,
  });
  if (!/^[0-9a-f]+$/i.test(lockingBytecode) || lockingBytecode.length !== 70) {
    throw new Error(`Unexpected Pact P2SH32 locking bytecode length: ${lockingBytecode.length / 2} bytes.`);
  }
  succeeded = true;
  console.log('XO Engine compiled the Pact P2SH32 policy locking bytecode.');
  console.log('Template identifier:', templateIdentifier);
} finally {
  try { await engine.stop(); }
  catch { console.warn('Engine shutdown could not reach a Chipnet Electrum server.'); }
}
if (!succeeded) process.exitCode = 1;

await new Promise((resolve) => process.stdout.write('', resolve));
process.exit(process.exitCode ?? 0);
