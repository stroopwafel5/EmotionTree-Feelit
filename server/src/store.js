/**
 * store.js
 * --------------------------------------------------------------------------
 * A very small database: everything is kept in memory and saved to one JSON
 * file (DATA_DIR/db.json) after every change. Good for a prototype and easy
 * to look inside. For many users, swap this for a real database (Postgres,
 * SQLite...) - the rest of the server only uses the functions below.
 *
 * The file is written to a temporary file first and then renamed, so a
 * crash in the middle of saving can never leave a broken file behind.
 */
import fs from 'node:fs';
import path from 'node:path';

/** The empty database. */
function emptyDb() {
  return {
    nextId: { kid: 1, request: 1, message: 1, school: 1, group: 1, mail: 1 },
    kids: {}, // id -> kid account
    schools: {}, // id -> school account
    groups: {}, // id -> group (made by a school)
    groupMembers: [], // { groupId, kidId, parent: 'pending'|'approved'|'declined', since }
    requests: {}, // id -> friend request
    friendships: [], // { a, b, since }  (a < b)
    messages: [], // all chat messages
    blocked: [], // messages the safety filter stopped (shown to parents)
    reports: [], // "Tell my grown-up" reports
    buddyAlerts: [], // worrying messages a child told their space buddy (parent + school only)
    sessions: {}, // hash(token) -> { kidId }            (kid app)
    webSessions: {}, // hash(token) -> { role, email|schoolId, csrf, expires } (parent/school pages)
    links: {}, // hash(token) -> email link (verify, approve, login...)
  };
}

export class Store {
  /** @param dataDir Folder where db.json lives. */
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.file = path.join(dataDir, 'db.json');
    fs.mkdirSync(path.join(dataDir, 'voice'), { recursive: true });
    this.db = fs.existsSync(this.file)
      ? { ...emptyDb(), ...JSON.parse(fs.readFileSync(this.file, 'utf8')) }
      : emptyDb();
  }

  /** Gives the next id for a kind of record ("kid", "message", ...). */
  nextId(kind) {
    const id = this.db.nextId[kind] ?? 1;
    this.db.nextId[kind] = id + 1;
    return id;
  }

  /** Saves the database to disk (call after every change). */
  save() {
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.db));
    fs.renameSync(tmp, this.file);
  }

  /** Path of a stored voice clip. */
  voicePath(fileName) {
    return path.join(this.dataDir, 'voice', path.basename(fileName));
  }
}
