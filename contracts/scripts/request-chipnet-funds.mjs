import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const contractsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stateDir = path.join(contractsDir, '.xo-state');
const profile = JSON.parse(fs.readFileSync(path.join(stateDir, 'public-profile.json'), 'utf8'));
const claimPath = path.join(stateDir, `faucet-claim-${profile.templateIdentifier.slice(0, 12)}.json`);
const amountSatoshis = 100_000;
const faucet = 'https://chipnet.bch.ninja';

if (profile.network !== 'chipnet' || !/^bchtest:[rz]/.test(profile.policyTokenAddress)) {
  throw new Error('Funding stopped: the profile is not a CashTokens-aware Chipnet address.');
}
if (fs.existsSync(claimPath)) {
  const prior = JSON.parse(fs.readFileSync(claimPath, 'utf8'));
  if (prior.address === profile.policyTokenAddress) {
    throw new Error('This policy address already has a recorded faucet claim. Refusing to request another one.');
  }
}
const requestJson = async (path, body) => {
  const response = await fetch(`${faucet}/api/${path}`, body === undefined ? {} : {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Chipnet faucet ${path} failed (${response.status}): ${data.error ?? 'unknown response'}`);
  return data;
};

const pool = await requestJson('pool');
const maxSatoshis = Number(pool.max);
const requestedSatoshis = Math.min(amountSatoshis, maxSatoshis);
if (!Number.isSafeInteger(requestedSatoshis) || requestedSatoshis < 21_546) {
  throw new Error(`Chipnet faucet has only ${String(pool.max)} sats available; at least 21,546 sats are needed for the 20,000 sat policy fee, 1,000 sat payment, and dust-safe continuation.`);
}
console.log(`Requesting ${requestedSatoshis} Chipnet sats for the local Pact covenant.`);
const challenge = await requestJson('challenge', { address: profile.policyTokenAddress, sats: String(requestedSatoshis) });
if (typeof challenge.payload !== 'string' || typeof challenge.signature !== 'string' || typeof challenge.target !== 'string' || !/^\d+$/.test(String(challenge.expires))) {
  throw new Error('Chipnet faucet returned an incomplete proof-of-work challenge.');
}
const target = BigInt(`0x${challenge.target}`);
let nonce = 0n;
const expiresAt = Number(challenge.expires);
let lastProgress = Date.now();
while (Date.now() < expiresAt) {
  const digest = createHash('sha256').update(`${challenge.payload}:${nonce}`).digest('hex');
  if (BigInt(`0x${digest}`) <= target) break;
  nonce++;
  if (Date.now() - lastProgress >= 5_000) {
    console.log(`Chipnet proof of work: ${nonce.toString()} hashes checked.`);
    lastProgress = Date.now();
  }
}
if (Date.now() >= expiresAt) throw new Error('The faucet challenge expired before the proof was found; rerun the request.');
const result = await requestJson('claim', { payload: challenge.payload, signature: challenge.signature, nonce: nonce.toString() });
if (typeof result.txid !== 'string' || !/^[0-9a-f]{64}$/i.test(result.txid)) throw new Error('The faucet did not return a valid transaction ID.');
const record = {
  network: 'chipnet', address: profile.policyTokenAddress, satoshis: requestedSatoshis,
  txid: result.txid, feeSatoshis: result.fee, claimedAt: new Date().toISOString(),
  explorerUrl: `${'https://explorer.selene.cash/tx/'}${result.txid}?network=chipnet`,
};
fs.mkdirSync(stateDir, { recursive: true });
fs.writeFileSync(claimPath, JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify(record, null, 2));
await new Promise((resolve) => process.stdout.write('', resolve));
process.exit(0);
