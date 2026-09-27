import { createSign, randomUUID } from 'node:crypto';

const BRIDGE_URL = 'https://sjacwqpwxstpkvaayyxx.supabase.co/functions/v1/tradestack-bridge';
const DOMAIN = 'tradestack-supabase-bridge-v1';

function serviceAccount() {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!raw) throw Error('Google Play service credentials are unavailable.');
  const account = JSON.parse(raw);
  if (!account.private_key) throw Error('Google Play service credentials are incomplete.');
  return account;
}

export async function callTradeStackBridge(payload) {
  const account = serviceAccount();
  const body = JSON.stringify(payload || {});
  const timestamp = String(Date.now());
  const nonce = randomUUID().replace(/-/g, '');
  const canonical = `${DOMAIN}\n${timestamp}\n${nonce}\n${body}`;
  const signature = createSign('RSA-SHA256').update(canonical).end().sign(account.private_key, 'base64');

  const response = await fetch(BRIDGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ts-timestamp': timestamp,
      'x-ts-nonce': nonce,
      'x-ts-signature': signature
    },
    body,
    signal: AbortSignal.timeout(10000)
  });
  const data = await response.json().catch(() => ({ error: 'Invalid Supabase bridge response.' }));
  if (!response.ok) throw Error(data.error || 'Supabase bridge request failed.');
  return data;
}
