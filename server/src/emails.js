/**
 * emails.js
 * --------------------------------------------------------------------------
 * The emails the server sends, in plain, friendly English.
 * Every email has an HTML version and a plain-text version.
 *
 * The buttons open a page on the server that ASKS before doing anything
 * (e.g. "Approve" / "Decline"). Email programs sometimes open links by
 * themselves to scan them, so a link alone never approves anything.
 */
import { escapeHtml } from './pages.js';

/** Shared look for all emails. */
function layout(title, paragraphs, button) {
  const body = paragraphs.map(p => `<p style="margin:0 0 14px">${p}</p>`).join('');
  const html = `<!doctype html><html><body style="margin:0;background:#f5eeff;font-family:Arial,Helvetica,sans-serif;color:#2e1065">
<div style="max-width:560px;margin:0 auto;padding:24px">
  <div style="background:#1a0b3d;color:#fff;border-radius:20px 20px 0 0;padding:18px 24px;font-size:20px;font-weight:bold">🚀 Emotion Tree</div>
  <div style="background:#fff;border:3px solid #c084fc;border-top:0;border-radius:0 0 20px 20px;padding:24px;font-size:16px;line-height:1.5">
    <h1 style="font-size:22px;margin:0 0 16px">${title}</h1>
    ${body}
    ${button ? `<p style="margin:24px 0 8px"><a href="${button.url}" style="background:#9333ea;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:bold;display:inline-block">${button.label}</a></p><p style="font-size:13px;color:#6b5a8e">Or copy this link: ${button.url}</p>` : ''}
  </div>
  <p style="font-size:12px;color:#6b5a8e;text-align:center">You get this email because your email address was used for a child's account in Emotion Tree. If this wasn't you, you can ignore it.</p>
</div></body></html>`;
  // Plain-text version: links become "label (address)", <br> becomes a new line.
  const toText = p =>
    p
      .replace(/<a href="([^"]+)">([^<]*)<\/a>/g, '$2 ($1)')
      .replace(/<br>/g, '\n')
      .replace(/<[^>]+>/g, '');
  const text = [title, '', ...paragraphs.map(toText), button ? `\n${button.label}: ${button.url}` : ''].join('\n');
  return { html, text };
}

/** "Turn on Friends for your child?" - sent when the app connects. */
export function verifyEmail(kid, url) {
  const name = escapeHtml(kid.username);
  return {
    subject: `Turn on Friends for ${kid.username}?`,
    ...layout(
      `Turn on Friends for ${name}?`,
      [
        `Someone asked to turn on <b>Friends</b> for <b>${name}</b> in the Emotion Tree app.`,
        'With Friends, your child can chat with friends that <b>you</b> approve:',
        '• Friends are added with a friend code only. Nobody can search for your child.<br>• Every new friend needs your OK by email, the other child\'s parent\'s OK, and the friend\'s OK.<br>• Children chat with ready-made phrases and feeling cards. <b>Typed messages and voice messages are OFF</b> until you turn them on.<br>• Pictures can never be sent.<br>• You can read all of your child\'s chats on your parent page.',
      ],
      { label: 'Open the page to say yes', url },
    ),
  };
}

/** A friend request needs this parent's OK. */
export function friendRequestEmail(kid, other, url) {
  const name = escapeHtml(kid.username);
  const otherName = escapeHtml(other.username);
  return {
    subject: `${kid.username} and ${other.username} want to be friends`,
    ...layout(
      `${name} and ${otherName} want to be friends`,
      [
        `<b>${name}</b> (your child) and <b>${otherName}</b> (friend code ${escapeHtml(other.friendCode)}) asked to become friends in Emotion Tree.`,
        'They become friends only when <b>both</b> parents say yes and the child accepts. Then they can chat with phrases and feelings, plus typed or voice messages only if you turned those on.',
        'Do you know this child? If you\'re not sure, it\'s OK to say no.',
        'You can also answer in the app: <b>Friends → Grown-up corner</b> (with your grown-up PIN).',
      ],
      { label: 'Open the page to approve or decline', url },
    ),
  };
}

