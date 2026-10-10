/**
 * The whole Friends story, against a real running server:
 * accounts -> parent OK -> friend request -> both parents + friend OK ->
 * chat rules -> voice -> reports -> what parents may read -> school groups.
 * Run:  npm test   (in the server folder)
 */
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import { createApp } from '../src/app.js';
import { api, Browser, fakeMp4, lastMail, linkIn, startServer, uploadVoice } from './helpers.js';

let srv;
const kids = {}; // name -> { token, me, parent: Browser }

/** Makes a kid account and lets its parent confirm Friends. */
async function makeKid(name, parentEmail, { verify = true } = {}) {
  const res = await api(srv.base, null, 'POST', '/api/connect', { username: name, parentEmail, password: 'rocket123' });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  const parent = new Browser(srv.base);
  kids[name] = { token: res.data.token, me: res.data.me, parent, email: parentEmail };
  if (verify) {
    const { path, token } = linkIn(lastMail(srv.store, parentEmail));
    assert.equal(path, '/parent/verify');
    const page = await parent.get(`${path}?t=${token}`);
    assert.match(page.html, /Turn on Friends for/);
    const done = await parent.post('/parent/verify', { t: token }, { withCsrf: false });
    assert.equal(done.status, 303);
    await parent.get('/parent'); // picks up the csrf value
  }
  return kids[name];
}

before(async () => {
  srv = await startServer();
});
after(async () => {
  await srv.close();
});

describe('accounts', () => {
  test('a new child needs the parent to confirm Friends by email', async () => {
    await makeKid('dina', 'dina.parent@test.local', { verify: false });
    const mail = lastMail(srv.store, 'dina.parent@test.local');
    assert.match(mail.subject, /Turn on Friends for dina/);
    assert.equal(kids.dina.me.verified, false);
    assert.equal(kids.dina.me.settings.freeText, false, 'typed messages start OFF');
    assert.equal(kids.dina.me.settings.voice, false, 'voice starts OFF');
    assert.match(kids.dina.me.friendCode, /^[A-Z]+-\d{4}$/);
    // Not verified -> cannot add friends yet.
    const res = await api(srv.base, kids.dina.token, 'POST', '/api/friends/requests', { friendCode: 'STAR-0000' });
    assert.equal(res.status, 403);
  });

  test('the parent confirms through the email link (a button, not just the link)', async () => {
    const { path, token } = linkIn(lastMail(srv.store, 'dina.parent@test.local'));
    const browser = kids.dina.parent;
    await browser.get(`${path}?t=${token}`);
    // Opening the link alone changes nothing:
    assert.equal(srv.store.db.kids[kids.dina.me.id].verified, false);
    await browser.post('/parent/verify', { t: token }, { withCsrf: false });
    assert.equal(srv.store.db.kids[kids.dina.me.id].verified, true);
    const dash = await browser.get('/parent');
    assert.equal(dash.status, 200);
    assert.match(dash.html, /Parent page/);
    // The link works only once (an old or forwarded email can't be used again):
    const again = await new Browser(srv.base).post('/parent/verify', { t: token }, { withCsrf: false });
    assert.equal(again.status, 400);
    assert.match(again.html, /not valid any more/);
  });

  test('passwords are stored as hashes, and a wrong password is refused', async () => {
    await makeKid('jim', 'jim.parent@test.local');
    const stored = JSON.stringify(srv.store.db.kids);
    assert.equal(stored.includes('rocket123'), false);
    const bad = await api(srv.base, null, 'POST', '/api/connect', { username: 'jim', parentEmail: 'jim.parent@test.local', password: 'wrongpass1' });
    assert.equal(bad.status, 401);
    const again = await api(srv.base, null, 'POST', '/api/connect', { username: 'JIM', parentEmail: 'jim.parent@test.local', password: 'rocket123' });
    assert.equal(again.status, 200, 'log in again works (name is not case-sensitive)');
  });
});

