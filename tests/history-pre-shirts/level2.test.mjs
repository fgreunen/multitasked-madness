import { staff, unstaff } from './helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, CONFIG, CATEGORIES, seasonAt } from '../src/game.js';
import { setTaskSize } from './helpers.mjs';

const live = (game) => game.slots.filter(task => task && ['task', 'waiting'].includes(task.state));
function opened(count = CONFIG.slots) {
  const game = new Game(17, 2);
  game.unlockedSlots = count;
  staff(game, game.slots[0].id);
  unstaff(game);
  game.pending.push(...Array.from({ length: 12 }, () => game.createDemand()));
  return game;
}

test('level 2 starts with one stakeholder and admits at most two tasks after unlocking', () => {
  const game = new Game(17, 2);
  assert.equal(game.unlockedSlots, 1);
  assert.equal(game.workLimit, 1);
  assert.equal(game.workCount, 1);
  assert.equal(game.status, 'ready');
  game.delivered = 90;
  setTaskSize(game.slots[0], 8);
  staff(game, game.slots[0].id);
  game.finish(game.slots[0], true);
  assert.equal(game.unlockedSlots, 2);
  game.pending.push(...Array.from({length: 4}, () => setTaskSize(game.createDemand(),21)));
  game.tick(2);
  game.admitDemand(); game.tick(CONFIG.admissionSeconds); game.admitDemand();
  assert.equal(game.workLimit, 2);
  assert.equal(game.workCount, 2);
  game.admitDemand();
  assert.equal(game.workCount, 2);
});

test('automatic rotation visits all four stakeholders in order without replacing live work', () => {
  const game = opened();
  game.admitDemand();
  const second = game.slots[1];
  assert.ok(second);
  const visits = [0];
  for (let slot = 0; slot < CONFIG.slots - 1; slot++) {
    const task = game.slots[slot === 0 ? 0 : slot + 1];
    assert.ok(task);
    task.dependencyChecked = true;
    if (slot > 0) visits.push(slot + 1);
    game.finish(task, true);
    game.elapsed += CONFIG.admissionSeconds;
    game.admitDemand();
    assert.ok(game.workCount <= 2);
    assert.equal(game.slots[1], second);
  }
  assert.deepEqual(visits, [0, 2, 3]);
  game.finish(second, true);
  game.elapsed += CONFIG.admissionSeconds;
  game.admitDemand();
  assert.ok(game.revealedSlots.every(Boolean));
});

test('queued progress and category stay frozen while idle stakeholder satisfaction falls', () => {
  const game = opened(4);
  game.admitDemand();
  const queued = [...game.pending];
  const progress = queued.map(task => task.progress);
  const categories = queued.map(task => task.category);
  game.tick(1);
  assert.deepEqual(game.pending, queued);
  assert.deepEqual(queued.map(task => task.progress), progress);
  assert.deepEqual(queued.map(task => task.category), categories);
  for (let slot = 0; slot < 4; slot++) assert.ok(Math.abs(game.stakeholders[slot].satisfaction - (slot === 0 ? 4.9 : -0.1)) < 1e-9);
  assert.equal(game.stakeholders.slice(4).length, 0);
});

test('both levels use identical growth, unstaffed decay, scoring, arrivals and seasons', () => {
  const games = [new Game(17, 1), new Game(17, 2)];
  for (const game of games) {
    game.unlockedSlots = 2;
    game.slots[0].progress = 1;
    setTaskSize(game.slots[0], 8);
    game.slots[0].scopeCreepChecked = true;
    game.slots[1] = game.createDemand();
    setTaskSize(game.slots[1], 8);
    game.slots[1].category = CATEGORIES.find(category => !category.urgent);
    staff(game, game.slots[0].id);
    game.tick(1);
  }
  const [first, second] = games;
  assert.equal(second.slots[0].progress, first.slots[0].progress);
  assert.equal(second.slots[1].progress, first.slots[1].progress);
  assert.deepEqual(second.pointsFor(second.slots[0]), first.pointsFor(first.slots[0]));
  assert.deepEqual(second.stakeholders, first.stakeholders);
  assert.equal(second.nextArrivalAt, first.nextArrivalAt);
  assert.deepEqual(seasonAt(second.elapsed), seasonAt(first.elapsed));
  for (const game of games) { unstaff(game); game.tick(1); }
  assert.equal(second.slots[0].progress, first.slots[0].progress);
});

test('a dependency counts toward the two-task limit and settles both without deadlock', () => {
  const game = opened(3);
  game.admitDemand();
  const [a, b] = game.slots;
  game.random = () => 0;
  game.finish(a, true);
  assert.equal(a.state, 'waiting');
  assert.equal(game.workCount, 2);
  game.elapsed += CONFIG.admissionSeconds;
  const pending = game.pending.length;
  game.admitDemand(true);
  assert.equal(game.pending.length, pending);
  game.finish(b, true);
  assert.equal(game.completed, 2);
  assert.equal(game.workCount, 0);
  game.tick(0.05); game.admitDemand();
  assert.equal(game.workCount, 1);
});

test('failure rotates to another stakeholder and a paired failure stays atomic', () => {
  const game = opened(3);
  game.admitDemand();
  const [a, b] = game.slots;
  game.random = () => 0;
  game.finish(a, true);
  const before = game.satisfaction;
  const cost = game.pointsFor(a).failure + game.pointsFor(b).failure;
  game.finish(b, false);
  assert.equal(game.failed, 2);
  assert.equal(cost,0);
  assert.equal(game.satisfaction,before);
  game.tick(CONFIG.admissionSeconds); game.admitDemand();
  assert.ok(game.slots[2]);
  assert.equal(game.workCount, 1);
});

test('level 2 can unlock all four stakeholders and never admits a third live task', () => {
  const game = new Game(17, 2);
  game.random = () => 0.99;
  for (let completion = 0; completion < 200 && game.unlockedSlots < CONFIG.slots; completion++) {
    const next = game.slots.find(task => task?.state === 'task');
    assert.ok(next);
    setTaskSize(next, 21);
    next.category = CATEGORIES[0];
    next.dependencyChecked = true;
    staff(game, next.id);
    game.finish(next, true);
    game.pending.push(game.createDemand()); game.tick(1); game.admitDemand();
    assert.ok(live(game).length <= game.workLimit);
  }
  assert.equal(game.unlockedSlots, CONFIG.slots);
  assert.equal(game.workLimit, 2);
  const elapsed = game.elapsed;
  const satisfaction = game.stakeholders.map(person => person.satisfaction);
  game.quit();
  game.tick(100);
  assert.equal(game.elapsed, elapsed);
  assert.deepEqual(game.stakeholders.map(person => person.satisfaction), satisfaction);
  const retry = new Game(17, game.level);
  assert.equal(retry.level, 2);
  assert.equal(retry.unlockedSlots, 1);
  assert.equal(retry.workCount, 1);
  assert.equal(retry.satisfaction,5);
  assert.ok(retry.stakeholders.slice(1).every(person => person.satisfaction === 0));
});
