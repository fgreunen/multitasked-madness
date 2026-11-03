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
  assert.equal(game.status,'ended');assert.equal(game.elapsed,60);
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
  ui.down(0);ui.up();ui.frame(59999);
  assert.equal(ui.run('level2Unlocked'),false);ui.click('level-2');assert.equal(ui.game.level,1);
  ui.frame(60000);assert.equal(ui.run('level2Unlocked'),true);
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
  ui.down(1);assert.equal(ui.game.activeColumn,1);ui.frame(61000);ui.up();
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
test('Level 2 shows the entire completed Level 1 history from ready through results and retry', async () => {
  const ui=await unlock();
  const baseline=JSON.stringify(ui.run('level1History'));
  assert.equal(ui.run('level1History.length'),61);
  ui.click('next-level');
  const comparison=()=>ui.elements.get('history-comparison').attributes.get('d');
  const fullLine=comparison();assert.match(fullLine,/L348.00,/);
  assert.equal(ui.elements.get('history-legend').hidden,false);
  assert.equal(ui.elements.get('history-max').textContent,'6000');
  assert.match(ui.elements.get('history').attributes.get('aria-label'),/Level 1, 5233 points/);
  assert.equal(ui.game.history.length,1);
  ui.down(1);ui.frame(65000);ui.click('pause');
  ui.frame(90000);assert.equal(comparison(),fullLine);
  ui.click('pause');ui.down(1);ui.frame(150000);
  assert.equal(ui.game.status,'ended');
  assert.equal(ui.elements.get('result-history-comparison').attributes.get('d'),comparison());
  assert.equal(ui.elements.get('result-history-legend').hidden,false);
  assert.equal(JSON.stringify(ui.run('level1History')),baseline);
  ui.click('retry');assert.equal(comparison(),fullLine);assert.equal(ui.game.history.length,1);
  ui.click('level-1');assert.equal(comparison(),'');assert.equal(ui.elements.get('history-legend').hidden,true);
  ui.click('level-2');assert.equal(comparison(),fullLine);
});
test('only another completed Level 1 replaces the comparison; reload clears it and the unlock', async () => {
  const ui=await unlock();
  const baseline=JSON.stringify(ui.run('level1History'));
  ui.click('retry');assert.equal(JSON.stringify(ui.run('level1History')),baseline);
  ui.down(1);ui.up();ui.frame(120000);
  assert.equal(ui.game.status,'ended');assert.equal(ui.run('level1History.at(-1).contribution'),0);
  assert.notEqual(JSON.stringify(ui.run('level1History')),baseline);
  ui.click('next-level');assert.equal(ui.elements.get('history-max').textContent,'1000');
  assert.match(ui.elements.get('history-comparison').attributes.get('d'),/L348.00,82.00$/);
  const reloaded=await app();assert.equal(reloaded.run('level1History.length'),0);
  assert.equal(reloaded.run('level2Unlocked'),false);
});

test('Level 2 results compare totals and average rates for better, worse, equal and zero-baseline scores', async () => {
  for (const [baseline, total, summary, firstRate, secondRate] of [
    [50,60,'1000 points more · 20% higher','83','100'],
    [50,40,'1000 points fewer · 20% lower','83','67'],
    [55,55,'Same contribution · 0 points difference','92','92'],
    [0,5,'500 points more · Level 1 scored zero','0','8'],
    [0,0,'Same contribution · 0 points difference','0','0'],
    [50,50.001,'Less than 1 point more · <1% higher','83','83'],
    [50,49.999,'Less than 1 point fewer · <1% lower','83','83'],
  ]) {
    const ui=await app();
    ui.run(`level1History=[{time:0,contribution:0},{time:60,contribution:${baseline}}]`);
    ui.game.reset(2);ui.game.start();ui.game.columns[0].contribution=total;
    ui.frame(60000);
    assert.equal(ui.elements.get('result-comparison').hidden,false);
    assert.equal(ui.elements.get('comparison-change').textContent,summary);
    assert.equal(ui.elements.get('comparison-level1-total').textContent,String(Math.round(baseline*100)));
    assert.equal(ui.elements.get('comparison-level2-total').textContent,String(Math.round(total*100)));
    assert.equal(ui.elements.get('comparison-level1-rate').textContent,firstRate);
    assert.equal(ui.elements.get('comparison-level2-rate').textContent,secondRate);
    ui.frame(90000);assert.equal(ui.elements.get('comparison-change').textContent,summary);
    ui.click('retry');assert.equal(ui.elements.get('result-comparison').hidden,true);
  }
});
test('comparison analysis is hidden for Level 1 results and uses the completed baseline after continuing', async () => {
  const ui=await unlock();
  assert.equal(ui.elements.get('result-comparison').hidden,true);
  ui.click('next-level');ui.down(0);ui.up();ui.frame(120000);
  assert.equal(ui.elements.get('result-comparison').hidden,false);
  assert.equal(ui.elements.get('comparison-change').textContent,'5233 points fewer · 100% lower');
  assert.equal(ui.elements.get('comparison-level1-total').textContent,'5233');
  assert.equal(ui.elements.get('comparison-level2-total').textContent,'0');
});
test('effort comparison snapshots switches and average holds independently of idle and pause time', async () => {
  const ui=await app();ui.down(0);ui.frame(3000);ui.up();ui.down(1);ui.frame(6000);ui.up();ui.frame(60000);
  assert.equal(ui.run('level1Focus.switches'),1);assert.equal(ui.run('level1Focus.averageFocusSeconds'),3);
  ui.click('next-level');ui.down(0);ui.frame(62000);ui.up();ui.down(0);ui.frame(64000);ui.up();
  ui.down(1);ui.frame(65000);ui.up();ui.frame(120000);
  assert.equal(ui.elements.get('comparison-level1-switches').textContent,'1');
  assert.equal(ui.elements.get('comparison-level2-switches').textContent,'1');
  assert.equal(ui.elements.get('comparison-level1-focus').textContent,'3.0s');
  assert.equal(ui.elements.get('comparison-level2-focus').textContent,'1.7s');
  ui.click('retry');assert.equal(ui.game.switches,0);assert.equal(ui.game.focusedSeconds,0);
  assert.equal(ui.run('level1Focus.averageFocusSeconds'),3);
});