describe('friends need BOTH parents and the friend', () => {
  let requestId;

  test('dina asks with jim\'s friend code; both parents get an email', async () => {
    const res = await api(srv.base, kids.dina.token, 'POST', '/api/friends/requests', { friendCode: kids.jim.me.friendCode.toLowerCase() });
    assert.equal(res.status, 200, JSON.stringify(res.data));
    requestId = res.data.request.id;
    assert.match(lastMail(srv.store, 'dina.parent@test.local').subject, /dina and jim want to be friends/);
    assert.match(lastMail(srv.store, 'jim.parent@test.local').subject, /jim and dina want to be friends/);
    // Unknown code / own code:
    assert.equal((await api(srv.base, kids.dina.token, 'POST', '/api/friends/requests', { friendCode: 'NOPE-1234' })).status, 404);
    assert.equal((await api(srv.base, kids.dina.token, 'POST', '/api/friends/requests', { friendCode: kids.dina.me.friendCode })).status, 400);
  });

  test('jim sees nothing until both parents said yes', async () => {
    let jim = await api(srv.base, kids.jim.token, 'GET', '/api/friends');
    assert.equal(jim.data.incoming.length, 0);
    // Dina's parent approves from the email:
    const { path, token } = linkIn(lastMail(srv.store, 'dina.parent@test.local'));
    await kids.dina.parent.post(path, { t: token, decision: 'approve' }, { withCsrf: false });
    jim = await api(srv.base, kids.jim.token, 'GET', '/api/friends');
    assert.equal(jim.data.incoming.length, 0, 'still waiting for jim\'s parent');
    const dina = await api(srv.base, kids.dina.token, 'GET', '/api/friends');
    assert.equal(dina.data.outgoing[0].stage, 'parents');
    // Jim's parent approves from the parent page:
    await kids.jim.parent.post('/parent/decide', { kidId: kids.jim.me.id, type: 'friend', id: requestId, decision: 'approve' });
    jim = await api(srv.base, kids.jim.token, 'GET', '/api/friends');
    assert.equal(jim.data.incoming.length, 1);
    assert.equal(jim.data.incoming[0].from.username, 'dina');
  });

  test('they are friends only after jim accepts', async () => {
    assert.equal((await api(srv.base, kids.dina.token, 'GET', '/api/chats/friend-' + kids.jim.me.id + '/messages')).status, 403);
    const ok = await api(srv.base, kids.jim.token, 'POST', `/api/friends/requests/${requestId}/accept`);
    assert.equal(ok.status, 200);
    const dina = await api(srv.base, kids.dina.token, 'GET', '/api/friends');
    assert.deepEqual(dina.data.friends.map(f => f.username), ['jim']);
  });

  test('a parent saying no stops a request', async () => {
    await makeKid('sam', 'sam.parent@test.local');
    const res = await api(srv.base, kids.sam.token, 'POST', '/api/friends/requests', { friendCode: kids.dina.me.friendCode });
    const { path, token } = linkIn(lastMail(srv.store, 'dina.parent@test.local'));
    await kids.dina.parent.post(path, { t: token, decision: 'decline' }, { withCsrf: false });
    assert.equal(srv.store.db.requests[res.data.request.id].status, 'declined');
    const dina = await api(srv.base, kids.dina.token, 'GET', '/api/friends');
    assert.equal(dina.data.incoming.length, 0);
  });
});

