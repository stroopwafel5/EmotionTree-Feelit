/**
 * friends.test.ts
 * --------------------------------------------------------------------------
 * Checks the new avatar + Friends parts of the app:
 *   Dec, Look.defineLook (humans AND pets), Pet, User,
 *   the buddy's face ("Same as me"), friend codes,
 *   chat message merging, the red Friends number,
 *   saving the profile, and the grown-up password check.
 *
 * (The server has its own tests: cd server && npm test)
 *
 * Run with:  npm test
 */
import { buddyFace } from '../src/components/avatar/BuddyAvatar';
import looksData from '../src/data/looks.json';
import { Dec } from '../src/models/Dec';
import { Look } from '../src/models/Look';
import { Pet } from '../src/models/Pet';
import { User } from '../src/models/User';
import { AuthService } from '../src/services/authService';
import { feelings, phraseCategories, phraseText } from '../src/services/feelings';
import { CODE_WORDS, makeCode, prettyCode } from '../src/services/friendCode';
import { mergeMessages, type ChatMessage, type FriendsOverview } from '../src/services/friendsService';
import { catalog } from '../src/services/looksCatalog';
import { ProfileService } from '../src/services/profileService';
import { MemoryStore } from '../src/services/storage';
import { countNews } from '../src/services/useFriendsOverview';

const human = { hair: 'buns', hairColor: 'purple', skin: 'skin4', outfit: 'spacesuit', accessories: ['catEars'] };
const buddy = { kind: 'alien', style: 'threeEyes', color: 'green', mood: 'silly', accessories: ['spaceHelmet'] };

