import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from './ui-harness.mjs';

test('the shared visual reference matches quadratic scoring in both levels', async () => {
  const ui = await app();
  assert.equal(
    ui.elements.get('contribution-guide').textContent,
    '25% → 6 pts/s · 50% → 25 pts/s · 75% → 56 pts/s · 100% → 100 pts/s',
  );
  ui.down(0);
  ui.frame(60000);
  ui.click('next-level');
  assert.equal(
    ui.elements.get('contribution-guide').textContent,
    '25% → 6 pts/s · 50% → 25 pts/s · 75% → 56 pts/s · 100% → 100 pts/s',
  );
});

test('stable warm-up indicator responds immediately, fills, and clears on release or pause', async () => {
  const ui = await app();
  const view = ui.column(0);
  const badge = view.warmup;
  assert.equal(badge.hidden, true);
  ui.down(0);
  assert.equal(badge.hidden, false);
  assert.equal(view.label.textContent, 'Focusing');
  assert.match(view.button.attributes.get('aria-label'), /Warming up/);
  ui.frame(1000);
  assert.equal(view.meter.style.width, '50%');
  assert.equal(view.warmup, badge);
  ui.frame(2000);
  assert.equal(badge.hidden, true);
  assert.equal(view.meter.hidden, true);
  ui.up();
  ui.down(0);
  assert.equal(badge.hidden, false);
  assert.equal(view.meter.style.width, '0%');
  ui.click('pause');
  assert.equal(badge.hidden, true);
  ui.click('pause');
  assert.equal(badge.hidden, true);
});

