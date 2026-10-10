/**
 * pin.test.js
 * --------------------------------------------------------------------------
 * The grown-up PIN (approving in the app instead of waiting for emails),
 * the "turn off Friends" heads-up link, and school passwords.
 *
 * Run with:  npm test
 */
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import { api, Browser, lastMail, linkIn, startServer } from './helpers.js';

let srv;
const kids = {};

/** Turns on Friends in the app with the account password + a grown-up PIN. */
async function connectWithPin(name, parentEmail, pin) {
  const res = await api(srv.base, null, 'POST', '/api/connect', { username: name, parentEmail, password: 'rocket123', pin });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  kids[name] = { token: res.data.token, me: res.data.me, email: parentEmail, pin };
  return res;
}
const grownUp = (name, path = '', body = {}) =>
  api(srv.base, kids[name].token, 'POST', `/api/grownup${path}`, { pin: kids[name].pin, ...body });

before(async () => {
  srv = await startServer();
});
after(async () => {
  await srv.close();
});

describe('grown-up PIN', () => {
  test('Friends is on straight away with a PIN, and the parent gets a heads-up email', async () => {
    const res = await connectWithPin('mia', 'mia.parent@test.local', '2468');
    assert.equal(res.data.me.verified, true);
    assert.equal(res.data.me.hasPin, true);
    const mail = lastMail(srv.store, 'mia.parent@test.local');
    assert.match(mail.subject, /Friends is on for mia/);
    assert.match(mail.text, /\/parent\/disable\?t=/);
    // The PIN is stored only as a hash.
    const kid = srv.store.db.kids[res.data.me.id];
    assert.equal(JSON.stringify(kid).includes('2468'), false);
    await connectWithPin('leo', 'leo.parent@test.local', '1357');
  });

  test('a bad PIN is refused when turning on Friends', async () => {
    const res = await api(srv.base, null, 'POST', '/api/connect', {
      username: 'sam',
      parentEmail: 'sam.parent@test.local',
      password: 'rocket123',
      pin: '12a4',
    });
    assert.equal(res.status, 400);
  });

  test('friends are approved in the app by both grown-ups, then the friend says yes', async () => {
    const sent = await api(srv.base, kids.mia.token, 'POST', '/api/friends/requests', { friendCode: kids.leo.me.friendCode });
    assert.equal(sent.status, 200, JSON.stringify(sent.data));
    let mia = await grownUp('mia');
    assert.equal(mia.status, 200);
    assert.equal(mia.data.waiting.length, 1);
    assert.match(mia.data.waiting[0].text, /mia wants to be friends with leo/);
    // The kids' overview shows the grown-up has something to approve.
    assert.equal((await api(srv.base, kids.leo.token, 'GET', '/api/friends')).data.grownUpWaiting, 1);

    mia = await grownUp('mia', '/decide', { type: 'friend', id: mia.data.waiting[0].id, decision: 'approve' });
    assert.equal(mia.data.waiting.length, 0);
    assert.equal((await api(srv.base, kids.leo.token, 'GET', '/api/friends')).data.incoming.length, 0, 'not before both grown-ups');
    const leo = await grownUp('leo');
    await grownUp('leo', '/decide', { type: 'friend', id: leo.data.waiting[0].id, decision: 'approve' });
    const incoming = (await api(srv.base, kids.leo.token, 'GET', '/api/friends')).data.incoming;
    assert.equal(incoming.length, 1);
    await api(srv.base, kids.leo.token, 'POST', `/api/friends/requests/${incoming[0].id}/accept`);
    assert.equal((await api(srv.base, kids.mia.token, 'GET', '/api/friends')).data.friends.length, 1);
  });

  test('a grown-up can only approve things about their own child', async () => {
    // Sam (another child) sends Mia a request; Leo's grown-up can't approve it.
    await connectWithPin('sam', 'sam.parent@test.local', '9999');
    const sent = await api(srv.base, kids.sam.token, 'POST', '/api/friends/requests', { friendCode: kids.mia.me.friendCode });
    const res = await grownUp('leo', '/decide', { type: 'friend', id: sent.data.request.id, decision: 'approve' });
    assert.equal(res.status, 403);
  });

  test('typed and voice messages are switched on and off with the PIN', async () => {
    const res = await grownUp('mia', '/settings', { freeText: true, voice: true });
    assert.deepEqual(res.data.settings, { freeText: true, voice: true });
    await grownUp('mia', '/settings', { voice: false });
    assert.deepEqual(srv.store.db.kids[kids.mia.me.id].settings, { freeText: true, voice: false });
  });

  test('wrong PINs: a few tries, then a 5-minute wait', async () => {
    const wrong = await api(srv.base, kids.sam.token, 'POST', '/api/grownup', { pin: '0000' });
    assert.equal(wrong.status, 403);
    assert.match(wrong.data.error, /Wrong grown-up PIN. 4 tries left/);
    for (let i = 0; i < 3; i++) {
      await api(srv.base, kids.sam.token, 'POST', '/api/grownup', { pin: '0000' });
    }
    const locked = await api(srv.base, kids.sam.token, 'POST', '/api/grownup', { pin: '0000' });
    assert.equal(locked.status, 429);
    // Even the right PIN has to wait now.
    assert.equal((await grownUp('sam')).status, 429);
    // (Without a PIN at all, nothing works either.)
    assert.equal((await api(srv.base, kids.mia.token, 'POST', '/api/grownup/settings', { voice: true })).status, 403);
  });

  test('turning on Friends again on another phone needs the same PIN', async () => {
    const bad = await api(srv.base, null, 'POST', '/api/connect', {
      username: 'mia',
      parentEmail: 'mia.parent@test.local',
      password: 'rocket123',
      pin: '1111',
    });
    assert.equal(bad.status, 403);
    const good = await api(srv.base, null, 'POST', '/api/connect', {
      username: 'mia',
      parentEmail: 'mia.parent@test.local',
      password: 'rocket123',
      pin: '2468',
    });
    assert.equal(good.status, 200);
  });

  test('the PIN can be changed in the app', async () => {
    await grownUp('leo', '/pin', { newPin: '8642' });
    assert.equal((await grownUp('leo')).status, 403);
    kids.leo.pin = '8642';
    assert.equal((await grownUp('leo')).status, 200);
  });

  test('the grown-up corner opens the parent page without an email', async () => {
    const res = await grownUp('mia', '/parent-page');
    assert.match(res.data.path, /^\/parent\/login\?t=/);
    const parent = new Browser(srv.base);
    const t = new URL(srv.base + res.data.path).searchParams.get('t');
    await parent.post('/parent/login', { t }, { withCsrf: false });
    const dash = await parent.get('/parent');
    assert.match(dash.html, /Parent page/);
    assert.match(dash.html, /mia/);
    // ...and the parent can make a new PIN there (forgot the PIN?).
    await parent.post('/parent/pin', { kidId: kids.mia.me.id, pin: '4321' });
    kids.mia.pin = '4321';
    assert.equal((await grownUp('mia')).status, 200);
  });

  test('"Not OK? Turn off Friends" from the heads-up email', async () => {
    const mail = srv.store.db.outbox.find(m => m.to === 'leo.parent@test.local' && /Friends is on/.test(m.subject));
    const url = /https?:\/\/[^\s"<]+\/parent\/disable\?t=[\w-]+/.exec(mail.text)[0];
    const t = new URL(url).searchParams.get('t');
    const page = await new Browser(srv.base).get(`/parent/disable?t=${t}`);
    assert.match(page.html, /Turn off Friends for leo/);
    await new Browser(srv.base).post('/parent/disable', { t }, { withCsrf: false });
    assert.equal(srv.store.db.kids[kids.leo.me.id].verified, false);
    // The app is logged out of Friends.
    assert.equal((await api(srv.base, kids.leo.token, 'GET', '/api/friends')).status, 401);
  });
});

describe('school log-in without waiting for emails', () => {
  test('adding a school gives its log-in link straight away', async () => {
    const res = await fetch(`${srv.base}/admin/schools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': 'dev-admin-key' },
      body: JSON.stringify({ name: 'Maple School', email: 'office@maple.test', kind: 'school' }),
    });
    const data = await res.json();
    assert.match(data.loginUrl, /\/school\/login\?t=/);
    // The test-mode form shows it on the page too.
    const page = await new Browser(srv.base).post('/dev/admin', { name: 'Rose Kindergarten', email: 'hi@rose.test', kind: 'kindergarten' }, { withCsrf: false });
    assert.match(page.html, /Open the school page/);
    assert.match(page.html, /\/school\/login\?t=/);
  });

  test('a school can set a password and log in with it', async () => {
    const school = new Browser(srv.base);
    const { path, token } = linkIn(lastMail(srv.store, 'office@maple.test'));
    await school.post(path, { t: token }, { withCsrf: false });
    const short = await school.post('/school/password', { password: 'short' });
    assert.equal(short.status, 400);
    await school.post('/school/password', { password: 'maple-garden-7' });

    const wrong = await new Browser(srv.base).post('/school/login-password', { email: 'office@maple.test', password: 'nope-nope' }, { withCsrf: false });
    assert.match(wrong.location, /error=/);
    const fresh = new Browser(srv.base);
    await fresh.post('/school/login-password', { email: 'office@maple.test', password: 'maple-garden-7' }, { withCsrf: false });
    const dash = await fresh.get('/school');
    assert.equal(dash.status, 200);
    assert.match(dash.html, /Maple School/);
  });
});
