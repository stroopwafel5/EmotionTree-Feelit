/**
 * routes/dev.js
 * --------------------------------------------------------------------------
 * Helpers for TEST MODE only (when no RESEND_API_KEY is set). They are
 * switched off completely when real emails are on.
 *
 *  GET  /dev/mail        the test mailbox: every email the server "sent"
 *  GET  /dev/mail/:id    one email, as the parent / school would see it
 *  GET  /dev/admin       a form to add a test school or kindergarten
 *  POST /dev/admin
 */
import { HttpError, readForm, sendHtml } from '../http.js';
import { escapeHtml as e, page } from '../pages.js';

export default function registerDev(router, ctx) {
  const { config, store, service } = ctx;

  function requireTestMode() {
    if (!config.testMode) {
      throw new HttpError(404, 'Page not found.');
    }
  }

  router.add('GET', '/dev/mail', (req, res) => {
    requireTestMode();
    const mails = [...(store.db.outbox ?? [])].reverse();
    const rows = mails
      .map(m => `<li><a href="/dev/mail/${m.id}"><b>${e(m.subject)}</b></a><br><span class="muted">to ${e(m.to)} · ${e(new Date(m.sentAt).toLocaleString('en-GB'))}</span></li>`)
      .join('');
    sendHtml(
      res,
      200,
      page('Test mailbox', `<div class="card"><h1>📧 Test mailbox</h1>
        <p class="muted">Test mode: these emails were NOT really sent. Open one and click its button to play the parent or the school. This page updates every 5 seconds.</p>
        ${mails.length === 0 ? '<p>No emails yet.</p>' : `<ul class="plain">${rows}</ul>`}</div>`,
        { refreshScript: '<script>setTimeout(() => location.reload(), 5000)</script>' }),
    );
  });

  router.add('GET', '/dev/mail/:id', (req, res, { params }) => {
    requireTestMode();
    const mail = (store.db.outbox ?? []).find(m => m.id === Number(params.id));
    if (!mail) {
      throw new HttpError(404, 'Email not found.');
    }
    const header = `<div style="font-family:system-ui;background:#fef9c3;padding:10px 16px">🧪 Test mailbox · to <b>${e(mail.to)}</b> · <a href="/dev/mail">← all emails</a></div>`;
    sendHtml(res, 200, mail.html.replace('<body', `<body`).replace(/<body([^>]*)>/, `<body$1>${header}`));
  });

  router.add('GET', '/dev/admin', (req, res, { query }) => {
    requireTestMode();
    const done = query.get('done');
    sendHtml(
      res,
      200,
      page('Add a test school', `${done ? `<div class="notice">School added! Its login email is in the <a href="/dev/mail">test mailbox</a>.</div>` : ''}
      <div class="card"><h1>🏫 Add a test school</h1>
      <p class="muted">In real use, the app owner adds schools with <code>npm run add-school</code> (see README). This form only exists in test mode.</p>
      <form method="post" action="/dev/admin">
        <p><input type="text" name="name" required placeholder="School name, e.g. Sunflower Kindergarten"></p>
        <p><input type="email" name="email" required placeholder="School email, e.g. teacher@sunflower.test"></p>
        <p><label><input type="radio" name="kind" value="kindergarten" checked> Kindergarten</label>
           <label><input type="radio" name="kind" value="school"> School</label></p>
        <button>Add school</button></form></div>`),
    );
  });

  router.add('POST', '/dev/admin', async (req, res) => {
    requireTestMode();
    const school = service.addSchool(await readForm(req));
    const loginUrl = await ctx.sendSchoolLogin(school);
    // Straight to the school's log-in link: no need to open the mailbox.
    sendHtml(
      res,
      200,
      page('School added', `<div class="notice">${e(school.name)} was added! ✅</div>
        <div class="card"><h1>🏫 ${e(school.name)}</h1>
        <p>Open the school page now (the same link was also put in the <a href="/dev/mail">test mailbox</a>). On the school page you can set a password for next time.</p>
        <p><a class="btn" href="${e(loginUrl)}">Open the school page</a></p>
        <p><a href="/dev/admin">Add another school</a></p></div>`),
    );
  });
}