describe('Dec', () => {
  it('is made from looks.json items', () => {
    const dec = Dec.fromJson('accessory', { id: 'glasses', name: 'Glasses', icon: '👓' });
    expect(dec.kind).toBe('accessory');
    expect(dec.isColor()).toBe(false);
    expect(Dec.fromJson('skin', { id: 'skin1', name: 'Skin 1', color: '#FCE3CF' }).isColor()).toBe(true);
  });

  it('every item in looks.json has a unique id in its list', () => {
    const lists = [
      ...Object.values(catalog.human),
      catalog.pet.kinds,
      catalog.pet.colors,
      catalog.pet.moods,
      catalog.pet.accessories,
      ...Object.values(catalog.pet.styles),
    ];
    for (const list of lists) {
      const ids = list.map(d => d.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('Look.defineLook - humans', () => {
  it('sets hair, skin and accessories from the choices', () => {
    const look = Look.human(7, human);
    expect(look.isHuman).toBe(true);
    expect(look.userId).toBe(7);
    expect(look.hair.id).toBe('buns');
    expect(look.skin.color).toBe('#D49C6C');
    expect(look.has('catEars')).toBe(true);
    expect(look.has('glasses')).toBe(false);
    expect(look.toChoices()).toEqual(human);
  });

  it('allows fun skin colours (green, blue, red...)', () => {
    for (const skin of ['funGreen', 'funBlue', 'funRed']) {
      expect(Look.human(1, { ...human, skin }).skin.id).toBe(skin);
    }
  });

  it('refuses unknown choices with a clear message', () => {
    expect(() => Look.human(1, { ...human, hair: 'mohawk' })).toThrow('Unknown hair style: "mohawk"');
  });

  it('keeps each accessory once', () => {
    const look = Look.human(1, { ...human, accessories: ['glasses', 'glasses'] });
    expect(look.accessories.map(a => a.id)).toEqual(['glasses']);
  });

  it('safeHuman() falls back to the defaults instead of breaking', () => {
    expect(Look.safeHuman(1, { hair: 'mohawk' }).hair.id).toBe(looksData.defaults.human.hair);
    expect(Look.safeHuman(1, null).skin.id).toBe(looksData.defaults.human.skin);
  });
});

describe('Look.defineLook - pets', () => {
  it('sets the buddy kind, style, colour, face and accessories', () => {
    const look = Look.pet(3, buddy);
    expect(look.isHuman).toBe(false);
    expect(look.kind?.id).toBe('alien');
    expect(look.hair.id).toBe('threeEyes'); // for pets, "hair" is the style
    expect(look.skin.id).toBe('green'); // ...and "skin" is the colour
    expect(look.mood?.id).toBe('silly');
    expect(look.toChoices()).toEqual(buddy);
  });

  it('a style must belong to the buddy kind', () => {
    expect(() => Look.pet(1, { ...buddy, kind: 'cat' })).toThrow('Unknown buddy style');
  });

  it('older saves without a face get the default smile', () => {
    const { mood: _unused, ...old } = buddy;
    expect(Look.pet(1, old).mood?.id).toBe('happy');
  });

  it('refuses an unknown face', () => {
    expect(() => Look.pet(1, { ...buddy, mood: 'evil' })).toThrow('Unknown buddy face');
  });
});

describe('Pet', () => {
  it('fromJson() builds a buddy and toJson() gives it back', () => {
    const pet = Pet.fromJson(5, { name: 'Comet', ...buddy });
    expect(pet.getKind()).toBe('alien');
    expect(pet.getMood()).toBe('silly');
    expect(pet.toJson()).toEqual({ name: 'Comet', ...buddy });
  });

  it('rename() only allows short, simple names', () => {
    const pet = Pet.fromJson(5, null);
    expect(pet.rename('  Nova  ')).toBeNull();
    expect(pet.name).toBe('Nova');
    expect(pet.rename('')).not.toBeNull();
    expect(pet.rename('www.example.com/visit-me')).not.toBeNull();
    expect(pet.rename('call 0541234567')).not.toBeNull();
    expect(pet.rename('bit.ly')).not.toBeNull();
    expect(pet.rename('R2D2')).toBeNull();
    expect(pet.rename('Zib Jr.')).toBeNull();
    pet.rename('Nova');
    expect(pet.name).toBe('Nova');
  });
});

describe("The buddy's face", () => {
  it('shows the chosen face', () => {
    expect(buddyFace(Pet.fromJson(1, { name: 'B', ...buddy, mood: 'grumpy' }), 'happy')).toBe('grumpy');
  });

  it('"Same as me" copies the child\'s feeling', () => {
    const pet = Pet.fromJson(1, { name: 'B', ...buddy, mood: 'mirror' });
    expect(buddyFace(pet, 'sad')).toBe('sad');
    expect(buddyFace(pet, 'excited')).toBe('grin');
    expect(buddyFace(pet, 'tired')).toBe('sleepy');
    expect(buddyFace(pet, null)).toBe('happy');
  });

  it('every feeling in feelings.json has a buddy face for "Same as me"', () => {
    const pet = Pet.fromJson(1, { name: 'B', ...buddy, mood: 'mirror' });
    const faces = catalog.pet.moods.map(m => m.id);
    for (const f of feelings) {
      expect(faces).toContain(buddyFace(pet, f.id));
    }
  });
});

describe('User', () => {
  const json = { id: 9, username: 'Mia', look: human, pet: { name: 'Comet', ...buddy }, feeling: 'happy' };

  it('fromJson() builds the look, the buddy and the feeling', () => {
    const friend = User.fromJson({ ...json, id: 10, username: 'Leo' });
    const user = User.fromJson(json, [friend]);
    expect(user.look.hair.id).toBe('buns');
    expect(user.pet.name).toBe('Comet');
    expect(user.getFeeling()?.emoji).toBe('😊');
    expect(user.getFriend(10)?.username).toBe('Leo');
    expect(user.getFriend(11)).toBeUndefined();
  });

  it('setFeeling() only takes feelings from feelings.json', () => {
    const user = User.fromJson(json);
    user.setFeeling('overwhelmed');
    expect(user.getFeeling()?.name).toBe('Too much');
    user.setFeeling(null);
    expect(user.getFeeling()).toBeNull();
    expect(() => user.setFeeling('grumpy-ish')).toThrow();
  });
});

describe('Ready-made phrases', () => {
  it('every phrase id is unique (old messages point to them)', () => {
    const ids = phraseCategories.flatMap(c => c.phrases.map(p => p.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(phraseText('hi')).toBe('Hi! 👋');
    expect(phraseText('no-such-phrase')).toBe('…');
  });
});

describe('Friend codes', () => {
  // (server/test/safety.test.js checks that these words match the server's.)
  it('has 10 different words, each with a picture', () => {
    expect(new Set(CODE_WORDS.map(w => w.word)).size).toBe(10);
    expect(CODE_WORDS.every(w => w.icon.length > 0)).toBe(true);
  });

  it('shows the picture with the code', () => {
    expect(makeCode('COMET', '0427')).toBe('COMET-0427');
    expect(prettyCode('COMET-0427')).toBe('☄️ COMET-0427');
    expect(prettyCode('ODD-1')).toBe('ODD-1');
  });
});

describe('Chat messages', () => {
  const msg = (id: number, extra: Partial<ChatMessage> = {}): ChatMessage => ({
    id,
    kind: 'phrase',
    phraseId: 'hi',
    from: { type: 'kid', id: 1, name: 'Mia' },
    createdAt: '2026-10-08T10:00:00Z',
    reported: false,
    ...extra,
  });

  it('keeps every message once, oldest first', () => {
    const merged = mergeMessages([msg(1), msg(3)], [msg(2), msg(3, { reported: true })]);
    expect(merged.map(m => m.id)).toEqual([1, 2, 3]);
    expect(merged[2].reported).toBe(true);
  });
});

describe('The red number on Friends', () => {
  it('adds new messages and friend requests', () => {
    const overview = {
      parent: { unread: 1 },
      friends: [{ unread: 2 }, { unread: 0 }],
      groups: [{ unread: 3 }],
      incoming: [{ id: 1 }],
    } as unknown as FriendsOverview;
    expect(countNews(overview)).toBe(7);
    expect(countNews(null)).toBe(0);
  });
});

describe('ProfileService', () => {
  it('gives a new child the default avatar and buddy, and saves changes', async () => {
    const service = new ProfileService(new MemoryStore());
    const fresh = await service.load(1);
    expect(fresh).toEqual(ProfileService.defaults());
    await service.save(1, { look: human, pet: { name: 'Comet', ...buddy }, feeling: 'calm' });
    const again = await service.load(1);
    expect(again.look.hair).toBe('buns');
    expect(again.pet.mood).toBe('silly');
    expect(again.feeling).toBe('calm');
    // Another child on the same phone has their own profile:
    expect((await service.load(2)).look).toEqual(looksData.defaults.human);
  });
});

describe('AuthService.checkPassword (turning on Friends)', () => {
  it('checks the password without logging anyone in', async () => {
    const auth = new AuthService(new MemoryStore());
    await auth.register('mia_star', 'grownup@example.com', 'rocket-1234');
    await auth.logOut();
    expect((await auth.checkPassword('mia_star', 'wrong-password')).ok).toBe(false);
    expect((await auth.checkPassword('mia_star', 'rocket-1234')).ok).toBe(true);
    expect(await auth.getCurrentUser()).toBeNull();
  });
});
