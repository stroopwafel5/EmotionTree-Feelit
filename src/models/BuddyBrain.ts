/**
 * BuddyBrain.ts
 * --------------------------------------------------------------------------
 * The space buddy's "brain" for talking with the child.
 *
 * It is NOT an AI and it never goes on the internet. It looks for simple
 * words in what the child types or taps (see buddyWords.ts) and answers ONLY
 * with sentences written in src/data/buddy.json, or by the child's grown-up
 * in "Teach my buddy" (comfort words, favourite topics, facts, names).
 * So the buddy can never say something nobody wrote.
 *
 * What it can do:
 *   - answer hundreds of kid sentences (hi, how are you, I'm sad, tell me
 *     a joke, I like dinosaurs, what's your favourite food...)
 *   - notice feelings, listen ("Do you want to tell me why?") and comfort
 *   - ask the child questions and listen to the answer without judging,
 *     and coach turn-taking ("Your turn! Ask me a question too.")
 *   - jokes (with a pause for guessing), facts about topics the child loves
 *   - offer games, adventures and "Help me with..." tips
 *
 * PRIVACY: a BuddyBrain lives only in memory while the chat is open. It
 * never saves or sends anything. When the chat closes, it is gone.
 * The ONE exception is a worrying message (someone hurting the child,
 * unsafe touching, wanting to hurt themselves...): then a Turn has
 * `sendWorry`, and the SCREEN sends that one message to the child's grown-up
 * and teacher (services/worryAlerts.ts) - never to anyone else.
 */
import buddyJson from '../data/buddy.json';
import feelingsJson from '../data/feelings.json';
import {
  aboutMe,
  bestMatch,
  findWorry,
  hasPrivateInfo,
  hasUnkindWords,
  matchedText,
  words,
  type SafetyRule,
  type Word,
} from './buddyWords';

// ===========================================================================
// The shape of buddy.json (see CONTENT_GUIDE.md section 13)
// ===========================================================================

export interface FeelingRule {
  id: string;
  /** How the buddy says it: "You feel {feeling}". */
  name: string;
  /** A hard feeling: the buddy comforts and gives tips. */
  hard: boolean;
  mood: string;
  words: string[];
  replies: string[];
  /** The buddy's question after it noticed the feeling ("What happened?"). */
  ask: string[];
  /** What the buddy says after the child told why. */
  why: string[];
  tips: string[];
  chips?: string[];
  /** Always say the first tip (e.g. "tell a grown-up how your body feels"). */
  tellGrownUp?: boolean;
}

export interface Intent {
  id: string;
  patterns: string[];
  replies?: string[];
  mood?: string;
  /** Something the buddy does (joke, fact, tip...) instead of a reply. */
  action?: string;
  /** Then wait for the answer to this question id. */
  expect?: string;
  /** Then offer this (games, adventures, help, help:<id>, fact:<topic>, joke, tip). */
  offer?: string;
  /** "ask": then ask the child a question. */
  then?: string;
  /** Sometimes said too, when the child did a good social thing. */
  praise?: string[];
  chips?: string[];
}

export interface Listen {
  patterns: string[];
  replies: string[];
  offer?: string;
  next?: string;
}

export interface BuddyQuestion {
  id: string;
  ask: string[];
  chips?: string[];
  chipsFeelings?: boolean;
  listen?: Listen[];
  otherwise: string[];
  /** "your favourite colour": remembered (only until the chat closes). */
  remember?: string;
  /** false = only asked on purpose, never as a random question. */
  random?: boolean;
  /** pets / friends / loves: only when the grown-up told the buddy about them. */
  needs?: 'pets' | 'friends' | 'loves';
  offerLoved?: boolean;
}

export interface TopicJson {
  id: string;
  title: string;
  icon: string;
  words: string[];
  like: string[];
  facts: string[];
}

export interface HelpTopic {
  id: string;
  icon: string;
  title: string;
  patterns: string[];
  intro: string;
  steps: string[];
  say: string[];
  outro?: string;
  /** An adventure to practise in. */
  practice?: string;
}

export interface Joke {
  q: string;
  a: string;
}

/** buddy.json (the parts the brain uses). */
interface BuddyData {
  settings: { helpline: string };
  yes: string[];
  no: string[];
  timeGreetings: Record<'morning' | 'afternoon' | 'evening' | 'late', string[]>;
  feelingHello: { good: string[]; hard: string[] };
  emptyInput: string[];
  safety: SafetyRule[];
  safetyTexts: Record<string, string[]> & { showCard: { title: string; line: string; small: string } };
  privateInfo: { replies: string[] };
  unkind: { replies: string[] };
  feelingChips: string[];
  defaultChips: string[];
  afterFeelingChips: string[];
  questionChips: string[];
  feelings: FeelingRule[];
  notFeeling: string[];
  whyNo: string[];
  whyYes: string[];
  comfortIntro: string[];
  calmIntro: string[];
  tips: string[];
  intents: Intent[];
  questions: BuddyQuestion[];
  yourTurn: string[];
  yourTurnChips: string[];
  dontKnowAnswer: string[];
  bigQuestions: { patterns: string[]; replies: string[] };
  dontKnow: string[];
  fallback: string[];
  steer: string[];
  homeworkLeft: string[];
  homeworkDone: string[];
  homeworkSchool: string[];
  rememberNothing: string[];
  rememberLoves: string[];
  rememberHeard: string[];
  rememberForget: string[];
  factIntro: string[];
  factOffer: string[];
  factAfterChips: string[];
  factsDone: string[];
  jokeChips: string[];
  jokeAfter: string[];
  jokeGotIt: string[];
  jokeAfterChips: string[];
  offerYes: string[];
  offerNo: string[];
  offerChips: Record<string, string[]>;
  helpOffer: string[];
  helpSayIntro: string[];
  helpSaid: string[];
  helpPracticeChip: string;
  topics: TopicJson[];
  jokes: Joke[];
  help: HelpTopic[];
}

