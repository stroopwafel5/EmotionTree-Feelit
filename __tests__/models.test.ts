/**
 * models.test.ts
 * --------------------------------------------------------------------------
 * Checks the game rules in the model classes:
 *   Leaf     - clickable / colour status
 *   Question - right answer checks
 *   Level    - getters, setters, toLeaf(), finish()
 *   MyTree   - which leaf is "next", getTree(), colours, updates
 *
 * Run with:  npm test
 */
import { getAnswerLook } from '../src/components/LevelPlayer';
import { Explanation } from '../src/models/Explanation';
import { Leaf } from '../src/models/Leaf';
import { Level } from '../src/models/Level';
import { MyTree } from '../src/models/MyTree';
import { Question } from '../src/models/Question';
import { colors } from '../src/theme/theme';

/** Makes a small level for the tests. */
function makeLevel(id: number, completed = false): Level {
  const explanation = new Explanation(id, ['happy-1'], 'Text', 'Help');
  const question = new Question(id, 'What?', ['A', 'B', 'C', 'D'], 'A', 'p');
  return new Level(id, `Level ${id}`, explanation, [question], completed);
}

describe('Leaf', () => {
  it('a completed leaf is clickable and light purple', () => {
    const leaf = new Leaf(1, 'Happiness', true, false);
    expect(leaf.clickable).toBe(true);
    expect(leaf.getStatus()).toBe('completed');
  });

  it('the next leaf is clickable', () => {
    const leaf = new Leaf(2, 'Sadness', false, true);
    expect(leaf.clickable).toBe(true);
    expect(leaf.getStatus()).toBe('next');
  });

  it('a locked leaf is NOT clickable', () => {
    const leaf = new Leaf(3, 'Anger', false, false);
    expect(leaf.clickable).toBe(false);
    expect(leaf.getStatus()).toBe('locked');
  });
});

describe('Question', () => {
  it('knows the right answer', () => {
    const q = new Question(1, 'What?', ['Happy', 'Sad'], 'Happy', 'happy-1');
    expect(q.isCorrect('Happy')).toBe(true);
    expect(q.isCorrect('Sad')).toBe(false);
  });

  it('refuses a question whose right answer is not in the list', () => {
    expect(() => new Question(1, 'What?', ['A', 'B'], 'C', 'x')).toThrow();
  });

  it('can be a story question with no photo', () => {
    const q = Question.fromJson({
      id: 2,
      levelId: 6,
      scene: 'A kid is playing with a toy. You want it too.',
      sceneIcon: '🧸',
      question: 'What are you feeling?',
      answers: ['Jealous', 'Happy', 'Tired', 'Scared'],
      correct: 'Jealous',
    });
    expect(q.image).toBeUndefined();
    expect(q.sceneIcon).toBe('🧸');
  });

  it('needs a photo or a story', () => {
    expect(() => new Question(3, 'What?', ['A', 'B'], 'A')).toThrow();
  });
});

describe('Explanation', () => {
  it('joins a list of lines and uses the default heading', () => {
    const e = Explanation.fromJson({
      id: 1,
      photos: ['happy-1'],
      explanation: ['Line one.', 'Line two.'],
      howToHelp: 'Smile.',
    });
    expect(e.getExplanationLines()).toEqual(['Line one.', 'Line two.']);
    expect(e.howToHelpTitle).toBe('How can we help? 🤝');
    expect(e.hasExamples()).toBe(false);
    expect(e.askYou).toBe('');
  });

  it('keeps stories, the balloon question and a custom heading', () => {
    const e = Explanation.fromJson({
      id: 7,
      photos: ['fear-1'],
      explanation: ['Scared is a feeling.'],
      howToHelp: ['Breathe slowly.'],
      howToHelpTitle: 'How to handle fear 🛟',
      examples: [
        { name: 'Leo', icon: '👦', text: 'Leo is scared of the dark.' },
      ],
      askYou: 'What makes YOU scared?',
    });
    expect(e.hasExamples()).toBe(true);
    expect(e.askYou).toBe('What makes YOU scared?');
    expect(e.howToHelpTitle).toBe('How to handle fear 🛟');
  });
});