describe('chat rules', () => {
  const ref = () => `friend-${kids.jim.me.id}`;

  test('phrases and feelings are always allowed', async () => {
    const a = await api(srv.base, kids.dina.token, 'POST', `/api/chats/${ref()}/messages`, { kind: 'phrase', phraseId: 'hi' });
    assert.equal(a.status, 200);
    const b = await api(srv.base, kids.dina.token, 'POST', `/api/chats/${ref()}/messages`, { kind: 'feeling', feelingId: 'happy' });
    assert.equal(b.status, 200);
    const bad = await api(srv.base, kids.dina.token, 'POST', `/api/chats/${ref()}/messages`, { kind: 'phrase', phraseId: 'made-up' });
    assert.equal(bad.status, 400);
  });

  test('pictures (or anything else) can never be sent', async () => {
    for (const kind of ['image', 'photo', 'sticker', 'file']) {
      const res = await api(srv.base, kids.dina.token, 'POST', `/api/chats/${ref()}/messages`, { kind, data: 'iVBORw0KGgo' });
      assert.equal(res.status, 400, kind);
    }
  });

  test('typed messages need BOTH parents to turn them on', async () => {
    const send = () => api(srv.base, kids.dina.token, 'POST', `/api/chats/${ref()}/messages`, { kind: 'text', text: 'Do you like trains?' });
    assert.equal((await send()).status, 403);
    await kids.dina.parent.post('/parent/settings', { kidId: kids.dina.me.id, setting: 'freeText', value: 'on' });
    assert.equal((await send()).status, 403, 'jim\'s parent has not turned it on');
    await kids.jim.parent.post('/parent/settings', { kidId: kids.jim.me.id, setting: 'freeText', value: 'on' });
    const ok = await send();
    assert.equal(ok.status, 200);
    assert.equal(ok.data.message.text, 'Do you like trains?');
  });

  test('the safety filter stops personal info, and the parent can see it', async () => {
    const res = await api(srv.base, kids.dina.token, 'POST', `/api/chats/${ref()}/messages`, { kind: 'text', text: 'my number is 054 123 4567' });
    assert.equal(res.data.stopped, true);
    assert.equal(res.data.reason, 'phone');
    const dash = await kids.dina.parent.get('/parent');
    assert.match(dash.html, /my number is 054 123 4567/);
  });

  test('a parent can turn typed messages off at any time - then they are hidden', async () => {
    await kids.jim.parent.post('/parent/settings', { kidId: kids.jim.me.id, setting: 'freeText', value: 'off' });
    const jim = await api(srv.base, kids.jim.token, 'GET', `/api/chats/friend-${kids.dina.me.id}/messages`);
    const typed = jim.data.messages.filter(m => m.kind === 'hidden');
    assert.equal(typed.length, 1);
    assert.equal(typed[0].hiddenKind, 'text');
    assert.equal(typed[0].text, undefined, 'the words are not sent to the app');
    assert.equal(jim.data.allowed.freeText, false);
    // Phrases still show:
    assert.ok(jim.data.messages.some(m => m.kind === 'phrase' && m.phraseId === 'hi'));
  });

  test('voice messages: off by default, on with both parents, audio only', async () => {
    let res = await uploadVoice(srv.base, kids.dina.token, ref(), fakeMp4());
    assert.equal(res.status, 403);
    await kids.dina.parent.post('/parent/settings', { kidId: kids.dina.me.id, setting: 'voice', value: 'on' });
    await kids.jim.parent.post('/parent/settings', { kidId: kids.jim.me.id, setting: 'voice', value: 'on' });
    res = await uploadVoice(srv.base, kids.dina.token, ref(), fakeMp4());
    assert.equal(res.status, 200, JSON.stringify(res.data));
    assert.equal(res.data.message.kind, 'voice');
    // Jim can listen:
    const listen = await fetch(`${srv.base}/api/voice/${res.data.message.id}`, { headers: { Authorization: `Bearer ${kids.jim.token}` } });
    assert.equal(listen.status, 200);
    assert.equal(listen.headers.get('content-type'), 'audio/mp4');
    // Sam (not in this chat) cannot:
    const sam = await fetch(`${srv.base}/api/voice/${res.data.message.id}`, { headers: { Authorization: `Bearer ${kids.sam.token}` } });
    assert.equal(sam.status, 404);
    // A picture or a video pretending to be voice is refused:
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);
    assert.equal((await uploadVoice(srv.base, kids.dina.token, ref(), png, 'audio/mp4')).status, 400);
    assert.equal((await uploadVoice(srv.base, kids.dina.token, ref(), fakeMp4('vide'))).status, 400);
  });

  test('"Tell my grown-up" flags the message and emails the parent', async () => {
    const msgs = await api(srv.base, kids.jim.token, 'GET', `/api/chats/friend-${kids.dina.me.id}/messages`);
    const phrase = msgs.data.messages.find(m => m.kind === 'phrase');
    const res = await api(srv.base, kids.jim.token, 'POST', `/api/messages/${phrase.id}/report`);
    assert.equal(res.status, 200);
    assert.match(lastMail(srv.store, 'jim.parent@test.local').subject, /jim pressed "Tell my grown-up"/);
    // Sam cannot report a message from a chat he is not in:
    assert.equal((await api(srv.base, kids.sam.token, 'POST', `/api/messages/${phrase.id}/report`)).status, 404);
  });

  test('a child can chat with their own parent', async () => {
    await api(srv.base, kids.dina.token, 'POST', '/api/chats/parent/messages', { kind: 'feeling', feelingId: 'tired' });
    await kids.dina.parent.post('/parent/message', { kidId: kids.dina.me.id, text: 'Time for a rest, sweetie 💜' });
    const res = await api(srv.base, kids.dina.token, 'GET', '/api/chats/parent/messages');
    assert.deepEqual(
      res.data.messages.map(m => m.kind),
      ['feeling', 'text'],
    );
    assert.equal(res.data.messages[1].from.name, 'My grown-up');
  });
});