export const BUDDY = buddyJson as unknown as BuddyData;

// ===========================================================================
// What the grown-up taught the buddy ("Teach my buddy"), saved on the phone
// ===========================================================================

/** A topic a grown-up added, with their own facts ("Horses 🐴"). */
export interface MyTopic {
  id: string;
  name: string;
  icon: string;
  facts: string[];
}

export interface BuddyNotebook {
  /** What the buddy calls the child ('' = the username). */
  nickname: string;
  /** Built-in topics the child loves (ids from buddy.json "topics"). */
  loves: string[];
  /** The grown-up's own topics and facts. */
  myTopics: MyTopic[];
  /** Comfort words for hard moments ("Mom loves you to the moon and back"). */
  comfort: string[];
  /** Things that help the child calm down ("my blue blanket"). */
  calm: string[];
  /** Friends' first names (so the buddy can encourage real-life play). */
  friends: string[];
  /** Pets' names. */
  pets: string[];
}

export const EMPTY_NOTEBOOK: BuddyNotebook = {
  nickname: '',
  loves: [],
  myTopics: [],
  comfort: [],
  calm: [],
  friends: [],
  pets: [],
};

// ===========================================================================
// What the brain gives back
// ===========================================================================

/**
 * A button under the chat. `go` = what it opens:
 *   games / adventures / help / bye / showCard / adventure:<id>  (the screen)
 *   fact:<topic> / joke / tip / ask / help:<id> / said           (the brain)
 */
export interface Chip {
  label: string;
  /** What the child "says" when tapping it (default: the label). */
  send: string;
  go?: string;
}

/** A worrying message, for the child's grown-up and teacher ONLY. */
export interface Worry {
  category: string;
  title: string;
  text: string;
}

/** One answer from the buddy. */
export interface Turn {
  /** Speech bubbles, in order. */
  lines: string[];
  /** The buddy's face (a mood id from looks.json). */
  mood: string;
  chips: Chip[];
  /** The screen should send this to the grown-up + teacher now. */
  sendWorry?: Worry;
  /** Show the big "Show this to a grown-up" card. */
  showCard?: boolean;
  /** The screen should open this (games, adventures, help...). */
  go?: string;
}

export interface BuddyOptions {
  childName: string;
  buddyName: string;
  /** The child's feeling on the home screen (feelings.json id). */
  feeling: string | null;
  notebook: BuddyNotebook;
  /** Missions still to do for this week's homework. */
  missionsLeft: number;
  /** Who gets worry alerts ("your grown-up and your teacher"), or null when Friends is off. */
  alertWho: string | null;
  /** Can the child type (open talk, turned on by a grown-up)? */
  typing: boolean;
  now?: Date;
  /** For tests: a fixed random number source. */
  random?: () => number;
}

type Expect =
  | { type: 'question'; id: string }
  | { type: 'why'; feeling: string }
  | { type: 'offer'; go: string }
  | { type: 'joke'; index: number }
  | { type: 'tell'; worry: Worry };

interface Topic {
  id: string;
  /** For sentences: "a fact about {topic}". */
  say: string;
  icon: string;
  words: string[];
  like: string[];
  facts: string[];
}

interface Candidate {
  score: number;
  /** Ties: help (0) before feelings (1), intents (2), topics (3), big questions (4). */
  order: number;
  run: () => Turn;
}

/** Turns "Play 🎲 @games" into a Chip. */
export function chip(text: string): Chip {
  const at = text.lastIndexOf(' @');
  if (at > 0) {
    return { label: text.slice(0, at), send: text.slice(0, at), go: text.slice(at + 2) };
  }
  return { label: text, send: text };
}

const QUESTIONS = new Map(BUDDY.questions.map(q => [q.id, q]));
const FEELING_NAMES = new Map(feelingsJson.feelings.map(f => [f.id, f.name.toLowerCase()]));
const FACT_WORDS = ['fact', 'facts', 'tell me about', 'teach me about', 'did you know', 'know about', 'something about', 'more about', 'talk about', 'another'];
const LIKE_WORDS = ['i like', 'i love', 'my favourite', 'i really like', 'i am into', 'is my favourite', 'are my favourite', 'is cool', 'are cool', 'are awesome', 'is awesome', 'do you like', 'i want to talk about'];
const NOT_WORDS = ['not', 'dont', 'never', 'isnt', 'arent', 'wasnt', 'didnt', 'doesnt', 'aint', 'no'];
const QUESTION_WORDS = ['what', 'why', 'how', 'when', 'where', 'who', 'which', 'can', 'do', 'does', 'is', 'are', 'will', 'would', 'could', 'should', 'did'];
const DONT_KNOW = ['=i dont know', '=dont know', '=no idea', '=not sure', '=i am not sure', '=i dont remember', '=hmm', '=um', '=umm'];

