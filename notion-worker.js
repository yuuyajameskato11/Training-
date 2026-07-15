/* ============================================================================
   notion-worker.js — Cloudflare Worker that lets the APEX PWA push logs to
   Notion. Notion's API has no CORS and needs a secret token, so this tiny
   proxy holds the token server-side, checks a shared key, adds CORS, and
   forwards page-creates to Notion.

   ── Deploy (one time, free) ────────────────────────────────────────────────
   1. Create a Notion internal integration:
      notion.so/my-integrations → New integration → copy the token (ntn_… / secret_…).
   2. Share each of the 4 dashboard databases with that integration:
      open the database → ••• → Connections → add your integration.
   3. Create the Worker:
      dash.cloudflare.com → Workers & Pages → Create → Worker → paste this file → Deploy.
   4. Add two secrets to the Worker (Settings → Variables and Secrets):
      NOTION_TOKEN = your integration token
      APEX_KEY     = any long random string you invent (your shared password)
   5. In the APEX app → You → Notion sync: paste the Worker URL and the APEX_KEY.

   That's it — logging in the app now appends rows to your Notion databases.
   ========================================================================== */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, x-apex-key',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'POST') return json({ message: 'POST only' }, 405);

    if (request.headers.get('x-apex-key') !== env.APEX_KEY)
      return json({ message: 'Unauthorized — APEX_KEY mismatch' }, 401);

    let body;
    try { body = await request.json(); } catch { return json({ message: 'Invalid JSON' }, 400); }
    if (!body || !body.parent || !body.properties)
      return json({ message: 'Expected { parent, properties }' }, 400);

    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    return new Response(text, { status: res.status, headers: { ...CORS, 'Content-Type': 'application/json' } });
  },
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}
