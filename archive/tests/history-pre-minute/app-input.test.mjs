import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from './ui-harness.mjs';

test('ready activators start the round on the first press, without counting ready time', async () => {
  const ui=await app(); assert.equal(ui.button(0).disabled,false);
  assert.equal(ui.elements.has('start'),false);assert.equal(ui.elements.has('sound'),false);
  ui.frame(50000);assert.equal(ui.game.status,'ready');assert.equal(ui.game.elapsed,0);
  ui.down(2);assert.equal(ui.game.status,'running');assert.equal(ui.game.activeColumn,2);
  assert.equal(ui.game.elapsed,0);ui.frame(51000);assert.equal(ui.game.elapsed,1);
  assert.equal(ui.game.columns[2].progress,10);
});
test('hold integrates to event time and release outside stops growth immediately', async () => {
  const ui=await app(); ui.clock.now=1000; ui.down(0);
  ui.clock.now=2000; ui.up();
  assert.equal(ui.game.columns[0].progress,10);
  assert.equal(ui.game.activeColumn,null);
  ui.frame(3000); assert.ok(ui.game.columns[0].progress<10);
});
test('right click and simultaneous second pointer cannot build another column', async () => {
  const ui=await app();ui.down(0,1,2);
  assert.equal(ui.game.activeColumn,null);
  ui.down(0,1);ui.down(1,2);ui.up(2);
  assert.equal(ui.game.activeColumn,0);ui.up(1);assert.equal(ui.game.activeColumn,null);
});
test('cancel and capture loss each release safely', async () => {
  const ui=await app();ui.down(0,5);
  ui.window.dispatch('pointercancel',{pointerId:5});assert.equal(ui.game.activeColumn,null);
  ui.down(1,7);ui.button(1).releasePointerCapture(7);assert.equal(ui.game.activeColumn,null);
});
test('a delayed capture-loss event from the old column cannot cancel the next mouse hold', async () => {
  const ui=await app();ui.down(0,1);ui.frame(1000);ui.up(1);
  ui.down(1,1);
  ui.button(0).dispatch('lostpointercapture',{pointerId:1});
  assert.equal(ui.game.activeColumn,1);
  ui.frame(2000);assert.equal(ui.game.columns[1].progress,10);
  assert.equal(ui.button(1).attributes.get('aria-pressed'),'true');
});
test('a fresh press with the same pointer recovers a missed release on the first click', async () => {
  const ui=await app();ui.down(0,1);ui.frame(1000);
  ui.down(1,1);
  assert.equal(ui.game.activeColumn,1);ui.frame(2000);
  assert.equal(ui.game.columns[1].progress,10);
  assert.ok(ui.game.columns[0].progress<10);
});
test('slow hold targets remain connected across every render', async () => {
  const ui=await app();const button=ui.button(0);const label=button.querySelector('span');ui.down(0);
  for(let time=10;time<=2000;time+=10)ui.frame(time);
  assert.equal(ui.button(0),button);assert.equal(button.querySelector('span'),label);
  assert.equal(button.writes,0);assert.equal(ui.elements.get('board').children.length,4);
  ui.up();assert.equal(ui.game.activeColumn,null);
});
test('pause, hidden tab and resume freeze the game and clear holds', async () => {
  const ui=await app();ui.down(0);ui.frame(1000);ui.click('pause');
  const before=JSON.stringify(ui.game);ui.frame(20000);assert.equal(JSON.stringify(ui.game),before);
  ui.click('pause');assert.equal(ui.game.activeColumn,null);ui.down(1);
  ui.clock.now=21000;ui.document.hidden=true;ui.window.dispatch('visibilitychange');
  assert.equal(ui.game.status,'paused');assert.equal(ui.game.activeColumn,null);
  ui.document.hidden=false;ui.clock.now=50000;ui.window.dispatch('visibilitychange');
  assert.equal(ui.game.status,'paused');assert.equal(ui.game.elapsed,2);
  ui.click('pause');ui.frame(51000);assert.equal(ui.game.elapsed,3);
});
test('visible blur releases input while the round continues', async () => {
  const ui=await app();ui.down(0);ui.frame(1000);ui.window.dispatch('blur');ui.frame(2000);
  assert.equal(ui.game.status,'running');assert.equal(ui.game.activeColumn,null);
  assert.equal(ui.game.elapsed,2);assert.ok(ui.game.columns[0].progress<10);
});
test('Space/Enter hold supports the focused activator and ignores repeats', async () => {
  const ui=await app();ui.button(2).dispatch('keydown',{code:'Space',repeat:false});ui.frame(1000);
  ui.button(2).dispatch('keydown',{code:'Space',repeat:true});assert.equal(ui.game.activeColumn,2);
  ui.window.dispatch('keyup',{code:'Space'});assert.equal(ui.game.activeColumn,null);
  ui.button(3).dispatch('keydown',{code:'Enter',repeat:false});ui.button(3).dispatch('blur');assert.equal(ui.game.activeColumn,null);
});
test('only timer ending opens results, then retry clears the full round', async () => {
  const ui=await app();ui.down(0);ui.frame(119000);
  assert.equal(ui.elements.get('results').open,undefined);ui.frame(125000);
  assert.equal(ui.game.elapsed,120);assert.equal(ui.elements.get('timer').textContent,'00:00');
  assert.equal(ui.elements.get('results').open,true);assert.equal(ui.elements.get('result-total').textContent,'115.0');
  assert.ok(ui.button(0).disabled);const before=JSON.stringify(ui.game);ui.frame(130000);assert.equal(JSON.stringify(ui.game),before);
  ui.click('retry');assert.equal(ui.game.status,'ready');assert.equal(ui.game.contribution,0);
  assert.equal(ui.elements.get('results').open,false);assert.equal(ui.elements.get('timer').textContent,'02:00');
});
test('arrows reflect real motion: up, full at rest, slow/medium/fast down, zero and pause', async () => {
  const ui=await app();const motion=()=>ui.run('controls[0].motion');
  assert.equal(motion().hidden,true);ui.down(0);assert.equal(motion().textContent,'↑');
  ui.frame(10000);assert.equal(motion().hidden,true);
  ui.up();assert.equal(motion().textContent,'↓');
  ui.frame(30000);assert.equal(motion().textContent,'↓↓');
  ui.frame(40000);assert.equal(motion().textContent,'↓↓↓');
  ui.click('pause');assert.equal(motion().hidden,true);
  ui.click('pause');ui.frame(50000);assert.equal(motion().hidden,true);
});
test('live chart freezes on pause, matches results at expiry, and resets on retry', async () => {
  const ui=await app();ui.down(0);ui.frame(5000);ui.click('pause');
  const path=ui.elements.get('history-line').attributes.get('d');
  const history=JSON.stringify(ui.game.history);
  ui.frame(20000);assert.equal(ui.elements.get('history-line').attributes.get('d'),path);
  assert.equal(JSON.stringify(ui.game.history),history);
  ui.down(1);assert.equal(ui.game.status,'paused');
  ui.click('pause');ui.down(0);ui.frame(140000);
  assert.equal(ui.game.status,'ended');
  assert.equal(ui.elements.get('history-line').attributes.get('d'),ui.elements.get('result-history-line').attributes.get('d'));
  ui.click('retry');assert.equal(ui.elements.get('history-line').attributes.get('d'),'M12.00,82.00');
  assert.equal(ui.game.history.length,1);assert.equal(ui.button(0).disabled,false);
  ui.down(1);assert.equal(ui.game.status,'running');assert.equal(ui.game.activeColumn,1);
});
