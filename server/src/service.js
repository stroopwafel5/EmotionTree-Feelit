/**
 * service.js
 * --------------------------------------------------------------------------
 * ALL the rules of Friends, chats and groups live here, in one place:
 *
 * ACCOUNTS
 *  - A child's account is turned on for Friends only after a grown-up says
 *    yes ("verified"): straight away in the app with the account password +
 *    a new 4-number GROWN-UP PIN, or (older apps) by email.
 *  - The grown-up PIN approves things in the child's app (friends, group
 *    invites, typing/voice). It is stored only as a hash, and 5 wrong tries
 *    lock it for 5 minutes. Emails still go to the parent as a heads-up.
 *  - Typed messages and voice messages are OFF until the parent turns them on.
 *
 * FRIENDS (a child can only add a friend by friend code - no searching)
 *  1. Child A types child B's friend code.
 *  2. BOTH parents must approve (in their child's app with the grown-up
 *     PIN, or with the button in the email they get).
 *  3. Only then does child B see the request, and B must accept.
 *  Any "no" stops the request.
 *
 * GROUPS
 *  - ONLY schools / kindergartens can make groups. Schools are added by the
 *    app owner (admin). Kids and parents can't make groups.
 *  - A school invites a child by friend code; the child joins only after
 *    their parent approves (grown-up PIN in the app, or email).
 *
 * MESSAGES
 *  - Kinds: "phrase" (ready-made), "feeling" (a feeling card), "text"
 *    (typed) and "voice". Nothing else - there is NO way to send pictures.
 *  - Phrases and feelings are always allowed.
 *  - Typed / voice messages follow each parent's settings:
 *      one-to-one chat: allowed only if BOTH parents turned it on
 *      group chat:      allowed if the sender's parent turned it on
 *      chat with own parent: always allowed
 *    A child whose parent turned typed (or voice) messages off sees
 *    "typed message (turned off)" instead. Teachers' messages always show.
 *
 * WHO CAN READ WHAT
 *  - A child: their own one-to-one chats, groups they are in, and the chat
 *    with their own parent.
 *  - A parent: ONLY the chats of their own children (one-to-one, groups the
 *    child is in, and the parent chat). Nothing else.
 *  - A school: only its own groups.
 *
 * SPACE BUDDY WORRY ALERTS
 *  - Ordinary chats with the space buddy never reach the server.
 *  - When a child tells the buddy something worrying (someone hurting them,
 *    unsafe touching...), the app sends THAT ONE message here. Only the
 *    child's parent and the schools of the child's groups can read it.
 *
 * Conversation keys:
 *   "d:3:8" = one-to-one chat between kids 3 and 8
 *   "p:3"   = chat between kid 3 and their parent
 *   "g:5"   = group 5
 */
import { HttpError } from './http.js';
import { checkName, checkText } from './filter.js';
import { hashPassword, checkPassword, newToken, tokenHash, newFriendCode } from './security.js';

export class Service {
  constructor(store, content, config) {
    this.store = store;
    this.content = content;
    this.config = config;
    /** Wrong grown-up PIN tries: kidId -> { count, until }. */
    this.pinFails = new Map();
  }

  get db() {
    return this.store.db;
  }

  // ==========================================================================
  // Kids
  // ==========================================================================

  kid(id) {
    const kid = this.db.kids[id];
    if (!kid) {
      throw new HttpError(404, 'This child was not found.');
    }
    return kid;
  }

  /** What other children may see about a child. */
  publicKid(kid) {
    return {
      id: kid.id,
      username: kid.username,
      look: kid.look,
      pet: kid.pet,
      feeling: kid.feeling,
    };
  }

  /** What a child sees about themselves. */
  selfKid(kid) {
    const [name, domain] = kid.parentEmail.split('@');
    return {
      ...this.publicKid(kid),
      friendCode: kid.friendCode,
      verified: kid.verified,
      settings: kid.settings,
      hasPin: Boolean(kid.pinHash),
      parentEmailHint: `${name.slice(0, 2)}***@${domain}`,
    };
  }

