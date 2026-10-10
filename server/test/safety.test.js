/**
 * The safety filter and the "is this really audio?" check.
 * Run:  npm test   (in the server folder)
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

import { checkName, checkText } from '../src/filter.js';
import { detectAudio, parseMultipart } from '../src/http.js';
import { newFriendCode } from '../src/security.js';
import { fakeMp4, fakeWebm } from './helpers.js';

test('normal kid messages are allowed', () => {
  for (const text of [
    'Do you like trains?',
    'I have 3 dinosaurs!',
    'My cat is called Comet and she is 2',
    'Want to play after lunch?',
    "I'm so happy today 😊",
  ]) {
    assert.equal(checkText(text).ok, true, text);
  }
});

test('personal info, links, pictures, other apps, secrets and unkind words are stopped', () => {
  const cases = {
    'call me 054 123 4567': 'phone',
    'my number is 0541234567': 'phone',
    'mail me at mom@mail.com': 'email',
    'add @cool_kid': 'email',
    'look www.games.com': 'link',
    'go to https://x.y': 'link',
    'cool.io is fun': 'link',
    'I live at 12 Oak Street': 'address',
    "what's your address": 'address',
    'add me on snapchat': 'other-app',
    'lets talk on whatsapp': 'other-app',
    "don't tell your mom": 'secret',
    "don't tell anyone ok": 'secret',
    'this is our secret': 'secret',
    'data:image/png;base64,iVBORw0': 'pictures',
    'see cat.png': 'pictures',
    'you are stupid': 'unkind',
  };
  for (const [text, reason] of Object.entries(cases)) {
    const result = checkText(text);
    assert.equal(result.ok, false, text);
    assert.equal(result.reason, reason, text);
    assert.ok(result.message.length > 0);
  }
});

test('empty and too-long messages are stopped', () => {
  assert.equal(checkText('   ').ok, false);
  assert.equal(checkText('a'.repeat(201)).ok, false);
});

test('buddy and group names are checked', () => {
  assert.equal(checkName('Comet').ok, true);
  assert.equal(checkName('Class 2B').ok, true);
  assert.equal(checkName('').ok, false);
  assert.equal(checkName('a'.repeat(21)).ok, false);
  assert.equal(checkName('stupid').ok, false);
  assert.equal(checkName('<script>').ok, false);
});

test('only real voice recordings pass - never pictures or videos', () => {
  assert.deepEqual(detectAudio(fakeMp4('soun')), { mime: 'audio/mp4', ext: 'm4a' });
  assert.equal(detectAudio(fakeMp4('vide')), null, 'video in MP4');
  assert.equal(detectAudio(fakeMp4('pict', 'heic')), null, 'HEIC photo');
  assert.equal(detectAudio(fakeMp4('soun', 'avif')), null, 'AVIF picture');
  assert.deepEqual(detectAudio(fakeWebm()), { mime: 'audio/webm', ext: 'webm' });
  assert.equal(detectAudio(fakeWebm(true)), null, 'WebM video');
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40)]);
  assert.equal(detectAudio(png), null, 'PNG');
  const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(40)]);
  assert.equal(detectAudio(jpeg), null, 'JPEG');
  assert.equal(detectAudio(Buffer.from('hello')), null);
});

test('multipart uploads are read correctly', () => {
  const boundary = 'XyZ';
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="seconds"\r\n\r\n5\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="voice"; filename="v.m4a"\r\nContent-Type: audio/mp4\r\n\r\n`),
    Buffer.from([1, 2, 3, 13, 10, 4]),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  const parts = parseMultipart(body, `multipart/form-data; boundary=${boundary}`);
  assert.equal(parts.length, 2);
  assert.equal(parts[0].value, '5');
  assert.equal(parts[1].filename, 'v.m4a');
  assert.deepEqual([...parts[1].data], [1, 2, 3, 13, 10, 4]);
});

test('friend codes use the same space words as the app', () => {
  // The app shows these words as picture buttons (src/services/friendCode.ts).
  const app = fs.readFileSync(new URL('../../src/services/friendCode.ts', import.meta.url), 'utf8');
  const appWords = [...app.matchAll(/word: '([A-Z]+)'/g)].map(m => m[1]);
  assert.equal(appWords.length, 10);
  for (let i = 0; i < 200; i++) {
    const code = newFriendCode();
    assert.match(code, /^[A-Z]+-\d{4}$/);
    assert.ok(appWords.includes(code.split('-')[0]), `${code} uses a word the app knows`);
  }
});
