/**
 * routes/school.js
 * --------------------------------------------------------------------------
 * School / kindergarten pages - the ONLY place where groups can be made.
 *
 * Schools are added by the app owner (admin), never by sign-up, so nobody
 * can pretend to be a school:
 *   POST /admin/schools        { name, email, kind }  with header  X-Admin-Key
 *   (or:  npm run add-school -- --name "..." --email ... --kind kindergarten)
 *   The school then gets an email with a link to its school page.
 *
 *  GET/POST /school/login            log in with an emailed link
 *  GET/POST /school/login-request    "email me a new link"
 *  GET      /school                  groups, members, invite children
 *  POST     /school/alert-seen       a space buddy worry alert was seen
 *  POST     /school/groups           make a group
 *  POST     /school/groups/:id/invite    invite a child by friend code (parent must approve)
 *  POST     /school/groups/:id/remove    take a child out
 *  POST     /school/groups/:id/delete    delete the group
 *  GET      /school/group            the group chat
 *  POST     /school/group/message    the teacher writes to the group
 *  GET      /school/voice/:id        listen to a voice message in a group
 */
import fs from 'node:fs';

import { groupInviteEmail, schoolLoginEmail } from '../emails.js';
import { HttpError, readForm, readJson, redirect, sendHtml, sendJson } from '../http.js';
import { chatRefreshScript, escapeHtml as e, messageHtml, page, postButton } from '../pages.js';
import { safeEqual } from '../security.js';

