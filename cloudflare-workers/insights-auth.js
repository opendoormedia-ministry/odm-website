/**
 * Insights Admin — Auth Worker
 *
 * Deploy this script as a Cloudflare Worker (Workers & Pages → Create application → Create Worker).
 *
 * Required secrets (Worker Settings → Variables → add as Secrets):
 *   ADMIN_USER    — your chosen admin username
 *   ADMIN_PASS    — your chosen admin password
 *   ADMIN_SECRET  — a long random string used to sign tokens (generate one at random.org or similar)
 *   GITHUB_PAT    — the GitHub personal access token with repo scope
 *
 * After deploying, copy the Worker URL and paste it into WORKER_URL in insights/admin/index.html
 */

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

async function sign(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const buf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

async function verifySignature(secret, message, sigB64) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  let sigBytes;
  try {
    sigBytes = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0));
  } catch {
    return false;
  }
  return crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(message));
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);

    // POST /login — verify credentials, return a signed token
    if (url.pathname === '/login' && request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }

      const { username, password } = body || {};
      if (!username || !password) return json({ error: 'Missing credentials' }, 400);

      if (username !== env.ADMIN_USER || password !== env.ADMIN_PASS) {
        return json({ error: 'Invalid credentials' }, 401);
      }

      const exp        = Date.now() + TOKEN_TTL_MS;
      const payloadB64 = btoa(JSON.stringify({ u: username, exp }));
      const sig        = await sign(env.ADMIN_SECRET, payloadB64);

      return json({ token: payloadB64 + '.' + sig });
    }

    // POST /verify — validate a token, return the PAT if valid
    if (url.pathname === '/verify' && request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return json({ valid: false }, 400); }

      const { token } = body || {};
      if (!token || typeof token !== 'string') return json({ valid: false });

      const dot = token.indexOf('.');
      if (dot < 1) return json({ valid: false });

      const payloadB64 = token.slice(0, dot);
      const sigB64     = token.slice(dot + 1);

      let payload;
      try { payload = JSON.parse(atob(payloadB64)); } catch { return json({ valid: false }); }

      if (!payload.exp || Date.now() > payload.exp) {
        return json({ valid: false, reason: 'expired' });
      }

      const ok = await verifySignature(env.ADMIN_SECRET, payloadB64, sigB64);
      if (!ok) return json({ valid: false });

      return json({ valid: true, pat: env.GITHUB_PAT });
    }

    return new Response('Not found', { status: 404, headers: CORS });
  },
};
