/**
 * pages.js
 * --------------------------------------------------------------------------
 * The web pages the server shows to grown-ups:
 *   - parent pages: confirm Friends, approve friends/groups, read chats,
 *     chat with your child, turn typed / voice messages on or off
 *   - school pages: make groups, invite children, chat with a group
 *   - the test mailbox (test mode only)
 *
 * Plain HTML with a little CSS - nothing to install. Every form that changes
 * something sends a hidden "csrf" value, so other websites can't send forms
 * in your name.
 */

/** Makes text safe to put inside HTML. */
export function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
const e = escapeHtml;

/** The frame around every page. */
export function page(title, body, { refreshScript = '' } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)} · Emotion Tree</title>
<style>
  :root { --space:#1a0b3d; --panel:#2d1466; --purple:#9333ea; --glow:#c084fc; --card:#f5eeff; --text:#2e1065; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--space); color:#fff; font:17px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 16px; }
  header { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:8px 0 16px; }
  header .logo { font-weight:800; font-size:20px; }
  h1 { font-size: 26px; margin: 8px 0 16px; }
  h2 { font-size: 20px; margin: 0 0 10px; }
  .card { background:var(--card); color:var(--text); border:3px solid var(--glow); border-radius:20px; padding:18px; margin:0 0 16px; }
  .card h2 { color: var(--purple); }
  .muted { color:#6b5a8e; font-size:15px; }
  .row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .between { justify-content:space-between; }
  button, .btn { background:var(--purple); color:#fff; border:3px solid var(--glow); border-radius:999px; padding:10px 18px; font:inherit; font-weight:700; cursor:pointer; text-decoration:none; display:inline-block; }
  button.soft, .btn.soft { background:transparent; color:var(--purple); }
  button.danger { background:#b91c1c; border-color:#fca5a5; }
  input[type=text], input[type=email], textarea { font:inherit; padding:10px 12px; border:3px solid var(--glow); border-radius:12px; width:100%; }
  ul.plain { list-style:none; padding:0; margin:0; }
  ul.plain li { padding:10px 0; border-bottom:1px solid #e4d4fb; }
  ul.plain li:last-child { border-bottom:0; }
  ul.plain.small li { padding:4px 0; font-size:15px; }
  .pill { display:inline-block; border-radius:999px; padding:2px 10px; font-size:14px; font-weight:700; }
  .on { background:#dcfce7; color:#166534; } .off { background:#fee2e2; color:#991b1b; } .wait { background:#fef9c3; color:#854d0e; }
  .chat { display:flex; flex-direction:column; gap:10px; }
  .msg { max-width:85%; background:#fff; border:2px solid #e4d4fb; border-radius:16px; padding:8px 12px; }
  .msg.me { align-self:flex-end; background:#ede9fe; }
  .msg .who { font-size:13px; font-weight:700; color:var(--purple); }
  .msg .when { font-size:12px; color:#8b7baf; }
  .flag { color:#b91c1c; font-weight:700; }
  .worry { background:#fff7ed; border:3px solid #fb923c; border-radius:16px; padding:12px 14px; margin:8px 0; color:#2e1065; }
  .worry .quote { display:block; background:#fff; border-radius:12px; padding:8px 12px; margin:6px 0; font-size:17px; }
  .worry.seen { background:#f5f5f4; border-color:#d6d3d1; }
  .notice { background:#dcfce7; color:#166534; border-radius:12px; padding:10px 14px; margin-bottom:16px; }
  .error { background:#fee2e2; color:#991b1b; border-radius:12px; padding:10px 14px; margin-bottom:16px; }
  a { color: var(--glow); }
  .card a { color: var(--purple); }
  .card a.btn { color: #fff; }
</style></head><body><main>
<header><span class="logo">🚀 Emotion Tree</span></header>
${body}
</main>${refreshScript}</body></html>`;
}

/** A form button that POSTs (with the csrf value). */
export function postButton(action, label, fields = {}, { csrf = '', className = '' } = {}) {
  const hidden = Object.entries({ ...fields, csrf })
    .map(([k, v]) => `<input type="hidden" name="${e(k)}" value="${e(v)}">`)
    .join('');
  return `<form method="post" action="${e(action)}" style="display:inline">${hidden}<button class="${e(className)}">${e(label)}</button></form>`;
}

/** A simple message page (errors, "done!"). */
export function messagePage(title, text, link) {
  return page(title, `<div class="card"><h1>${e(title)}</h1><p>${text}</p>${link ? `<p><a class="btn" href="${e(link.url)}">${e(link.label)}</a></p>` : ''}</div>`);
}

/** Describes one chat message as HTML. */
export function messageHtml(msg, describe, isMine, voiceUrl) {
  const who = e(describe.sender(msg));
  const when = new Date(msg.createdAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
  let body;
  if (msg.kind === 'voice') {
    body = `🎤 Voice message (${msg.seconds ?? '?'}s)<br><audio controls preload="none" src="${e(voiceUrl(msg))}"></audio>`;
  } else {
    body = e(describe.text(msg));
  }
  const flag = msg.reported ? '<div class="flag">⚑ Your child pressed "Tell my grown-up" on this message</div>' : '';
  return `<div class="msg ${isMine ? 'me' : ''}"><div class="who">${who}</div><div>${body}</div><div class="when">${e(when)}</div>${flag}</div>`;
}

/** Small script that reloads a chat every few seconds without losing typing. */
export function chatRefreshScript() {
  return `<script>
setInterval(async () => {
  const box = document.getElementById('chat');
  if (!box) return;
  const res = await fetch(location.href, { headers: { 'X-Partial': 'chat' } });
  if (res.ok) box.innerHTML = await res.text();
}, 5000);
</script>`;
}
