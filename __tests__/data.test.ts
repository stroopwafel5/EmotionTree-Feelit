/**
 * data.test.ts
 * --------------------------------------------------------------------------
 * Checks the JSON data files, so a typo can never break the game:
 *   - every question has 4 answers, and its right answer is one of them
 *   - every question has a photo or a story card
 *   - every photo used by a question or explanation is in photos.json
 *   - every photo has an https image and a source link to credit it
 *   - every lesson has stories and a "What makes YOU ...?" balloon
 *   - every level is on a planet, and MainScreen builds them in order
 *
 * Run this after you edit questions.json, explanations.json or photos.json.
 */
import explanationsData from '../src/data/explanations.json';
import levelsData from '../src/data/levels.json';
import photosData from '../src/data/photos.json';
import questionsData from '../src/data/questions.json';
import {
  initExplanations,
  initLevels,
  initQuestions,
  initSections,
  initTree,
} from '../src/screens/MainScreen';
import { getAllPhotoIds, getPhoto } from '../src/services/photoLibrary';

const photoIds = new Set(getAllPhotoIds());

describe('questions.json', () => {
  it.each(questionsData.questions)('question $id is valid', question => {
    // Some questions have a photo, some a story card, some both.
    const q = question as {
      levelId: number;
      image?: string;
      scene?: string;
      question: string;
      answers: string[];
      correct: string;
    };
    expect(q.answers).toHaveLength(4);
    expect(new Set(q.answers).size).toBe(4); // no answer twice
    expect(q.answers).toContain(q.correct);
    expect(q.question.length).toBeGreaterThan(0);
    expect(Boolean(q.image) || Boolean(q.scene)).toBe(true);
    if (q.image) {
      expect(photoIds.has(q.image)).toBe(true);
    }
    expect(levelsData.levels.some(l => l.id === q.levelId)).toBe(true);
  });

  it('gives every level at least 4 questions', () => {
    levelsData.levels.forEach(level => {
      const count = questionsData.questions.filter(
        q => q.levelId === level.id,
      ).length;
      expect(count).toBeGreaterThanOrEqual(4);
    });
  });

  it('has unique question ids', () => {
    const ids = questionsData.questions.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('explanations.json', () => {
  it.each(explanationsData.explanations)('explanation $id is valid', e => {
    expect(e.photos.length).toBeGreaterThan(0);
    e.photos.forEach(id => expect(photoIds.has(id)).toBe(true));
    expect(e.explanation.length).toBeGreaterThan(0);
    expect(e.howToHelp.length).toBeGreaterThan(0);
    // Stories: each has a name, an emoji and a text.
    e.examples.forEach(story => {
      expect(story.name.length).toBeGreaterThan(0);
      expect(story.icon.length).toBeGreaterThan(0);
      expect(story.text.length).toBeGreaterThan(0);
    });
    expect(e.askYou.length).toBeGreaterThan(0);
  });

  it('has one lesson for every level', () => {
    levelsData.levels.forEach(level => {
      expect(
        explanationsData.explanations.some(e => e.id === level.id),
      ).toBe(true);
    });
  });
});

describe('photos.json', () => {
  it.each(photosData.photos)('photo $id has an image and a source', p => {
    expect(p.uri).toMatch(/^https:\/\//);
    expect(p.source).toMatch(/^https:\/\//);
    expect(p.site.length).toBeGreaterThan(0);
    expect(p.description.length).toBeGreaterThan(0);
    expect(getPhoto(p.id)).toBeDefined();
  });

  it('has unique photo ids', () => {
    expect(photoIds.size).toBe(photosData.photos.length);
  });
});

describe('levels.json', () => {
  it('puts every level on a planet that exists', () => {
    const planetIds = levelsData.sections.map(s => s.id);
    levelsData.levels.forEach(level => {
      expect(planetIds).toContain(level.section);
    });
  });

  it('has unique level ids', () => {
    const ids = levelsData.levels.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('MainScreen set-up (initQuestions / initLevels / initTree)', () => {
  it('builds the levels in order, starting with the 5 from the brief', () => {
    const levels = initLevels();
    expect(levels.map(l => l.getName())).toEqual([
      'Happiness',
      'Sadness',
      'Anger',
      'Tiredness',
      'Annoyedness',
      'Jealousy',
      'Fear',
      'Overstimulation',
      'Unfamiliar Places',
      'Special Interests',
      'Body Language',
      'Sarcasm',
      'Bullies & Ableism',
    ]);
    levels.forEach(level => {
      expect(level.getQuestions().length).toBeGreaterThan(0);
      expect(level.getExplanation().id).toBe(level.getId());
      expect(level.isCompleted()).toBe(false);
      expect(level.getSection()).not.toBe('');
    });
  });

  it('labels the planets with their emoji', () => {
    expect(initSections().get(1)).toBe('🪐 Planet 1: Basic Feelings');
    const tree = initTree(1, initLevels());
    expect(tree.getSections().map(s => s.total)).toEqual([5, 3, 5]);
  });

  it('groups every question under its level', () => {
    const byLevel = initQuestions();
    const total = [...byLevel.values()].reduce((n, qs) => n + qs.length, 0);
    expect(total).toBe(questionsData.questions.length);
    expect(initExplanations().size).toBe(levelsData.levels.length);
  });

  it('restores saved progress into the tree', () => {
    const levels = initLevels([1, 2]);
    const tree = initTree(5, levels);
    expect(tree.getId()).toBe(5);
    expect(tree.getCompletedCount()).toBe(2);
    expect(tree.getNextLeaf()?.name).toBe('Anger');
  });
});
