import { staff, unstaff } from './helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, CATEGORIES, CONFIG, seasonAt } from '../src/game.js';

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

test('independent seasonal waves stay within 10/90 bounds and category chances sum to one', () => {
  for (let second = 0; second <= 1200; second += 0.5) {
    const season = seasonAt(second);
    for (const axis of ['important', 'urgent']) {
      assert.ok(season[axis].chance >= 0.1 - 1e-9 && season[axis].chance <= 0.9 + 1e-9);
      assert.ok(Object.values(CONFIG.taskSeasons[axis].names).includes(season[axis].name));
    }
    near(season.categories.reduce((sum, chance) => sum + chance, 0), 1);
    near(season.categories[0] + season.categories[2], season.important.chance);
    near(season.categories[0] + season.categories[1], season.urgent.chance);
  }
});

test('season cycles use separate periods/phases and humorous names, not a shared fixed mix', () => {
  near(seasonAt(0).important.chance, 0.1);
  near(seasonAt(0).urgent.chance, 0.9);
  near(seasonAt(20).important.chance, 0.9);
  near(seasonAt(15).urgent.chance, 0.1);
  near(seasonAt(40).important.chance, seasonAt(0).important.chance);
  assert.notEqual(seasonAt(40).urgent.chance, seasonAt(0).urgent.chance);
  assert.match(seasonAt(20).important.name, /January/);
  assert.match(seasonAt(0).urgent.name, /Year-End/);
  assert.match(seasonAt(15).urgent.name, /July/);
  assert.match(seasonAt(0).important.name, /August/);
  near(seasonAt(120).important.chance, seasonAt(0).important.chance);
  near(seasonAt(120).urgent.chance, seasonAt(0).urgent.chance);
});

test('season probabilities are identical at the same game time regardless of seed or player outcomes', () => {
  const games = [new Game(1), new Game(42), new Game(99)];
  games.forEach((game, index) => {
    game.stakeholders[0].satisfaction = index * 100;
    game.satisfactionGained = index * 5;
    game.unlockedSlots = index + 1;
    for (let draw = 0; draw < index * 37; draw++) game.createDemand();
  });
  for (const time of [0, 12.5, 30, 45, 60, 100, 180, 240, 600]) {
    games.forEach((game) => { game.elapsed = time; });
    const expected = seasonAt(time);
    for (const game of games) assert.deepEqual(seasonAt(game.elapsed), expected);
  }
});

test('new categories follow current probabilities; delayed work keeps its type', () => {
  for (const time of [0, 45, 60, 90]) {
    const game = new Game(42);
    assert.equal(game.slots[0].category, CATEGORIES[0]);
    game.elapsed = time;
    const counts = CATEGORIES.map(() => 0);
    const total = 15000;
    for (let sample = 0; sample < total; sample++) counts[CATEGORIES.indexOf(game.createDemand().category)]++;
    const expected = seasonAt(time).categories;
    counts.forEach((count, index) => assert.ok(Math.abs(count / total - expected[index]) < 0.015));
    const queued = game.createDemand();
    const category = queued.category;
    game.delayedDemands.push(queued);
    game.elapsed += 45;
    game.slots[0] = null;
    game.status = 'running'; game.allocateDemands();
    assert.ok(game.slots.includes(queued));
    assert.equal(queued.category, category);
  }
});

test('seasons advance only with game time and freeze/reset with the existing lifecycle', () => {
  const game = new Game();
  const opening = seasonAt(game.elapsed);
  game.tick(100);
  assert.deepEqual(seasonAt(game.elapsed), opening);
  staff(game, 1);
  game.tick(1);
  assert.notDeepEqual(seasonAt(game.elapsed), opening);
  game.quit();
  const frozen = seasonAt(game.elapsed);
  game.tick(100);
  assert.deepEqual(seasonAt(game.elapsed), frozen);
  assert.deepEqual(seasonAt(new Game().elapsed), opening);
});
