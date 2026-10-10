/**
 * routes/api.js
 * --------------------------------------------------------------------------
 * What the kids' app can ask the server (JSON). Every request except
 * /api/connect needs the header  Authorization: Bearer <token>.
 *
 *  POST   /api/connect                    turn on Friends / log in again
 *  GET    /api/me                         my account (friend code, settings...)
 *  POST   /api/me/resend-verification     email my parent again
 *  PUT    /api/me/profile                 save my avatar + space buddy
 *  PUT    /api/me/feeling                 save how I feel right now
 *  PUT    /api/me/progress                weekly homework + tests (for the parent page)
 *  POST   /api/parent-link                email my parent a link to the parent page
 *  GET    /api/friends                    friends, groups, requests, unread counts
 *  POST   /api/friends/requests           ask to be friends (friend code)
 *  POST   /api/friends/requests/:id/:action   accept / decline / cancel
 *  DELETE /api/friends/:id                stop being friends
 *  POST   /api/groups/:id/leave           leave a group
 *  GET    /api/chats/:ref/messages        read a chat (ref = parent | friend-ID | group-ID)
 *  POST   /api/chats/:ref/messages        send a phrase / feeling / typed message
 *  POST   /api/chats/:ref/voice           send a voice message (multipart, field "voice")
 *  GET    /api/voice/:id                  listen to a voice message
 *  POST   /api/messages/:id/report        "Tell my grown-up"
 *  POST   /api/buddy/alert                the space buddy heard something worrying:
 *                                         ONE message, for the parent + the child's
 *                                         school(s) only (normal buddy chats never come here)
 *
 *  Grown-up corner (each request carries the grown-up PIN in its body):
 *  POST   /api/grownup                    what is waiting + settings
 *  POST   /api/grownup/decide             approve / decline a friend or group
 *  POST   /api/grownup/settings           typed / voice messages on or off
 *  POST   /api/grownup/pin                change the PIN
 *  POST   /api/grownup/parent-page        a one-time link to the parent page
 *  POST   /api/grownup/alert-seen         a space buddy worry was talked about
 */
import fs from 'node:fs';

import {
  buddyAlertParentEmail,
  buddyAlertSchoolEmail,
  friendRequestEmail,
  friendsOnEmail,
  parentLoginEmail,
  reportEmail,
  verifyEmail,
} from '../emails.js';
import { detectAudio, HttpError, parseMultipart, readBody, readJson, sendJson } from '../http.js';

