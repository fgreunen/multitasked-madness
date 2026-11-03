import { staff, unstaff } from './helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, CONFIG, CATEGORIES } from '../src/game.js';
import { setTaskSize } from './helpers.mjs';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
const nearEnding = (satisfaction, progress) => {
  const game = new Game(17);
  game.stakeholders[0].satisfaction = satisfaction;
  game.slots[0].progress = progress;
  setTaskSize(game.slots[0]);
  game.slots[0].scopeCreepChecked = true;
  staff(game, 1);
  return game;
};

test('completion before the negative crossing replenishes satisfaction in coarse and fine frames', () => {
  const games = [nearEnding(0.003, 99.9), nearEnding(0.003, 99.9)];
  games[0].tick(0.05);
  for (let i = 0; i < 50; i++) games[1].tick(0.001);
  for (const game of games) {
    assert.equal(game.status, 'running');
    assert.equal(game.completed, 1);
    assert.equal(game.delivered, 1);
    assert.ok(game.events[0].time < 0.03);
    near(game.satisfaction, 0.998);
  }
  near(games[0].events[0].time, games[1].events[0].time);
});

test('negative satisfaction permits later completions in every frame size', () => {
  const games = [nearEnding(0.0001, 99.9), nearEnding(0.0001, 99.9)];
  games[0].tick(0.05);
  for (let i = 0; i < 50; i++) games[1].tick(0.001);
  for (const game of games) {
    assert.equal(game.status, 'running');
    assert.equal(game.completed, 1);
    near(game.elapsed, 0.05);
    game.tick(CONFIG.roundSeconds);
    assert.equal(game.endReason, 'round');
    assert.equal(game.elapsed, CONFIG.roundSeconds);
    const frozen = JSON.stringify(game);
    game.tick(10);
    assert.equal(JSON.stringify(game), frozen);
  }
  near(games[0].elapsed, games[1].elapsed);
});

test('a completion exactly at zero remains allowed', () => {
  // One minion produces 48 × 0.05 = 2.4 points at the zero crossing.
  const game = nearEnding(0.005, 97.6);
  game.tick(0.05);
  assert.equal(game.completed, 1);
  assert.equal(game.status, 'running');
  near(game.satisfaction, 1);
});

test('scope and completion timestamps are crossings, independent of rendering frame size', () => {
  const games = [new Game(17), new Game(17)];
  for (const game of games) { setTaskSize(game.slots[0]); game.random = () => 0; staff(game, 1); }
  games[0].tick(1.8);
  for (let i = 0; i < 108; i++) games[1].tick(1 / 60);
  for (const game of games) {
    near(game.scopeCreepEvents[0].time, 40 / 48);
    near(game.events[0].time, 80 / 48);
    assert.equal(game.completed, 1);
    assert.equal(game.scopeCreepEvents.length, 1);
  }
  near(games[0].slots[0].progress, games[1].slots[0].progress);
});

test('an earlier partner failure fails a pair even if the staffed partner occupies the first slot', () => {
  const game = new Game(17);
  game.unlockedSlots = 3;
  const held = game.slots[0], partner = game.createDemand();
  setTaskSize(held); setTaskSize(partner);
  game.slots[1] = partner;
  held.progress = 99.9;
  held.scopeCreepChecked = true;
  partner.category = CATEGORIES[1];
  partner.progress = 0.001;
  held.dependencyId = partner.id;
  partner.dependencyId = held.id;
  staff(game, held.id);
  game.tick(0.05);
  assert.equal(game.completed, 0);
  assert.equal(game.failed, 2);
  assert.equal(game.delivered, 0);
  near(game.events[0].time, 0.001 / (CONFIG.urgentDecayPerSecond * CONFIG.decayMultiplier));
  assert.equal(game.events[0].time, game.events[1].time);
  assert.equal(game.dependencyPairs.length, 0);
});

test('completion at the round boundary counts, but work due after it remains unfinished',()=>{
 for(const offset of [0,.001]){const g=new Game();staff(g,1);g.elapsed=CONFIG.roundSeconds-.05;g.arrivalIndex=g.demandPlan.length;g.nextArrivalAt=CONFIG.roundSeconds;
  const t=g.slots[0];t.size=1;t.scopeCreepChecked=true;t.dependencyChecked=true;t.progress=100-48*.05-offset;g.tick(1);
  assert.equal(g.endReason,'round');assert.equal(g.elapsed,CONFIG.roundSeconds);assert.equal(g.completed,offset===0?1:0);
 }
});
