import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, CONFIG, decayRate, contributionRate } from '../src/game.js';

const near = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
const started = () => { const game = new Game(); game.start(); return game; };

test('warm-up integrates ramp height and scoring, resets on release, and ignores repeated holds', () => {
  const game=started();game.hold(0);game.advance(1);
  near(game.columns[0].progress,2.5);near(game.contribution,1/120);near(game.warmupProgress,.5);
  game.hold(0);game.advance(1);near(game.columns[0].progress,10);near(game.contribution,1/15);
  assert.equal(game.holdCount,1);game.release();assert.equal(game.warmupProgress,0);
  game.hold(0);game.advance(1);near(game.columns[0].progress,12.5);assert.equal(game.switches,0);
  game.hold(1);assert.equal(game.switches,1);assert.equal(game.heldSeconds,0);
  game.advance(1);near(game.columns[1].progress,2.5);
  near(game.focusedSeconds,4);near(game.averageFocusSeconds,4/3);
  game.pause();const before=JSON.stringify(game);game.advance(50);assert.equal(JSON.stringify(game),before);
  game.resume();assert.equal(game.warmupProgress,0);game.reset();assert.equal(game.holdCount,0);assert.equal(game.switches,0);
});
test('warm-up cap crossing has exact contribution and is independent of frame sizes', () => {
  function play(step){const game=started();game.columns[0].progress=99;game.hold(0);
    while(game.elapsed<1)game.advance(Math.min(step,1-game.elapsed));return game;}
  const coarse=play(1),fine=play(.007);
  near(coarse.columns[0].progress,100);near(coarse.contribution,1-2*Math.sqrt(.4)/300);
  near(fine.contribution,coarse.contribution);near(fine.heldSeconds,1);
});