describe('parents can only read their OWN child\'s chats', () => {
  test('dina\'s parent can read dina & jim\'s chat', async () => {
    const [a, b] = [kids.dina.me.id, kids.jim.me.id].sort((x, y) => x - y);
    const page = await kids.dina.parent.get(`/parent/chat?kid=${kids.dina.me.id}&c=d:${a}:${b}`);
    assert.equal(page.status, 200);
    assert.match(page.html, /Do you like trains\?/);
  });

  test('but not another child\'s chats', async () => {
    const [a, b] = [kids.dina.me.id, kids.jim.me.id].sort((x, y) => x - y);
    // Pretending to be jim's parent:
    assert.equal((await kids.dina.parent.get(`/parent/chat?kid=${kids.jim.me.id}&c=d:${a}:${b}`)).status, 403);
    // A chat dina is not in:
    assert.equal((await kids.dina.parent.get(`/parent/chat?kid=${kids.dina.me.id}&c=p:${kids.sam.me.id}`)).status, 403);
    // Settings of someone else's child:
    const r = await kids.dina.parent.post('/parent/settings', { kidId: kids.sam.me.id, setting: 'freeText', value: 'on' });
    assert.equal(r.status, 403);
    assert.equal(srv.store.db.kids[kids.sam.me.id].settings.freeText, false);
  });

  test('forms without the csrf value are refused', async () => {
    const r = await kids.dina.parent.post('/parent/settings', { kidId: kids.dina.me.id, setting: 'voice', value: 'off' }, { withCsrf: false });
    assert.equal(r.status, 403);
  });

  test('a stranger without a login is sent to the login page', async () => {
    const stranger = new Browser(srv.base);
    const r = await stranger.get('/parent');
    assert.equal(r.status, 303);
    assert.equal(r.location, '/parent/login-request');
  });
});

