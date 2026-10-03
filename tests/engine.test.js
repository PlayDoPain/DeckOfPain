// Plain Node tests for the rules engine (no dependencies): node tests/engine.test.js
const assert = require('assert');
global.window = {};
require('../js/engine.js');
const E = window.DOP.engine;

const deck = E.buildDeck(2);
const c = (id) => deck.find((x) => x.id === id);
const mercy = (...ids) => E.evaluate(ids.map(c)).join(',');

assert.strictEqual(deck.length, 54);
assert.strictEqual(new Set(deck.map((x) => x.file)).size, 54);

assert.strictEqual(mercy('S5'), 'single');
assert.strictEqual(mercy('S5', 'H5'), 'pair');
assert.strictEqual(mercy('S5', 'H6'), '');
assert.strictEqual(mercy('S5', 'J1'), 'pair');
assert.strictEqual(mercy('S5', 'H5', 'D5'), 'trips');
assert.strictEqual(mercy('S2', 'S9', 'S13'), 'flush');
assert.strictEqual(mercy('S5', 'H6', 'D7'), 'straight');
assert.strictEqual(mercy('S1', 'H2', 'D3'), 'straight');   // Ace low
assert.strictEqual(mercy('S12', 'H13', 'D1'), 'straight'); // Ace high
assert.strictEqual(mercy('S13', 'H1', 'D2'), '');          // no wrap-around
assert.strictEqual(mercy('S5', 'S6', 'S7'), 'flush,straight');
assert.strictEqual(mercy('S5', 'J1', 'D7'), 'straight');
assert.strictEqual(mercy('S2', 'H9', 'D13'), '');

assert.deepStrictEqual(E.punishment([c('S1'), c('H7'), c('D12')]), { swats: 18, faces: 1 });
assert.deepStrictEqual(E.punishment([c('J1'), c('J2')]), { swats: 20, faces: 2 });

const yaml = (() => { global.window = { DOP: {} }; require('../js/yaml.js'); return window.DOP.parseYaml; })();
const cfg = yaml(require('fs').readFileSync(__dirname + '/../config/game.yaml', 'utf8'));
assert.strictEqual(cfg.MAX_RESTRAINTS, 4);
assert.strictEqual(cfg.IMPLEMENT_LIST['hair brush'], true);
assert.strictEqual(cfg.IMPLEMENT_LIST['crop'], false);

console.log('All engine tests passed.');