  /**
   * Turns on Friends for a child (first time), or logs the app in again.
   * With a grown-up `pin` (4 numbers), Friends is on straight away: the
   * grown-up typed the account password and made a PIN in the app.
   * Returns { kid, token, isNew, verifiedNow }.
   */
  connect({ username, parentEmail, password, pin }) {
    const withPin = pin !== undefined && pin !== null && pin !== '';
    if (withPin && !this.validPin(pin)) {
      throw new HttpError(400, 'The grown-up PIN must be 4 numbers.');
    }
    const name = String(username ?? '').trim();
    const email = String(parentEmail ?? '').trim().toLowerCase();
    if (!/^[A-Za-z0-9_]{3,20}$/.test(name)) {
      throw new HttpError(400, 'Usernames have 3-20 letters, numbers or _.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(400, 'Please use a real parent email.');
    }
    if (String(password ?? '').length < 8) {
      throw new HttpError(400, 'The password needs at least 8 characters.');
    }
    let kid = Object.values(this.db.kids).find(k => k.usernameLower === name.toLowerCase());
    let isNew = false;
    if (kid) {
      if (kid.parentEmail !== email || !checkPassword(password, kid.salt, kid.passwordHash)) {
        throw new HttpError(401, 'This username is already used in Friends with a different password or email.');
      }
      if (withPin) {
        // A PIN already exists? Then it must be that one.
        if (kid.pinHash) {
          this.checkPin(kid, pin);
        } else {
          this.setPin(kid, pin);
        }
      }
    } else {
      const { salt, hash } = hashPassword(password);
      let friendCode;
      do {
        friendCode = newFriendCode();
      } while (Object.values(this.db.kids).some(k => k.friendCode === friendCode));
      kid = {
        id: this.store.nextId('kid'),
        username: name,
        usernameLower: name.toLowerCase(),
        parentEmail: email,
        salt,
        passwordHash: hash,
        friendCode,
        verified: false,
        settings: { freeText: false, voice: false },
        look: null,
        pet: null,
        feeling: null,
        lastRead: {},
        createdAt: new Date().toISOString(),
      };
      this.db.kids[kid.id] = kid;
      isNew = true;
    }
    let verifiedNow = false;
    if (withPin) {
      if (!kid.pinHash) {
        this.setPin(kid, pin);
      }
      if (!kid.verified) {
        kid.verified = true;
        verifiedNow = true;
      }
    }
    const token = newToken();
    this.db.sessions[tokenHash(token)] = { kidId: kid.id, createdAt: Date.now() };
    this.store.save();
    return { kid, token, isNew, verifiedNow };
  }

  // ==========================================================================
  // Grown-up PIN
  // ==========================================================================

  validPin(pin) {
    return /^\d{4}$/.test(String(pin ?? ''));
  }

  setPin(kid, pin) {
    if (!this.validPin(pin)) {
      throw new HttpError(400, 'The grown-up PIN must be 4 numbers.');
    }
    const { salt, hash } = hashPassword(String(pin));
    kid.pinSalt = salt;
    kid.pinHash = hash;
    this.pinFails.delete(kid.id);
    this.store.save();
  }

  /** Checks the grown-up PIN. 5 wrong tries: wait 5 minutes. */
  checkPin(kid, pin) {
    const now = Date.now();
    const fails = this.pinFails.get(kid.id);
    if (fails && fails.until > now) {
      const minutes = Math.ceil((fails.until - now) / 60000);
      throw new HttpError(429, `Too many wrong PINs. Please wait ${minutes} minute${minutes === 1 ? '' : 's'}.`);
    }
    if (!kid.pinHash) {
      throw new HttpError(400, 'There is no grown-up PIN yet. A grown-up can make one on the parent page.');
    }
    if (!this.validPin(pin) || !checkPassword(String(pin), kid.pinSalt, kid.pinHash)) {
      const count = (fails?.count ?? 0) + 1;
      if (count >= 5) {
        this.pinFails.set(kid.id, { count: 0, until: now + 5 * 60 * 1000 });
        throw new HttpError(429, 'Too many wrong PINs. Please wait 5 minutes.');
      }
      this.pinFails.set(kid.id, { count, until: 0 });
      throw new HttpError(403, `Wrong grown-up PIN. ${5 - count} ${5 - count === 1 ? 'try' : 'tries'} left.`);
    }
    this.pinFails.delete(kid.id);
  }

  /** Things waiting for this child's grown-up to approve. */
  waitingFor(kid) {
    const waiting = [];
    for (const r of Object.values(this.db.requests)) {
      if (r.status !== 'pending') {
        continue;
      }
      if (r.fromKid === kid.id && r.parentFrom === 'pending') {
        const other = this.kid(r.toKid);
        waiting.push({ type: 'friend', id: r.id, text: `${kid.username} wants to be friends with ${other.username} (${other.friendCode})` });
      }
      if (r.toKid === kid.id && r.parentTo === 'pending') {
        const other = this.kid(r.fromKid);
        waiting.push({ type: 'friend', id: r.id, text: `${other.username} (${other.friendCode}) wants to be friends with ${kid.username}` });
      }
    }
    for (const m of this.db.groupMembers) {
      if (m.kidId === kid.id && m.parent === 'pending' && this.db.groups[m.groupId]) {
        const g = this.db.groups[m.groupId];
        waiting.push({ type: 'group', id: g.id, text: `${this.school(g.schoolId).name} invited ${kid.username} to the group "${g.name}"` });
      }
    }
    return waiting;
  }

  /** A grown-up approves or declines a friend request / group invite for this child. */
  grownUpDecide(kid, type, id, approve) {
    if (type === 'friend') {
      const request = this.request(Number(id));
      const side = request.fromKid === kid.id ? 'from' : request.toKid === kid.id ? 'to' : null;
      if (!side) {
        throw new HttpError(403, 'This request is not about your child.');
      }
      return this.parentDecideFriend(request.id, side, approve);
    }
    if (type === 'group') {
      return this.parentDecideGroup(Number(id), kid.id, approve);
    }
    throw new HttpError(400, 'Unknown kind of approval.');
  }

  /** Turns typed / voice messages on or off for a child. */
  setSettings(kid, changes) {
    const next = { ...kid.settings };
    for (const key of ['freeText', 'voice']) {
      if (changes && typeof changes[key] === 'boolean') {
        next[key] = changes[key];
      }
    }
    kid.settings = next;
    this.store.save();
    return next;
  }

  /** A school sets a password, so it can log in without an email link. */
  setSchoolPassword(school, password) {
    if (String(password ?? '').length < 8) {
      throw new HttpError(400, 'The password needs at least 8 characters.');
    }
    const { salt, hash } = hashPassword(String(password));
    school.salt = salt;
    school.passwordHash = hash;
    this.store.save();
  }

  /** The school with this email and password, or null. */
  schoolByPassword(email, password) {
    const clean = String(email ?? '').trim().toLowerCase();
    const school = Object.values(this.db.schools).find(s => s.email === clean);
    if (!school || !school.passwordHash || !checkPassword(String(password ?? ''), school.salt, school.passwordHash)) {
      return null;
    }
    return school;
  }

  /** "Turn off Friends" (from the parent's email): logs the app out too. */
  disableFriends(kid) {
    kid.verified = false;
    for (const [hash, session] of Object.entries(this.db.sessions)) {
      if (session.kidId === kid.id) {
        delete this.db.sessions[hash];
      }
    }
    this.store.save();
  }

  /** Finds the child for an app token. */
  kidForToken(token) {
    const session = token ? this.db.sessions[tokenHash(token)] : undefined;
    const kid = session ? this.db.kids[session.kidId] : undefined;
    if (!kid) {
      throw new HttpError(401, 'Please turn on Friends again.');
    }
    return kid;
  }

  requireVerified(kid) {
    if (!kid.verified) {
      throw new HttpError(403, 'Your grown-up has not said yes to Friends yet. Ask them to check their email.');
    }
  }

  /**
   * Saves the weekly check-up the app sends (missions per week, streak,
   * test scores), so the parent page can show it. Everything is checked
   * and kept small.
   */
  setProgress(kid, body) {
    const int = (v, min, max) => {
      const n = Number(v);
      if (!Number.isInteger(n) || n < min || n > max) {
        throw new HttpError(400, 'This progress report is not valid.');
      }
      return n;
    };
    const list = (v, max) => {
      if (!Array.isArray(v) || v.length > max) {
        throw new HttpError(400, 'This progress report is not valid.');
      }
      return v;
    };
    const b = body && typeof body === 'object' ? body : {};
    const weeks = list(b.weeks ?? [], 8).map(w => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(w?.start))) {
        throw new HttpError(400, 'This progress report is not valid.');
      }
      return { start: String(w.start), missions: int(w.missions, 0, 200), goal: int(w.goal, 1, 14) };
    });
    const tests = list(b.tests ?? [], 5).map(t => {
      const at = new Date(String(t?.at));
      const total = int(t?.total, 1, 100);
      const score = int(t?.score, 0, total);
      if (Number.isNaN(at.getTime())) {
        throw new HttpError(400, 'This progress report is not valid.');
      }
      return { at: at.toISOString(), score, total };
    });
    kid.progress = {
      weeklyGoal: int(b.weeklyGoal, 1, 14),
      streak: int(b.streak, 0, 520),
      weeks,
      tests,
      candiesEarned: int(b.candiesEarned ?? 0, 0, 10_000_000),
      updatedAt: new Date().toISOString(),
    };
    this.store.save();
    return kid.progress;
  }

  /** Saves the child's avatar and space buddy. */
  setProfile(kid, { look, pet }) {
    if (look !== undefined) {
      const clean = this.content.cleanHumanLook(look);
      if (!clean) {
        throw new HttpError(400, 'Some parts of this look are unknown.');
      }
      kid.look = clean;
    }
    if (pet !== undefined) {
      const clean = this.content.cleanPet(pet);
      if (!clean) {
        throw new HttpError(400, 'Some parts of this space buddy are unknown, or the name is not OK.');
      }
      kid.pet = clean;
    }
    this.store.save();
  }

  /** Saves how the child feels right now (or null to clear it). */
  setFeeling(kid, feeling) {
    if (feeling !== null && !this.content.feeling(feeling)) {
      throw new HttpError(400, 'Unknown feeling.');
    }
    kid.feeling = feeling;
    this.store.save();
  }

  // ==========================================================================
  // Email links (one random token per link; only its hash is stored)
  // ==========================================================================

  makeLink(data) {
    const token = newToken();
    this.db.links[tokenHash(token)] = {
      ...data,
      expires: Date.now() + this.config.linkLifetimeMs,
    };
    this.store.save();
    return token;
  }

  readLink(token, type) {
    const link = token ? this.db.links[tokenHash(token)] : undefined;
    if (!link || link.type !== type || link.expires < Date.now()) {
      throw new HttpError(400, 'This link is not valid any more. Please ask for a new one.');
    }
    return link;
  }

  /**
   * Email links work ONCE: after the button was pressed, the link is
   * deleted (a forwarded or old email can't be used again).
   */
  useLink(token) {
    delete this.db.links[tokenHash(token)];
    this.store.save();
  }

  /** The parent confirms Friends for their child. */
  verifyKid(kidId) {
    const kid = this.kid(kidId);
    kid.verified = true;
    this.store.save();
    return kid;
  }

  // ==========================================================================
  // Friends
  // ==========================================================================

  areFriends(a, b) {
    const [x, y] = a < b ? [a, b] : [b, a];
    return this.db.friendships.some(f => f.a === x && f.b === y);
  }

  friendsOf(kidId) {
    return this.db.friendships
      .filter(f => f.a === kidId || f.b === kidId)
      .map(f => this.db.kids[f.a === kidId ? f.b : f.a])
      .filter(Boolean);
  }

  /** Child `kid` asks to be friends with the child who has `friendCode`. */
  requestFriend(kid, friendCode) {
    this.requireVerified(kid);
    const code = String(friendCode ?? '').trim().toUpperCase();
    const other = Object.values(this.db.kids).find(k => k.friendCode === code);
    if (!other || !other.verified) {
      throw new HttpError(404, 'No friend has this code. Check the code with your friend.');
    }
    if (other.id === kid.id) {
      throw new HttpError(400, 'That is your own code! 😄');
    }
    if (this.areFriends(kid.id, other.id)) {
      throw new HttpError(400, 'You are already friends! 💜');
    }
    const open = Object.values(this.db.requests).find(
      r =>
        r.status === 'pending' &&
        ((r.fromKid === kid.id && r.toKid === other.id) || (r.fromKid === other.id && r.toKid === kid.id)),
    );
    if (open) {
      throw new HttpError(400, 'There is already a friend request between you. Your grown-ups will get to it soon.');
    }
    const pendingCount = Object.values(this.db.requests).filter(
      r => r.fromKid === kid.id && r.status === 'pending',
    ).length;
    if (pendingCount >= 20) {
      throw new HttpError(429, 'You have lots of waiting requests. Please wait for your grown-ups first.');
    }
    const request = {
      id: this.store.nextId('request'),
      fromKid: kid.id,
      toKid: other.id,
      parentFrom: 'pending',
      parentTo: 'pending',
      friend: 'pending',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.db.requests[request.id] = request;
    this.store.save();
    return { request, other };
  }

  request(id) {
    const request = this.db.requests[id];
    if (!request) {
      throw new HttpError(404, 'This friend request was not found.');
    }
    return request;
  }

  /**
   * A parent decides on a friend request. `side` is "from" or "to" (whose
   * parent is deciding). Returns the request.
   */
  parentDecideFriend(requestId, side, approve) {
    const request = this.request(requestId);
    if (request.status !== 'pending') {
      return request;
    }
    const field = side === 'from' ? 'parentFrom' : 'parentTo';
    request[field] = approve ? 'approved' : 'declined';
    if (!approve) {
      request.status = 'declined';
    }
    this.store.save();
    return request;
  }

  /** Child B accepts or declines (only after both parents said yes). */
  kidDecideFriend(kid, requestId, accept) {
    const request = this.request(requestId);
    if (request.toKid !== kid.id || request.status !== 'pending') {
      throw new HttpError(404, 'This friend request was not found.');
    }
    if (request.parentFrom !== 'approved' || request.parentTo !== 'approved') {
      throw new HttpError(400, 'Your grown-ups have not said yes yet.');
    }
    request.friend = accept ? 'accepted' : 'declined';
    request.status = accept ? 'approved' : 'declined';
    if (accept) {
      const [a, b] = request.fromKid < request.toKid ? [request.fromKid, request.toKid] : [request.toKid, request.fromKid];
      this.db.friendships.push({ a, b, since: new Date().toISOString() });
    }
    this.store.save();
    return request;
  }

  /** Child A takes back a request that is still waiting. */
  cancelRequest(kid, requestId) {
    const request = this.request(requestId);
    if (request.fromKid !== kid.id || request.status !== 'pending') {
      throw new HttpError(404, 'This friend request was not found.');
    }
    request.status = 'cancelled';
    this.store.save();
  }

  /** Ends a friendship (by either child, or by either child's parent). */
  removeFriend(kidId, otherId) {
    const [a, b] = kidId < otherId ? [kidId, otherId] : [otherId, kidId];
    this.db.friendships = this.db.friendships.filter(f => !(f.a === a && f.b === b));
    this.store.save();
  }

  // ==========================================================================
  // Schools and groups
  // ==========================================================================

  /** Adds a school / kindergarten (admin only - see routes). */
  addSchool({ name, email, kind }) {
    const cleanName = String(name ?? '').trim();
    const cleanEmail = String(email ?? '').trim().toLowerCase();
    if (cleanName.length < 2 || cleanName.length > 60) {
      throw new HttpError(400, 'The school name needs 2-60 characters.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new HttpError(400, 'Please give a real school email.');
    }
    const school = {
      id: this.store.nextId('school'),
      name: cleanName,
      email: cleanEmail,
      kind: kind === 'kindergarten' ? 'kindergarten' : 'school',
      createdAt: new Date().toISOString(),
    };
    this.db.schools[school.id] = school;
    this.store.save();
    return school;
  }

  school(id) {
    const school = this.db.schools[id];
    if (!school) {
      throw new HttpError(404, 'School not found.');
    }
    return school;
  }

  /** ONLY a school can call this (the routes check the school login). */
  createGroup(school, name) {
    const checked = checkName(name);
    if (!checked.ok) {
      throw new HttpError(400, checked.message);
    }
    const group = {
      id: this.store.nextId('group'),
      schoolId: school.id,
      name: checked.name,
      createdAt: new Date().toISOString(),
    };
    this.db.groups[group.id] = group;
    this.store.save();
    return group;
  }

  /** A group that belongs to this school (or an error). */
  schoolGroup(school, groupId) {
    const group = this.db.groups[groupId];
    if (!group || group.schoolId !== school.id) {
      throw new HttpError(404, 'Group not found.');
    }
    return group;
  }

  deleteGroup(school, groupId) {
    const group = this.schoolGroup(school, groupId);
    delete this.db.groups[group.id];
    this.db.groupMembers = this.db.groupMembers.filter(m => m.groupId !== group.id);
    this.store.save();
  }

  member(groupId, kidId) {
    return this.db.groupMembers.find(m => m.groupId === groupId && m.kidId === kidId);
  }

  /** The school invites a child (by friend code). The parent must approve. */
  inviteToGroup(school, groupId, friendCode) {
    const group = this.schoolGroup(school, groupId);
    const code = String(friendCode ?? '').trim().toUpperCase();
    const kid = Object.values(this.db.kids).find(k => k.friendCode === code);
    if (!kid || !kid.verified) {
      throw new HttpError(404, 'No child has this friend code (or their parent has not turned on Friends yet).');
    }
    if (this.member(group.id, kid.id)) {
      throw new HttpError(400, 'This child is already invited or in the group.');
    }
    const member = { groupId: group.id, kidId: kid.id, parent: 'pending', invitedAt: new Date().toISOString() };
    this.db.groupMembers.push(member);
    this.store.save();
    return { group, kid, member };
  }

  parentDecideGroup(groupId, kidId, approve) {
    const member = this.member(groupId, kidId);
    if (!member) {
      throw new HttpError(404, 'This group invitation was not found.');
    }
    if (member.parent === 'pending') {
      member.parent = approve ? 'approved' : 'declined';
      this.store.save();
    }
    return member;
  }

  /** Takes a child out of a group (by the school, the parent or the child). */
  removeFromGroup(groupId, kidId) {
    this.db.groupMembers = this.db.groupMembers.filter(m => !(m.groupId === groupId && m.kidId === kidId));
    this.store.save();
  }

  /** Groups a child is really in (parent approved). */
  groupsOf(kidId) {
    return this.db.groupMembers
      .filter(m => m.kidId === kidId && m.parent === 'approved')
      .map(m => this.db.groups[m.groupId])
      .filter(Boolean);
  }

  activeMembers(groupId) {
    return this.db.groupMembers
      .filter(m => m.groupId === groupId && m.parent === 'approved')
      .map(m => this.db.kids[m.kidId])
      .filter(Boolean);
  }

  // ==========================================================================
  // Conversations
  // ==========================================================================

  /**
   * Turns what the app asks for ("parent", "friend-8", "group-5") into a
   * conversation the child is allowed to use. Throws if not allowed.
   */
  kidConversation(kid, ref) {
    if (ref === 'parent') {
      return { key: `p:${kid.id}`, type: 'parent' };
    }
    this.requireVerified(kid);
    const friend = /^friend-(\d+)$/.exec(ref);
    if (friend) {
      const otherId = Number(friend[1]);
      if (!this.areFriends(kid.id, otherId)) {
        throw new HttpError(403, 'You can only chat with your friends.');
      }
      const [a, b] = kid.id < otherId ? [kid.id, otherId] : [otherId, kid.id];
      return { key: `d:${a}:${b}`, type: 'friend', other: this.kid(otherId) };
    }
    const group = /^group-(\d+)$/.exec(ref);
    if (group) {
      const groupId = Number(group[1]);
      const member = this.member(groupId, kid.id);
      if (!member || member.parent !== 'approved' || !this.db.groups[groupId]) {
        throw new HttpError(403, 'You are not in this group.');
      }
      return { key: `g:${groupId}`, type: 'group', group: this.db.groups[groupId] };
    }
    throw new HttpError(404, 'Chat not found.');
  }

  /** The kids whose chats a conversation key belongs to. */
  kidsInConversation(key) {
    const [type, x, y] = key.split(':');
    if (type === 'd') {
      return [Number(x), Number(y)];
    }
    if (type === 'p') {
      return [Number(x)];
    }
    if (type === 'g') {
      return this.activeMembers(Number(x)).map(k => k.id);
    }
    return [];
  }

  /** What a child may SEND in this conversation. */
  allowedFor(kid, convo) {
    if (convo.type === 'parent') {
      return { freeText: true, voice: true };
    }
    if (convo.type === 'friend') {
      return {
        freeText: kid.settings.freeText && convo.other.settings.freeText,
        voice: kid.settings.voice && convo.other.settings.voice,
      };
    }
    return { freeText: kid.settings.freeText, voice: kid.settings.voice };
  }

  /** Saves a phrase / feeling / text message. Returns the message or a "stopped" answer. */
  sendMessage(kid, convo, body) {
    const allowed = this.allowedFor(kid, convo);
    const base = {
      id: 0,
      convo: convo.key,
      from: { type: 'kid', id: kid.id },
      createdAt: new Date().toISOString(),
    };
    let msg;
    if (body.kind === 'phrase') {
      if (!this.content.phraseText(body.phraseId)) {
        throw new HttpError(400, 'Unknown phrase.');
      }
      msg = { ...base, kind: 'phrase', phraseId: body.phraseId };
    } else if (body.kind === 'feeling') {
      if (!this.content.feeling(body.feelingId)) {
        throw new HttpError(400, 'Unknown feeling.');
      }
      msg = { ...base, kind: 'feeling', feelingId: body.feelingId };
    } else if (body.kind === 'text') {
      if (!allowed.freeText) {
        throw new HttpError(403, 'Typed messages are turned off in this chat. You can use phrases and feelings. 💜');
      }
      const checked = checkText(body.text, this.config.maxTextLength);
      if (!checked.ok) {
        this.db.blocked.push({
          kidId: kid.id,
          convo: convo.key,
          text: String(body.text ?? '').slice(0, 300),
          reason: checked.reason,
          createdAt: base.createdAt,
        });
        this.store.save();
        return { stopped: true, reason: checked.reason, message: checked.message };
      }
      msg = { ...base, kind: 'text', text: checked.text };
    } else {
      // Anything else (pictures, files, stickers...) is never allowed.
      throw new HttpError(400, 'Only phrases, feelings, typed and voice messages can be sent. No pictures.');
    }
    msg.id = this.store.nextId('message');
    this.db.messages.push(msg);
    this.store.save();
    return { message: msg };
  }

  /** Saves a voice message (the file was already checked to be audio). */
  sendVoice(kid, convo, { mime, ext, seconds, data }) {
    if (!this.allowedFor(kid, convo).voice) {
      throw new HttpError(403, 'Voice messages are turned off in this chat. 💜');
    }
    const id = this.store.nextId('message');
    const fileName = `${id}.${ext}`;
    return { id, fileName, msg: {
      id,
      convo: convo.key,
      from: { type: 'kid', id: kid.id },
      kind: 'voice',
      voiceFile: fileName,
      mime,
      seconds: Math.max(1, Math.min(this.config.maxVoiceSeconds, Math.round(Number(seconds) || 1))),
      createdAt: new Date().toISOString(),
    }, data };
  }

  /** Grown-ups (parent or teacher) send typed messages. */
  sendGrownUpMessage(convoKey, from, text) {
    const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
    if (!clean || clean.length > 1000) {
      throw new HttpError(400, 'Please type a message (up to 1000 letters).');
    }
    const msg = {
      id: this.store.nextId('message'),
      convo: convoKey,
      from,
      kind: 'text',
      text: clean,
      createdAt: new Date().toISOString(),
    };
    this.db.messages.push(msg);
    this.store.save();
    return msg;
  }

  /**
   * The messages a CHILD sees in a conversation (after `afterId`).
   * Typed / voice messages from other children are hidden if the child's
   * parent turned them off. Grown-ups' messages always show.
   */
  messagesForKid(kid, convo, afterId = 0) {
    const list = this.db.messages.filter(m => m.convo === convo.key && m.id > afterId);
    return list.map(m => {
      const fromOtherKid = m.from.type === 'kid' && m.from.id !== kid.id && convo.type !== 'parent';
      if (fromOtherKid && m.kind === 'text' && !kid.settings.freeText) {
        return { ...this.messageOut(m), kind: 'hidden', hiddenKind: 'text', text: undefined };
      }
      if (fromOtherKid && m.kind === 'voice' && !kid.settings.voice) {
        return { ...this.messageOut(m), kind: 'hidden', hiddenKind: 'voice' };
      }
      return this.messageOut(m);
    });
  }

  /** A message as the app gets it (with the sender's name). */
  messageOut(m) {
    return {
      id: m.id,
      kind: m.kind,
      phraseId: m.phraseId,
      feelingId: m.feelingId,
      text: m.text,
      seconds: m.seconds,
      from: { type: m.from.type, id: m.from.id, name: this.senderName(m) },
      createdAt: m.createdAt,
      reported: Boolean(m.reported),
    };
  }

  senderName(m) {
    if (m.from.type === 'kid') {
      return this.db.kids[m.from.id]?.username ?? 'A friend';
    }
    if (m.from.type === 'parent') {
      return 'My grown-up';
    }
    return this.db.schools[m.from.id]?.name ?? 'Teacher';
  }

  /** A message as plain words (for grown-ups' pages and emails). */
  messageText(m) {
    if (m.kind === 'phrase') {
      return this.content.phraseText(m.phraseId) ?? '(phrase)';
    }
    if (m.kind === 'feeling') {
      const f = this.content.feeling(m.feelingId);
      return f ? `${f.emoji} I feel ${f.name.toLowerCase()}` : '(feeling)';
    }
    if (m.kind === 'voice') {
      return `🎤 Voice message (${m.seconds}s)`;
    }
    return m.text ?? '';
  }

  /** Marks messages as read and counts unread ones for a child. */
  markRead(kid, convoKey) {
    const last = this.db.messages.filter(m => m.convo === convoKey).at(-1);
    if (last) {
      kid.lastRead = { ...(kid.lastRead ?? {}), [convoKey]: last.id };
      this.store.save();
    }
  }

  unread(kid, convoKey) {
    const seen = kid.lastRead?.[convoKey] ?? 0;
    return this.db.messages.filter(
      m => m.convo === convoKey && m.id > seen && !(m.from.type === 'kid' && m.from.id === kid.id),
    ).length;
  }

  /** "Tell my grown-up": the child flags a message. */
  report(kid, messageId) {
    const msg = this.db.messages.find(m => m.id === Number(messageId));
    if (!msg || !this.kidsInConversation(msg.convo).includes(kid.id)) {
      throw new HttpError(404, 'Message not found.');
    }
    msg.reported = true;
    this.db.reports.push({ messageId: msg.id, byKid: kid.id, createdAt: new Date().toISOString() });
    this.store.save();
    return msg;
  }

  // ==========================================================================
  // Space buddy worry alerts
  // ==========================================================================

  /**
   * The child told their space buddy something worrying. The app sends ONE
   * message (not the chat). It is kept for the child's parent and for the
   * schools of the child's groups - nobody else can read it.
   * Returns { alert, schools }.
   */
  buddyAlert(kid, { category, text }) {
    this.requireVerified(kid);
    const title = this.content.alertTitle(category);
    if (!title) {
      throw new HttpError(400, 'Unknown kind of worry.');
    }
    const clean = String(text ?? '').trim().slice(0, 300);
    if (!clean) {
      throw new HttpError(400, 'The message is empty.');
    }
    this.db.buddyAlerts = this.db.buddyAlerts ?? [];
    const hourAgo = Date.now() - 60 * 60 * 1000;
    const recent = this.db.buddyAlerts.filter(a => a.kidId === kid.id && Date.parse(a.createdAt) > hourAgo);
    if (recent.length >= 10) {
      throw new HttpError(429, 'Your grown-up got a few messages already. Please go and talk to them.');
    }
    const schoolIds = [...new Set(this.groupsOf(kid.id).map(g => g.schoolId))].filter(id => this.db.schools[id]);
    const alert = {
      id: this.store.nextId('alert'),
      kidId: kid.id,
      category,
      title,
      text: clean,
      createdAt: new Date().toISOString(),
      parentSeen: false,
      schoolIds,
      schoolSeen: [],
    };
    this.db.buddyAlerts.push(alert);
    this.store.save();
    return { alert, schools: schoolIds.map(id => this.db.schools[id]) };
  }

  /** A child's worry alerts, newest first (for their parent only). */
  alertsOfKid(kid) {
    return (this.db.buddyAlerts ?? []).filter(a => a.kidId === kid.id).slice(-30).reverse();
  }

  /** Worry alerts a school may see (children in its groups), newest first. */
  alertsForSchool(school) {
    return (this.db.buddyAlerts ?? []).filter(a => a.schoolIds.includes(school.id)).slice(-50).reverse();
  }

  /** The parent marks an alert as "talked about". */
  parentSawAlert(kid, alertId) {
    const alert = (this.db.buddyAlerts ?? []).find(a => a.id === Number(alertId) && a.kidId === kid.id);
    if (!alert) {
      throw new HttpError(404, 'This message was not found.');
    }
    alert.parentSeen = true;
    this.store.save();
    return alert;
  }

  /** A school marks an alert as seen. */
  schoolSawAlert(school, alertId) {
    const alert = (this.db.buddyAlerts ?? []).find(a => a.id === Number(alertId) && a.schoolIds.includes(school.id));
    if (!alert) {
      throw new HttpError(404, 'This message was not found.');
    }
    if (!alert.schoolSeen.includes(school.id)) {
      alert.schoolSeen.push(school.id);
      this.store.save();
    }
    return alert;
  }

  /** What the Grown-up corner shows about an alert. */
  alertOut(alert) {
    return { id: alert.id, at: alert.createdAt, title: alert.title, text: alert.text, seen: alert.parentSeen };
  }

  // ==========================================================================
  // What grown-ups may see
  // ==========================================================================

  /** The children of a parent (all accounts with this parent email). */
  kidsOfParent(email) {
    return Object.values(this.db.kids).filter(k => k.parentEmail === email);
  }

  /** Throws unless this parent owns this child. */
  parentKid(email, kidId) {
    const kid = this.db.kids[kidId];
    if (!kid || kid.parentEmail !== email) {
      throw new HttpError(403, 'You can only see your own child.');
    }
    return kid;
  }

  /**
   * Throws unless the parent's child is part of this conversation.
   * (Parents can ONLY read their own children's chats.)
   */
  parentCanRead(email, kidId, convoKey) {
    const kid = this.parentKid(email, kidId);
    if (!this.kidsInConversation(convoKey).includes(kid.id)) {
      throw new HttpError(403, 'You can only read chats your child is part of.');
    }
    return kid;
  }

  /** All conversations a child is part of (for the parent page). */
  conversationsOf(kid) {
    const list = [{ key: `p:${kid.id}`, title: `Chat with ${kid.username}`, kind: 'parent' }];
    for (const friend of this.friendsOf(kid.id)) {
      const [a, b] = kid.id < friend.id ? [kid.id, friend.id] : [friend.id, kid.id];
      list.push({ key: `d:${a}:${b}`, title: `${kid.username} & ${friend.username}`, kind: 'friend', other: friend });
    }
    for (const group of this.groupsOf(kid.id)) {
      list.push({ key: `g:${group.id}`, title: `Group: ${group.name}`, kind: 'group', group });
    }
    return list;
  }
}