/** A school invited the child to a group. */
export function groupInviteEmail(kid, group, school, url) {
  const name = escapeHtml(kid.username);
  return {
    subject: `${school.name} invited ${kid.username} to "${group.name}"`,
    ...layout(
      `${escapeHtml(school.name)} invited ${name} to a group`,
      [
        `<b>${escapeHtml(school.name)}</b> invited <b>${name}</b> to the group <b>"${escapeHtml(group.name)}"</b>.`,
        'In a group, the children and the teacher chat together. Your settings for typed and voice messages still apply. You can read the group chat on your parent page, and you can take your child out of the group at any time.',
        'You can also answer in the app: <b>Friends → Grown-up corner</b> (with your grown-up PIN).',
      ],
      { label: 'Open the page to approve or decline', url },
    ),
  };
}

/** The child pressed "Tell my grown-up" on a message. */
export function reportEmail(kid, messageText, fromName, url) {
  return {
    subject: `${kid.username} pressed "Tell my grown-up"`,
    ...layout(
      `${escapeHtml(kid.username)} wants you to see a message`,
      [
        `<b>${escapeHtml(kid.username)}</b> pressed <b>"Tell my grown-up"</b> on a message from <b>${escapeHtml(fromName)}</b>:`,
        `<span style="display:block;background:#f5eeff;border-radius:12px;padding:12px">${escapeHtml(messageText)}</span>`,
        'You can see the whole chat, remove the friend, or change the settings on your parent page.',
      ],
      { label: 'Open my parent page', url },
    ),
  };
}

/**
 * The child told their space buddy something worrying. For privacy, the
 * email does NOT say what it was: the parent reads it on the parent page.
 */
export function buddyAlertParentEmail(kid, url) {
  const name = escapeHtml(kid.username);
  return {
    subject: `Please check in with ${kid.username}`,
    ...layout(
      `Please check in with ${name} 💜`,
      [
        `<b>${name}</b> told their space buddy (in the Emotion Tree app) something that a grown-up should know about.`,
        'For privacy, this email does not say what it was. Please open your parent page to read it, and talk with your child soon.',
        'If you think your child is in danger right now, call your local emergency number.',
      ],
      { label: 'Open my parent page', url },
    ),
  };
}

/** The same, for the school of the child's group (also without the child's words). */
export function buddyAlertSchoolEmail(school, kid, url) {
  const name = escapeHtml(kid.username);
  return {
    subject: 'A child in your group needs a grown-up',
    ...layout(
      'A child in your group needs a grown-up',
      [
        `<b>${name}</b>, a child in one of your groups at <b>${escapeHtml(school.name)}</b>, told their space buddy something that a grown-up should know about. Their parent was told too.`,
        'For privacy, this email does not say what it was. Please log in to the school page to read it, and follow your school\'s safeguarding steps.',
      ],
      { label: 'Open the school page', url },
    ),
  };
}

/** A sign-in link for the parent page. */
export function parentLoginEmail(url) {
  return {
    subject: 'Your Emotion Tree parent page',
    ...layout(
      'Your parent page',
      [
        'Here is your link to the parent page. There you can approve friends and groups, read your child\'s chats, chat with your child, and turn typed and voice messages on or off.',
        'The link works once, for 7 days.',
      ],
      { label: 'Open my parent page', url },
    ),
  };
}

/** A sign-in link for the school page. */
export function schoolLoginEmail(school, url) {
  return {
    subject: `Your Emotion Tree school page (${school.name})`,
    ...layout(
      `School page for ${escapeHtml(school.name)}`,
      [
        'Here is your link to the school page. There you can make groups, invite children with their friend code, and chat with your groups.',
        'Each child joins a group only after their parent approves. The link works once, for 7 days. On the school page you can set a password, so next time you can log in without an email.',
      ],
      { label: 'Open the school page', url },
    ),
  };
}

/** Heads-up: a grown-up turned on Friends in the app with the grown-up PIN. */
export function friendsOnEmail(kid, parentPageUrl, turnOffUrl) {
  const name = escapeHtml(kid.username);
  return {
    subject: `Friends is on for ${kid.username}`,
    ...layout(
      `Friends is on for ${name}`,
      [
        `A grown-up turned on <b>Friends</b> for <b>${name}</b> in the Emotion Tree app, and made a grown-up PIN.`,
        '• Friends are added with a friend code only. Nobody can search for your child.<br>• Every new friend needs your OK (in the app with the PIN, or by email), the other parent\'s OK, and the friend\'s OK.<br>• Children chat with ready-made phrases and feeling cards. <b>Typed messages and voice messages are OFF</b> until you turn them on.<br>• Pictures can never be sent.',
        `Not OK? <a href="${turnOffUrl}">Turn off Friends for ${name}</a>.`,
      ],
      { label: 'Open my parent page', url: parentPageUrl },
    ),
  };
}