export default function registerSchool(router, ctx) {
  const { service, store, mailer, config, limits } = ctx;

  function requireSchool(req, res) {
    const session = ctx.webSession(req, 'school');
    if (!session || !store.db.schools[session.schoolId]) {
      redirect(res, '/school/login-request');
      return null;
    }
    return { session, school: store.db.schools[session.schoolId] };
  }

  /** Emails a school a link to its page. Also returns the link. */
  async function sendSchoolLogin(school) {
    const url = ctx.url('/school/login', service.makeLink({ type: 'schoolLogin', schoolId: school.id }));
    await mailer.send({ to: school.email, ...schoolLoginEmail(school, url) });
    return url;
  }
  ctx.sendSchoolLogin = sendSchoolLogin;

  // ------------------------------------------------------- admin (app owner)

  router.add('POST', '/admin/schools', async (req, res) => {
    const key = String(req.headers['x-admin-key'] ?? '');
    if (!config.adminKey || !safeEqual(key, config.adminKey)) {
      throw new HttpError(403, 'Wrong admin key.');
    }
    const school = service.addSchool(await readJson(req));
    // The link is emailed AND given to the app owner, so nobody has to wait for the email.
    const loginUrl = await sendSchoolLogin(school);
    sendJson(res, 200, { school, loginUrl });
  });

  // ------------------------------------------------------- login

  router.add('GET', '/school/login', (req, res, { query }) => {
    const token = query.get('t');
    const link = service.readLink(token, 'schoolLogin');
    const school = service.school(link.schoolId);
    sendHtml(res, 200, page('School page', `<div class="card"><h1>${e(school.name)}</h1><div class="row">${postButton('/school/login', 'Open the school page', { t: token })}</div></div>`));
  });

  router.add('POST', '/school/login', async (req, res) => {
    const form = await readForm(req);
    const link = service.readLink(form.t, 'schoolLogin');
    service.useLink(form.t);
    redirect(res, '/school', { 'Set-Cookie': ctx.startWebSession('school', { schoolId: link.schoolId }) });
  });

  router.add('GET', '/school/login-request', (req, res, { query }) => {
    const error = query.get('error');
    const body = query.get('sent')
      ? '<div class="card"><h1>Check your email 📧</h1><p>If this email belongs to a school in Emotion Tree, we sent a link to the school page.</p></div>'
      : `${error ? `<div class="error">${e(error)}</div>` : ''}
         <div class="card"><h1>School page</h1><p>Schools and kindergartens are added by the Emotion Tree team.</p>
         <h3>Log in with your password</h3>
         <form method="post" action="/school/login-password">
           <p><input type="email" name="email" required placeholder="school@mail.com"></p>
           <p><input type="password" name="password" required placeholder="Password"></p>
           <button>Log in</button></form>
         <h3>No password yet?</h3>
         <p class="muted">Get a log-in link by email. On the school page you can then set a password.</p>
         <form method="post" action="/school/login-request" class="row"><input type="email" name="email" required placeholder="school@mail.com"><button>Email me a link</button></form></div>`;
    sendHtml(res, 200, page('School page', body));
  });

  router.add('POST', '/school/login-password', async (req, res) => {
    if (!limits.connect.allow(`school-login:${ctx.ip(req)}`)) {
      redirect(res, `/school/login-request?error=${encodeURIComponent('Too many tries. Please wait a few minutes.')}`);
      return;
    }
    const form = await readForm(req);
    const school = service.schoolByPassword(form.email, form.password);
    if (!school) {
      redirect(res, `/school/login-request?error=${encodeURIComponent('Wrong email or password.')}`);
      return;
    }
    redirect(res, '/school', { 'Set-Cookie': ctx.startWebSession('school', { schoolId: school.id }) });
  });

  router.add('POST', '/school/password', async (req, res) => {
    const found = requireSchool(req, res);
    if (!found) {
      return;
    }
    const form = await readForm(req);
    ctx.checkCsrf(found.session, form);
    service.setSchoolPassword(found.school, form.password);
    redirect(res, `/school?notice=${encodeURIComponent('Password saved. Next time, log in with your email and this password. ✅')}`);
  });

  router.add('POST', '/school/alert-seen', async (req, res) => {
    const found = requireSchool(req, res);
    if (!found) {
      return;
    }
    const form = await readForm(req);
    ctx.checkCsrf(found.session, form);
    service.schoolSawAlert(found.school, form.alertId);
    redirect(res, `/school?notice=${encodeURIComponent('Marked as seen. ✅')}`);
  });

  router.add('POST', '/school/login-request', async (req, res) => {
    const form = await readForm(req);
    const email = String(form.email ?? '').trim().toLowerCase();
    const school = Object.values(store.db.schools).find(s => s.email === email);
    if (school && limits.email.allow(`school:${school.id}`)) {
      await sendSchoolLogin(school);
    }
    redirect(res, '/school/login-request?sent=1');
  });

  router.add('POST', '/school/logout', async (req, res) => {
    redirect(res, '/school/login-request', { 'Set-Cookie': 'et_school=; Path=/; Max-Age=0' });
  });

  // ------------------------------------------------------- dashboard

  router.add('GET', '/school', (req, res, { query }) => {
    const found = requireSchool(req, res);
    if (!found) {
      return;
    }
    const { session, school } = found;
    const csrf = session.csrf;
    const groups = Object.values(store.db.groups).filter(g => g.schoolId === school.id);
    const notice = query.get('notice');
    const error = query.get('error');
    let body = `<div class="row between"><h1>🏫 ${e(school.name)}</h1>${postButton('/school/logout', 'Log out', {}, { csrf, className: 'soft' })}</div>`;
    if (notice) {
      body += `<div class="notice">${e(notice)}</div>`;
    }
    if (error) {
      body += `<div class="error">${e(error)}</div>`;
    }
    const alerts = service.alertsForSchool(school);
    if (alerts.length > 0) {
      body += `<div class="card"><h2>🚨 Children who need a grown-up</h2>
        <p class="muted">A child in one of your groups told their space buddy (in the app) something worrying. Their parent was told too. Only you and the parent can see this. Please follow your school's safeguarding steps.</p>
        ${alerts
          .map(a => {
            const kid = store.db.kids[a.kidId];
            const seen = a.schoolSeen.includes(school.id);
            const groups = service.groupsOf(a.kidId).filter(g => g.schoolId === school.id).map(g => g.name);
            return `<div class="worry ${seen ? 'seen' : ''}"><b>${e(kid?.username ?? '?')}</b>${groups.length ? ` <span class="muted">(${e(groups.join(', '))})</span>` : ''} · <b>${e(a.title)}</b> <span class="muted">· ${e(new Date(a.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }))}</span>
              <span class="quote">“${e(a.text)}”</span>
              ${seen ? '<span class="pill on">✓ seen</span>' : postButton('/school/alert-seen', 'Seen ✓', { alertId: a.id }, { csrf })}</div>`;
          })
          .join('')}</div>`;
    }
    body += `<div class="card"><h2>Make a group</h2>
      <p class="muted">For example "Class 2B" or "Sunflowers". Only schools can make groups.</p>
      <form method="post" action="/school/groups" class="row"><input type="hidden" name="csrf" value="${e(csrf)}">
      <input type="text" name="name" required maxlength="20" placeholder="Group name" style="flex:1"><button>Make group</button></form></div>`;
    for (const group of groups) {
      const members = store.db.groupMembers.filter(m => m.groupId === group.id);
      body += `<div class="card"><div class="row between"><h2>${e(group.name)}</h2><a class="btn" href="/school/group?id=${group.id}">💬 Open group chat</a></div>
        <h3>Children</h3>
        ${members.length === 0 ? '<p class="muted">No children yet. Invite them with their friend code (the parent can find it on the parent page).</p>' : `<ul class="plain">${members
          .map(m => {
            const kid = store.db.kids[m.kidId];
            const status = m.parent === 'approved' ? '<span class="pill on">in the group</span>' : m.parent === 'pending' ? '<span class="pill wait">waiting for parent</span>' : '<span class="pill off">parent said no</span>';
            return `<li class="row between"><span>${e(kid?.username ?? '?')} ${status}</span>${postButton(`/school/groups/${group.id}/remove`, 'Remove', { kidId: m.kidId }, { csrf, className: 'soft' })}</li>`;
          })
          .join('')}</ul>`}
        <form method="post" action="/school/groups/${group.id}/invite" class="row" style="margin-top:10px"><input type="hidden" name="csrf" value="${e(csrf)}">
          <input type="text" name="friendCode" required placeholder="Friend code, e.g. COMET-4821" style="flex:1"><button>Invite child</button></form>
        <p class="muted">The child joins only after their parent approves (in the app with the grown-up PIN, or by email).</p>
        <div style="margin-top:10px">${postButton(`/school/groups/${group.id}/delete`, 'Delete group', {}, { csrf, className: 'danger' })}</div>
      </div>`;
    }
    body += `<div class="card"><h2>🔑 School password</h2>
      <p class="muted">${school.passwordHash ? 'You have a password. You can change it here.' : 'Set a password, so you can log in with your email and password (no email link needed).'}</p>
      <form method="post" action="/school/password" class="row"><input type="hidden" name="csrf" value="${e(csrf)}">
      <input type="password" name="password" required minlength="8" placeholder="New password (8+ characters)" style="flex:1"><button>Save password</button></form></div>`;
    sendHtml(res, 200, page('School page', body));
  });

  router.add('POST', '/school/groups', async (req, res) => {
    const found = requireSchool(req, res);
    if (!found) {
      return;
    }
    const form = await readForm(req);
    ctx.checkCsrf(found.session, form);
    try {
      const group = service.createGroup(found.school, form.name);
      redirect(res, `/school?notice=${encodeURIComponent(`Group "${group.name}" is ready.`)}`);
    } catch (error) {
      if (!(error instanceof HttpError)) {
        throw error;
      }
      redirect(res, `/school?error=${encodeURIComponent(error.message)}`);
    }
  });

  router.add('POST', '/school/groups/:id/invite', async (req, res, { params }) => {
    const found = requireSchool(req, res);
    if (!found) {
      return;
    }
    const form = await readForm(req);
    ctx.checkCsrf(found.session, form);
    try {
      const { group, kid } = service.inviteToGroup(found.school, Number(params.id), form.friendCode);
      const token = service.makeLink({ type: 'group', groupId: group.id, kidId: kid.id });
      await mailer.send({ to: kid.parentEmail, ...groupInviteEmail(kid, group, found.school, ctx.url('/parent/group', token)) });
      redirect(res, `/school?notice=${encodeURIComponent(`${kid.username} is invited. Waiting for the parent's OK.`)}`);
    } catch (error) {
      if (!(error instanceof HttpError)) {
        throw error;
      }
      redirect(res, `/school?error=${encodeURIComponent(error.message)}`);
    }
  });

  router.add('POST', '/school/groups/:id/remove', async (req, res, { params }) => {
    const found = requireSchool(req, res);
    if (!found) {
      return;
    }
    const form = await readForm(req);
    ctx.checkCsrf(found.session, form);
    const group = service.schoolGroup(found.school, Number(params.id));
    service.removeFromGroup(group.id, Number(form.kidId));
    redirect(res, `/school?notice=${encodeURIComponent('The child was removed from the group.')}`);
  });

  router.add('POST', '/school/groups/:id/delete', async (req, res, { params }) => {
    const found = requireSchool(req, res);
    if (!found) {
      return;
    }
    const form = await readForm(req);
    ctx.checkCsrf(found.session, form);
    service.deleteGroup(found.school, Number(params.id));
    redirect(res, `/school?notice=${encodeURIComponent('The group was deleted.')}`);
  });

  // ------------------------------------------------------- group chat

  router.add('GET', '/school/group', (req, res, { query }) => {
    const found = requireSchool(req, res);
    if (!found) {
      return;
    }
    const group = service.schoolGroup(found.school, Number(query.get('id')));
    const key = `g:${group.id}`;
    const messages = store.db.messages.filter(m => m.convo === key);
    const describe = { sender: m => service.senderName(m), text: m => service.messageText(m) };
    const chatHtml =
      messages.length === 0
        ? '<p class="muted">No messages yet. Say hello to your group!</p>'
        : messages.map(m => messageHtml(m, describe, m.from.type === 'school', msg => `/school/voice/${msg.id}`)).join('');
    if (req.headers['x-partial'] === 'chat') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(chatHtml);
      return;
    }
    const members = service.activeMembers(group.id).map(k => e(k.username)).join(', ') || 'nobody yet';
    sendHtml(
      res,
      200,
      page(group.name, `<p><a href="/school">← Back to the school page</a></p>
        <div class="card"><h2>💬 ${e(group.name)}</h2><p class="muted">In the group: ${members}</p>
        <div id="chat" class="chat">${chatHtml}</div>
        <form method="post" action="/school/group/message" class="row" style="margin-top:12px">
          <input type="hidden" name="csrf" value="${e(found.session.csrf)}"><input type="hidden" name="groupId" value="${group.id}">
          <input type="text" name="text" required maxlength="1000" placeholder="Write to the group..." style="flex:1"><button>Send</button></form></div>`, {
        refreshScript: chatRefreshScript(),
      }),
    );
  });

  router.add('POST', '/school/group/message', async (req, res) => {
    const found = requireSchool(req, res);
    if (!found) {
      return;
    }
    const form = await readForm(req);
    ctx.checkCsrf(found.session, form);
    const group = service.schoolGroup(found.school, Number(form.groupId));
    service.sendGrownUpMessage(`g:${group.id}`, { type: 'school', id: found.school.id }, form.text);
    redirect(res, `/school/group?id=${group.id}`);
  });

  router.add('GET', '/school/voice/:id', (req, res, { params }) => {
    const found = requireSchool(req, res);
    if (!found) {
      return;
    }
    const msg = store.db.messages.find(m => m.id === Number(params.id) && m.kind === 'voice');
    const groupId = msg ? Number(msg.convo.split(':')[1]) : 0;
    if (!msg || !msg.convo.startsWith('g:') || store.db.groups[groupId]?.schoolId !== found.school.id) {
      throw new HttpError(404, 'Voice message not found.');
    }
    const file = store.voicePath(msg.voiceFile);
    res.writeHead(200, { 'Content-Type': msg.mime, 'Content-Length': fs.statSync(file).size });
    fs.createReadStream(file).pipe(res);
  });
}