/** The built-in topics plus the grown-up's own ones. */
export function allTopics(notebook: BuddyNotebook): Topic[] {
  const builtIn = BUDDY.topics.map(t => ({ id: t.id, say: t.title.toLowerCase(), icon: t.icon, words: t.words, like: t.like, facts: t.facts }));
  const mine = notebook.myTopics
    .filter(t => t.name.trim() && t.facts.length > 0)
    .map(t => {
      const name = t.name.trim();
      const lower = name.toLowerCase();
      const single = lower.endsWith('s') && lower.length > 3 ? lower.slice(0, -1) : lower;
      return {
        id: t.id,
        say: name,
        icon: t.icon || '⭐',
        words: [...new Set([lower, single, `${single}s`])],
        like: [`Ooh, {thing}! ${t.icon || '⭐'} I love that!`],
        facts: t.facts,
      };
    });
  return [...mine, ...builtIn];
}

export class BuddyBrain {
  private expect: Expect | null = null;
  /** Which variants of each list were said already (so it doesn't repeat itself). */
  private used = new Map<string, number[]>();
  private answeredCount = 0;
  private misses = 0;
  /** What the child told the buddy in THIS chat (forgotten when it closes). */
  private heard: { label: string; value: string }[] = [];
  private lastFeeling: string | null = null;
  private lastTopic: string | null = null;
  /** The "Help me with…" topic shown last (for its buttons). */
  private lastHelp: HelpTopic | null = null;
  private asked = new Set<string>();
  private readonly topics: Topic[];
  private readonly rnd: () => number;

  constructor(private readonly o: BuddyOptions) {
    this.topics = allTopics(o.notebook);
    this.rnd = o.random ?? Math.random;
  }

  // =========================================================================
  // Public: start, hear, tap a chip, after a worry was sent
  // =========================================================================

  /** The first thing the buddy says when the chat opens. */
  hello(): Turn {
    const hour = (this.o.now ?? new Date()).getHours();
    const slot = hour < 5 || hour >= 21 ? 'late' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    const lines = [this.say('greet', BUDDY.timeGreetings[slot])];
    const feeling = this.o.feeling ? BUDDY.feelings.find(f => f.id === this.o.feeling) : undefined;
    if (feeling) {
      const extra = { feeling: feeling.name };
      if (feeling.hard) {
        this.lastFeeling = feeling.id;
        lines.push(this.say('fhello', BUDDY.feelingHello.hard, extra));
        if (this.o.typing) {
          this.expect = { type: 'why', feeling: feeling.id };
          return this.turn(lines, 'happy', ['Yes 💜', "No, let's play 🎲 @games", 'Give me a tip 💡']);
        }
        return this.offer(lines, 'tip', 'happy');
      }
      lines.push(this.say('fhello', BUDDY.feelingHello.good, extra));
    }
    return this.withQuestion(lines, 'happy');
  }

  /** The child typed something (or tapped a chip that "says" something). */
  hear(text: string): Turn {
    const raw = text.trim().slice(0, 300);
    const msg = words(raw);
    if (msg.length === 0) {
      return this.turn([this.say('empty', BUDDY.emptyInput)], 'happy');
    }

    // 1. Something worrying? Always checked first.
    const worry = findWorry(raw);
    if (worry) {
      return this.worryTurn(worry, raw);
    }
    // 2. Private info (phone number, address...)? 3. Unkind words?
    if (hasPrivateInfo(raw)) {
      this.expect = null;
      return this.turn([this.say('private', BUDDY.privateInfo.replies)], 'surprised');
    }
    if (hasUnkindWords(raw)) {
      this.expect = null;
      return this.turn([this.say('unkind', BUDDY.unkind.replies)], 'sad');
    }
    // 4. An answer to what the buddy just asked?
    if (this.expect) {
      const expected = this.expect;
      this.expect = null;
      const answer = this.onExpected(expected, msg, raw);
      if (answer) {
        this.misses = 0;
        return answer;
      }
    }
    // 5. Everything else.
    return this.understand(msg, raw);
  }

  /** A chip with a "go" the brain handles (fact:x, joke, tip, ask, help:x). */
  go(go: string): Turn {
    this.expect = null;
    if (go.startsWith('fact:')) {
      const topic = this.topics.find(t => t.id === go.slice(5));
      return this.factTurn(topic);
    }
    if (go.startsWith('help:')) {
      const help = BUDDY.help.find(h => h.id === go.slice(5));
      if (help) {
        return this.helpTurn(help);
      }
    }
    if (go === 'joke') {
      return this.jokeTurn();
    }
    if (go === 'tip') {
      return this.tipTurn();
    }
    if (go === 'ask') {
      return this.withQuestion([], 'happy');
    }
    return this.turn([this.say('offerYes', BUDDY.offerYes)], 'grin', undefined, go);
  }

  /** The child tapped one of the "Things you can say" in a help topic. */
  said(sentence: string): Turn {
    const line = this.say('helpSaid', BUDDY.helpSaid, { said: sentence });
    if (this.lastHelp) {
      // The same buttons again (without the one just said), so the child can keep practising.
      const chips = this.helpChips(this.lastHelp).filter(c => c.send !== sentence);
      return { lines: [line], mood: 'grin', chips };
    }
    return this.turn([line], 'grin', ['Another tricky moment 💡 @help', 'Thanks! 💜']);
  }

