import { staff, unstaff } from './helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, CATEGORIES, taskValueMultiplier } from '../src/config.js';
import { Game, phaseAt, CONFIG as legacyConfig, CATEGORIES as legacyCategories } from '../src/game.js';

test('simulation and compatibility exports use the single configuration source', () => {
  assert.equal(legacyConfig, CONFIG);
  assert.equal(legacyCategories, CATEGORIES);
  const game = new Game();
  assert.deepEqual(game.stakeholders, new Game(CONFIG.defaultSeed).stakeholders);
  assert.equal(game.slots.length, CONFIG.slots);
  assert.equal(game.nextArrivalAt, CONFIG.phases[0].interval);
  const generated = [game.slots[0], ...Array.from({ length: 20 }, () => game.createDemand())];
  assert.equal(generated[0].category, CATEGORIES[0]);
  for (const task of generated) {
    assert.ok(CATEGORIES.includes(task.category));
    assert.ok(CONFIG.taskSizes.some(({ size }) => size === task.size));
    assert.equal(task.progress, CONFIG.startingProgress);
  }
  for (const phase of CONFIG.phases) assert.equal(phaseAt(phase.at), phase);
  staff(game, 1);
  game.finish(game.slots[0], true);
  assert.equal(game.delivered, Math.round(generated[0].size * taskValueMultiplier(generated[0].category) + CONFIG.startingSatisfaction));
  assert.equal(game.satisfaction, CONFIG.startingSatisfaction + CONFIG.satisfactionPerCompletion);
});

test('configured balance values meet the documented tuning constraints', () => {
  assert.ok(Number.isInteger(CONFIG.slots) && CONFIG.slots >= 1 && CONFIG.slots <= 8);
  assert.equal(CONFIG.slotMilestones.length, CONFIG.slots - 1);
  assert.ok(CONFIG.slotMilestones.every((value, index, values) => value > (values[index - 1] ?? 0)));
  assert.ok(CONFIG.startingProgress > 0 && CONFIG.startingProgress < 100);
  assert.equal(CONFIG.roundSeconds, 180);
  assert.equal(CONFIG.slots, 4);
  assert.deepEqual(CONFIG.slotMilestones, [100,200,350]);
  assert.equal(CONFIG.outputPerSecond, 48);
  assert.equal(CONFIG.minionCount, 5);
  assert.equal(CONFIG.maxMinions, 5);
  assert.equal(CONFIG.minionsPerUnlock, 0);
  assert.equal(CONFIG.minionsPerColumn, 3);
  assert.equal(CONFIG.firstWorkerOutput, 1);
  assert.equal(CONFIG.additionalWorkerOutput, 1.1);
  assert.ok(!('focusRampSeconds' in CONFIG));
  assert.equal(CONFIG.decayMultiplier, 2);
  assert.equal(CONFIG.satisfactionDecayPerSecond, 0.1);
  assert.equal(CONFIG.satisfactionPerCompletion, 1);
  assert.equal(CONFIG.startingSatisfaction, 5);
  assert.ok(!('startingScore' in CONFIG));
  assert.ok(!('decayPerExtraSlot' in CONFIG));
  assert.equal(CONFIG.scopeCreepChance, 0.1);
  assert.equal(CONFIG.dependencyChance, 0.05);
  assert.equal(CONFIG.dependencyMinSlots, 3);
  assert.ok(CONFIG.scopeCreepResetProgress >= 0 && CONFIG.scopeCreepResetProgress < CONFIG.scopeCreepThreshold && CONFIG.scopeCreepThreshold < 100);
  assert.ok(!('importantShakeDelaySeconds' in CONFIG));
  assert.ok(!('importantShakeDurationSeconds' in CONFIG));
  assert.ok(!('importantShakePixels' in CONFIG));
  assert.ok(CONFIG.view.scopeCreepNoticeSeconds > 0);
  for (const key of ['outputPerSecond', 'urgentDecayPerSecond', 'calmDecayPerSecond', 'decayMultiplier', 'feedbackSeconds', 'admissionSeconds', 'stepSeconds', 'trendSeconds', 'deliveryRateWindowSeconds', 'satisfactionPerCompletion', 'satisfactionDecayPerSecond', 'minimumTaskValue']) {
    assert.ok(Number.isFinite(CONFIG[key]) && CONFIG[key] > 0, `${key} must be positive`);
  }
  assert.equal(CONFIG.phases[0].at, 0);
  assert.ok(CONFIG.phases.every((phase, index, phases) => phase.interval > 0 && (!index || phase.at > phases[index - 1].at)));
  for (const wave of Object.values(CONFIG.taskSeasons)) {
    assert.equal(wave.min, 0.1);
    assert.equal(wave.max, 0.9);
    assert.ok(wave.periodSeconds > 0 && Number.isFinite(wave.phaseRadians));
    assert.ok(Object.values(wave.names).every((name) => typeof name === 'string' && name.length));
  }
  assert.notEqual(CONFIG.taskSeasons.important.periodSeconds, CONFIG.taskSeasons.urgent.periodSeconds);
  assert.ok(CONFIG.stakeholderNames.length >= CONFIG.slots);
  assert.equal(new Set(CONFIG.stakeholderNames).size, CONFIG.stakeholderNames.length);
  assert.ok(CONFIG.stakeholderNames.every((name) => typeof name === 'string' && name.trim().length));
  assert.deepEqual(CONFIG.taskSizes.map(({ size }) => size), [1, 2, 3, 5, 8, 13, 21]);
  assert.equal(CONFIG.taskSizes.reduce((sum, entry) => sum + entry.chance, 0), 1);
  assert.ok(CONFIG.taskSizes.every(({ size, chance }) => size > 0 && chance > 0));
  assert.deepEqual(CONFIG.valueModifiers, { important: 1.1, lowImportance: 0.9, urgent: 1.1, notUrgent: 0.9 });
  assert.ok(CATEGORIES.every((category) => !('value' in category) && category.labels.length > 0));
});
