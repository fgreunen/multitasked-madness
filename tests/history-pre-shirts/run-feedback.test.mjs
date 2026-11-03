import { staff, unstaff } from './helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, CONFIG } from '../src/game.js';
import { completionPace, formatSatisfaction, durationDifference, metricDifference, comparisonHeadline } from '../src/run-feedback.js';

test('completion upkeep includes every unlocked stakeholder and recent pace uses a full window', () => {
  const game = new Game();
  assert.deepEqual(completionPace(game), { recent: 0, required: 6 });
  game.slots[0].size = 1; staff(game, 1); game.slots[0].scopeCreepChecked = true; game.tick(2.2);
  assert.equal(completionPace(game).recent, 6);
  game.unlockedSlots = 4;
  assert.equal(completionPace(game).required, 24);
  game.elapsed = game.events[0].time + CONFIG.trendSeconds;
  assert.equal(completionPace(game).recent, 0);
});

test('result flow counts linked waiting work and the queue, freezes and resets', () => {
  const game = new Game(17, 2);
  game.unlockedSlots = 3;
  game.slots[1] = game.createDemand();
  game.slots[0].state = 'waiting';
  game.pending.push(game.createDemand(), game.createDemand());
  game.quit();
  const snapshot = game.results;
  assert.equal(snapshot.liveTasks, 2);
  assert.equal(snapshot.queuedTasks, 2);
  assert.equal(snapshot.unlockedStakeholders, 3);
  game.tick(100);
  assert.deepEqual(game.results, snapshot);
  assert.equal(new Game(17, 2).results.queuedTasks, 0);
  assert.equal(new Game(17, 2).results.unlockedStakeholders, 1);
});

test('duration changes preserve subsecond direction and rounding at minute boundaries', () => {
  assert.equal(durationDifference(0.2), '+00:00.2');
  assert.equal(durationDifference(-0.2), '−00:00.2');
  assert.equal(durationDifference(0.01), '+<0.1s');
  assert.equal(durationDifference(59.99), '+01:00.0');
  assert.equal(durationDifference(0), '—');
});

test('unmatched run comparisons describe actual rates without tiny signed-zero claims', () => {
  const previous = { averageDeliveryRate: 100 };
  assert.equal(comparisonHeadline({ averageDeliveryRate: 100.01 }, previous), 'Both runs had about the same average delivery rate.');
  assert.match(comparisonHeadline({ averageDeliveryRate: 80 }, previous), /20.0 fewer pts\/min in these runs/);
  assert.match(comparisonHeadline({ averageDeliveryRate: 120 }, previous), /20.0 more pts\/min in these runs/);
  assert.equal(metricDifference(100.01, 100, 'averageDeliveryRate', String), '≈0.0 pts/min');
  assert.equal(metricDifference(1.2, 1, 'elapsed', String), '+00:00.2');
  assert.equal(metricDifference(-2e-9, -4e-9, 'satisfaction', String), '≈0.0');
  assert.match(comparisonHeadline({ averageDeliveryRate: 99.95 }, previous), /0.1 fewer/);
  assert.equal(metricDifference(99.95, 100, 'averageDeliveryRate', (v) => v.toFixed(1) + ' pts/min'), '−0.1 pts/min');
});

test('negative endings never format as zero, including numerical crossing precision', () => {
  for (const value of [-1e-9, -0.00003, -0.005]) {
    assert.ok(Number(formatSatisfaction(value)) < 0);
  }
  assert.equal(formatSatisfaction(0), '0.0');
});
