/**
 * buddy.test.js
 * --------------------------------------------------------------------------
 * Space buddy worry alerts: when a child tells their space buddy something
 * worrying, that ONE message reaches ONLY the child's parent and the
 * school(s) of the child's groups. Emails never contain the child's words.
 *
 * Run with:  npm test
 */
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import { api, Browser, lastMail, linkIn, startServer } from './helpers.js';

let srv;
const kids = {};

async function connect(name, parentEmail, pin) {
  const res = await api(srv.base, null, 'POST', '/api/connect', { username: name, parentEmail, password: 'rocket123', pin });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  kids[name] = { token: res.data.token, me: res.data.me, email: parentEmail, pin };
}
const alert = (name, body) => api(srv.base, kids[name].token, 'POST', '/api/buddy/alert', body);
const WORDS = 'my brother hits me every day';

/** A parent browser, logged in with a link from the Grown-up corner. */
async function parentPage(name) {
  const res = await api(srv.base, kids[name].token, 'POST', '/api/grownup/parent-page', { pin: kids[name].pin });
  const t = new URL(srv.base + res.data.path).searchParams.get('t');
  const parent = new Browser(srv.base);
  await parent.post('/parent/login', { t }, { withCsrf: false });
  return parent;
}

before(async () => {
  srv = await startServer();
  await connect('mia', 'mia.parent@test.local', '2468');
  await connect('leo', 'leo.parent@test.local', '1357');
  // A school with a group; Mia joins it (her parent approves with the PIN).
  const res = await fetch(`${srv.base}/admin/schools`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': 'dev-admin-key' },
    body: JSON.stringify({ name: 'Maple School', email: 'office@maple.test', kind: 'school' }),
  });
  assert.equal(res.status, 200);
  const school = new Browser(srv.base);
  const { path, token } = linkIn(lastMail(srv.store, 'office@maple.test'));
  await school.post(path, { t: token }, { withCsrf: false });
  await school.get('/school');
  await school.post('/school/groups', { name: 'Class 2B' });
  const groupId = Object.values(srv.store.db.groups)[0].id;
  await school.post(`/school/groups/${groupId}/invite`, { friendCode: kids.mia.me.friendCode });
  await api(srv.base, kids.mia.token, 'POST', '/api/grownup/decide', { pin: '2468', type: 'group', id: groupId, decision: 'approve' });
  kids.school = school;
});
after(async () => {
  await srv.close();
});