describe('Level', () => {
  it('has working getters and setters', () => {
    const level = makeLevel(1);
    expect(level.getId()).toBe(1);
    level.setName('Happiness');
    expect(level.getName()).toBe('Happiness');
    level.setCompleted(true);
    expect(level.isCompleted()).toBe(true);
    level.setIcon('😊');
    expect(level.getIcon()).toBe('😊');
  });

  it('toLeaf() copies id, name and completed', () => {
    const leaf = makeLevel(4, true).toLeaf();
    expect(leaf).toBeInstanceOf(Leaf);
    expect(leaf.id).toBe(4);
    expect(leaf.name).toBe('Level 4');
    expect(leaf.completed).toBe(true);
  });

  it('finish() sets completed = TRUE and redraws the tree', () => {
    const levels = [makeLevel(1), makeLevel(2)];
    const tree = MyTree.fromLevels(1, 1, levels);
    const redraw = jest.fn();

    levels[0].finish(tree, redraw);

    expect(levels[0].isCompleted()).toBe(true);
    expect(redraw).toHaveBeenCalledTimes(1);
    // The tree moved on: leaf 1 is done, leaf 2 is next.
    expect(tree.getLeaves()[0].completed).toBe(true);
    expect(tree.getNextLeaf()?.id).toBe(2);
  });
});

describe('MyTree', () => {
  it('marks the first unfinished leaf as next', () => {
    const tree = MyTree.fromLevels(1, 7, [
      makeLevel(1, true),
      makeLevel(2),
      makeLevel(3),
    ]);
    const leaves = tree.getLeaves();
    expect(leaves.map(l => l.getStatus())).toEqual([
      'completed',
      'next',
      'locked',
    ]);
    expect(leaves.map(l => l.clickable)).toEqual([true, true, false]);
    expect(tree.getUserId()).toBe(7);
  });

  it('has exactly one next leaf, or none when all are done', () => {
    const tree = MyTree.fromLevels(1, 1, [makeLevel(1), makeLevel(2)]);
    expect(tree.getLeaves().filter(l => l.isNext)).toHaveLength(1);

    tree.updateLeaf(new Leaf(1, 'Level 1', true, false));
    tree.updateLeaf(new Leaf(2, 'Level 2', true, false));
    expect(tree.getNextLeaf()).toBeUndefined();
    expect(tree.isFinished()).toBe(true);
    expect(tree.getCompletedCount()).toBe(2);
  });

  it('getTree() returns the leaves as text', () => {
    const tree = MyTree.fromLevels(1, 1, [makeLevel(1), makeLevel(2)]);
    const text = tree.getTree();
    expect(typeof text).toBe('string');
    expect(text.startsWith('[')).toBe(true);
    expect(text).toContain('Leaf(1, Level 1');
    expect(text).toContain('isNext=true');
  });

  it('uses the colours from the brief', () => {
    expect(MyTree.getLeafColors(new Leaf(1, 'a', true, false)).background).toBe(
      colors.leafCompleted, // light purple
    );
    expect(MyTree.getLeafColors(new Leaf(1, 'a', false, true)).background).toBe(
      colors.leafNext, // dark purple
    );
    expect(
      MyTree.getLeafColors(new Leaf(1, 'a', false, false)).background,
    ).toBe(colors.leafLocked); // grey
  });

  it('counts the leaves done on each planet', () => {
    const levels = [makeLevel(1, true), makeLevel(2), makeLevel(3)];
    levels[0].setSection('🪐 Planet 1');
    levels[1].setSection('🪐 Planet 1');
    levels[2].setSection('🌋 Planet 2');
    const tree = MyTree.fromLevels(1, 1, levels);
    expect(tree.getSections()).toEqual([
      { title: '🪐 Planet 1', done: 1, total: 2 },
      { title: '🌋 Planet 2', done: 0, total: 1 },
    ]);
    // The planet survives when the tree updates which leaf is next.
    expect(tree.getLeaves()[1].section).toBe('🪐 Planet 1');
  });

  it('zig-zags the path left and right', () => {
    const offsets = [0, 1, 2, 3, 4].map(i => MyTree.getLeafOffset(i));
    expect(offsets).toEqual([0, 70, 0, -70, 0]);
  });
});

describe('answer buttons', () => {
  it('turn green for a right answer and red for a wrong one', () => {
    expect(getAnswerLook('Happy', null, 'Happy')).toBe('idle');
    expect(getAnswerLook('Happy', 'Happy', 'Happy')).toBe('right');
    expect(getAnswerLook('Sad', 'Sad', 'Happy')).toBe('wrong');
    expect(getAnswerLook('Tired', 'Sad', 'Happy')).toBe('dimmed');
  });
});