test('four identical empty columns, frozen until first activation', () => {
  const game = new Game();
  assert.equal(game.columns.length, 4);
  assert.deepEqual(game.columns, Array.from({length:4}, () => ({progress:0,contribution:0})));
  assert.equal(game.remaining, 60);
  assert.equal(game.hold(0), false);
  game.advance(50);
  assert.equal(game.elapsed, 0);
  assert.equal(game.contribution, 0);
});
test('idle zero contribution never ends a round early', () => {
  const game = started();
  game.advance(59);
  assert.equal(game.status, 'running');
  assert.equal(game.contribution, 0);
  game.advance(1);
  assert.equal(game.status, 'ended');
});
test('holding fills in 11 seconds including warm-up and integrates the rising height', () => {
  const game = started(); game.hold(0); game.advance(5);
  near(game.columns[0].progress, 40); near(game.contribution, 49/60); near(game.rate, 0.4);
  game.advance(6);
  near(game.columns[0].progress, 100); near(game.contribution, 301/60);
  assert.equal(game.status, 'running');
});
test('100% persists while held, never completes or resets, earning one per second', () => {
  const game = started(); game.hold(0); game.advance(60);
  near(game.columns[0].progress, 100); near(game.contribution, 3241/60);
  assert.equal(game.elapsed, 60); assert.equal(game.activeColumn, null);
});
test('single active column and validated index', () => {
  const game = started();
  for (const index of [-1, 4, 1.5, NaN, '0']) assert.equal(game.hold(index), false);
  game.hold(0); game.advance(5); game.hold(1); game.advance(2);
  assert.equal(game.activeColumn, 1);
  assert.ok(game.columns[0].progress < 50); near(game.columns[1].progress, 10);
  assert.ok(game.columns[0].contribution > 1.25);
});
test('linear contribution and constant decay at every height', () => {
  near(contributionRate(0), 0); near(contributionRate(50), .5); near(contributionRate(100), 1);
  for (const height of [0, .1, 20, 50, 80, 100]) near(decayRate(height), 3.85);
  const game = started(); game.hold(0); game.advance(10); game.release(); game.advance(10);
  near(game.columns[0].progress, 51.5);
  near(game.contribution, 1337/120);
});
test('released columns reach exact zero; no negative height or future earnings', () => {
  const game = started(); game.hold(0); game.advance(10); game.release(); game.advance(50);
  assert.equal(game.columns[0].progress, 0);
  near(game.contribution, 61/15 + 40.5 / CONFIG.decayPerSecond);
  const before = game.contribution; game.advance(50);
  assert.equal(game.contribution, before);
});
test('empty columns can be built again without new tasks', () => {
  const game = started(); game.hold(2); game.advance(1); game.release(); game.advance(10);
  assert.equal(game.columns[2].progress, 0);
  game.hold(2); game.advance(1); near(game.columns[2].progress, 2.5);
});
test('coarse, fine and uneven frames produce equal outcomes through cap, zero and switches', () => {
  function play(step) {
    const game = started();
    for (const [duration, column] of [[13,0],[7,1],[20,2],[4,null],[40,3],[36,null]]) {
      if (column === null) game.release(); else game.hold(column);
      const target = Math.min(CONFIG.roundSeconds, game.elapsed + duration);
      while (game.elapsed < target - 1e-9) game.advance(Math.min(step, target - game.elapsed));
    }
    return game;
  }
  const coarse = play(1000);
  for (const step of [1/60, .073, 1.37]) {
    const other = play(step);
    near(other.contribution, coarse.contribution, 1e-6);
    for (let i=0;i<4;i++) near(other.columns[i].progress, coarse.columns[i].progress, 1e-6);
  }
});
test('round boundary clips a long frame and freezes all state', () => {
  const game = started(); game.advance(55); game.hold(0); game.advance(1000);
  near(game.columns[0].progress, 40); near(game.contribution, 49/60);
  assert.equal(game.elapsed, 60); assert.equal(game.remaining, 0);
  const before = JSON.stringify(game); game.advance(100); game.hold(1); game.resume(); game.start();
  assert.equal(JSON.stringify(game), before);
});
test('pause freezes progress, contribution and timer; resume requires a fresh hold', () => {
  const game = started(); game.hold(1); game.advance(3); game.pause();
  const before=JSON.stringify(game); game.advance(100);
  assert.equal(JSON.stringify(game), before); assert.equal(game.hold(0), false);
  game.resume(); game.advance(1); assert.ok(game.columns[1].progress < 30);
});
test('reset clears all metrics and returns to ready', () => {
  const game = started(); game.hold(2); game.advance(60); game.reset();
  assert.deepEqual(game, new Game());
});
test('invalid time deltas never corrupt state', () => {
  const game = started(); const before=JSON.stringify(game);
  for (const time of [-1,0,NaN,Infinity,-Infinity]) game.advance(time);
  assert.equal(JSON.stringify(game),before);
});

test('history samples exact running seconds through long frames and includes round end', () => {
  const game=started();game.hold(0);game.advance(500);
  assert.equal(game.history.length,61);near(game.history[5].contribution,49/60);
  near(game.history[10].contribution,61/15);near(game.history.at(-1).contribution,3241/60);
  assert.equal(game.history.at(-1).time,60);
  for(let i=1;i<game.history.length;i++){
    assert.equal(game.history[i].time,i);
    assert.ok(game.history[i].contribution>=game.history[i-1].contribution);
  }
});
test('history is frame-independent, including decay across zero', () => {
  function play(step){
    const game=started();game.hold(0);
    while(game.elapsed<10)game.advance(Math.min(step,10-game.elapsed));
    game.release();while(game.elapsed<CONFIG.roundSeconds)game.advance(Math.min(step,CONFIG.roundSeconds-game.elapsed));
    return game;
  }
  const coarse=play(1000),fine=play(.073);
  assert.equal(coarse.history.length,fine.history.length);
  coarse.history.forEach((point,i)=>{assert.equal(point.time,fine.history[i].time);near(point.contribution,fine.history[i].contribution,1e-7);});
});