  /** Help tips for one topic (from the "Help me with…" list). */
  help(id: string): Turn {
    const topic = BUDDY.help.find(h => h.id === id);
    return topic ? this.helpTurn(topic) : this.turn([this.say('fallback', BUDDY.fallback)], 'happy');
  }

  /** After the screen tried to send a worry alert. */
  worrySent(ok: boolean): Turn {
    const show: Chip = { label: 'Show a grown-up 🪧', send: '', go: 'showCard' };
    if (ok) {
      return {
        lines: [this.say('told', BUDDY.safetyTexts.told)],
        mood: 'happy',
        chips: [chip('Thank you 💜'), show, chip("Let's do something calm 🎲 @games")],
      };
    }
    return { lines: [this.say('cantReach', BUDDY.safetyTexts.cantReach)], mood: 'sad', chips: [show], showCard: true };
  }

  // =========================================================================
  // Understanding a message
  // =========================================================================

  private understand(msg: Word[], raw: string): Turn {
    const best = this.best(msg);
    if (best) {
      this.misses = 0;
      return best.run();
    }
    this.misses += 1;
    if (isQuestion(raw, msg)) {
      this.expect = { type: 'question', id: 'tellMe' };
      return this.turn([this.say('dontKnow', BUDDY.dontKnow)], 'surprised');
    }
    if (this.misses >= 2) {
      this.misses = 0;
      return this.turn([this.say('steer', BUDDY.steer)], 'grin', [
        ...this.lovedChip(),
        "Let's play 🎲 @games",
        'An adventure 🗺️ @adventures',
        'Tell me a joke 😂',
      ]);
    }
    return this.turn([this.say('fallback', BUDDY.fallback)], 'happy');
  }

  /** Everything the message could mean, with how sure the buddy is. */
  private candidates(msg: Word[]): Candidate[] {
    const list: Candidate[] = [];

    for (const help of BUDDY.help) {
      const hit = bestMatch(msg, help.patterns);
      if (hit) {
        list.push({ score: hit.score, order: 0, run: () => this.offerHelp(help) });
      }
    }

    for (const feeling of BUDDY.feelings) {
      const hit = bestMatch(msg, feeling.words);
      if (hit) {
        const before = msg.slice(Math.max(0, hit.at - 2), hit.at).map(m => m.w);
        const negated = before.some(w => NOT_WORDS.includes(w));
        const bonus = aboutMe(msg, hit.at) ? 1 : 0;
        list.push({ score: hit.score + bonus, order: 1, run: () => (negated ? this.notFeelingTurn(feeling) : this.feelingTurn(feeling)) });
      }
    }

    for (const intent of BUDDY.intents) {
      const hit = bestMatch(msg, intent.patterns);
      if (hit) {
        list.push({ score: hit.score, order: 2, run: () => this.intentTurn(intent) });
      }
    }

    const wantsFact = bestMatch(msg, FACT_WORDS) !== null;
    const likes = bestMatch(msg, LIKE_WORDS) !== null;
    for (const topic of this.topics) {
      const hit = bestMatch(msg, topic.words);
      if (hit) {
        const thing = matchedText(msg, hit);
        list.push({
          score: hit.score + (wantsFact ? 2 : likes ? 1.5 : 0),
          order: 3,
          run: () => (wantsFact ? this.factTurn(topic, thing) : this.likeTurn(topic, thing)),
        });
      }
    }

    const big = bestMatch(msg, BUDDY.bigQuestions.patterns);
    if (big) {
      list.push({ score: big.score, order: 4, run: () => this.turn([this.say('big', BUDDY.bigQuestions.replies)], 'surprised') });
    }
    return list;
  }

  private best(msg: Word[]): Candidate | null {
    const list = this.candidates(msg);
    list.sort((a, b) => b.score - a.score || a.order - b.order);
    return list[0] ?? null;
  }

  private isYes(msg: Word[]): boolean {
    return bestMatch(msg, BUDDY.yes) !== null || ['yes', 'okay', 'sure', 'please', 'yay'].includes(msg[0]?.w ?? '');
  }

  private isNo(msg: Word[]): boolean {
    return bestMatch(msg, BUDDY.no) !== null || ['no', 'nope', 'not'].includes(msg[0]?.w ?? '');
  }

