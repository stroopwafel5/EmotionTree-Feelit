/**
 * Test helpers: start a real server on a free port with an empty database,
 * and talk to it like the app, a parent and a school would.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createApp } from '../src/app.js';

export async function startServer(dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'et-'))) {
  const app = createApp({ port: 0, dataDir, resendApiKey: '', quiet: true });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  return { ...app, base, dataDir, close: () => new Promise(r => app.server.close(r)) };
}

/** Calls the kids' API. */
export async function api(base, token, method, urlPath, body) {
  const res = await fetch(base + urlPath, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : await res.text();
  return { status: res.status, data };
}

/** The newest email to this address in the test mailbox. */
export function lastMail(store, to) {
  return [...(store.db.outbox ?? [])].reverse().find(m => m.to === to);
}

/** The link in an email, as a path on our test server. */
export function linkIn(mail) {
  const url = /https?:\/\/[^\s"<]+\?t=[\w-]+/.exec(mail.text)?.[0];
  if (!url) {
    throw new Error(`No link in mail: ${mail.subject}`);
  }
  const u = new URL(url);
  return { path: u.pathname, token: u.searchParams.get('t') };
}

/**
 * A browser for the parent / school pages: keeps cookies, sends forms,
 * finds the csrf value on pages.
 */
export class Browser {
  constructor(base) {
    this.base = base;
    this.cookies = {};
    this.csrf = '';
  }

  cookieHeader() {
    return Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join('; ');
  }

  remember(res) {
    for (const line of res.headers.getSetCookie?.() ?? []) {
      const [pair] = line.split(';');
      const [key, value] = pair.split('=');
      if (value === '') {
        delete this.cookies[key];
      } else {
        this.cookies[key] = value;
      }
    }
  }

  async get(urlPath, headers = {}) {
    const res = await fetch(this.base + urlPath, { headers: { Cookie: this.cookieHeader(), ...headers }, redirect: 'manual' });
    this.remember(res);
    const html = await res.text();
    const csrf = /name="csrf" value="([^"]+)"/.exec(html)?.[1];
    if (csrf) {
      this.csrf = csrf;
    }
    return { status: res.status, html, location: res.headers.get('location') };
  }

  async post(urlPath, form, { withCsrf = true } = {}) {
    const body = new URLSearchParams({ ...form, ...(withCsrf && this.csrf ? { csrf: this.csrf } : {}) });
    const res = await fetch(this.base + urlPath, {
      method: 'POST',
      headers: { Cookie: this.cookieHeader(), 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      redirect: 'manual',
    });
    this.remember(res);
    const result = { status: res.status, location: res.headers.get('location'), html: await res.text() };
    // Like a real browser: after a new login, open the next page (this also
    // picks up the new csrf value).
    if ((res.headers.getSetCookie?.() ?? []).length > 0 && result.location) {
      await this.get(result.location);
    }
    return result;
  }
}

/** A fake MP4 voice recording (has a sound track, like Android makes). */
export function fakeMp4(handler = 'soun', brand = 'M4A ') {
  return Buffer.concat([
    Buffer.from([0, 0, 0, 20]),
    Buffer.from(`ftyp${brand}`, 'latin1'),
    Buffer.alloc(8),
    Buffer.from('moovtrakmdia'),
    Buffer.from([0, 0, 0, 33]),
    Buffer.from('hdlr'),
    Buffer.alloc(8),
    Buffer.from(handler),
    Buffer.alloc(40),
  ]);
}

/** A fake WebM recording (audio only unless video=true). */
export function fakeWebm(video = false) {
  return Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.from(`webm....${video ? 'V_VP8' : ''}A_OPUS`), Buffer.alloc(40)]);
}

/** Uploads a voice message like the app does (multipart). */
export async function uploadVoice(base, token, ref, data, type = 'audio/mp4') {
  const form = new FormData();
  form.append('voice', new Blob([data], { type }), 'voice.m4a');
  form.append('seconds', '4');
  const res = await fetch(`${base}/api/chats/${ref}/voice`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  return { status: res.status, data: await res.json() };
}
