import aiHandler from './tradestack-ai.mjs';
import {
  PREMIUM_PRODUCT,
  AI_PRODUCT,
  verifySubscriptionPurchase
} from './tradestack-billing.mjs';

function allowedOrigins() {
  const configured = String(process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map(value => value.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return [...new Set([...configured, 'https://jesseperez00181978-tech.github.io'])];
}

function setCors(req, res) {
  const origin = String(req.headers.origin || '');
  if (origin && allowedOrigins().includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only.' });

  const origin = String(req.headers.origin || '');
  const allowed = allowedOrigins();
  if (allowed.length && origin && !allowed.includes(origin)) {
    return res.status(403).json({ error: 'This TradeStack front end is not allowed to use this AI endpoint.' });
  }

  let body = req.body;
  try {
    if (typeof body === 'string') body = JSON.parse(body);
  } catch {
    return res.status(400).json({ error: 'Invalid request.' });
  }
  req.body = body || {};

  const premiumPurchaseToken = req.body.premiumPurchaseToken;
  const aiPurchaseToken = req.body.aiPurchaseToken;
  if (!premiumPurchaseToken || !aiPurchaseToken) {
    return res.status(402).json({
      error: 'TradeStack Premium plus the TradeStack AI Add-On is required for cloud AI troubleshooting.',
      code: 'ai_subscription_required'
    });
  }

  try {
    const [premium, ai] = await Promise.all([
      verifySubscriptionPurchase(PREMIUM_PRODUCT, premiumPurchaseToken, { acknowledge: false }),
      verifySubscriptionPurchase(AI_PRODUCT, aiPurchaseToken, { acknowledge: false })
    ]);
    if (!premium.active || !ai.active) {
      return res.status(402).json({
        error: 'TradeStack Premium plus an active TradeStack AI Add-On is required for cloud AI troubleshooting.',
        code: 'ai_subscription_required'
      });
    }
  } catch (error) {
    if (error?.code === 'INVALID_PURCHASE') {
      return res.status(402).json({
        error: 'TradeStack could not verify the Premium and AI Add-On purchases. Restore purchases and try again.',
        code: 'ai_subscription_required'
      });
    }
    return res.status(502).json({
      error: 'Google Play could not verify AI access right now. Restore purchases and try again.',
      code: 'billing_verification_unavailable'
    });
  }

  delete req.body.premiumPurchaseToken;
  delete req.body.aiPurchaseToken;
  return aiHandler(req, res);
}