  /** The child answers what the buddy asked or offered. Null = they talk about something else. */
  private onExpected(e: Expect, msg: Word[], raw: string): Turn | null {
    switch (e.type) {
      case 'tell':
        if (this.isYes(msg)) {
          return this.sendWorryTurn(e.worry);
        }
        if (this.isNo(msg)) {
          return {
            lines: [this.say('notNow', BUDDY.safetyTexts.notNow)],
            mood: 'happy',
            chips: [{ label: 'Show a grown-up 🪧', send: '', go: 'showCard' }, chip('Who can I talk to? 💜'), chip('Okay 💜')],
          };
        }
        return null;

      case 'joke':
        return this.punchline(e.index, msg);

      case 'offer':
        if (this.isYes(msg)) {
          return this.go(e.go);
        }
        if (this.isNo(msg)) {
          return this.turn([this.say('offerNo', BUDDY.offerNo)], 'happy');
        }
        return null;

      case 'why': {
        const feeling = BUDDY.feelings.find(f => f.id === e.feeling);
        if (!feeling) {
          return null;
        }
        if (this.isNo(msg)) {
          const lines = [this.say('whyNo', BUDDY.whyNo), this.tipLine(feeling)];
          return this.turn(lines, 'happy', BUDDY.afterFeelingChips);
        }
        if (this.isYes(msg) && msg.length <= 4) {
          this.expect = e;
          return this.turn([this.say('whyYes', BUDDY.whyYes)], 'happy', ["I don't want to say 💜", 'Give me a tip 💡']);
        }
        // A question or something clearly new ("what's the capital of France?") is not the reason.
        const other = this.best(msg);
        if (other && other.score >= (isQuestion(raw, msg) ? 2 : 3)) {
          return other.run();
        }
        return this.whyTurn(feeling);
      }

      case 'question': {
        const q = QUESTIONS.get(e.id);
        if (!q) {
          return null;
        }
        for (const listen of q.listen ?? []) {
          const hit = bestMatch(msg, listen.patterns);
          if (hit) {
            return this.answered(q, listen, matchedText(msg, hit));
          }
        }
        const other = this.best(msg);
        if (other && other.score >= 2) {
          return other.run();
        }
        if (bestMatch(msg, DONT_KNOW)) {
          return this.turn([this.say('dk', BUDDY.dontKnowAnswer)], 'happy');
        }
        return this.answered(q, null, raw);
      }
    }
    return null;
  }

  // =========================================================================
  // The kinds of answers
  // =========================================================================

  private worryTurn(rule: SafetyRule, raw: string): Turn {
    this.expect = null;
    const worry: Worry = { category: rule.id, title: rule.title, text: raw };
    const lines = [this.say(`worry:${rule.id}`, rule.replies)];
    const show: Chip = { label: 'Show a grown-up 🪧', send: '', go: 'showCard' };
    const who = chip('Who can I talk to? 💜');
    if (rule.tell === 'auto') {
      if (this.o.alertWho) {
        lines.push(this.say('telling', BUDDY.safetyTexts.telling));
        return { lines, mood: 'sad', chips: [show, who], sendWorry: worry };
      }
      lines.push(this.say('noServer', BUDDY.safetyTexts.noServer));
      return { lines, mood: 'sad', chips: [show, who], showCard: true };
    }
    if (this.o.alertWho) {
      lines.push(this.say('askTell', BUDDY.safetyTexts.askTell));
      this.expect = { type: 'tell', worry };
      return { lines, mood: 'sad', chips: [{ label: 'Yes, tell them 💜', send: 'yes' }, { label: 'Not now', send: 'not now' }] };
    }
    lines.push(this.say('noServer', BUDDY.safetyTexts.noServer));
    return { lines, mood: 'sad', chips: [show, who] };
  }

  private sendWorryTurn(worry: Worry): Turn {
    return {
      lines: [this.say('telling', BUDDY.safetyTexts.telling)],
      mood: 'happy',
      chips: [{ label: 'Show a grown-up 🪧', send: '', go: 'showCard' }],
      sendWorry: worry,
    };
  }

  private intentTurn(intent: Intent): Turn {
    if (intent.action) {
      return this.action(intent.action);
    }
    const mood = intent.mood ?? 'happy';
    const lines = [this.say(`i:${intent.id}`, intent.replies ?? [])];
    if (intent.praise && this.rnd() < 0.5) {
      lines.push(this.say(`praise:${intent.id}`, intent.praise));
    }
    if (intent.expect) {
      return this.expectQuestion(lines, intent.expect, mood);
    }
    if (intent.offer) {
      return this.offer(lines, intent.offer, mood);
    }
    if (intent.then === 'ask') {
      return this.withQuestion(lines, mood);
    }
    return this.turn(lines, mood, intent.chips);
  }

  private action(name: string): Turn {
    switch (name) {
      case 'joke':
        return this.jokeTurn();
      case 'fact':
        return this.factTurn();
      case 'ask':
        return this.withQuestion([], 'happy');
      case 'tip':
        return this.tipTurn();
      case 'trusted': {
        const lines = [this.say('trusted', BUDDY.safetyTexts.trusted)];
        if (BUDDY.settings.helpline.trim()) {
          lines.push(BUDDY.settings.helpline.trim());
        }
        lines.push(this.say('danger', BUDDY.safetyTexts.danger));
        return this.turn(lines, 'happy', ['Show a grown-up 🪧 @showCard', 'Thank you 💜']);
      }
      case 'privacy':
        return this.turn(
          [this.say('privacy', this.o.alertWho ? BUDDY.safetyTexts.privacyCanTell : BUDDY.safetyTexts.privacyNoTell)],
          'happy',
        );
      case 'homework': {
        const lines = [
          this.o.missionsLeft > 0 ? this.say('hw', BUDDY.homeworkLeft) : this.say('hwDone', BUDDY.homeworkDone),
          this.say('hwSchool', BUDDY.homeworkSchool),
        ];
        return this.turn(lines, 'happy', ['An adventure 🗺️ @adventures', ...BUDDY.defaultChips.slice(0, 3)]);
      }
      case 'remember': {
        const lines: string[] = [];
        if (this.lovedTopics().length > 0) {
          lines.push(this.say('remLoves', BUDDY.rememberLoves));
        }
        for (const h of this.heard.slice(-2)) {
          lines.push(this.say('remHeard', BUDDY.rememberHeard, { label: h.label, value: h.value }));
        }
        if (lines.length === 0) {
          lines.push(this.say('remNothing', BUDDY.rememberNothing));
        }
        lines.push(this.say('remForget', BUDDY.rememberForget));
        return this.turn(lines, 'happy');
      }
    }
    return this.turn([this.say('fallback', BUDDY.fallback)], 'happy');
  }