describe('space buddy worry alerts', () => {
  test('a worrying message reaches the parent and the school, and the emails do not contain it', async () => {
    const res = await alert('mia', { category: 'hurt', text: WORDS });
    assert.equal(res.status, 200, JSON.stringify(res.data));
    assert.deepEqual(res.data.told, { parent: true, schools: ['Maple School'] });

    const toParent = lastMail(srv.store, 'mia.parent@test.local');
    assert.match(toParent.subject, /Please check in with mia/);
    const toSchool = lastMail(srv.store, 'office@maple.test');
    assert.match(toSchool.subject, /needs a grown-up/);
    for (const mail of [toParent, toSchool]) {
      assert.equal(mail.text.includes('brother'), false, 'the child\'s words are never in an email');
      assert.equal(mail.html.includes('brother'), false);
      assert.equal(mail.text.includes('hurting'), false, 'not even the kind of worry');
    }
  });

  test('the parent reads it in the Grown-up corner (with the PIN) and on the parent page', async () => {
    const corner = await api(srv.base, kids.mia.token, 'POST', '/api/grownup', { pin: '2468' });
    assert.equal(corner.data.alerts.length, 1);
    assert.equal(corner.data.alerts[0].text, WORDS);
    assert.equal(corner.data.alerts[0].title, 'Someone is hurting them');
    assert.equal(corner.data.alerts[0].seen, false);

    const parent = await parentPage('mia');
    const page = await parent.get('/parent');
    assert.match(page.html, /Worrying things mia told the space buddy/);
    assert.match(page.html, new RegExp(WORDS));
    assert.match(page.html, /Maple School/);
    await parent.post('/parent/alert-seen', { kidId: kids.mia.me.id, alertId: corner.data.alerts[0].id });
    const again = await api(srv.base, kids.mia.token, 'POST', '/api/grownup', { pin: '2468' });
    assert.equal(again.data.alerts[0].seen, true);
  });

  test('the school sees it on the school page and can mark it as seen', async () => {
    const page = await kids.school.get('/school');
    assert.match(page.html, /Children who need a grown-up/);
    assert.match(page.html, new RegExp(WORDS));
    assert.match(page.html, /Class 2B/);
    const id = srv.store.db.buddyAlerts[0].id;
    await kids.school.post('/school/alert-seen', { alertId: id });
    assert.deepEqual(srv.store.db.buddyAlerts[0].schoolSeen, [srv.store.db.buddyAlerts[0].schoolIds[0]]);
  });

  test('nobody else can see it: not another child, another parent, another school or the Grown-up corner without the PIN', async () => {
    const leoCorner = await api(srv.base, kids.leo.token, 'POST', '/api/grownup', { pin: '1357' });
    assert.equal(leoCorner.data.alerts.length, 0);
    const leoParent = await parentPage('leo');
    assert.equal((await leoParent.get('/parent')).html.includes('brother'), false);
    assert.equal((await api(srv.base, kids.mia.token, 'POST', '/api/grownup', { pin: '0000' })).status, 403);
    // The kids' API never shows alerts.
    const overview = await api(srv.base, kids.mia.token, 'GET', '/api/friends');
    assert.equal(JSON.stringify(overview.data).includes('brother'), false);
    // Another school.
    await fetch(`${srv.base}/admin/schools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': 'dev-admin-key' },
      body: JSON.stringify({ name: 'Oak School', email: 'office@oak.test', kind: 'school' }),
    });
    const oak = new Browser(srv.base);
    const { path, token } = linkIn(lastMail(srv.store, 'office@oak.test'));
    await oak.post(path, { t: token }, { withCsrf: false });
    const oakPage = await oak.get('/school');
    assert.equal(oakPage.html.includes('brother'), false);
    assert.equal((await oak.post('/school/alert-seen', { alertId: srv.store.db.buddyAlerts[0].id })).status, 404);
  });

  test('a child without a school group: only the parent is told', async () => {
    const res = await alert('leo', { category: 'bullied', text: 'kids laugh at me' });
    assert.deepEqual(res.data.told, { parent: true, schools: [] });
  });

  test('only known kinds of worry, short messages, and not too many', async () => {
    assert.equal((await alert('leo', { category: 'gossip', text: 'hello' })).status, 400);
    assert.equal((await alert('leo', { category: 'hurt', text: '   ' })).status, 400);
    await alert('leo', { category: 'hurt', text: 'x'.repeat(1000) });
    assert.equal(srv.store.db.buddyAlerts.at(-1).text.length, 300);
    for (let i = 0; i < 7; i++) {
      await alert('leo', { category: 'sadSelf', text: `nobody likes me ${i}` });
    }
    // 1 + 1 + 7 = 9 this hour for Leo; the 10th is fine, the 11th waits.
    assert.equal((await alert('leo', { category: 'sadSelf', text: 'ten' })).status, 200);
    assert.equal((await alert('leo', { category: 'sadSelf', text: 'eleven' })).status, 429);
  });

  test('without a login token nothing can be sent', async () => {
    assert.equal((await api(srv.base, null, 'POST', '/api/buddy/alert', { category: 'hurt', text: 'x' })).status, 401);
  });

  test('every kind of worry in buddy.json is known to the server', async () => {
    const fs = await import('node:fs');
    const buddy = JSON.parse(fs.readFileSync(new URL('../../src/data/buddy.json', import.meta.url)));
    for (const rule of buddy.safety) {
      assert.equal(srv.ctx.content.alertTitle(rule.id), rule.title);
    }
  });
});
