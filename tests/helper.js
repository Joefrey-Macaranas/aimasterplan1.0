// Shared QA helper — spawns server on ephemeral port, exposes fetch + auth.
const { spawn } = require('node:child_process');
const path = require('node:path');

async function startServer() {
  const port = 18082 + Math.floor(Math.random() * 1000);
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const base = `http://localhost:${port}`;
  // wait for health
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(base + '/api/health');
      if (r.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  return { child, base, port };
}

function stopServer(h) {
  try { h.child.kill('SIGTERM'); } catch {}
}

async function api(base, method, p, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  const opts = { method, headers };
  if (body !== undefined && body !== null && method !== 'GET' && method !== 'HEAD') {
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(base + p, opts);
  let json = null;
  try { json = await r.json(); } catch { json = null; }
  return { status: r.status, json, headers: r.headers };
}

async function register(base, email, password, name) {
  return api(base, 'POST', '/api/auth/register', { email, password, name });
}
async function login(base, email, password) {
  return api(base, 'POST', '/api/auth/login', { email, password });
}

module.exports = { startServer, stopServer, api, register, login };