  private feelingTurn(feeling: FeelingRule): Turn {
    this.lastFeeling = feeling.id;
    const lines = [this.say(`f:${feeling.id}`, feeling.replies)];
    if (feeling.tellGrownUp && feeling.tips[0]) {
      lines.push(this.fill(feeling.tips[0]) ?? feeling.tips[0]);
    }
    if (feeling.chips) {
      return this.turn(lines, feeling.mood, feeling.chips);
    }
    if (feeling.ask.length > 0 && this.o.typing) {
      lines.push(this.say(`fask:${feeling.id}`, feeling.ask));
      this.expect = { type: 'why', feeling: feeling.id };
      return this.turn(
        lines,
        feeling.mood,
        feeling.hard ? ["I don't want to say 💜", 'Give me a tip 💡', "Let's play 🎲 @games"] : ['Tell me a joke 😂', "Let's play 🎲 @games"],
      );
    }
    if (feeling.hard) {
      if (!feeling.tellGrownUp) {
        lines.push(this.tipLine(feeling));
      }
      lines.push(...this.comfortLines());
      return this.turn(lines, feeling.mood, BUDDY.afterFeelingChips);
    }
    return this.withQuestion(lines, feeling.mood);
  }

  private whyTurn(feeling: FeelingRule): Turn {
    const lines = [feeling.why.length > 0 ? this.say(`why:${feeling.id}`, feeling.why) : 'Thank you for telling me. 💜'];
    if (!feeling.hard) {
      return this.withQuestion(lines, feeling.mood === 'grin' ? 'grin' : 'happy');
    }
    const comfort = this.comfortLines();
    lines.push(...(comfort.length > 0 ? comfort : [this.tipLine(feeling)]));
    return this.turn(lines, 'happy', BUDDY.afterFeelingChips);
  }

  private notFeelingTurn(feeling: FeelingRule): Turn {
    this.expect = { type: 'question', id: 'howYou' };
    return this.turn([this.say('notFeeling', BUDDY.notFeeling, { feeling: feeling.name })], 'surprised', BUDDY.feelingChips);
  }

  /** A tip for this feeling (or a general one). */
  private tipLine(feeling?: FeelingRule): string {
    const list = feeling && feeling.tips.length > 0 ? feeling.tips : BUDDY.tips;
    return this.say(`tip:${feeling?.id ?? 'all'}`, list);
  }

  private tipTurn(): Turn {
    const feeling = BUDDY.feelings.find(f => f.id === this.lastFeeling);
    const lines = [this.tipLine(feeling)];
    const calm = this.sayMaybe('calm', BUDDY.calmIntro);
    if (calm) {
      lines.push(calm);
    }
    return this.turn(lines, 'happy', ['Another tip 💡', 'Thank you 💜', "Let's play 🎲 @games"]);
  }

  /** The grown-up's comfort words and calm-down things (when they added some). */
  private comfortLines(): string[] {
    return [this.sayMaybe('comfort', BUDDY.comfortIntro), this.sayMaybe('calm', BUDDY.calmIntro)].filter(
      (l): l is string => l !== null,
    );
  }

  private offerHelp(help: HelpTopic): Turn {
    const lines = [this.say(`helpOffer:${help.id}`, BUDDY.helpOffer, { intro: help.intro })];
    this.expect = { type: 'offer', go: `help:${help.id}` };
    return this.turn(lines, 'happy', [`Yes, show me ${help.icon} @help:${help.id}`, 'No thanks']);
  }

  private helpTurn(help: HelpTopic): Turn {
    const lines = [help.intro, ...help.steps.map((s, i) => `${i + 1}. ${s}`)];
    const outro = help.outro ? this.fill(help.outro) : null;
    if (outro) {
      lines.push(outro);
    }
    lines.push(this.say('sayIntro', BUDDY.helpSayIntro));
    this.lastHelp = help;
    return { lines, mood: 'happy', chips: this.helpChips(help) };
  }

  /** "Things you can say" buttons, practise in an adventure, another topic. */
  private helpChips(help: HelpTopic): Chip[] {
    const chips: Chip[] = help.say.map(s => ({ label: `💬 ${s}`, send: s, go: 'said' }));
    if (help.practice) {
      chips.push({ label: BUDDY.helpPracticeChip, send: BUDDY.helpPracticeChip, go: `adventure:${help.practice}` });
    }
    chips.push(chip('Another tricky moment 💡 @help'));
    return chips;
  }

  private jokeTurn(): Turn {
    const index = this.pickIndex('joke', BUDDY.jokes.length);
    this.expect = { type: 'joke', index };
    return this.turn([BUDDY.jokes[index].q], 'grin', BUDDY.jokeChips);
  }

  private punchline(index: number, msg: Word[]): Turn {
    const joke = BUDDY.jokes[index];
    // Did the child guess it? (a long word from the answer)
    const key = words(joke.a).filter(w => w.w.length >= 5);
    const guessed = key.some(k => msg.some(m => m.w === k.w));
    const lines = guessed
      ? [this.say('gotIt', BUDDY.jokeGotIt), joke.a]
      : [joke.a, this.say('jokeAfter', BUDDY.jokeAfter)];
    return this.turn(lines, 'grin', BUDDY.jokeAfterChips);
  }

