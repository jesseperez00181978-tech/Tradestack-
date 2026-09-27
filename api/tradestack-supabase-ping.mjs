import { callTradeStackBridge } from './tradestack-supabase-bridge.mjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only.' });
  try {
    const result = await callTradeStackBridge({ action: 'ping' });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(502).json({ error: error?.message || 'Supabase bridge test failed.' });
  }
}