test('ready activators start the round on the first press, without counting ready time', async () => {
  const ui = await app();
  assert.equal(ui.button(0).disabled, false);
  assert.equal(ui.elements.has('start'), false);
  assert.equal(ui.elements.has('sound'), false);
  ui.frame(50000);
  assert.equal(ui.game.status, 'ready');
  assert.equal(ui.game.elapsed, 0);
  ui.down(2);
  assert.equal(ui.game.status, 'running');
  assert.equal(ui.game.activeColumn, 2);
  assert.equal(ui.game.elapsed, 0);
  ui.frame(51000);
  assert.equal(ui.game.elapsed, 1);
  assert.equal(ui.game.columns[2].progress, 2.5);
});
test('hold integrates to event time and release outside stops growth immediately', async () => {
  const ui = await app();
  ui.clock.now = 1000;
  ui.down(0);
  ui.clock.now = 2000;
  ui.up();
  assert.equal(ui.game.columns[0].progress, 2.5);
  assert.equal(ui.game.activeColumn, null);
  ui.frame(3000);
  assert.ok(ui.game.columns[0].progress < 10);
});
test('right click and simultaneous second pointer cannot build another column', async () => {
  const ui = await app();
  ui.down(0, 1, 2);
  assert.equal(ui.game.activeColumn, null);
  ui.down(0, 1);
  ui.down(1, 2);
  ui.up(2);
  assert.equal(ui.game.activeColumn, 0);
  ui.up(1);
  assert.equal(ui.game.activeColumn, null);
});
test('cancel and capture loss each release safely', async () => {
  const ui = await app();
  ui.down(0, 5);
  ui.window.dispatch('pointercancel', { pointerId: 5 });
  assert.equal(ui.game.activeColumn, null);
  ui.down(1, 7);
  ui.button(1).releasePointerCapture(7);
  assert.equal(ui.game.activeColumn, null);
});
test('a delayed capture-loss event from the old column cannot cancel the next mouse hold', async () => {
  const ui = await app();
  ui.down(0, 1);
  ui.frame(1000);
  ui.up(1);
  ui.down(1, 1);
  ui.button(0).dispatch('lostpointercapture', { pointerId: 1 });
  assert.equal(ui.game.activeColumn, 1);
  ui.frame(2000);
  assert.equal(ui.game.columns[1].progress, 2.5);
  assert.equal(ui.button(1).attributes.get('aria-pressed'), 'true');
});
test('a fresh press with the same pointer recovers a missed release on the first click', async () => {
  const ui = await app();
  ui.down(0, 1);
  ui.frame(1000);
  ui.down(1, 1);
  assert.equal(ui.game.activeColumn, 1);
  ui.frame(2000);
  assert.equal(ui.game.columns[1].progress, 2.5);
  assert.ok(ui.game.columns[0].progress < 10);
});
test('recapturing the same button ignores stale loss and still rejects a simultaneous key hold', async () => {
  const ui = await app();
  ui.down(0, 1);
  ui.down(0, 1);
  ui.button(0).dispatch('lostpointercapture', { pointerId: 1 });
  ui.button(1).dispatch('keydown', { code: 'Space', repeat: false });
  assert.equal(ui.game.activeColumn, 0);
  ui.frame(1000);
  assert.equal(ui.game.columns[0].progress, 2.5);
  assert.equal(ui.game.columns[1].progress, 0);
  ui.button(0).releasePointerCapture(1);
  assert.equal(ui.game.activeColumn, null);
});
test('slow hold targets remain connected across every render', async () => {
  const ui = await app();
  const button = ui.button(0);
  const label = button.querySelector('span');
  ui.down(0);
  for (let time = 10; time <= 2000; time += 10) ui.frame(time);
  assert.equal(ui.button(0), button);
  assert.equal(button.querySelector('span'), label);
  assert.equal(button.writes, 0);
  assert.equal(ui.elements.get('board').children.length, 4);
  ui.up();
  assert.equal(ui.game.activeColumn, null);
});
test('pause, hidden tab and resume freeze the game and clear holds', async () => {
  const ui = await app();
  ui.down(0);
  ui.frame(1000);
  ui.click('pause');
  const before = JSON.stringify(ui.game);
  ui.frame(20000);
  assert.equal(JSON.stringify(ui.game), before);
  ui.click('pause');
  assert.equal(ui.game.activeColumn, null);
  ui.down(1);
  ui.clock.now = 21000;
  ui.document.hidden = true;
  ui.window.dispatch('visibilitychange');
  assert.equal(ui.game.status, 'paused');
  assert.equal(ui.game.activeColumn, null);
  ui.document.hidden = false;
  ui.clock.now = 50000;
  ui.window.dispatch('visibilitychange');
  assert.equal(ui.game.status, 'paused');
  assert.equal(ui.game.elapsed, 2);
  ui.click('pause');
  ui.frame(51000);
  assert.equal(ui.game.elapsed, 3);
});
test('visible blur releases input while the round continues', async () => {
  const ui = await app();
  ui.down(0);
  ui.frame(1000);
  ui.window.dispatch('blur');
  ui.frame(2000);
  assert.equal(ui.game.status, 'running');
  assert.equal(ui.game.activeColumn, null);
  assert.equal(ui.game.elapsed, 2);
  assert.ok(ui.game.columns[0].progress < 10);
});
test('Space/Enter hold supports the focused activator and ignores repeats', async () => {
  const ui = await app();
  ui.button(2).dispatch('keydown', { code: 'Space', repeat: false });
  ui.frame(1000);
  ui.button(2).dispatch('keydown', { code: 'Space', repeat: true });
  assert.equal(ui.game.activeColumn, 2);
  ui.window.dispatch('keyup', { code: 'Space' });
  assert.equal(ui.game.activeColumn, null);
  ui.button(3).dispatch('keydown', { code: 'Enter', repeat: false });
  ui.button(3).dispatch('blur');
  assert.equal(ui.game.activeColumn, null);
});
test('only timer ending opens results, then retry clears the full round', async () => {
  const ui = await app();
  ui.down(0);
  ui.frame(59000);
  assert.equal(ui.elements.get('results').open, undefined);
  ui.frame(65000);
  assert.equal(ui.game.elapsed, 60);
  assert.equal(ui.elements.get('timer').textContent, '00:00');
  assert.equal(ui.elements.get('results').open, true);
  assert.equal(ui.elements.get('result-total').textContent, '5233');
  assert.equal(ui.elements.has('result-columns'), false);
  assert.ok(ui.button(0).disabled);
  const before = JSON.stringify(ui.game);
  ui.frame(70000);
  assert.equal(JSON.stringify(ui.game), before);
  ui.click('retry');
  assert.equal(ui.game.status, 'ready');
  assert.equal(ui.game.contribution, 0);
  assert.equal(ui.elements.get('results').open, false);
  assert.equal(ui.elements.get('timer').textContent, '01:00');
});
test('columns omit motion arrows while retaining accessible growth and decay descriptions', async () => {
  const ui = await app();
  assert.doesNotMatch(ui.column(0).column.innerHTML, /motion-indicator|↑|↓/);
  ui.down(0);
  ui.frame(1000);
  assert.match(ui.column(0).track.attributes.get('aria-valuetext'), /Growing/);
  ui.up();
  assert.match(ui.column(0).track.attributes.get('aria-valuetext'), /Decaying/);
  ui.click('pause');
  assert.match(ui.column(0).track.attributes.get('aria-valuetext'), /Frozen/);
});
test('contribution displays as 100x integers without rounding internal contribution or rate', async () => {
  const ui = await app();
  assert.equal(ui.elements.get('rate').textContent, '+0 pts/s');
  ui.down(0);
  ui.frame(5500);
  assert.ok(Math.abs(ui.game.contribution - 3653 / 12000) < 1e-10);
  assert.equal(ui.game.rate, 0.2025);
  assert.equal(ui.elements.get('contribution').textContent, '30');
  assert.equal(ui.elements.get('rate').textContent, '+20 pts/s');
  assert.equal(ui.elements.get('history-max').textContent, '1000');
  assert.match(ui.elements.get('history').attributes.get('aria-label'), /30 points/);
  assert.equal(ui.column(0).progress.textContent, '45%');
  ui.frame(60000);
  assert.equal(ui.elements.get('result-average').textContent, '87 points/s average');
  assert.equal(ui.elements.get('result-total').textContent, '5233');
  assert.equal(ui.elements.get('result-history-max').textContent, '6000');
});
test('live chart freezes on pause, matches results at expiry, and resets on retry', async () => {
  const ui = await app();
  ui.down(0);
  ui.frame(5000);
  ui.click('pause');
  const path = ui.elements.get('history-line').attributes.get('d');
  const history = JSON.stringify(ui.game.history);
  ui.frame(20000);
  assert.equal(ui.elements.get('history-line').attributes.get('d'), path);
  assert.equal(JSON.stringify(ui.game.history), history);
  ui.down(1);
  assert.equal(ui.game.status, 'paused');
  ui.click('pause');
  ui.down(0);
  ui.frame(140000);
  assert.equal(ui.game.status, 'ended');
  assert.equal(
    ui.elements.get('history-line').attributes.get('d'),
    ui.elements.get('result-history-line').attributes.get('d'),
  );
  ui.click('retry');
  assert.equal(ui.elements.get('history-line').attributes.get('d'), 'M12.00,82.00');
  assert.equal(ui.game.history.length, 1);
  assert.equal(ui.button(0).disabled, false);
  ui.down(1);
  assert.equal(ui.game.status, 'running');
  assert.equal(ui.game.activeColumn, 1);
});