  private lovedTopics(): Topic[] {
    const loved = new Set([...this.o.notebook.loves, ...this.o.notebook.myTopics.map(t => t.id)]);
    return this.topics.filter(t => loved.has(t.id));
  }

  /** A "Tell me about <loved topic>" chip, when the grown-up told the buddy what the child loves. */
  private lovedChip(): string[] {
    const loved = this.lovedTopics();
    if (loved.length === 0) {
      return [];
    }
    const t = loved[Math.floor(this.rnd() * loved.length)];
    return [`A fact about ${t.say} ${t.icon} @fact:${t.id}`];
  }

  private likeTurn(topic: Topic, thing: string): Turn {
    this.lastTopic = topic.id;
    const lines = [this.say(`like:${topic.id}`, topic.like, { thing })];
    return this.offer(lines, `fact:${topic.id}`, 'grin');
  }

  private factTurn(topic?: Topic, thing?: string): Turn {
    let t = topic;
    if (!t && this.lastTopic) {
      t = this.topics.find(x => x.id === this.lastTopic);
    }
    if (!t) {
      const loved = this.lovedTopics();
      const pool = loved.length > 0 && this.rnd() < 0.75 ? loved : this.topics;
      t = pool[Math.floor(this.rnd() * pool.length)];
    }
    this.lastTopic = t.id;
    const extra = { topic: t.say, topicIcon: t.icon };
    const key = `fact:${t.id}`;
    const used = this.used.get(key) ?? [];
    const lines = [this.say('factIntro', BUDDY.factIntro, extra)];
    if (used.length >= t.facts.length) {
      lines[0] = this.say('factsDone', BUDDY.factsDone, extra);
      this.used.set(key, []);
    }
    // Prefer a fact about the exact thing the child said ("octopus").
    const stem = thing && thing.length >= 4 ? thing.slice(0, 4).toLowerCase() : null;
    const fresh = t.facts.map((f, i) => i).filter(i => !(this.used.get(key) ?? []).includes(i));
    const about = stem ? fresh.filter(i => t!.facts[i].toLowerCase().includes(stem)) : [];
    const pool = about.length > 0 ? about : fresh;
    const index = pool[Math.floor(this.rnd() * pool.length)];
    this.used.set(key, [...(this.used.get(key) ?? []), index]);
    lines.push(this.fill(t.facts[index]) ?? t.facts[index]);
    return this.turn(lines, 'surprised', [`Another fact 💡 @fact:${t.id}`, ...BUDDY.factAfterChips.slice(1)]);
  }

  // =========================================================================
  // Questions the buddy asks
  // =========================================================================

  private hasNeed(q: BuddyQuestion): boolean {
    const nb = this.o.notebook;
    if (q.needs === 'pets') {
      return nb.pets.length > 0;
    }
    if (q.needs === 'friends') {
      return nb.friends.length > 0;
    }
    if (q.needs === 'loves') {
      return this.lovedTopics().length > 0;
    }
    return true;
  }

  /** Adds a question for the child (if there is one left). */
  private withQuestion(lines: string[], mood: string): Turn {
    const open = BUDDY.questions.filter(q => q.random !== false && !this.asked.has(q.id) && this.hasNeed(q));
    if (open.length === 0) {
      return this.turn(lines, mood);
    }
    // Questions about the child's own world (pets, friends, loved topics) come up more often.
    const personal = open.filter(q => q.needs);
    const pool = personal.length > 0 && this.rnd() < 0.5 ? personal : open;
    const q = pool[Math.floor(this.rnd() * pool.length)];
    return this.expectQuestion(lines, q.id, mood, true);
  }

  private expectQuestion(lines: string[], id: string, mood: string, sayIt = false): Turn {
    const q = QUESTIONS.get(id);
    if (!q) {
      return this.turn(lines, mood);
    }
    this.asked.add(q.id);
    this.expect = { type: 'question', id: q.id };
    // The loved topic in "What do you like most about {topic}?" is remembered for the answer.
    const out = [...lines];
    if (sayIt) {
      const ask = this.say(`ask:${q.id}`, q.ask);
      out.push(ask);
    }
    // The answers, plus a way out for children who don't want to answer.
    const chips = q.chipsFeelings ? [...BUDDY.feelingChips, ...BUDDY.questionChips.slice(1)] : q.chips ? [...q.chips, ...BUDDY.questionChips] : undefined;
    return this.turn(out, mood, chips);
  }

  private answered(q: BuddyQuestion, listen: Listen | null, value: string): Turn {
    this.answeredCount += 1;
    // Remembered only until the chat closes, and only words the buddy knows (never free text).
    if (q.remember && listen) {
      this.heard.push({ label: q.remember, value: value.trim().slice(0, 30) });
    }
    const idx = listen ? (q.listen ?? []).indexOf(listen) : -1;
    const lines = [
      listen
        ? this.say(`q:${q.id}:${idx}`, listen.replies, { match: value })
        : this.say(`q:${q.id}:otherwise`, q.otherwise),
    ];
    if (listen?.offer) {
      return this.offer(lines, listen.offer, 'grin');
    }
    if (listen?.next) {
      return this.expectQuestion(lines, listen.next, 'happy', !listen.replies.some(r => r.includes('?')));
    }
    if (q.offerLoved) {
      const loved = this.lovedTopics();
      if (loved.length > 0) {
        return this.offer(lines, `fact:${loved[0].id}`, 'grin');
      }
    }
    if (this.answeredCount % 3 === 0) {
      lines.push(this.say('yourTurn', BUDDY.yourTurn));
      return this.turn(lines, 'grin', BUDDY.yourTurnChips);
    }
    return this.withQuestion(lines, 'grin');
  }

