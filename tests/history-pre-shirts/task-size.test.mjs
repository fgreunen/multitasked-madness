import { staff, unstaff } from './helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, CONFIG, CATEGORIES } from '../src/game.js';
import { taskValueMultiplier } from '../src/config.js';
import { setTaskSize } from './helpers.mjs';

const near = (actual, expected, epsilon = 1e-8) => assert.ok(Math.abs(actual - expected) < epsilon, `${actual} != ${expected}`);

function demandForSizeDraw(sizeDraw) {
  const game = new Game(17);
  const draws = [0.99, 0.99, sizeDraw];
  game.random = () => draws.shift();
  return game.createDemand();
}

test('Fibonacci size weights cover exact cumulative boundaries', () => {
  assert.deepEqual(CONFIG.taskSizes.map(({ size, chance }) => [size, chance]), [
    [1, 0.05], [2, 0.10], [3, 0.20], [5, 0.25], [8, 0.25], [13, 0.10], [21, 0.05],
  ]);
  for (const [draw, size] of [
    [0, 1], [0.049999, 1], [0.05, 2], [0.149999, 2], [0.15, 3], [0.349999, 3],
    [0.35, 5], [0.599999, 5], [0.6, 8], [0.849999, 8], [0.85, 13],
    [0.949999, 13], [0.95, 21], [0.999999, 21],
  ]) assert.equal(demandForSizeDraw(draw).size, size, `draw ${draw}`);
});

test('seeded demand samples follow the configured size distribution', () => {
  const game = new Game(42);
  const counts = new Map(CONFIG.taskSizes.map(({ size }) => [size, 0]));
  const sample = 50000;
  for (let index = 0; index < sample; index++) {
    const task = game.createDemand();
    counts.set(task.size, counts.get(task.size) + 1);
  }
  for (const { size, chance } of CONFIG.taskSizes) near(counts.get(size) / sample, chance, 0.01);
});

test('size and category modifiers determine rounded value before satisfaction gain', () => {
  const game = new Game(17);
  game.stakeholders[0].satisfaction = 2;
  const task = setTaskSize(game.slots[0], 13);
  task.category = CATEGORIES[0];
  assert.deepEqual(game.pointsFor(task), { bonus: 2, base: 15.730000000000002, reward: 18, failure: 0 });
  staff(game, task.id);
  game.finish(task, true);
  assert.equal(task.outcomeValue, 18);
  assert.equal(game.stakeholders[0].satisfaction, 3);
});

test('all category modifiers, rounding and the one-point floor apply to sized work', () => {
  const game = new Game(17);
  const task = setTaskSize(game.slots[0], 13);
  const bases = [15.73, 12.87, 12.87, 10.53];
  CATEGORIES.forEach((category, index) => {
    task.category = category;
    game.stakeholders[0].satisfaction = 0;
    near(taskValueMultiplier(category), [1.21, 0.99, 0.99, 0.81][index]);
    near(game.pointsFor(task).base, bases[index]);
    assert.equal(game.pointsFor(task).reward, Math.round(bases[index]));
  });
  task.category = CATEGORIES[3];
  game.stakeholders[0].satisfaction = -100;
  assert.equal(game.pointsFor(task).reward, CONFIG.minimumTaskValue);
  assert.equal(game.pointsFor(task).failure, 0);
});

test('one persistent minion produces progress inversely proportional to size', () => {
  const games = [1, 13].map((size) => {
    const game = new Game(17);
    const task = setTaskSize(game.slots[0], size);
    task.scopeCreepChecked = true;
    staff(game, task.id);
    game.tick(1);
    return game;
  });
  const gains = games.map((game) => game.slots[0].progress - CONFIG.startingProgress);
  near(gains[0] / gains[1], 13);
});

test('Explicit admission preserves queued size and category', () => {
  const game = new Game(17);
  const oldest = game.createDemand();
  setTaskSize(oldest, 21);
  oldest.category = CATEGORIES[2];
  game.pending.push(oldest, game.createDemand());
  staff(game, game.slots[0].id);
  unstaff(game);
  game.slots[0].progress = 0.001;
  game.tick(1);
  assert.equal(game.slots[0], null);
  assert.equal(game.admitDemand(oldest.id), true);
  assert.equal(game.slots[0], oldest);
  assert.equal(game.slots[0].size, 21);
  assert.equal(game.slots[0].category, CATEGORIES[2]);
});

test('both levels share sized growth, decay and scoring', () => {
  const games = [new Game(17, 1), new Game(17, 2)];
  for (const game of games) {
    const task = setTaskSize(game.slots[0], 8);
    task.category = CATEGORIES[2];
    task.scopeCreepChecked = true;
    staff(game, task.id);
    game.tick(1);
  }
  near(games[0].slots[0].progress, games[1].slots[0].progress);
  assert.deepEqual(games[0].pointsFor(games[0].slots[0]), games[1].pointsFor(games[1].slots[0]));
  for (const game of games) { unstaff(game); game.tick(1); }
  near(games[0].slots[0].progress, games[1].slots[0].progress);
});
