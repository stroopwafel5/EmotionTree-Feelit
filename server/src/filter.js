/**
 * filter.js
 * --------------------------------------------------------------------------
 * The safety filter for TYPED messages (ready-made phrases and feelings
 * never need it - they can only be the exact texts in the app).
 *
 * A typed message is stopped when it has:
 *   - a link or web address, or a picture written as data (no pictures!)
 *   - an email address or an @handle
 *   - a phone number (6 or more digits)
 *   - a home address, or asks for one
 *   - an invite to another app ("add me on ...", "text me")
 *   - a request to keep secrets from grown-ups
 *   - unkind or rude words
 *
 * The child gets a friendly reason in easy English. The parent can see
 * stopped messages on the parent page.
 *
 * This is a simple first filter for a prototype. Before a real launch, add a
 * professional moderation service as well.
 */

const RULES = [
  {
    reason: 'pictures',
    test: /data:\w+\/[\w.+-]+;base64|<img|\.(png|jpe?g|gif|webp|heic|bmp)\b/i,
    message: 'Pictures can\'t be sent here. You can send words, phrases and feelings. 💜',
  },
  {
    reason: 'email',
    test: /[^\s@]+@[^\s@]+\.[^\s@]+|(^|\s)@[a-z0-9_.]{2,}/i,
    message: 'Emails and @names can\'t be sent here. This keeps you safe. 💜',
  },
  {
    reason: 'link',
    test: /(https?:\/\/|www\.)|\b[a-z0-9-]+\.(com|net|org|io|co|me|ly|gg|app|xyz|info|ru|il|uk|de|fr|nl|tv|link|site)\b/i,
    message: 'Links can\'t be sent here. This keeps you safe. 💜',
  },
  {
    reason: 'phone',
    test: /(\d[\s\-().]*){6,}/,
    message: 'Phone numbers can\'t be sent here. This keeps you safe. 💜',
  },
  {
    reason: 'address',
    test: /\b\d+\s+\w+(\s\w+)?\s+(street|st|road|rd|avenue|ave|lane|ln|drive|dr|boulevard|blvd|way|place|pl)\b|\b(my address|home address|your address|i live (at|on)|where do you live|what school do you go to)\b/i,
    message: 'Addresses can\'t be shared here. Keep your home a secret from the internet. 💜',
  },
  {
    reason: 'other-app',
    test: /\b(snap ?chat|snap me|insta(gram)?|tik ?tok|whats ?app|discord|telegram|kik|facebook|messenger|wechat|signal app|text me|call me|my number|your number|phone number|meet me|meet up)\b/i,
    message: 'Let\'s keep chatting here in Emotion Tree, where it\'s safe. 💜',
  },
  {
    reason: 'secret',
    test: /\b(do ?n[o']?t tell (anyone|anybody|nobody|(your|ur|my) ?(mom|mum|dad|parents?|grown[- ]?ups?|teacher))|keep (it|this) (a )?secret|our secret|delete (this|the) (chat|message))\b/i,
    message: 'Secrets that grown-ups can\'t know are not OK. If something feels wrong, tell your grown-up. 💜',
  },
  {
    reason: 'unkind',
    test: /\b(stupid|idiot|dumb|loser|ugly|shut ?up|hate you|kill|die|retard(ed)?|freak|weirdo|f+u+c+k\w*|sh[i1]t\w*|b[i1]tch\w*|a+ss+hole|bastard|damn|crap|piss\w*|dick|wtf|stfu)\b/i,
    message: 'Let\'s use kind words. 💜',
  },
];

/**
 * Checks a typed message.
 * @returns {{ok: true, text: string} | {ok: false, reason: string, message: string}}
 */
export function checkText(text, maxLength = 200) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length === 0) {
    return { ok: false, reason: 'empty', message: 'Please type a message first.' };
  }
  if (clean.length > maxLength) {
    return {
      ok: false,
      reason: 'too-long',
      message: `That's a long message! Please keep it under ${maxLength} letters.`,
    };
  }
  for (const rule of RULES) {
    if (rule.test.test(clean)) {
      return { ok: false, reason: rule.reason, message: rule.message };
    }
  }
  return { ok: true, text: clean };
}

/**
 * Checks a short name (a buddy's name, a group's name): letters, numbers,
 * spaces and a few marks, 1-20 characters, and it must pass checkText.
 */
export function checkName(name) {
  const clean = String(name ?? '').trim();
  if (!/^[\p{L}\p{N} .'-]{1,20}$/u.test(clean)) {
    return { ok: false, message: 'Names can have 1-20 letters, numbers and spaces.' };
  }
  const result = checkText(clean, 20);
  return result.ok ? { ok: true, name: clean } : result;
}
