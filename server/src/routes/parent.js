/**
 * routes/parent.js
 * --------------------------------------------------------------------------
 * The parent pages. A parent never needs a password: they log in with the
 * links in their emails (or ask for a new link with their email address).
 *
 *  GET/POST /parent/verify          "Turn on Friends for my child?"
 *  GET/POST /parent/friend          approve / decline a friend request
 *  GET/POST /parent/group           approve / decline a school group invite
 *  GET/POST /parent/login           log in with an emailed link
 *  GET/POST /parent/login-request   "email me a new link"
 *  GET      /parent                 the parent page (dashboard)
 *  GET/POST /parent/disable         "Not OK? Turn off Friends" (heads-up email)
 *  POST     /parent/pin             make / change the grown-up PIN
 *  POST     /parent/settings        typed / voice messages on or off
 *  POST     /parent/decide          approve / decline from the dashboard
 *  POST     /parent/remove-friend   end a friendship
 *  POST     /parent/remove-group    take my child out of a group
 *  POST     /parent/alert-seen      a space buddy worry was talked about
 *  GET      /parent/chat            read a chat of MY child (only)
 *  POST     /parent/message         write to my child
 *  GET      /parent/voice/:id       listen to a voice message in my child's chats
 *  POST     /parent/logout
 *
 * Every "GET" page only SHOWS things. Changes happen with a button (POST),
 * because email programs sometimes open links by themselves.
 */
import fs from 'node:fs';

import { parentLoginEmail } from '../emails.js';
import { HttpError, readForm, redirect, sendHtml } from '../http.js';
import { chatRefreshScript, escapeHtml as e, messageHtml, messagePage, page, postButton } from '../pages.js';

