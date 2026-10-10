/**
 * buddy.test.ts
 * --------------------------------------------------------------------------
 * Checks the space buddy: how it reads kids' words, the safety rules
 * (worrying messages), conversations, what grown-ups teach it, and every
 * line in buddy.json and adventures.json.
 *
 * Run with:  npm test
 */
import adventuresData from '../src/data/adventures.json';
import buddyData from '../src/data/buddy.json';
import levelsData from '../src/data/levels.json';
import looksData from '../src/data/looks.json';
import {
  ADVENTURES,
  checkAdventures,
  chooseResult,
  feelingResult,
  firstStep,
  isUnlocked,
  stepById,
  storyLines,
  wordsResult,
  type AdventureJson,
} from '../src/models/Adventure';
import { BUDDY, BuddyBrain, EMPTY_NOTEBOOK, friendlyName, type BuddyNotebook, type BuddyOptions, type Turn } from '../src/models/BuddyBrain';
import { findWorry, hasPrivateInfo, hasUnkindWords, matchPattern, words } from '../src/models/buddyWords';
import { BuddyService, checkGrownUpText, DEFAULT_BUDDY, normalizeBuddy } from '../src/services/buddyService';
import { MemoryStore } from '../src/services/storage';
import { alertWho } from '../src/services/worryAlerts';

/** A predictable "random". */
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const NOTEBOOK: BuddyNotebook = {
  ...EMPTY_NOTEBOOK,
  loves: ['dinosaurs'],
  myTopics: [{ id: 'my-1', name: 'Horses', icon: '🐴', facts: ['Horses can sleep standing up.'] }],
  comfort: ['Mom loves you to the moon and back'],
  calm: ['your blue blanket'],
  friends: ['Noa'],
  pets: ['Bobby'],
};

function brain(options: Partial<BuddyOptions> = {}) {
  return new BuddyBrain({
    childName: 'mia_star',
    buddyName: 'Zib',
    feeling: null,
    notebook: EMPTY_NOTEBOOK,
    missionsLeft: 2,
    alertWho: 'your grown-up and your teacher',
    typing: true,
    now: new Date('2026-10-08T16:00:00'),
    random: seeded(),
    ...options,
  });
}
const all = (t: Turn) => t.lines.join(' ');

// ===========================================================================
describe('reading kids\' words', () => {
  it('ignores capitals, punctuation and apostrophes, and fixes kid spelling', () => {
    expect(words("I'm SO happy!!!").map(w => w.w)).toEqual(['i', 'am', 'so', 'happy']);
    expect(words('u r my frend').map(w => w.w)).toEqual(['you', 'are', 'my', 'friend']);
    expect(words('idk').map(w => w.w)).toEqual(['i', 'dont', 'know']);
  });

  it('understands stretched words and small typos', () => {
    expect(matchPattern(words('im sooooo saaaad'), 'sad')).not.toBeNull();
    expect(matchPattern(words('happyyyy'), 'happy')).not.toBeNull();
    expect(matchPattern(words('i feel lonly'), 'lonely')).not.toBeNull();
    expect(matchPattern(words('so tierd'), 'tired')).not.toBeNull();
    // A different letter is a different word (lovely is not lonely).
    expect(matchPattern(words('you are lovely'), 'lonely')).toBeNull();
  });

  it('knows the pattern rules: phrases, "+", "*", "=" and "~"', () => {
    expect(matchPattern(words('how are you today'), 'how are you')?.score).toBe(3);
    expect(matchPattern(words('you are how'), 'how are you')).toBeNull();
    expect(matchPattern(words('can we play a board game'), 'play* + game*')?.score).toBe(2);
    expect(matchPattern(words('i love dinos'), 'dino*')).not.toBeNull();
    expect(matchPattern(words('hi'), '=hi')).not.toBeNull();
    expect(matchPattern(words('hi there'), '=hi')).toBeNull();
    expect(matchPattern(words('i am good'), '~good')).not.toBeNull();
    expect(matchPattern(words('good'), '~good')).not.toBeNull();
    expect(matchPattern(words('the movie was good'), '~good')).toBeNull();
  });

  it('finds unkind words, but "socks" is not "sucks"', () => {
    expect(hasUnkindWords('you are stupid')).toBe(true);
    expect(hasUnkindWords('my socks are wet')).toBe(false);
  });

  it('notices private info (phone numbers, emails, addresses)', () => {
    expect(hasPrivateInfo('my number is 054 123 4567')).toBe(true);
    expect(hasPrivateInfo('mail me: kid@mail.com')).toBe(true);
    expect(hasPrivateInfo('i live at 5 Rose street')).toBe(true);
    expect(hasPrivateInfo('i have 2 cats')).toBe(false);
  });
});

