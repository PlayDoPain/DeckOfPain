// Plain Node tests for the rules engine (no dependencies): node tests/engine.test.js
const assert = require('assert');
// The browser scripts attach to window.DOP; make window the Node global so they load unchanged.
global.window = global;
require('../js/engine.js');
require('../js/yaml.js');
const E = window.DOP.engine;

const deck = E.buildDeck(2);
const c = (id) => deck.find((x) => x.id === id);
const mercy = (...ids) => E.evaluate(ids.map(c)).join(',');

assert.strictEqual(deck.length, 54);
assert.strictEqual(new Set(deck.map((x) => x.file)).size, 54);
const two = E.buildDeck(2, 2);
assert.strictEqual(two.length, 108);
assert.strictEqual(new Set(two.map((x) => x.id)).size, 108);   // duplicates stay distinct
assert.strictEqual(two.filter((x) => x.suit === 'J').length, 4);

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

const ids = (cs) => (cs || []).map((x) => x.id).sort().join(',');
const best = (hand, key) => ids(E.bestFor(hand.map(c), key));
assert.strictEqual(best(['S2', 'H10', 'D5'], 'single'), 'H10');
assert.strictEqual(best(['S2', 'J1', 'D10'], 'single'), 'D10');          // spare the Joker on a tie
assert.strictEqual(best(['S10', 'H13'], 'single'), 'H13');               // higher rank wins a tie
assert.strictEqual(best(['S5', 'H5', 'S9', 'H9'], 'pair'), 'H5,S5');     // lowest pair
assert.strictEqual(best(['S5', 'H7', 'J1'], 'pair'), 'J1,S5');           // Joker only when needed
assert.strictEqual(best(['S5', 'H6'], 'pair'), '');
assert.strictEqual(best(['S5', 'H5', 'D5', 'C5'], 'trips'), 'D5,H5,S5');
assert.strictEqual(best(['S2', 'S9', 'S4', 'S3', 'H13'], 'flush'), 'S2,S3,S4');
assert.strictEqual(best(['S5', 'H6', 'D7', 'S1', 'H2', 'D3'], 'straight'), 'D3,H2,S1');
assert.strictEqual(E.bestFor([], 'single'), null);

const yaml = window.DOP.parseYaml;
const cfg = yaml(require('fs').readFileSync(__dirname + '/../config/game.yaml', 'utf8'));
assert.strictEqual(cfg.MAX_RESTRAINTS, undefined);   // restraint cap was removed in v3.4
assert.strictEqual(cfg.DECKS_DUO, 2);
assert.strictEqual(cfg.DUO_NAME_1, 'A');
assert.strictEqual(cfg.IMPLEMENT_LIST['hair brush'], true);
assert.strictEqual(cfg.IMPLEMENT_LIST['crop'], false);

console.log('All engine tests passed.');
