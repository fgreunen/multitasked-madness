import test from 'node:test';
import assert from 'node:assert/strict';
import { PageSession, CONFIG } from '../src/game.js';

function completeLevel1(session) {
  session.game.start();
  session.game.hold(0);
  session.advance(CONFIG.roundSeconds + 100);
}

test('session records exact Level 1 completion without rendering, regardless of score', () => {
  const session = new PageSession();
  assert.equal(session.game.level, 1);
  assert.equal(session.level2Unlocked, false);
  session.advance(1000);
  assert.equal(session.game.elapsed, 0);
  session.game.start();
  session.advance(CONFIG.roundSeconds - 1);
  assert.equal(session.level2Unlocked, false);
  session.advance(1000);
  assert.equal(session.game.elapsed, CONFIG.roundSeconds);
  assert.equal(session.level2Unlocked, true);
  assert.deepEqual(session.level1History.at(-1), { time: CONFIG.roundSeconds, contribution: 0 });
});

test('ready time, pause time and rejected preparation never record a completion', () => {
  const session = new PageSession();
  session.game.start();
  session.advance(1);
  assert.equal(session.prepareRound(), false);
  session.game.pause();
  session.advance(1000);
  assert.equal(session.prepareRound(2), false);
  assert.equal(session.prepareRound(1), false);
  assert.equal(session.game.status, 'paused');
  assert.equal(session.game.elapsed, 1);
  assert.equal(session.level2Unlocked, false);
  assert.deepEqual(session.level1History, []);
  session.game.resume();
  session.advance(CONFIG.roundSeconds - 1);
  assert.equal(session.level2Unlocked, true);
});

test('round preparation validates levels and preserves the current round on rejection', () => {
  const session = new PageSession();
  const game = session.game;
  const before = JSON.stringify(game);
  for (const level of [2, 0, 3, NaN, '1', null]) {
    assert.equal(session.prepareRound(level), false);
    assert.equal(JSON.stringify(game), before);
  }
  assert.equal(session.prepareRound(), true);
  completeLevel1(session);
  assert.equal(session.prepareRound(2), true);
  assert.equal(session.game, game);
  game.start();
  session.advance(1);
  assert.equal(session.prepareRound(1), false);
  assert.equal(game.level, 2);
  assert.equal(game.elapsed, 1);
});

test('baseline survives retries, level selection and Level 2 completion', () => {
  const session = new PageSession();
  completeLevel1(session);
  const baseline = session.level1History.map((point) => ({ ...point }));
  assert.deepEqual(session.level1History, session.game.history);
  assert.throws(() => {
    session.level1History.at(-1).contribution = -1;
  }, TypeError);
  assert.throws(() => {
    session.level1History.push({ time: 1000, contribution: -1 });
  }, TypeError);
  // Even changes to the old round history cannot alter the saved baseline.
  session.game.history.at(-1).contribution = -1;
  session.game.history.push({ time: 1000, contribution: -1 });
  assert.deepEqual(session.level1History, baseline);
  session.advance(1000);
  assert.deepEqual(session.level1History, baseline);
  assert.equal(session.prepareRound(2), true);
  session.game.start();
  session.advance(CONFIG.roundSeconds);
  assert.equal(session.prepareRound(), true);
  assert.equal(session.game.level, 2);
  assert.equal(session.game.status, 'ready');
  assert.equal(session.game.elapsed, 0);
  assert.equal(session.game.contribution, 0);
  assert.deepEqual(session.game.history, [{ time: 0, contribution: 0 }]);
  assert.equal(session.prepareRound(1), true);
  assert.equal(session.prepareRound(2), true);
  assert.equal(session.level2Unlocked, true);
  assert.deepEqual(session.level1History, baseline);
});

test('only another completed Level 1 replaces the baseline, and a new session clears progression', () => {
  const session = new PageSession();
  completeLevel1(session);
  const baseline = session.level1History.map((point) => ({ ...point }));
  session.prepareRound();
  session.game.start();
  session.advance(CONFIG.roundSeconds - 1);
  assert.deepEqual(session.level1History, baseline);
  session.advance(1);
  assert.equal(session.level1History.at(-1).contribution, 0);
  assert.notDeepEqual(session.level1History, baseline);
  const fresh = new PageSession();
  assert.equal(fresh.level2Unlocked, false);
  assert.equal(fresh.game.level, 1);
  assert.deepEqual(fresh.level1History, []);
});