export default function registerApi(router, ctx) {
  const { service, store, mailer, config, limits } = ctx;

  /** Emails the parent the "Turn on Friends?" link. */
  async function sendVerify(kid) {
    const token = service.makeLink({ type: 'verify', kidId: kid.id });
    await mailer.send({ to: kid.parentEmail, ...verifyEmail(kid, ctx.url('/parent/verify', token)) });
  }

  /** A link that logs the parent in to the parent page. */
  function parentLoginUrl(email) {
    return ctx.url('/parent/login', service.makeLink({ type: 'parentLogin', email }));
  }

  router.add('POST', '/api/connect', async (req, res) => {
    if (!limits.connect.allow(ctx.ip(req))) {
      throw new HttpError(429, 'Too many tries. Please wait a few minutes.');
    }
    const body = await readJson(req);
    const { kid, token, isNew, verifiedNow } = service.connect(body);
    if (verifiedNow) {
      // Turned on in the app with the grown-up PIN: just a heads-up email.
      const turnOff = ctx.url('/parent/disable', service.makeLink({ type: 'disable', kidId: kid.id }));
      await mailer.send({ to: kid.parentEmail, ...friendsOnEmail(kid, parentLoginUrl(kid.parentEmail), turnOff) });
    } else if (isNew) {
      await sendVerify(kid);
    }
    sendJson(res, 200, { token, me: service.selfKid(kid) });
  });

  router.add('GET', '/api/me', (req, res) => {
    sendJson(res, 200, { me: service.selfKid(ctx.kidFromRequest(req)) });
  });

  router.add('POST', '/api/me/resend-verification', async (req, res) => {
    const kid = ctx.kidFromRequest(req);
    if (!kid.verified) {
      if (!limits.email.allow(`kid:${kid.id}`)) {
        throw new HttpError(429, 'We sent a few emails already. Please check the inbox (and the spam folder).');
      }
      await sendVerify(kid);
    }
    sendJson(res, 200, { ok: true });
  });

  router.add('PUT', '/api/me/profile', async (req, res) => {
    const kid = ctx.kidFromRequest(req);
    service.setProfile(kid, await readJson(req));
    sendJson(res, 200, { me: service.selfKid(kid) });
  });

  router.add('PUT', '/api/me/feeling', async (req, res) => {
    const kid = ctx.kidFromRequest(req);
    const { feeling } = await readJson(req);
    service.setFeeling(kid, feeling ?? null);
    sendJson(res, 200, { me: service.selfKid(kid) });
  });

  router.add('PUT', '/api/me/progress', async (req, res) => {
    const kid = ctx.kidFromRequest(req);
    service.setProgress(kid, await readJson(req));
    sendJson(res, 200, { ok: true });
  });

  router.add('POST', '/api/parent-link', async (req, res) => {
    const kid = ctx.kidFromRequest(req);
    if (!limits.email.allow(`kid:${kid.id}`)) {
      throw new HttpError(429, 'We sent a few emails already. Please check the inbox (and the spam folder).');
    }
    await mailer.send({ to: kid.parentEmail, ...parentLoginEmail(parentLoginUrl(kid.parentEmail)) });
    sendJson(res, 200, { ok: true });
  });

  // ------------------------------------------------------------------ friends

  // ------------------------------------------------------- grown-up corner

  /** Every grown-up request carries the PIN; it is checked first. */
  async function grownUp(req) {
    const kid = ctx.kidFromRequest(req);
    const body = await readJson(req);
    service.checkPin(kid, body.pin);
    return { kid, body };
  }
  const grownUpView = kid => ({
    waiting: service.waitingFor(kid),
    settings: kid.settings,
    verified: kid.verified,
    // Worrying things the child told their space buddy (newest first).
    alerts: service.alertsOfKid(kid).slice(0, 10).map(a => service.alertOut(a)),
  });

  router.add('POST', '/api/grownup', async (req, res) => {
    const { kid } = await grownUp(req);
    sendJson(res, 200, grownUpView(kid));
  });

  router.add('POST', '/api/grownup/decide', async (req, res) => {
    const { kid, body } = await grownUp(req);
    service.grownUpDecide(kid, body.type, body.id, body.decision === 'approve');
    sendJson(res, 200, grownUpView(kid));
  });

  router.add('POST', '/api/grownup/settings', async (req, res) => {
    const { kid, body } = await grownUp(req);
    service.setSettings(kid, body);
    sendJson(res, 200, grownUpView(kid));
  });

  router.add('POST', '/api/grownup/pin', async (req, res) => {
    const { kid, body } = await grownUp(req);
    service.setPin(kid, body.newPin);
    sendJson(res, 200, { ok: true });
  });

  router.add('POST', '/api/grownup/parent-page', async (req, res) => {
    const { kid } = await grownUp(req);
    const token = service.makeLink({ type: 'parentLogin', email: kid.parentEmail });
    // The app adds its own server address (an emulator uses 10.0.2.2).
    sendJson(res, 200, { path: `/parent/login?t=${token}` });
  });

  router.add('POST', '/api/grownup/alert-seen', async (req, res) => {
    const { kid, body } = await grownUp(req);
    service.parentSawAlert(kid, body.id);
    sendJson(res, 200, grownUpView(kid));
  });

  router.add('GET', '/api/friends', (req, res) => {
    const kid = ctx.kidFromRequest(req);
    const pairKey = otherId => `d:${Math.min(kid.id, otherId)}:${Math.max(kid.id, otherId)}`;
    const requests = Object.values(store.db.requests).filter(r => r.status === 'pending');
    sendJson(res, 200, {
      me: service.selfKid(kid),
      parent: { unread: service.unread(kid, `p:${kid.id}`) },
      // Things waiting for this child's grown-up (shown on the Grown-up corner button).
      grownUpWaiting: service.waitingFor(kid).length,
      friends: service.friendsOf(kid.id).map(f => ({
        ...service.publicKid(f),
        unread: service.unread(kid, pairKey(f.id)),
      })),
      groups: service.groupsOf(kid.id).map(g => ({
        id: g.id,
        name: g.name,
        school: store.db.schools[g.schoolId]?.name ?? '',
        unread: service.unread(kid, `g:${g.id}`),
        members: service.activeMembers(g.id).map(m => service.publicKid(m)),
      })),
      // Children only see a request after BOTH parents said yes.
      incoming: requests
        .filter(r => r.toKid === kid.id && r.parentFrom === 'approved' && r.parentTo === 'approved')
        .map(r => ({ id: r.id, from: service.publicKid(service.kid(r.fromKid)) })),
      outgoing: requests
        .filter(r => r.fromKid === kid.id)
        .map(r => ({
          id: r.id,
          to: { username: service.kid(r.toKid).username },
          stage: r.parentFrom === 'approved' && r.parentTo === 'approved' ? 'friend' : 'parents',
        })),
    });
  });

  router.add('POST', '/api/friends/requests', async (req, res) => {
    const kid = ctx.kidFromRequest(req);
    const { friendCode } = await readJson(req);
    const { request, other } = service.requestFriend(kid, friendCode);
    // BOTH parents get an email.
    const fromToken = service.makeLink({ type: 'friend', requestId: request.id, side: 'from' });
    const toToken = service.makeLink({ type: 'friend', requestId: request.id, side: 'to' });
    await mailer.send({ to: kid.parentEmail, ...friendRequestEmail(kid, other, ctx.url('/parent/friend', fromToken)) });
    await mailer.send({ to: other.parentEmail, ...friendRequestEmail(other, kid, ctx.url('/parent/friend', toToken)) });
    sendJson(res, 200, { request: { id: request.id, to: { username: other.username }, stage: 'parents' } });
  });

  router.add('POST', '/api/friends/requests/:id/:action', (req, res, { params }) => {
    const kid = ctx.kidFromRequest(req);
    const id = Number(params.id);
    if (params.action === 'accept' || params.action === 'decline') {
      service.kidDecideFriend(kid, id, params.action === 'accept');
    } else if (params.action === 'cancel') {
      service.cancelRequest(kid, id);
    } else {
      throw new HttpError(404, 'Unknown action.');
    }
    sendJson(res, 200, { ok: true });
  });

  router.add('DELETE', '/api/friends/:id', (req, res, { params }) => {
    const kid = ctx.kidFromRequest(req);
    service.removeFriend(kid.id, Number(params.id));
    sendJson(res, 200, { ok: true });
  });

  router.add('POST', '/api/groups/:id/leave', (req, res, { params }) => {
    const kid = ctx.kidFromRequest(req);
    service.removeFromGroup(Number(params.id), kid.id);
    sendJson(res, 200, { ok: true });
  });

  // -------------------------------------------------------------------- chats

  router.add('GET', '/api/chats/:ref/messages', (req, res, { params, query }) => {
    const kid = ctx.kidFromRequest(req);
    const convo = service.kidConversation(kid, params.ref);
    const after = Number(query.get('after') ?? 0);
    const messages = service.messagesForKid(kid, convo, after);
    service.markRead(kid, convo.key);
    sendJson(res, 200, {
      messages,
      allowed: service.allowedFor(kid, convo),
      members:
        convo.type === 'group' ? service.activeMembers(convo.group.id).map(m => service.publicKid(m)) : undefined,
    });
  });

  router.add('POST', '/api/chats/:ref/messages', async (req, res, { params }) => {
    const kid = ctx.kidFromRequest(req);
    const convo = service.kidConversation(kid, params.ref);
    const result = service.sendMessage(kid, convo, await readJson(req));
    if (result.stopped) {
      sendJson(res, 200, { stopped: true, reason: result.reason, message: result.message });
      return;
    }
    sendJson(res, 200, { message: service.messageOut(result.message) });
  });

  router.add('POST', '/api/chats/:ref/voice', async (req, res, { params }) => {
    const kid = ctx.kidFromRequest(req);
    const convo = service.kidConversation(kid, params.ref);
    const body = await readBody(req, config.maxVoiceBytes + 64 * 1024);
    const parts = parseMultipart(body, req.headers['content-type']);
    const file = parts.find(p => p.name === 'voice');
    if (!file || file.data.length === 0) {
      throw new HttpError(400, 'No voice recording was sent.');
    }
    if (file.data.length > config.maxVoiceBytes) {
      throw new HttpError(413, 'That voice message is too long. Please keep it under 1 minute.');
    }
    // Make sure it is REALLY sound - not a picture or video in disguise.
    const audio = detectAudio(file.data);
    if (!audio) {
      throw new HttpError(400, 'Only voice recordings can be sent. No pictures or videos.');
    }
    const seconds = parts.find(p => p.name === 'seconds')?.value;
    const { msg, fileName, data } = service.sendVoice(kid, convo, { ...audio, seconds, data: file.data });
    fs.writeFileSync(store.voicePath(fileName), data);
    store.db.messages.push(msg);
    store.save();
    sendJson(res, 200, { message: service.messageOut(msg) });
  });

  router.add('GET', '/api/voice/:id', (req, res, { params }) => {
    const kid = ctx.kidFromRequest(req);
    const msg = store.db.messages.find(m => m.id === Number(params.id) && m.kind === 'voice');
    if (!msg || !service.kidsInConversation(msg.convo).includes(kid.id)) {
      throw new HttpError(404, 'Voice message not found.');
    }
    const fromOtherKid = msg.from.type === 'kid' && msg.from.id !== kid.id && !msg.convo.startsWith('p:');
    if (fromOtherKid && !kid.settings.voice) {
      throw new HttpError(403, 'Voice messages are turned off.');
    }
    const file = store.voicePath(msg.voiceFile);
    res.writeHead(200, { 'Content-Type': msg.mime, 'Content-Length': fs.statSync(file).size });
    fs.createReadStream(file).pipe(res);
  });

  // ------------------------------------------------------- space buddy

  router.add('POST', '/api/buddy/alert', async (req, res) => {
    const kid = ctx.kidFromRequest(req);
    const { alert, schools } = service.buddyAlert(kid, await readJson(req));
    // The emails only say "please log in" - never what the child said.
    await mailer.send({ to: kid.parentEmail, ...buddyAlertParentEmail(kid, parentLoginUrl(kid.parentEmail)) });
    for (const school of schools) {
      const url = ctx.url('/school/login', service.makeLink({ type: 'schoolLogin', schoolId: school.id }));
      await mailer.send({ to: school.email, ...buddyAlertSchoolEmail(school, kid, url) });
    }
    sendJson(res, 200, { told: { parent: true, schools: schools.map(s => s.name) }, id: alert.id });
  });

  router.add('POST', '/api/messages/:id/report', async (req, res, { params }) => {
    const kid = ctx.kidFromRequest(req);
    const msg = service.report(kid, params.id);
    await mailer.send({
      to: kid.parentEmail,
      ...reportEmail(kid, service.messageText(msg), service.senderName(msg), parentLoginUrl(kid.parentEmail)),
    });
    sendJson(res, 200, { ok: true });
  });
}