  /** Offers something ("Want to hear a fact?") and waits for yes / no. */
  private offer(lines: string[], go: string, mood: string): Turn {
    const out = [...lines];
    if (go.startsWith('fact:')) {
      const t = this.topics.find(x => x.id === go.slice(5));
      if (t) {
        out.push(this.say('factOffer', BUDDY.factOffer, { topic: t.say, topicIcon: t.icon }));
      }
    } else if (go === 'joke') {
      out.push('Want to hear one? 😂');
    } else if (go === 'tip') {
      out.push('Do you want a tip? 💡');
    }
    this.expect = { type: 'offer', go };
    const chips = BUDDY.offerChips[go] ?? (go.startsWith('help:') ? [`Yes, show me 💡 @${go}`, 'No thanks'] : [`Yes! 🤩 @${go}`, 'No thanks']);
    return this.turn(out, mood, chips);
  }

  // =========================================================================
  // Saying things
  // =========================================================================

  private turn(lines: (string | null)[], mood: string, chips?: string[], go?: string): Turn {
    const clean = lines.filter((l): l is string => !!l).map(capitalise);
    const unique = [...new Set(chips ?? BUDDY.defaultChips)];
    return { lines: clean, mood, chips: unique.map(chip), go };
  }

  /** Picks a random index, not one used lately. */
  private pickIndex(key: string, count: number): number {
    const used = this.used.get(key) ?? [];
    let fresh = Array.from({ length: count }, (_, i) => i).filter(i => !used.includes(i));
    if (fresh.length === 0) {
      fresh = Array.from({ length: count }, (_, i) => i);
      this.used.set(key, []);
    }
    const index = fresh[Math.floor(this.rnd() * fresh.length)];
    this.used.set(key, [...(this.used.get(key) ?? []), index]);
    return index;
  }

  /** One sentence from a list (filled in), or null if none can be filled. */
  private sayMaybe(key: string, list: readonly string[], extra: Record<string, string> = {}): string | null {
    const options = list
      .map((text, i) => ({ i, text: this.fill(text, extra) }))
      .filter((x): x is { i: number; text: string } => x.text !== null);
    if (options.length === 0) {
      return null;
    }
    const used = this.used.get(key) ?? [];
    let fresh = options.filter(x => !used.includes(x.i));
    if (fresh.length === 0) {
      fresh = options;
      this.used.set(key, []);
    }
    const pick = fresh[Math.floor(this.rnd() * fresh.length)];
    this.used.set(key, [...(this.used.get(key) ?? []), pick.i]);
    return pick.text;
  }

  /** Like sayMaybe, but always says something. */
  private say(key: string, list: readonly string[], extra: Record<string, string> = {}): string {
    return this.sayMaybe(key, list, extra) ?? this.sayMaybe('fallback', BUDDY.fallback) ?? '😊';
  }

  /**
   * Fills in {name}, {buddy}, {topic}... Returns null when a value is
   * missing (e.g. {pet} but no pet names), so that sentence is skipped.
   */
  private fill(text: string, extra: Record<string, string> = {}): string | null {
    const nb = this.o.notebook;
    const one = (list: string[]) => (list.length > 0 ? list[Math.floor(this.rnd() * list.length)] : undefined);
    const loved = this.lovedTopics();
    const topic = loved.length > 0 ? loved[Math.floor(this.rnd() * loved.length)] : undefined;
    const values: Record<string, string | undefined> = {
      name: nb.nickname.trim() || friendlyName(this.o.childName),
      buddy: this.o.buddyName,
      feeling: this.o.feeling ? FEELING_NAMES.get(this.o.feeling) : undefined,
      topic: topic?.say,
      topicIcon: topic?.icon,
      friend: one(nb.friends),
      pet: one(nb.pets),
      calm: one(nb.calm),
      comfort: one(nb.comfort),
      missionsLeft: String(this.o.missionsLeft),
      who: this.o.alertWho ?? undefined,
      ...extra,
    };
    let missing = false;
    const out = text.replace(/\{(\w+)\}/g, (_, key: string) => {
      const value = values[key];
      if (value === undefined || value === '') {
        missing = true;
        return '';
      }
      return value;
    });
    return missing ? null : out;
  }
}

function isQuestion(raw: string, msg: Word[]): boolean {
  return raw.trim().endsWith('?') || QUESTION_WORDS.includes(msg[0]?.w ?? '');
}

/** "mia_star" -> "Mia" (a grown-up can set a nickname in "Teach my buddy"). */
export function friendlyName(username: string): string {
  const first = username.split(/[^A-Za-z]+/).find(part => part.length >= 2);
  return first ? first[0].toUpperCase() + first.slice(1).toLowerCase() : username;
}

function capitalise(line: string): string {
  return line.length > 0 && /[a-z]/.test(line[0]) ? line[0].toUpperCase() + line.slice(1) : line;
}
