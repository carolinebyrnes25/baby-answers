/**
 * Baby Answers — AI Q&A proxy (self-contained; NOT connected to any other project).
 *
 * The app's "Ask" box calls this instead of hitting Gemini from the browser, so:
 *   - the API key lives here (a Cloud Functions secret), never in the public site;
 *   - only signed-in, allow-listed people (you + Luke) can use it, so the paid
 *     endpoint can't be abused;
 *   - the app is on GitHub Pages (a different origin), so we enable CORS for it.
 *
 * The app does its own retrieval in the browser and sends the relevant Moms on Call /
 * Cribsheet excerpts in `system`; this function is just the protected key-holder.
 *
 * One-time setup (see DEPLOY.md):
 *   - firebase functions:secrets:set AI_API_KEY   (paste your Gemini API key)
 *   - firebase deploy --only functions
 *   - add carolinebyrnes25.github.io under Firebase console -> Authentication ->
 *     Settings -> Authorized domains, and enable Google sign-in.
 */

const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret, defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');

admin.initializeApp();

const AI_API_KEY = defineSecret('AI_API_KEY');
const AI_PROVIDER = defineString('AI_PROVIDER', { default: 'gemini' });
const AI_MODEL = defineString('AI_MODEL', { default: '' });

// Who may use the AI box (Google sign-in emails).
const ALLOW = [
  'carolinebyrnes25@gmail.com',
  'luke.f.byrnes@gmail.com',
  'byrnesfam25@gmail.com',
];

// The site allowed to call this endpoint (CORS).
const APP_ORIGIN = 'https://carolinebyrnes25.github.io';

// gemini-flash-latest auto-resolves to the current stable Gemini Flash, so we
// don't have to track version numbers as Google releases new ones.
const DEFAULT_MODELS = { gemini: 'gemini-flash-latest', anthropic: 'claude-sonnet-4-5', openai: 'gpt-4.1' };
// High ceiling so a "thinking" Flash model's internal reasoning doesn't starve
// the visible answer (the system prompt still keeps answers brief). You only pay
// for tokens actually generated, so a generous cap is safe.
const MAX_TOKENS = 4096;

exports.askBaby = onRequest(
  { secrets: [AI_API_KEY], region: 'us-central1', maxInstances: 3, cors: [APP_ORIGIN] },
  async (req, res) => {
    try {
      if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

      // auth: signed-in + allow-listed
      const bearer = (req.get('Authorization') || '').match(/^Bearer (.+)$/);
      if (!bearer) { res.status(401).json({ error: 'Please sign in to ask.' }); return; }
      let decoded;
      try { decoded = await admin.auth().verifyIdToken(bearer[1]); }
      catch (e) { res.status(401).json({ error: 'Session expired — sign in again.' }); return; }
      const email = (decoded.email || '').toLowerCase();
      if (ALLOW.indexOf(email) === -1) { res.status(403).json({ error: 'This account is not on the allow-list.' }); return; }

      const body = req.body || {};
      const system = String(body.system || '').slice(0, 24000);
      let messages = Array.isArray(body.messages) ? body.messages.slice(-8) : [];
      messages = messages
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
      if (!messages.length) { res.status(400).json({ error: 'No question.' }); return; }

      const provider = (AI_PROVIDER.value() || 'gemini').toLowerCase();
      const model = AI_MODEL.value() || DEFAULT_MODELS[provider] || '';
      const key = AI_API_KEY.value();
      if (!key) { res.status(500).json({ error: 'AI_API_KEY secret is not set.' }); return; }

      const text = await callProvider(provider, model, key, system, messages);
      res.json({ text: text });
    } catch (e) {
      res.status(502).json({ error: (e && e.message) || 'Proxy error.' });
    }
  }
);

async function callProvider(provider, model, key, system, messages) {
  if (provider === 'gemini') {
    // Gemini uses roles "user"/"model" and a separate system_instruction.
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }],
    }));
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
      encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(key);
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: contents,
        generationConfig: { maxOutputTokens: MAX_TOKENS },
      }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j && j.error && (j.error.message || j.error)) || 'Gemini ' + r.status);
    const cand = j.candidates && j.candidates[0];
    return ((cand && cand.content && cand.content.parts) || []).map((p) => p.text || '').join('');
  }

  if (provider === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: model, max_tokens: MAX_TOKENS, system: system, messages: messages }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j && j.error && (j.error.message || j.error)) || 'Anthropic ' + r.status);
    return (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  }

  if (provider === 'openai') {
    const msgs = [{ role: 'system', content: system }].concat(messages);
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'content-type': 'application/json' },
      body: JSON.stringify({ model: model, messages: msgs, max_tokens: MAX_TOKENS }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j && j.error && (j.error.message || j.error)) || 'OpenAI ' + r.status);
    return (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
  }

  throw new Error('Unknown AI_PROVIDER: ' + provider);
}