export default function registerParent(router, ctx) {
  const { service, store, mailer, limits } = ctx;

  /** The logged-in parent, or a redirect to the login-request page. */
  function requireParent(req, res) {
    const session = ctx.webSession(req, 'parent');
    if (!session) {
      redirect(res, '/parent/login-request');
      return null;
    }
    return session;
  }

  // ------------------------------------------------------- verify (Friends on)

  router.add('GET', '/parent/verify', (req, res, { query }) => {
    const token = query.get('t');
    const link = service.readLink(token, 'verify');
    const kid = service.kid(link.kidId);
    const body = kid.verified
      ? `<div class="card"><h1>Friends is already on for ${e(kid.username)} ✅</h1><p><a class="btn" href="/parent">Open my parent page</a></p></div>`
      : `<div class="card"><h1>Turn on Friends for ${e(kid.username)}?</h1>
         <ul>
           <li>Friends are added with a friend code only. Nobody can search for your child.</li>
           <li>Every new friend needs your OK, the other parent's OK, and the other child's OK.</li>
           <li>Children chat with ready-made phrases and feeling cards. <b>Typed and voice messages are OFF</b> until you turn them on.</li>
           <li>Pictures can never be sent.</li>
           <li>You can read all of your child's chats on your parent page, and nobody else's.</li>
         </ul>
         <div class="row">${postButton('/parent/verify', `Yes, I'm the parent: turn on Friends`, { t: token })}</div></div>`;
    sendHtml(res, 200, page('Turn on Friends', body));
  });

  router.add('POST', '/parent/verify', async (req, res) => {
    const form = await readForm(req);
    const link = service.readLink(form.t, 'verify');
    const kid = service.verifyKid(link.kidId);
    service.useLink(form.t);
    const cookie = ctx.startWebSession('parent', { email: kid.parentEmail });
    redirect(res, `/parent?notice=${encodeURIComponent(`Friends is on for ${kid.username}! 🎉`)}`, { 'Set-Cookie': cookie });
  });

  // ------------------------------------------------------- friend requests

  router.add('GET', '/parent/friend', (req, res, { query }) => {
    const token = query.get('t');
    const link = service.readLink(token, 'friend');
    const request = service.request(link.requestId);
    const mine = service.kid(link.side === 'from' ? request.fromKid : request.toKid);
    const other = service.kid(link.side === 'from' ? request.toKid : request.fromKid);
    const myAnswer = link.side === 'from' ? request.parentFrom : request.parentTo;
    let body = `<div class="card"><h1>${e(mine.username)} and ${e(other.username)} want to be friends</h1>
      <p><b>${e(other.username)}</b> has the friend code <b>${e(other.friendCode)}</b>.</p>`;
    if (request.status !== 'pending' || myAnswer !== 'pending') {
      body += `<p>This request is already answered (${e(request.status === 'pending' ? myAnswer : request.status)}). Thank you!</p><p><a class="btn" href="/parent">Open my parent page</a></p></div>`;
    } else {
      body += `<p>They become friends only when both parents say yes and ${e(other.username)} accepts. Do you know this child? If you're not sure, it's OK to say no.</p>
        <div class="row">${postButton('/parent/friend', 'Approve', { t: token, decision: 'approve' })}
        ${postButton('/parent/friend', 'Decline', { t: token, decision: 'decline' }, { className: 'soft' })}</div></div>`;
    }
    sendHtml(res, 200, page('Friend request', body));
  });

  router.add('POST', '/parent/friend', async (req, res) => {
    const form = await readForm(req);
    const link = service.readLink(form.t, 'friend');
    const request = service.parentDecideFriend(link.requestId, link.side, form.decision === 'approve');
    service.useLink(form.t);
    const mine = service.kid(link.side === 'from' ? request.fromKid : request.toKid);
    const cookie = ctx.startWebSession('parent', { email: mine.parentEmail });
    const notice = form.decision === 'approve' ? 'Approved! 💜' : 'Declined. The children will not become friends.';
    redirect(res, `/parent?notice=${encodeURIComponent(notice)}`, { 'Set-Cookie': cookie });
  });

  // ------------------------------------------------------- group invites

  router.add('GET', '/parent/group', (req, res, { query }) => {
    const token = query.get('t');
    const link = service.readLink(token, 'group');
    const group = store.db.groups[link.groupId];
    const kid = service.kid(link.kidId);
    const member = service.member(link.groupId, link.kidId);
    if (!group || !member) {
      throw new HttpError(404, 'This invitation is not open any more.');
    }
    const school = service.school(group.schoolId);
    let body = `<div class="card"><h1>${e(school.name)} invited ${e(kid.username)} to "${e(group.name)}"</h1>
      <p>In the group, the children and the teacher chat together. Your settings for typed and voice messages still apply. You can read the group chat on your parent page, and take your child out at any time.</p>`;
    body +=
      member.parent === 'pending'
        ? `<div class="row">${postButton('/parent/group', 'Approve', { t: token, decision: 'approve' })}
           ${postButton('/parent/group', 'Decline', { t: token, decision: 'decline' }, { className: 'soft' })}</div></div>`
        : `<p>Already answered (${e(member.parent)}).</p><p><a class="btn" href="/parent">Open my parent page</a></p></div>`;
    sendHtml(res, 200, page('Group invitation', body));
  });

  router.add('POST', '/parent/group', async (req, res) => {
    const form = await readForm(req);
    const link = service.readLink(form.t, 'group');
    const kid = service.kid(link.kidId);
    service.parentDecideGroup(link.groupId, link.kidId, form.decision === 'approve');
    service.useLink(form.t);
    const cookie = ctx.startWebSession('parent', { email: kid.parentEmail });
    const notice = form.decision === 'approve' ? `${kid.username} joined the group! 🏫` : 'Declined.';
    redirect(res, `/parent?notice=${encodeURIComponent(notice)}`, { 'Set-Cookie': cookie });
  });

  // ------------------------------------------------------- login

  router.add('GET', '/parent/login', (req, res, { query }) => {
    const token = query.get('t');
    service.readLink(token, 'parentLogin');
    sendHtml(res, 200, page('Parent page', `<div class="card"><h1>Your parent page</h1><div class="row">${postButton('/parent/login', 'Open my parent page', { t: token })}</div></div>`));
  });

  router.add('POST', '/parent/login', async (req, res) => {
    const form = await readForm(req);
    const link = service.readLink(form.t, 'parentLogin');
    service.useLink(form.t);
    redirect(res, '/parent', { 'Set-Cookie': ctx.startWebSession('parent', { email: link.email }) });
  });

  router.add('GET', '/parent/login-request', (req, res, { query }) => {
    const sent = query.get('sent');
    const body = sent
      ? '<div class="card"><h1>Check your email 📧</h1><p>If this email belongs to a child\'s account, we sent you a link to the parent page.</p></div>'
      : `<div class="card"><h1>Parent page</h1><p>Type the parent email you used for your child's account. We'll email you a link.</p>
         <form method="post" action="/parent/login-request" class="row"><input type="email" name="email" required placeholder="you@mail.com"><button>Email me a link</button></form></div>`;
    sendHtml(res, 200, page('Parent page', body));
  });

  router.add('POST', '/parent/login-request', async (req, res) => {
    const form = await readForm(req);
    const email = String(form.email ?? '').trim().toLowerCase();
    // Same answer whether or not the email is known (no hints for strangers).
    if (service.kidsOfParent(email).length > 0 && limits.email.allow(`parent:${email}`)) {
      const url = ctx.url('/parent/login', service.makeLink({ type: 'parentLogin', email }));
      await mailer.send({ to: email, ...parentLoginEmail(url) });
    }
    redirect(res, '/parent/login-request?sent=1');
  });

  router.add('POST', '/parent/logout', async (req, res) => {
    redirect(res, '/parent/login-request', { 'Set-Cookie': 'et_parent=; Path=/; Max-Age=0' });
  });

  // ------------------------------------------------------- dashboard

  router.add('GET', '/parent', (req, res, { query }) => {
    const session = requireParent(req, res);
    if (!session) {
      return;
    }
    const csrf = session.csrf;
    const kids = service.kidsOfParent(session.email);
    const notice = query.get('notice');
    let body = `<div class="row between"><h1>Parent page</h1>${postButton('/parent/logout', 'Log out', {}, { csrf, className: 'soft' })}</div>`;
    if (notice) {
      body += `<div class="notice">${e(notice)}</div>`;
    }
    if (kids.length === 0) {
      body += '<div class="card"><p>No children are linked to this email yet.</p></div>';
    }
    for (const kid of kids) {
      body += kidCard(kid, csrf);
    }
    sendHtml(res, 200, page('Parent page', body));
  });

  /** "Oct 5" from "2026-10-05". */
  function shortDate(isoDay) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [, m, d] = isoDay.slice(0, 10).split('-').map(Number);
    return `${months[m - 1]} ${d}`;
  }

  /** The weekly check-up the app sends: homework, streak, tests. */
  function weeklyCheckup(kid) {
    const p = kid.progress;
    if (!p) {
      return `<h3>📅 Weekly check-up</h3><p class="muted">Nothing yet. It shows up here after ${e(kid.username)} plays a leaf, a Feelings Test or a buddy adventure.</p>`;
    }
    const [now, ...before] = p.weeks;
    const lastTest = p.tests[0];
    const rows = before
      .slice(0, 7)
      .map(w => `<li>Week of ${e(shortDate(w.start))}: ${w.missions} of ${w.goal} ${w.missions >= w.goal ? '✓' : ''}</li>`)
      .join('');
    return `<h3>📅 Weekly check-up</h3>
      <p><b>This week:</b> ${now ? `${now.missions} of ${now.goal} missions ${now.missions >= now.goal ? '✓ done' : ''}` : '-'}
      · <b>🔥 Streak:</b> ${p.streak} week${p.streak === 1 ? '' : 's'} in a row
      · <b>Weekly homework:</b> ${p.weeklyGoal} missions
      ${lastTest ? `· <b>Last Feelings Test:</b> ${lastTest.score} of ${lastTest.total} (${e(shortDate(lastTest.at))})` : ''}</p>
      <p class="muted">A mission = a finished leaf, a Feelings Test or a space buddy adventure. Space candies earned: ${p.candiesEarned}. You can change the weekly homework in the app (For grown-ups → Weekly report).</p>
      ${rows ? `<ul class="plain small">${rows}</ul>` : ''}`;
  }

  /** Everything about one child, on the dashboard. */
  function kidCard(kid, csrf) {
    const pill = on => `<span class="pill ${on ? 'on' : 'off'}">${on ? 'ON' : 'OFF'}</span>`;
    const toggle = (setting, label, on) =>
      `<li class="row between"><span>${label} ${pill(on)}</span>${postButton('/parent/settings', on ? 'Turn off' : 'Turn on', { kidId: kid.id, setting, value: on ? 'off' : 'on' }, { csrf, className: on ? 'soft' : '' })}</li>`;

    // Things waiting for THIS parent.
    const waiting = service.waitingFor(kid);

    const convos = service.conversationsOf(kid);
    const blocked = store.db.blocked.filter(b => b.kidId === kid.id).slice(-10).reverse();
    const reports = store.db.reports.filter(r => r.byKid === kid.id).slice(-10).reverse();
    const alerts = service.alertsOfKid(kid);
    const schools = [...new Set(service.groupsOf(kid.id).map(g => store.db.schools[g.schoolId]?.name).filter(Boolean))];

    return `<div class="card">
      <h2>${e(kid.username)}</h2>
      <p class="muted">Friend code: <b>${e(kid.friendCode)}</b> · Friends: ${kid.verified ? '<span class="pill on">ON</span>' : '<span class="pill wait">waiting for your OK</span>'}</p>

      <h3>🚨 Worrying things ${e(kid.username)} told the space buddy</h3>
      <p class="muted">Normal chats with the space buddy are never saved or sent. Only when ${e(kid.username)} tells the buddy something worrying (like someone hurting them), the buddy tells you${schools.length ? ` and the teacher at ${e(schools.join(', '))}` : ''}, and nobody else.</p>
      ${alerts.length === 0 ? '<p class="muted">Nothing. 💜</p>' : alerts
        .map(a => `<div class="worry ${a.parentSeen ? 'seen' : ''}"><b>${e(a.title)}</b> <span class="muted">· ${e(new Date(a.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }))}</span>
          <span class="quote">“${e(a.text)}”</span>
          ${a.parentSeen ? '<span class="pill on">✓ talked about</span>' : postButton('/parent/alert-seen', 'We talked about it ✓', { kidId: kid.id, alertId: a.id }, { csrf })}</div>`)
        .join('')}

      ${weeklyCheckup(kid)}

      <h3>👪 Grown-up PIN</h3>
      <p class="muted">${kid.pinHash ? 'With the grown-up PIN you can approve friends and groups and change settings right in the app (Friends → Grown-up corner). Forgot it? Make a new one here.' : 'Make a 4-number PIN to approve things right in the app (Friends → Grown-up corner).'}</p>
      <form method="post" action="/parent/pin" class="row">
        <input type="hidden" name="csrf" value="${e(csrf)}"><input type="hidden" name="kidId" value="${kid.id}">
        <input type="password" name="pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required placeholder="New PIN (4 numbers)" style="flex:1">
        <button>${kid.pinHash ? 'Change PIN' : 'Make PIN'}</button>
      </form>

      <h3>Settings</h3>
      <p class="muted">Ready-made phrases and feeling cards are always allowed. You can change these at any time.</p>
      <ul class="plain">
        ${toggle('freeText', '⌨️ Typed messages', kid.settings.freeText)}
        ${toggle('voice', '🎤 Voice messages', kid.settings.voice)}
      </ul>

      <h3>Waiting for you</h3>
      ${waiting.length === 0 ? '<p class="muted">Nothing right now.</p>' : `<ul class="plain">${waiting
        .map(w => `<li class="row between"><span>${e(w.text)}</span><span class="row">${postButton('/parent/decide', 'Approve', { kidId: kid.id, type: w.type, id: w.id, decision: 'approve' }, { csrf })}${postButton('/parent/decide', 'Decline', { kidId: kid.id, type: w.type, id: w.id, decision: 'decline' }, { csrf, className: 'soft' })}</span></li>`)
        .join('')}</ul>`}

      <h3>Chats</h3>
      <ul class="plain">${convos
        .map(c => {
          const remove =
            c.kind === 'friend'
              ? postButton('/parent/remove-friend', 'Remove friend', { kidId: kid.id, otherId: c.other.id }, { csrf, className: 'soft' })
              : c.kind === 'group'
                ? postButton('/parent/remove-group', 'Take out of group', { kidId: kid.id, groupId: c.group.id }, { csrf, className: 'soft' })
                : '';
          return `<li class="row between"><a href="/parent/chat?kid=${kid.id}&c=${encodeURIComponent(c.key)}">${c.kind === 'parent' ? '💬 ' : c.kind === 'group' ? '🏫 ' : '👫 '}${e(c.title)}</a>${remove}</li>`;
        })
        .join('')}</ul>

      <h3>"Tell my grown-up"</h3>
      ${reports.length === 0 ? '<p class="muted">No messages were flagged.</p>' : `<ul class="plain">${reports
        .map(r => {
          const m = store.db.messages.find(x => x.id === r.messageId);
          return m ? `<li><span class="flag">⚑</span> ${e(service.senderName(m))}: "${e(service.messageText(m))}" · <a href="/parent/chat?kid=${kid.id}&c=${encodeURIComponent(m.convo)}">see chat</a></li>` : '';
        })
        .join('')}</ul>`}

      <h3>Messages the safety filter stopped</h3>
      ${blocked.length === 0 ? '<p class="muted">None.</p>' : `<ul class="plain">${blocked
        .map(b => `<li>"${e(b.text)}" <span class="muted">(${e(b.reason)})</span></li>`)
        .join('')}</ul>`}
    </div>`;
  }

  router.add('POST', '/parent/pin', async (req, res) => {
    const session = requireParent(req, res);
    if (!session) {
      return;
    }
    const form = await readForm(req);
    ctx.checkCsrf(session, form);
    const kid = service.parentKid(session.email, Number(form.kidId));
    service.setPin(kid, form.pin);
    redirect(res, `/parent?notice=${encodeURIComponent('The new grown-up PIN is saved. ✅')}`);
  });

  // "Not OK? Turn off Friends" from the heads-up email.
  router.add('GET', '/parent/disable', (req, res, { query }) => {
    const token = query.get('t');
    const link = service.readLink(token, 'disable');
    const kid = service.kid(link.kidId);
    sendHtml(
      res,
      200,
      page('Turn off Friends', `<div class="card"><h1>Turn off Friends for ${e(kid.username)}?</h1>
        <p>The app will be logged out of Friends. Friends can be turned on again in the app with the account password.</p>
        <div class="row">${postButton('/parent/disable', `Yes, turn off Friends`, { t: token }, { className: 'danger' })}</div></div>`),
    );
  });

  router.add('POST', '/parent/disable', async (req, res) => {
    const form = await readForm(req);
    const link = service.readLink(form.t, 'disable');
    const kid = service.kid(link.kidId);
    service.disableFriends(kid);
    service.useLink(form.t);
    sendHtml(res, 200, messagePage('Friends is off', `Friends is now off for ${e(kid.username)}. ✅`));
  });

  router.add('POST', '/parent/settings', async (req, res) => {
    const session = requireParent(req, res);
    if (!session) {
      return;
    }
    const form = await readForm(req);
    ctx.checkCsrf(session, form);
    const kid = service.parentKid(session.email, Number(form.kidId));
    if (form.setting !== 'freeText' && form.setting !== 'voice') {
      throw new HttpError(400, 'Unknown setting.');
    }
    kid.settings = { ...kid.settings, [form.setting]: form.value === 'on' };
    store.save();
    redirect(res, `/parent?notice=${encodeURIComponent('Saved! ✅')}`);
  });

  router.add('POST', '/parent/alert-seen', async (req, res) => {
    const session = requireParent(req, res);
    if (!session) {
      return;
    }
    const form = await readForm(req);
    ctx.checkCsrf(session, form);
    const kid = service.parentKid(session.email, Number(form.kidId));
    service.parentSawAlert(kid, form.alertId);
    redirect(res, `/parent?notice=${encodeURIComponent('Thank you for talking with your child. 💜')}`);
  });

  router.add('POST', '/parent/decide', async (req, res) => {
    const session = requireParent(req, res);
    if (!session) {
      return;
    }
    const form = await readForm(req);
    ctx.checkCsrf(session, form);
    const kid = service.parentKid(session.email, Number(form.kidId));
    const approve = form.decision === 'approve';
    if (form.type === 'friend') {
      const request = service.request(Number(form.id));
      const side = request.fromKid === kid.id ? 'from' : request.toKid === kid.id ? 'to' : null;
      if (!side) {
        throw new HttpError(403, 'This request is not about your child.');
      }
      service.parentDecideFriend(request.id, side, approve);
    } else {
      service.parentDecideGroup(Number(form.id), kid.id, approve);
    }
    redirect(res, `/parent?notice=${encodeURIComponent(approve ? 'Approved! 💜' : 'Declined.')}`);
  });

  router.add('POST', '/parent/remove-friend', async (req, res) => {
    const session = requireParent(req, res);
    if (!session) {
      return;
    }
    const form = await readForm(req);
    ctx.checkCsrf(session, form);
    const kid = service.parentKid(session.email, Number(form.kidId));
    service.removeFriend(kid.id, Number(form.otherId));
    redirect(res, `/parent?notice=${encodeURIComponent('The friend was removed.')}`);
  });

  router.add('POST', '/parent/remove-group', async (req, res) => {
    const session = requireParent(req, res);
    if (!session) {
      return;
    }
    const form = await readForm(req);
    ctx.checkCsrf(session, form);
    const kid = service.parentKid(session.email, Number(form.kidId));
    service.removeFromGroup(Number(form.groupId), kid.id);
    redirect(res, `/parent?notice=${encodeURIComponent(`${kid.username} left the group.`)}`);
  });

  // ------------------------------------------------------- chats

  router.add('GET', '/parent/chat', (req, res, { query }) => {
    const session = requireParent(req, res);
    if (!session) {
      return;
    }
    const kidId = Number(query.get('kid'));
    const key = String(query.get('c') ?? '');
    // Parents can ONLY read chats their own child is part of.
    const kid = service.parentCanRead(session.email, kidId, key);
    const messages = store.db.messages.filter(m => m.convo === key);
    const isParentChat = key === `p:${kid.id}`;
    const describe = { sender: m => service.senderName(m), text: m => service.messageText(m) };
    const chatHtml =
      messages.length === 0
        ? '<p class="muted">No messages yet.</p>'
        : messages
            .map(m =>
              messageHtml(
                m,
                describe,
                isParentChat ? m.from.type === 'parent' : m.from.type === 'kid' && m.from.id === kid.id,
                msg => `/parent/voice/${msg.id}`,
              ),
            )
            .join('');
    if (req.headers['x-partial'] === 'chat') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(chatHtml);
      return;
    }
    const title = service.conversationsOf(kid).find(c => c.key === key)?.title ?? 'Chat';
    const form = isParentChat
      ? `<form method="post" action="/parent/message" class="row" style="margin-top:12px">
           <input type="hidden" name="csrf" value="${e(session.csrf)}"><input type="hidden" name="kidId" value="${kid.id}">
           <input type="text" name="text" required maxlength="1000" placeholder="Write to ${e(kid.username)}..." style="flex:1">
           <button>Send</button></form>`
      : `<p class="muted">You can read this chat because ${e(kid.username)} is part of it. Only the children (and the teacher, in groups) can write here.</p>`;
    sendHtml(
      res,
      200,
      page(title, `<p><a href="/parent">← Back to my parent page</a></p><div class="card"><h2>${e(title)}</h2><div id="chat" class="chat">${chatHtml}</div>${form}</div>`, {
        refreshScript: chatRefreshScript(),
      }),
    );
  });

  router.add('POST', '/parent/message', async (req, res) => {
    const session = requireParent(req, res);
    if (!session) {
      return;
    }
    const form = await readForm(req);
    ctx.checkCsrf(session, form);
    const kid = service.parentKid(session.email, Number(form.kidId));
    service.sendGrownUpMessage(`p:${kid.id}`, { type: 'parent', id: kid.id }, form.text);
    redirect(res, `/parent/chat?kid=${kid.id}&c=${encodeURIComponent(`p:${kid.id}`)}`);
  });

  router.add('GET', '/parent/voice/:id', (req, res, { params }) => {
    const session = requireParent(req, res);
    if (!session) {
      return;
    }
    const msg = store.db.messages.find(m => m.id === Number(params.id) && m.kind === 'voice');
    const myKids = service.kidsOfParent(session.email).map(k => k.id);
    if (!msg || !service.kidsInConversation(msg.convo).some(id => myKids.includes(id))) {
      throw new HttpError(404, 'Voice message not found.');
    }
    const file = store.voicePath(msg.voiceFile);
    res.writeHead(200, { 'Content-Type': msg.mime, 'Content-Length': fs.statSync(file).size });
    fs.createReadStream(file).pipe(res);
  });

  // A simple start page.
  router.add('GET', '/', (req, res) => {
    const dev = ctx.config.testMode
      ? '<div class="card"><h2>Test mode 🧪</h2><p>Emails are not sent. They wait in the <a href="/dev/mail">test mailbox</a>. You can <a href="/dev/admin">add a test school</a>.</p></div>'
      : '';
    sendHtml(res, 200, page('Emotion Tree', `<div class="card"><h1>Emotion Tree server 🚀</h1><p><a class="btn" href="/parent">Parent page</a> <a class="btn soft" href="/school">School page</a></p></div>${dev}`));
  });

}