describe('groups: ONLY schools can make them', () => {
  const school = new Browser('');
  let groupId;

  test('kids and parents have no way to make a group', async () => {
    assert.equal((await api(srv.base, kids.dina.token, 'POST', '/api/groups', { name: 'My gang' })).status, 404);
    const parentTry = await kids.dina.parent.post('/school/groups', { name: 'Parents group' });
    assert.equal(parentTry.status, 303);
    assert.equal(parentTry.location, '/school/login-request');
    assert.equal(Object.keys(srv.store.db.groups).length, 0);
  });

  test('only the app owner can add a school (admin key)', async () => {
    const bad = await fetch(`${srv.base}/admin/schools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': 'guess' },
      body: JSON.stringify({ name: 'Fake School', email: 'fake@test.local' }),
    });
    assert.equal(bad.status, 403);
    const ok = await fetch(`${srv.base}/admin/schools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': 'dev-admin-key' },
      body: JSON.stringify({ name: 'Sunflower Kindergarten', email: 'teacher@sunflower.test', kind: 'kindergarten' }),
    });
    assert.equal(ok.status, 200);
    assert.match(lastMail(srv.store, 'teacher@sunflower.test').subject, /school page/);
  });

  test('the school logs in and makes a group', async () => {
    school.base = srv.base;
    const { path, token } = linkIn(lastMail(srv.store, 'teacher@sunflower.test'));
    await school.get(`${path}?t=${token}`);
    await school.post('/school/login', { t: token }, { withCsrf: false });
    const dash = await school.get('/school');
    assert.match(dash.html, /Sunflower Kindergarten/);
    await school.post('/school/groups', { name: 'Class 2B' });
    groupId = Object.values(srv.store.db.groups)[0].id;
    assert.equal(srv.store.db.groups[groupId].name, 'Class 2B');
  });

  test('a child joins only after their parent approves', async () => {
    await school.post(`/school/groups/${groupId}/invite`, { friendCode: kids.dina.me.friendCode });
    assert.match(lastMail(srv.store, 'dina.parent@test.local').subject, /Sunflower Kindergarten invited dina/);
    assert.equal((await api(srv.base, kids.dina.token, 'GET', `/api/chats/group-${groupId}/messages`)).status, 403);
    const { path, token } = linkIn(lastMail(srv.store, 'dina.parent@test.local'));
    await kids.dina.parent.post(path, { t: token, decision: 'approve' }, { withCsrf: false });
    const friends = await api(srv.base, kids.dina.token, 'GET', '/api/friends');
    assert.deepEqual(friends.data.groups.map(g => g.name), ['Class 2B']);
    // Jim's parent says no:
    await school.post(`/school/groups/${groupId}/invite`, { friendCode: kids.jim.me.friendCode });
    const jimLink = linkIn(lastMail(srv.store, 'jim.parent@test.local'));
    await kids.jim.parent.post(jimLink.path, { t: jimLink.token, decision: 'decline' }, { withCsrf: false });
    assert.equal((await api(srv.base, kids.jim.token, 'GET', `/api/chats/group-${groupId}/messages`)).status, 403);
    // Sam joins (his parent never turned on typed messages):
    await school.post(`/school/groups/${groupId}/invite`, { friendCode: kids.sam.me.friendCode });
    const samLink = linkIn(lastMail(srv.store, 'sam.parent@test.local'));
    await kids.sam.parent.post(samLink.path, { t: samLink.token, decision: 'approve' }, { withCsrf: false });
  });

  test('group chat: teacher messages always show; typed messages follow each parent', async () => {
    const g = await school.get(`/school/group?id=${groupId}`);
    assert.equal(g.status, 200);
    await school.post('/school/group/message', { groupId, text: 'Good morning, Class 2B! ☀️' });
    // Dina's parent allows typed messages -> dina can type in the group.
    const typed = await api(srv.base, kids.dina.token, 'POST', `/api/chats/group-${groupId}/messages`, { kind: 'text', text: 'Good morning!' });
    assert.equal(typed.status, 200);
    // Sam's parent did not -> sam sees the teacher, but dina's typed words are hidden.
    const sam = await api(srv.base, kids.sam.token, 'GET', `/api/chats/group-${groupId}/messages`);
    const teacher = sam.data.messages.find(m => m.from.type === 'school');
    assert.equal(teacher.text, 'Good morning, Class 2B! ☀️');
    assert.equal(teacher.from.name, 'Sunflower Kindergarten');
    assert.equal(sam.data.messages.find(m => m.from.type === 'kid' && m.from.id === kids.dina.me.id).kind, 'hidden');
    // ...and sam cannot type:
    assert.equal((await api(srv.base, kids.sam.token, 'POST', `/api/chats/group-${groupId}/messages`, { kind: 'text', text: 'hi' })).status, 403);
  });

  test('parents can read the group only if their child is in it', async () => {
    assert.equal((await kids.dina.parent.get(`/parent/chat?kid=${kids.dina.me.id}&c=g:${groupId}`)).status, 200);
    assert.equal((await kids.jim.parent.get(`/parent/chat?kid=${kids.jim.me.id}&c=g:${groupId}`)).status, 403);
  });

  test('a parent can take their child out of a group', async () => {
    await kids.sam.parent.post('/parent/remove-group', { kidId: kids.sam.me.id, groupId });
    assert.equal((await api(srv.base, kids.sam.token, 'GET', `/api/chats/group-${groupId}/messages`)).status, 403);
  });

  test('a school only sees its own groups', async () => {
    const other = await fetch(`${srv.base}/admin/schools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': 'dev-admin-key' },
      body: JSON.stringify({ name: 'Oak School', email: 'office@oak.test', kind: 'school' }),
    });
    assert.equal(other.status, 200);
    const oak = new Browser(srv.base);
    const { path, token } = linkIn(lastMail(srv.store, 'office@oak.test'));
    await oak.get(`${path}?t=${token}`);
    await oak.post('/school/login', { t: token }, { withCsrf: false });
    assert.equal((await oak.get(`/school/group?id=${groupId}`)).status, 404);
    const dash = await oak.get('/school');
    assert.match(dash.html, /Oak School/);
    assert.equal(dash.html.includes(`/school/group?id=${groupId}`), false, 'no link to the other school\'s group');
    // ...and it cannot invite into it or post in it:
    await oak.post(`/school/groups/${groupId}/invite`, { friendCode: kids.jim.me.friendCode });
    await oak.post('/school/group/message', { groupId, text: 'Hello from Oak' });
    assert.equal(srv.store.db.messages.some(m => m.text === 'Hello from Oak'), false);
  });
});

describe('avatars and saving', () => {
  test('the avatar, space buddy and feeling are checked and shared with friends', async () => {
    // Fun skin colours (green, blue...) are allowed on purpose.
    const look = { hair: 'buns', hairColor: 'purple', skin: 'funGreen', outfit: 'spacesuit', accessories: ['catEars', 'glasses'] };
    const pet = { kind: 'alien', name: 'Zib Jr.', style: 'threeEyes', color: 'green', mood: 'silly', accessories: ['spaceHelmet'] };
    const res = await api(srv.base, kids.dina.token, 'PUT', '/api/me/profile', { look, pet });
    assert.equal(res.status, 200, JSON.stringify(res.data));
    await api(srv.base, kids.dina.token, 'PUT', '/api/me/feeling', { feeling: 'excited' });
    const jim = await api(srv.base, kids.jim.token, 'GET', '/api/friends');
    const dina = jim.data.friends[0];
    assert.equal(dina.look.hair, 'buns');
    assert.deepEqual(dina.look.accessories, ['catEars', 'glasses']);
    assert.equal(dina.look.skin, 'funGreen');
    assert.equal(dina.pet.kind, 'alien');
    assert.equal(dina.pet.mood, 'silly');
    assert.equal(dina.feeling, 'excited');
    // Unknown parts and bad buddy names are refused:
    assert.equal((await api(srv.base, kids.dina.token, 'PUT', '/api/me/profile', { look: { ...look, hair: 'mohawk' } })).status, 400);
    assert.equal((await api(srv.base, kids.dina.token, 'PUT', '/api/me/profile', { pet: { ...pet, name: 'call 0541234567' } })).status, 400);
    assert.equal((await api(srv.base, kids.dina.token, 'PUT', '/api/me/profile', { pet: { ...pet, mood: 'evil' } })).status, 400);
    // An older app that sends no face gets the default smile:
    const { mood: _unused, ...oldPet } = pet;
    await api(srv.base, kids.dina.token, 'PUT', '/api/me/profile', { pet: oldPet });
    assert.equal(srv.store.db.kids[kids.dina.me.id].pet.mood, 'happy');
    assert.equal((await api(srv.base, kids.dina.token, 'PUT', '/api/me/feeling', { feeling: 'grumpy-ish' })).status, 400);
  });

  test('the weekly check-up (homework, streak, tests) shows on the parent page', async () => {
    const progress = {
      weeklyGoal: 3,
      streak: 4,
      weeks: [
        { start: '2026-10-05', missions: 2, goal: 3 },
        { start: '2026-09-28', missions: 3, goal: 3 },
      ],
      tests: [{ at: '2026-10-07T10:00:00.000Z', score: 8, total: 10 }],
      candiesEarned: 120,
    };
    const res = await api(srv.base, kids.dina.token, 'PUT', '/api/me/progress', progress);
    assert.equal(res.status, 200, JSON.stringify(res.data));
    const dash = await kids.dina.parent.get('/parent');
    assert.match(dash.html, /Weekly check-up/);
    assert.match(dash.html, /This week:<\/b> 2 of 3 missions/);
    assert.match(dash.html, /Streak:<\/b> 4 weeks in a row/);
    assert.match(dash.html, /Last Feelings Test:<\/b> 8 of 10/);
    assert.match(dash.html, /Week of Sep 28: 3 of 3/);
    // Nonsense is refused:
    for (const bad of [
      { ...progress, weeklyGoal: 0 },
      { ...progress, weeks: Array(9).fill(progress.weeks[0]) },
      { ...progress, tests: [{ at: 'yesterday', score: 1, total: 2 }] },
      { ...progress, tests: [{ at: progress.tests[0].at, score: 11, total: 10 }] },
      { ...progress, weeks: [{ start: '<script>', missions: 1, goal: 1 }] },
    ]) {
      assert.equal((await api(srv.base, kids.dina.token, 'PUT', '/api/me/progress', bad)).status, 400);
    }
  });

  test('everything is still there after a restart', async () => {
    const again = createApp({ port: 0, dataDir: srv.dataDir, resendApiKey: '' });
    assert.equal(Object.keys(again.store.db.kids).length, 3);
    assert.equal(again.store.db.friendships.length, 1);
    assert.ok(again.store.db.messages.length > 5);
  });
});
