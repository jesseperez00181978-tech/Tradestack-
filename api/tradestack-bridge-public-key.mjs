import { createPublicKey } from 'node:crypto';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only.' });
  try {
    const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
    if (!raw) return res.status(503).json({ error: 'Google Play credentials are not configured.' });
    const account = JSON.parse(raw);
    if (!account.private_key || !account.client_email || !account.private_key_id) {
      return res.status(503).json({ error: 'Google Play credentials are incomplete.' });
    }
    const publicKeyPem = createPublicKey(account.private_key).export({ type: 'spki', format: 'pem' });
    return res.status(200).json({
      clientEmail: account.client_email,
      privateKeyId: account.private_key_id,
      publicKeyPem
    });
  } catch {
    return res.status(500).json({ error: 'Could not derive bridge public key.' });
  }
}
