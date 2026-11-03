import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, CONFIG } from '../src/game.js';
import { app } from './ui-harness.mjs';

const unlock = async () => {
  const ui=await app();ui.down(0);ui.frame(CONFIG.roundSeconds*1000);return ui;
};

test('levels retain four columns, with exactly the first two playable in Level 2', () => {
  const one=new Game(),two=new Game(2);
  assert.equal(one.playableColumns,4);assert.equal(two.playableColumns,2);
  assert.equal(two.columns.length,4);two.start();
  for(const index of [2,3,-1,4,NaN])assert.equal(two.hold(index),false);
  assert.equal(two.hold(0),true);assert.equal(two.hold(1),true);
});
test('Level 2 right-hand columns remain zero and never contribute for an entire round', () => {
  const game=new Game(2);game.start();
  for(let i=0;i<CONFIG.roundSeconds;i++){
    assert.equal(game.hold(2),false);assert.equal(game.hold(3),false);
    game.hold(i%CONFIG.level2Columns);game.advance(1);
    assert.deepEqual(game.columns.slice(2),[{progress:0,contribution:0},{progress:0,contribution:0}]);
  }
  assert.equal(game.status,'ended');assert.equal(game.elapsed,120);
});
test('same focus decisions produce identical rates, scoring, decay, timing and history in both levels', () => {
  const games=[new Game(1),new Game(2)];
  for(const game of games){
    game.start();
    for(const [column,seconds] of [[0,10],[1,10],[null,20],[0,30],[1,50]]){
      if(column===null)game.release();else game.hold(column);
      game.advance(seconds);
    }
  }
  assert.deepEqual(games[0].columns,games[1].columns);
  assert.deepEqual(games[0].history,games[1].history);
  assert.equal(games[0].contribution,games[1].contribution);
  assert.equal(games[0].rate,games[1].rate);
  assert.equal(games[0].elapsed,games[1].elapsed);
});
test('retry preserves Level 2 while resetting metrics; Level 1 restores the full board', () => {
  const game=new Game(2);game.start();game.hold(0);game.advance(30);game.reset();
  assert.equal(game.level,2);assert.equal(game.playableColumns,2);
  assert.equal(game.contribution,0);assert.equal(game.elapsed,0);assert.equal(game.status,'ready');
  assert.equal(game.history.length,1);game.reset(1);assert.equal(game.playableColumns,4);
  assert.throws(()=>game.reset(3),RangeError);
});
test('Level 2 unlocks only at the full Level 1 timer, regardless of contribution', async () => {
  const ui=await app();assert.equal(ui.elements.get('level-2').disabled,true);
  ui.click('level-2');ui.click('next-level');assert.equal(ui.game.level,1);
  ui.down(0);ui.up();ui.frame(119999);
  assert.equal(ui.run('level2Unlocked'),false);ui.click('level-2');assert.equal(ui.game.level,1);
  ui.frame(120000);assert.equal(ui.run('level2Unlocked'),true);
  assert.equal(ui.elements.get('next-level').hidden,false);
  assert.equal(ui.elements.get('result-title').textContent,'Level 1 complete.');
  ui.click('next-level');assert.equal(ui.game.level,2);assert.equal(ui.game.status,'ready');
  assert.equal(ui.game.elapsed,0);assert.equal(ui.game.contribution,0);
  assert.equal(ui.elements.get('history-line').attributes.get('d'),'M12.00,82.00');
});
test('pausing or retrying an unfinished Level 1 never unlocks Level 2', async () => {
  const ui=await app();ui.click('retry');assert.equal(ui.run('level2Unlocked'),false);
  ui.down(0);ui.frame(1000);ui.click('pause');ui.frame(500000);
  assert.equal(ui.run('level2Unlocked'),false);assert.equal(ui.game.status,'paused');
  ui.click('level-2');assert.equal(ui.game.level,1);
});
test('grey Level 2 controls reject pointer/key input before starting and during play', async () => {
  const ui=await unlock();ui.click('next-level');
  assert.equal(ui.button(0).disabled,false);assert.equal(ui.button(1).disabled,false);
  assert.equal(ui.button(2).disabled,true);assert.equal(ui.button(3).disabled,true);
  ui.down(2);ui.button(3).dispatch('keydown',{code:'Space',repeat:false});
  assert.equal(ui.game.status,'ready');assert.equal(ui.game.elapsed,0);
  assert.equal(ui.run('controls[2].track').attributes.get('aria-disabled'),'true');
  ui.down(1);assert.equal(ui.game.activeColumn,1);ui.frame(121000);ui.up();
  ui.down(3);assert.equal(ui.game.activeColumn,null);
  assert.deepEqual(ui.game.columns.slice(2),[{progress:0,contribution:0},{progress:0,contribution:0}]);
});
test('level changes cannot interrupt running/paused rounds; unlock survives retry and returning to Level 1', async () => {
  const ui=await unlock();ui.click('next-level');ui.down(0);
  ui.click('level-1');assert.equal(ui.game.level,2);
  ui.click('pause');ui.click('level-1');assert.equal(ui.game.level,2);
  ui.click('pause');ui.frame(240000);assert.equal(ui.game.status,'ended');
  assert.equal(ui.elements.get('next-level').hidden,true);
  assert.equal(ui.elements.get('result-title').textContent,'Level 2 complete.');
  ui.click('retry');assert.equal(ui.game.level,2);assert.equal(ui.button(2).disabled,true);
  ui.click('level-1');assert.equal(ui.game.level,1);assert.equal(ui.button(3).disabled,false);
  ui.click('level-2');assert.equal(ui.game.level,2);assert.equal(ui.run('level2Unlocked'),true);
});