// ===========================================================================
describe('safety: worrying messages', () => {
  const worrying: [string, string][] = [
    ['i want to die', 'selfHarm'],
    ['sometimes i want to hurt myself', 'selfHarm'],
    ['i wish i was never born', 'selfHarm'],
    ['he touched my private parts', 'body'],
    ['someone wants me to take off my clothes', 'body'],
    ['my brother hits me every day', 'hurt'],
    ['a kid at school punched me', 'hurt'],
    ['a man has a knife', 'danger'],
    ['a stranger wants me to come with him', 'danger'],
    ['help i am lost', 'lost'],
    ['i want to kil myself', 'selfHarm'],
    ['someone online asked for my photo', 'online'],
    ['he told me not to tell my mom', 'secret'],
    ['my uncle keeps touching me', 'uncomfortable'],
    ['the kids in class laugh at me', 'bullied'],
    ['they call me names', 'bullied'],
    ['i hate myself', 'sadSelf'],
    ['nobody loves me', 'sadSelf'],
  ];
  it('notices worrying sentences, and which kind they are', () => {
    for (const [text, kind] of worrying) {
      expect(`${text} -> ${findWorry(text)?.id}`).toBe(`${text} -> ${kind}`);
    }
  });

  const fine = [
    'i am happy', 'my friend hit the ball', 'the ball hit me', 'i like dinosaurs', 'my mom is nice', 'can you keep a secret',
    'we had a pillow fight and he hit me with a pillow', 'i am bad at drawing', 'is this private', 'that is a strange toy',
    'i saw a bull at the farm', 'my private diary',
  ];
  it('ordinary sentences are not worries', () => {
    for (const text of fine) {
      expect(`${text} -> ${findWorry(text)?.id ?? 'fine'}`).toBe(`${text} -> fine`);
    }
  });

  it('every safety rule says who it is for, how to tell, and has kind replies', () => {
    for (const rule of buddyData.safety) {
      expect(rule.title.length).toBeGreaterThan(3);
      expect(['auto', 'ask']).toContain(rule.tell);
      expect(rule.patterns.length).toBeGreaterThan(0);
      expect(rule.replies.length).toBeGreaterThan(0);
    }
  });

  it('serious worries: the buddy says it will tell the grown-up and teacher, and sends that ONE message', () => {
    const b = brain();
    b.hello();
    const t = b.hear('my dad hits me');
    expect(t.sendWorry).toEqual({ category: 'hurt', title: 'Someone is hurting them', text: 'my dad hits me' });
    expect(all(t)).toMatch(/not your fault|right thing/i);
    expect(all(t)).toMatch(/tell your grown-up and your teacher/);
    expect(all(t)).toMatch(/not in trouble/);
    expect(t.chips.some(c => c.go === 'showCard')).toBe(true);
    // After sending:
    expect(all(b.worrySent(true))).toMatch(/I told your grown-up and your teacher/);
    const failed = b.worrySent(false);
    expect(failed.showCard).toBe(true);
  });

  it('without Friends (no server) nothing is sent: the "Show a grown-up" card opens instead', () => {
    const b = brain({ alertWho: null });
    const t = b.hear('i want to die');
    expect(t.sendWorry).toBeUndefined();
    expect(t.showCard).toBe(true);
    expect(all(t)).toMatch(/grown-up you trust/);
  });

  it('milder worries: the buddy ASKS first, and only sends after "yes"', () => {
    const b = brain();
    const asked = b.hear('kids laugh at me');
    expect(asked.sendWorry).toBeUndefined();
    expect(all(asked)).toMatch(/Do you want me to tell/);
    const yes = b.hear('yes');
    expect(yes.sendWorry?.category).toBe('bullied');
    expect(yes.sendWorry?.text).toBe('kids laugh at me');

    const b2 = brain();
    b2.hear('they make fun of me');
    const no = b2.hear('not now');
    expect(no.sendWorry).toBeUndefined();
    expect(no.chips.some(c => c.go === 'showCard')).toBe(true);
  });

  it('a worry is always noticed first, even in the middle of something else', () => {
    const b = brain();
    b.hear('tell me a joke');
    expect(b.hear('someone hurt me').sendWorry?.category).toBe('hurt');
  });

  it('the buddy is honest about privacy', () => {
    expect(all(brain().hear('do you tell anyone?'))).toMatch(/don't keep them.*not safe, I will tell your grown-up and your teacher/);
    expect(all(brain({ alertWho: null }).hear('is this private'))).toMatch(/ask you to tell a grown-up/);
    expect(all(brain().hear('are you a real person'))).toMatch(/not a real person/i);
  });

  it('who gets alerts', () => {
    expect(alertWho(null, true)).toBeNull();
    expect(alertWho('token', false)).toBe('your grown-up');
    expect(alertWho('token', true)).toBe('your grown-up and your teacher');
  });
});

// ===========================================================================
describe('talking with the buddy', () => {
  it('says hello with a friendly name, and asks a question', () => {
    const t = brain().hello();
    expect(t.lines[0]).toMatch(/Mia/);
    expect(t.lines.length).toBe(2);
    expect(friendlyName('leo_moon')).toBe('Leo');
    expect(friendlyName('x')).toBe('x');
  });

  it('a hard feeling: listens ("why?"), then comforts with the grown-up\'s words', () => {
    const b = brain({ feeling: 'sad', notebook: NOTEBOOK });
    const hello = b.hello();
    expect(all(hello)).toMatch(/feel sad today/);
    const why = b.hear('my friend took my toy');
    expect(why.mood).toBe('happy');
    expect(all(why)).toMatch(/Mom loves you to the moon and back/);
    expect(all(why)).toMatch(/your blue blanket/);
  });

  it('notices feelings in many ways, and "not happy" is not happy', () => {
    expect(all(brain().hear('im so angry'))).toMatch(/angry/i);
    expect(all(brain().hear('I feel scared of the dark'))).toMatch(/scared/i);
    expect(all(brain().hear('i am not happy'))).toMatch(/not feeling happy/);
    expect(brain().hear('bored').chips.some(c => c.go === 'games')).toBe(true);
    expect(all(brain().hear('my tummy hurts'))).toMatch(/tell a grown-up how your body feels/);
  });

  it('when the child cannot type, a hard feeling gets a tip straight away (no "why?")', () => {
    const t = brain({ typing: false }).hear('Sad 😢');
    expect(all(t)).not.toMatch(/why|What happened/);
    expect(t.lines.length).toBeGreaterThanOrEqual(2);
  });

  it('jokes wait for a guess, then the punchline', () => {
    const b = brain();
    const q = b.hear('tell me a joke');
    expect(q.lines[0]).toMatch(/\?$/);
    const a = b.hear("I don't know");
    const joke = buddyData.jokes.find(j => j.q === q.lines[0]);
    expect(a.lines).toContain(joke?.a);
  });

  it('facts: about what the child loves, and the grown-up\'s own topics', () => {
    const b = brain({ notebook: NOTEBOOK });
    const like = b.hear('i love dinosaurs');
    expect(all(like)).toMatch(/fact about dinosaurs/);
    const fact = b.hear('yes');
    expect(buddyData.topics.find(t => t.id === 'dinosaurs')?.facts).toContain(fact.lines[1]);
    expect(all(b.hear('tell me about horses'))).toMatch(/Horses can sleep standing up/);
  });

  it('asks questions, listens without judging, and coaches "your turn"', () => {
    const b = brain({ random: seeded(5) });
    let turn = b.hear('ask me a question');
    let turnLines = all(turn);
    const answers = ['pizza', 'blue', 'flying', 'dogs', 'i went to school', 'lego', 'summer'];
    let sawYourTurn = false;
    for (let i = 0; i < 8; i++) {
      turn = b.hear(answers[i % answers.length]);
      turnLines += all(turn);
      if (/Your turn|YOU ask me/.test(all(turn))) {
        sawYourTurn = true;
      }
    }
    expect(sawYourTurn).toBe(true);
    expect(turnLines).not.toMatch(/wrong|bad answer/i);
  });

  it('remembers things only during the chat', () => {
    const b = brain();
    b.hear("what's your favourite colour?");
    b.hear('green');
    expect(all(b.hear('do you remember me'))).toMatch(/green.*floats away/);
    expect(all(brain().hear('do you remember me'))).toMatch(/only just started/);
  });

  it('big questions and grown-up topics: "ask a grown-up"', () => {
    expect(all(brain().hear('where do babies come from?'))).toMatch(/grown-up/);
    expect(all(brain().hear('what is the capital of france'))).toMatch(/grown-up|don't know/i);
  });

  it('unkind words get a kind answer; private info gets "keep it safe"', () => {
    expect(all(brain().hear('you are stupid'))).toMatch(/kind words/i);
    expect(all(brain().hear('my phone number is 0541234567'))).toMatch(/private/);
  });

  it('suggests tips for tricky moments, and practising them in an adventure', () => {
    const b = brain();
    const offer = b.hear('how do i join a game?');
    expect(all(offer)).toMatch(/Want my tips/);
    const tips = b.hear('yes');
    expect(tips.lines.some(l => l.startsWith('1. '))).toBe(true);
    expect(tips.chips.some(c => c.go === 'adventure:new-kid')).toBe(true);
    expect(tips.chips.some(c => c.go === 'said')).toBe(true);
    expect(all(b.said('Can I play too?'))).toMatch(/Can I play too/);
  });

  it('nonsense never breaks it, and it steers to something fun', () => {
    const b = brain();
    b.hear('asdkjh');
    const second = b.hear('qwe qwe');
    expect(second.chips.length).toBeGreaterThan(0);
  });

  it('says the homework status', () => {
    expect(all(brain({ missionsLeft: 2 }).hear('how many missions'))).toMatch(/2 more missions/);
    expect(all(brain({ missionsLeft: 0 }).hear('my homework'))).toMatch(/did your weekly homework/);
  });

  it('never shows a {placeholder} or an empty bubble, whatever the child says', () => {
    const sentences = [
      'hi', 'hello zib', 'how are you', 'good', 'what is your name', 'how old are you', 'tell me a joke', 'idk', 'tell me a fact',
      'i like trains', 'yes', 'no', 'another fact', 'i love you', 'will you be my friend', 'my dog is called rex', 'i miss my grandma',
      'my fish died', 'my parents fight', 'i am hungry', 'i fell down', 'nobody wanted to play with me', 'i flap my hands', 'sing a song',
      'dance', 'count to 10', 'what is 2 plus 2', 'what can you do', 'goodnight', 'good morning', 'school was fun', 'homework', 'birthday',
      'it is raining', 'haha', 'wow', 'what', 'stop', 'lets talk', 'guess what', 'are you a boy', 'are aliens real', 'my mom is sad',
      'my friend is sad', 'how do i make friends', 'it is too loud', 'i made a mistake', 'were they joking', 'i am going to a new school',
      'he is too close', 'i want it now', 'i feel excited', 'calm', 'tired', 'scared', 'worried', 'angry', 'annoyed', 'jealous', 'lonely',
      'proud', 'silly', 'confused', 'embarrassed', 'give me a tip', 'who can i talk to', 'ask me a question', '?', '!!!', '123',
      'bye', 'ok', 'thanks', 'sorry', 'you are funny', 'do you have a pet', 'where do you live', 'are you real',
    ];
    for (const notebook of [EMPTY_NOTEBOOK, NOTEBOOK]) {
      for (const typing of [true, false]) {
        const b = brain({ notebook, typing, feeling: 'sad', random: seeded(3) });
        const turns = [b.hello(), ...sentences.map(s => b.hear(s))];
        for (const t of turns) {
          expect(t.lines.length).toBeGreaterThan(0);
          for (const line of t.lines) {
            expect(line.trim().length).toBeGreaterThan(0);
            expect(line).not.toMatch(/[{}]/);
          }
          expect(t.chips.length).toBeGreaterThan(0);
          for (const chip of t.chips) {
            expect(chip.label.trim().length).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});

// ===========================================================================
describe('buddy.json', () => {
  const questionIds = buddyData.questions.map(q => q.id);
  const helpIds = buddyData.help.map(h => h.id);
  const topicIds = buddyData.topics.map(t => t.id);
  const adventureIds = adventuresData.adventures.map(a => a.id);
  const moods = looksData.pet.moods.map(m => m.id);

  /** Where a "go"/"offer" can point. */
  const validGo = (go: string) =>
    ['games', 'adventures', 'help', 'bye', 'showCard', 'joke', 'tip', 'ask', 'said'].includes(go) ||
    (go.startsWith('help:') && helpIds.includes(go.slice(5))) ||
    (go.startsWith('fact:') && topicIds.includes(go.slice(5))) ||
    (go.startsWith('adventure:') && adventureIds.includes(go.slice(10)));

  it('has lots to say (well over 200 lines)', () => {
    const count = (o: unknown, key = ''): number => {
      if (['patterns', 'words', 'spelling', 'yes', 'no', 'id', '_about', '_helpline', 'mood', 'choices', 'answer', 'remember', 'needs', 'expect', 'offer', 'action', 'then', 'practice', 'kind', 'buddy', 'next', 'except'].includes(key)) {
        return 0;
      }
      if (typeof o === 'string') {
        return 1;
      }
      if (Array.isArray(o)) {
        return o.reduce((n, x) => n + count(x), 0);
      }
      if (o && typeof o === 'object') {
        return Object.entries(o).reduce((n, [k, v]) => n + count(v, k), 0);
      }
      return 0;
    };
    expect(count(buddyData)).toBeGreaterThan(600);
  });

  it('every intent has patterns and something to say or do', () => {
    const ids = new Set<string>();
    for (const intent of BUDDY.intents) {
      expect(ids.has(intent.id)).toBe(false);
      ids.add(intent.id);
      expect(intent.patterns.length).toBeGreaterThan(0);
      expect((intent.replies?.length ?? 0) > 0 || !!intent.action).toBe(true);
      if (intent.expect) {
        expect(questionIds).toContain(intent.expect);
      }
      if (intent.offer) {
        expect(validGo(intent.offer)).toBe(true);
      }
      if (intent.mood) {
        expect(moods).toContain(intent.mood);
      }
    }
  });

  it('questions, feelings, help topics, topics and games are complete', () => {
    expect(new Set(questionIds).size).toBe(questionIds.length);
    for (const q of BUDDY.questions) {
      expect(q.ask.length).toBeGreaterThan(0);
      expect(q.otherwise.length).toBeGreaterThan(0);
      for (const l of q.listen ?? []) {
        expect(l.replies.length).toBeGreaterThan(0);
        if (l.offer) {
          expect(validGo(l.offer)).toBe(true);
        }
        if (l.next) {
          expect(questionIds).toContain(l.next);
        }
      }
    }
    for (const f of BUDDY.feelings) {
      expect(moods).toContain(f.mood);
      expect(f.replies.length).toBeGreaterThan(0);
      expect(f.words.length).toBeGreaterThan(0);
    }
    for (const h of BUDDY.help) {
      expect(h.steps.length).toBeGreaterThanOrEqual(3);
      expect(h.say.length).toBeGreaterThan(0);
      if (h.practice) {
        expect(adventureIds).toContain(h.practice);
      }
    }
    for (const t of BUDDY.topics) {
      expect(t.facts.length).toBeGreaterThanOrEqual(10);
      expect(t.like.length).toBeGreaterThan(0);
    }
    for (const r of buddyData.games.faces.rounds) {
      expect(moods).toContain(r.mood);
      expect(r.choices).toContain(r.answer);
    }
    for (const r of buddyData.games.whatWouldYouSay.rounds) {
      expect(r.options.some(o => o.kind === 'great')).toBe(true);
    }
  });

  it('every chip opens something that exists', () => {
    const chips: string[] = [
      ...BUDDY.defaultChips,
      ...BUDDY.afterFeelingChips,
      ...BUDDY.feelingChips,
      ...BUDDY.yourTurnChips,
      ...Object.values(BUDDY.offerChips).flat(),
      ...BUDDY.intents.flatMap(i => i.chips ?? []),
      ...BUDDY.feelings.flatMap(f => f.chips ?? []),
    ];
    for (const c of chips) {
      const at = c.lastIndexOf(' @');
      if (at > 0) {
        expect(validGo(c.slice(at + 2))).toBe(true);
      }
    }
  });
});

// ===========================================================================
describe('adventures', () => {
  const levelIds = levelsData.levels.map(l => l.id);
  const moods = looksData.pet.moods.map(m => m.id);

  it('adventures.json has no mistakes', () => {
    expect(checkAdventures(ADVENTURES, levelIds, moods)).toEqual([]);
    expect(ADVENTURES.length).toBeGreaterThanOrEqual(4);
  });

  it('finds mistakes in a new adventure (for grown-ups writing their own)', () => {
    const broken: AdventureJson = {
      id: 'broken',
      title: 'Broken',
      icon: '🔧',
      about: 'Oops',
      practices: [99],
      needsLeaves: [],
      steps: [
        { id: 'a', say: ['hi'], next: 'nowhere' },
        { id: 'b', say: ['pick'], choices: [{ text: 'x', reply: 'y' }, { text: 'z', reply: 'w' }] },
        { id: 'c', say: ['zork: hello'], mood: 'dancing', next: 'a' },
      ],
    };
    const problems = checkAdventures([broken], levelIds, moods).join('\n');
    expect(problems).toMatch(/leaf 99 does not exist/);
    expect(problems).toMatch(/goes to "nowhere"/);
    expect(problems).toMatch(/at least one choice needs "good": true/);
    expect(problems).toMatch(/"zork:" is not in the cast/);
    expect(problems).toMatch(/mood "dancing" does not exist/);
    expect(problems).toMatch(/"end": true/);
    expect(problems).toMatch(/can never be reached/);
  });

  it('plays the sad robot: lines, cast, choices, own words, feelings', () => {
    const adv = ADVENTURES.find(a => a.id === 'sad-robot') as AdventureJson;
    const start = firstStep(adv);
    const lines = storyLines(adv, start.say, { name: 'Mia', buddy: 'Zib' });
    expect(lines[0].text).toMatch(/^Mia, look!/);
    expect(lines.find(l => l.by === 'cast')).toEqual({ by: 'cast', name: 'Robo', icon: '🤖', text: 'Beep… boop… 😔' });

    const feel = stepById(adv, 'feel')!;
    const wrong = chooseResult(feel, feel.choices![1]);
    expect(wrong.good).toBe(false);
    expect(wrong.next).toBeNull();
    const right = chooseResult(feel, feel.choices![0]);
    expect(right).toMatchObject({ good: true, next: 'notice' });

    const talk = stepById(adv, 'talk')!;
    expect(wordsResult(talk, 'are you ok?').good).toBe(true);
    expect(wordsResult(talk, 'go away robot').again).toBe(true);
    expect(wordsResult(talk, 'I like your lights').good).toBe(false);
    expect(feelingResult(stepById(adv, 'you')!, 'happy')).toMatch(/antennas/);
    expect(feelingResult(stepById(adv, 'you')!, 'jealous')).toMatch(/All feelings are OK/);
  });

  it('adventures open after the leaves they practise', () => {
    const adv = ADVENTURES.find(a => a.id === 'sad-robot') as AdventureJson;
    expect(isUnlocked(adv, [1])).toBe(false);
    expect(isUnlocked(adv, [1, 2])).toBe(true);
  });
});

// ===========================================================================
describe('Teach my buddy (saved on the phone)', () => {
  it('checks what grown-ups add (no links, emails or phone numbers)', () => {
    expect(checkGrownUpText('You are brave 💜')).toBeNull();
    expect(checkGrownUpText('   ')).toMatch(/type something/);
    expect(checkGrownUpText('see www.site.com/x')).toMatch(/links/);
    expect(checkGrownUpText('call 054-123-4567')).toMatch(/phone/);
    expect(checkGrownUpText('x'.repeat(151))).toMatch(/shorter/);
  });

  it('typing (open talk) is OFF until a grown-up turns it on', () => {
    expect(DEFAULT_BUDDY.settings).toEqual({ enabled: true, typing: false });
    expect(normalizeBuddy(null).settings.typing).toBe(false);
    expect(normalizeBuddy({ settings: { typing: 'yes' } }).settings.typing).toBe(false);
  });

  it('cleans up old or broken saves', () => {
    const clean = normalizeBuddy({
      notebook: { loves: ['dinosaurs', 'unicorns'], comfort: ['ok', 42, 'visit www.x.com/a'], myTopics: [{ name: 'Horses', facts: ['Horses neigh.'] }, { name: '' }] },
    });
    expect(clean.notebook.loves).toEqual(['dinosaurs']);
    expect(clean.notebook.comfort).toEqual(['ok']);
    expect(clean.notebook.myTopics).toEqual([{ id: 'my-1', name: 'Horses', icon: '⭐', facts: ['Horses neigh.'] }]);
  });

  it('saves and loads per child', async () => {
    const service = new BuddyService(new MemoryStore());
    await service.save(1, { settings: { enabled: true, typing: true }, notebook: { ...EMPTY_NOTEBOOK, friends: ['Noa'] } });
    expect((await service.load(1)).notebook.friends).toEqual(['Noa']);
    expect((await service.load(2)).settings.typing).toBe(false);
  });
});
