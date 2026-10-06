// Proxy for the public demo. The page sends one turn's prompts; this function adds the xAI key,
// a fixed model and the response schema, and returns the model's JSON text.
//
// - Key: XAI_API_KEY in functions/.env at deploy time. Never in git or in the client bundle.
// - Origins are allow-listed so other sites cannot embed the page and spend the key.
// - Quota: ASA_PER_IP calls per IP per UTC day, ASA_PER_DAY overall. One negotiation run is 20 calls.
//   If the counter cannot be read the request is refused.

import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';

initializeApp();
const db = getFirestore();

const MODEL = 'grok-4-0709'; // the model used in the study
const ASA_PER_IP = Number(process.env.ASA_PER_IP || 200);
const ASA_PER_DAY = Number(process.env.ASA_PER_DAY || 1000);
const ALLOWED_ORIGINS = ['https://able0401.github.io', 'http://localhost:5173', 'http://localhost:4173'];
const MAX_SYSTEM = 8000;
const MAX_USER = 40000;

const today = () => new Date().toISOString().slice(0, 10);
const ipKey = (ip) => createHash('sha256').update(ip).digest('hex').slice(0, 16);
const clientIp = (req) => String(req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim();

const takeQuota = (ip) => {
  const ref = db.collection('asaQuota').doc(today());
  const key = ipKey(ip);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const d = snap.exists ? snap.data() : {};
    const total = d.total || 0;
    const mine = (d.ips && d.ips[key]) || 0;
    if (total >= ASA_PER_DAY || mine >= ASA_PER_IP) return false;
    tx.set(ref, { total: total + 1, ips: { [key]: mine + 1 } }, { merge: true });
    return true;
  });
};

const schema = (isKo) => ({
  type: 'json_schema',
  json_schema: {
    name: 'single_turn_response',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: isKo ? '실제 발언 내용' : 'What the agent actually says, in English' },
        reasoning: { type: 'string', description: isKo ? '발언의 기저에 깔린 생각' : 'The thinking behind the message, in English' },
      },
      required: ['message', 'reasoning'],
      additionalProperties: false,
    },
  },
});

// maxInstances: 3 caps the blast radius if the page is hit hard; the quota still applies.
export const asaTurn = onRequest(
  { region: 'us-central1', timeoutSeconds: 180, maxInstances: 3 },
  async (req, res) => {
    const origin = req.headers.origin;
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return res.status(403).json({ error: 'origin' });
    res.set('Access-Control-Allow-Origin', origin || ALLOWED_ORIGINS[0]);
    res.set('Vary', 'Origin');
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(204).send('');
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const system = String(body?.system || '');
    const user = String(body?.user || '');
    if (!system || !user || system.length > MAX_SYSTEM || user.length > MAX_USER) {
      return res.status(400).json({ error: 'input' });
    }
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'not_configured' });

    let allowed = false;
    try {
      allowed = await takeQuota(clientIp(req));
    } catch (err) {
      console.error('quota check failed:', err);
    }
    if (!allowed) return res.status(429).json({ error: 'quota' });

    try {
      const r = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.7,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          response_format: schema(body?.lang === 'ko'),
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        console.error('xai error', r.status, JSON.stringify(data).slice(0, 500));
        return res.status(502).json({ error: 'upstream' });
      }
      return res.json({ content: data.choices?.[0]?.message?.content || '' });
    } catch (err) {
      console.error('xai call failed:', err);
      return res.status(502).json({ error: 'upstream' });
    }
  }
);
