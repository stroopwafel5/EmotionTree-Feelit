/**
 * http.js
 * --------------------------------------------------------------------------
 * Small helpers for reading requests and sending answers, so the route
 * files stay short and readable.
 */

/** Reads the whole request body (up to maxBytes) as a Buffer. */
export function readBody(req, maxBytes = 64 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new HttpError(413, 'That is too big.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** Reads a JSON body. */
export async function readJson(req) {
  const body = await readBody(req);
  if (body.length === 0) {
    return {};
  }
  try {
    return JSON.parse(body.toString('utf8'));
  } catch {
    throw new HttpError(400, 'The request was not valid JSON.');
  }
}

/** Reads an HTML form body (application/x-www-form-urlencoded). */
export async function readForm(req) {
  const body = await readBody(req);
  return Object.fromEntries(new URLSearchParams(body.toString('utf8')));
}

/** An error with an HTTP status and an easy-English message. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Sends JSON. */
export function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

/** Sends an HTML page. */
export function sendHtml(res, status, html, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', ...headers });
  res.end(html);
}

/** Redirects to another page. */
export function redirect(res, location, headers = {}) {
  res.writeHead(303, { Location: location, ...headers });
  res.end();
}

/** Reads the cookies of a request into an object. */
export function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key) {
      out[key] = decodeURIComponent(rest.join('='));
    }
  }
  return out;
}

/** A Set-Cookie header value for a login cookie. */
export function sessionCookie(name, token, maxAgeMs) {
  return `${name}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(maxAgeMs / 1000)}`;
}

/**
 * Reads a multipart/form-data body (used for voice uploads).
 * Returns the parts: [{ name, filename, contentType, data, value }].
 */
export function parseMultipart(body, contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType ?? '');
  if (!match) {
    throw new HttpError(400, 'Upload was not multipart/form-data.');
  }
  const boundary = Buffer.from(`--${match[1] ?? match[2]}`);
  const parts = [];
  let start = body.indexOf(boundary);
  while (start !== -1) {
    const headerStart = start + boundary.length;
    // "--" after the boundary means the end.
    if (body.subarray(headerStart, headerStart + 2).toString() === '--') {
      break;
    }
    const headerEnd = body.indexOf('\r\n\r\n', headerStart);
    if (headerEnd === -1) {
      break;
    }
    const next = body.indexOf(boundary, headerEnd);
    if (next === -1) {
      break;
    }
    const headers = body.subarray(headerStart, headerEnd).toString('utf8');
    const data = body.subarray(headerEnd + 4, next - 2); // remove the \r\n before the boundary
    const name = /name="([^"]*)"/i.exec(headers)?.[1] ?? '';
    const filename = /filename="([^"]*)"/i.exec(headers)?.[1];
    const partType = /content-type:\s*([^\r\n]+)/i.exec(headers)?.[1]?.trim();
    parts.push({ name, filename, contentType: partType, data, value: data.toString('utf8') });
    start = next;
  }
  return parts;
}

/**
 * Checks that an uploaded file is really a voice recording - and NOT a
 * picture or a video in disguise. Returns { mime, ext } or null.
 *
 *  - MP4 / M4A (Android recordings): must have a sound track, and no video
 *    or picture track.
 *  - WebM / Ogg: must use an audio codec, and no video codec.
 *  - AAC (ADTS): audio only by design.
 */
export function detectAudio(data) {
  if (data.length < 16) {
    return null;
  }
  const ascii = data.toString('latin1');
  // MP4 family: "ftyp" at byte 4
  if (ascii.slice(4, 8) === 'ftyp') {
    const brand = ascii.slice(8, 12);
    if (/^(heic|heix|hevc|heim|heis|mif1|msf1|avif|avis)/.test(brand)) {
      return null; // a picture format
    }
    const handlers = [];
    let i = ascii.indexOf('hdlr');
    while (i !== -1) {
      handlers.push(ascii.slice(i + 12, i + 16));
      i = ascii.indexOf('hdlr', i + 4);
    }
    if (!handlers.includes('soun') || handlers.some(h => h === 'vide' || h === 'pict')) {
      return null;
    }
    return { mime: 'audio/mp4', ext: 'm4a' };
  }
  // WebM / Matroska
  if (data[0] === 0x1a && data[1] === 0x45 && data[2] === 0xdf && data[3] === 0xa3) {
    if (/V_(VP8|VP9|AV1|MPEG|THEORA|UNCOMPRESSED)/.test(ascii)) {
      return null;
    }
    return /A_(OPUS|VORBIS)/.test(ascii) ? { mime: 'audio/webm', ext: 'webm' } : null;
  }
  // Ogg
  if (ascii.startsWith('OggS')) {
    if (/theora/i.test(ascii)) {
      return null;
    }
    return /OpusHead|\x01vorbis/.test(ascii) ? { mime: 'audio/ogg', ext: 'ogg' } : null;
  }
  // AAC ADTS
  if (data[0] === 0xff && (data[1] & 0xf6) === 0xf0) {
    return { mime: 'audio/aac', ext: 'aac' };
  }
  return null;
}
