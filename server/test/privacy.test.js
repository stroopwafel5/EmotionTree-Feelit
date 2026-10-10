/**
 * privacy.test.js
 * --------------------------------------------------------------------------
 * Checks the APP's source code (not the server) for the space buddy's
 * privacy promise:
 *
 *   - The buddy's brain, adventures, games and screens never talk to any
 *     server. Only worryAlerts.ts sends something - one worrying message,
 *     to our own Friends server.
 *   - No AI company is used anywhere (no AI libraries, no AI web addresses).
 *
 * Run with:  npm test
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const app = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = file => fs.readFileSync(path.join(app, file), 'utf8');
const list = dir => fs.readdirSync(path.join(app, dir)).map(f => path.join(dir, f));

const BUDDY_FILES = [
  'src/models/BuddyBrain.ts',
  'src/models/buddyWords.ts',
  'src/models/Adventure.ts',
  'src/services/buddyService.ts',
  ...list('src/screens/buddy'),
  ...list('src/components/buddy'),
];

describe('space buddy privacy (app code)', () => {
  test('the buddy files never talk to a server', () => {
    for (const file of BUDDY_FILES) {
      const code = read(file);
      const code_ = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''); // without comments
      for (const bad of ['fetch(', 'apiRequest', 'XMLHttpRequest', 'WebSocket', "services/api'", 'friendsService', 'worryAlerts']) {
        assert.equal(code_.includes(bad), false, `${file} must not use ${bad}`);
      }
    }
  });

  test('only worryAlerts.ts sends something, and only to /api/buddy/alert', () => {
    const code = read('src/services/worryAlerts.ts');
    const calls = [...code.matchAll(/apiRequest[^(]*\(\s*'(\w+)',\s*'([^']+)'/g)].map(m => `${m[1]} ${m[2]}`);
    assert.deepEqual(calls, ['POST /api/buddy/alert']);
    // The screen passes the worry on only through onWorry -> sendWorry.
    const main = read('src/screens/MainScreen.tsx');
    assert.equal((main.match(/sendWorry\(/g) ?? []).length, 1);
  });

  test('the chat is never saved: the buddy files never use storage', () => {
    for (const file of BUDDY_FILES.filter(f => !f.endsWith('buddyService.ts'))) {
      const code = read(file);
      assert.equal(/AsyncStorage|deviceStorage|writeJson|setItem/.test(code), false, `${file} must not save anything`);
    }
  });

  test('no AI company anywhere: no AI libraries, no AI web addresses', () => {
    const deps = { ...JSON.parse(read('package.json')).dependencies, ...JSON.parse(read('server/package.json')).dependencies };
    for (const name of Object.keys(deps ?? {})) {
      assert.equal(/openai|anthropic|langchain|gemini|cohere|mistral|huggingface|llm/i.test(name), false, `AI library found: ${name}`);
    }
    const walk = dir =>
      fs.readdirSync(path.join(app, dir), { withFileTypes: true }).flatMap(d =>
        d.isDirectory() ? walk(path.join(dir, d.name)) : /\.(ts|tsx|js)$/.test(d.name) ? [path.join(dir, d.name)] : [],
      );
    for (const file of [...walk('src'), ...walk('server/src')]) {
      assert.equal(/api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis|api\.cohere|api\.mistral/i.test(read(file)), false, `${file} talks to an AI company`);
    }
  });
});
