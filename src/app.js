import { PageSession, CONFIG, contributionRate } from './game.js';
import { contributionChartData } from './contribution-chart.js';

const $ = id => document.getElementById(id);
const session = new PageSession();
const game = session.game;
let lastTime = performance.now();
let heldInput = null;
let resultsShown = false;

function displayContribution(value) {
  return String(Math.round(value * CONFIG.contributionDisplayScale));
}

function formatTime(seconds) {
  const whole = Math.ceil(Math.max(0, seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
}
for (const prefix of ['history', 'result-history']) {
  $(`${prefix}-mid`).textContent = formatTime(CONFIG.roundSeconds / 2).replace(/^0/, '');
  $(`${prefix}-end`).textContent = formatTime(CONFIG.roundSeconds).replace(/^0/, '');
}
$('board').setAttribute('aria-label', `${CONFIG.columns} contribution columns`);
$('contribution-guide').textContent = [0.25, 0.5, 0.75, 1].map(fraction =>
  `${Math.round(fraction * CONFIG.maximumProgress)}% → ${displayContribution(contributionRate(fraction * CONFIG.maximumProgress))} pts/s`).join(' · ');

function synchronizeClock(now = performance.now()) {
  session.advance(Math.max(0, (now - lastTime) / 1000));
  lastTime = now;
}

function clearHold() {
  const previous = heldInput;
  heldInput = null;
  game.release();
  if (previous?.type === 'pointer') {
    const button = controls[previous.index].button;
    if (button.hasPointerCapture(previous.id)) button.releasePointerCapture(previous.id);
  }
}

function beginHold(input) {
  if (document.hidden || !['ready', 'running'].includes(game.status) || !game.isColumnAvailable(input.index)) return false;
  // A new down from the same pointer proves its previous press has ended.
  // Recover a missed release without allowing another contact to steal a hold.
  if (heldInput && !(input.type === 'pointer' && heldInput.type === 'pointer' && input.id === heldInput.id)) return false;
  synchronizeClock();
  if (heldInput) clearHold();
  if (game.status === 'ready') game.start();
  if (!game.hold(input.index)) { render(); return false; }
  heldInput = input;
  render();
  return true;
}

function endHold(type, id, index) {
  if (heldInput?.type !== type || heldInput.id !== id || (index !== undefined && heldInput.index !== index)) return;
  synchronizeClock();
  clearHold();
  render();
}

// Activators and their children stay connected through every render.
const controls = Array.from({ length: CONFIG.columns }, (_, index) => {
  const column = document.createElement('section');
  column.className = 'column';
  column.innerHTML = `<div class="column-track" role="progressbar" aria-label="Column ${index + 1} height" aria-valuemin="0" aria-valuemax="${CONFIG.maximumProgress}" aria-valuenow="0"><div class="column-fill"></div><strong class="column-progress" aria-hidden="true">0%</strong></div>
    <button class="activator" type="button" aria-label="Focus on column ${index + 1}" aria-pressed="false"><span>Focus</span><small class="warmup-label" hidden>Warming up</small><i class="warmup-meter" aria-hidden="true" hidden></i></button>`;
  $('board').append(column);
  const button = column.querySelector('.activator');
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault();
    if (beginHold({ type: 'pointer', id: event.pointerId, index })) {
      button.focus({ preventScroll: true });
      button.setPointerCapture(event.pointerId);
    }
  });
  button.addEventListener('lostpointercapture', event => {
    // Capture-loss can arrive after a new press, even with the same pointer ID.
    if (!button.hasPointerCapture(event.pointerId)) endHold('pointer', event.pointerId, index);
  });
  button.addEventListener('keydown', event => {
    if (event.code !== 'Space' && event.code !== 'Enter') return;
    event.preventDefault();
    if (!event.repeat) beginHold({ type: 'key', id: event.code, index });
  });
  button.addEventListener('keyup', event => {
    if (event.code === 'Space' || event.code === 'Enter') event.preventDefault();
    endHold('key', event.code);
  });
  button.addEventListener('blur', () => {
    if (heldInput?.index === index) { synchronizeClock(); clearHold(); render(); }
  });
  button.addEventListener('contextmenu', event => event.preventDefault());
  return { column, button, fill: column.querySelector('.column-fill'), track: column.querySelector('.column-track'),
    progress: column.querySelector('.column-progress'),
    label: button.querySelector('span'), warmup: button.querySelector('.warmup-label'), meter: button.querySelector('.warmup-meter') };
});

window.addEventListener('pointerup', event => endHold('pointer', event.pointerId));
window.addEventListener('pointercancel', event => endHold('pointer', event.pointerId));
window.addEventListener('keyup', event => endHold('key', event.code));
window.addEventListener('blur', () => { synchronizeClock(); clearHold(); render(); });
window.addEventListener('pagehide', () => { synchronizeClock(); game.pause(); clearHold(); });
document.addEventListener('visibilitychange', () => {
  synchronizeClock();
  if (document.hidden) { game.pause(); clearHold(); }
  render();
});

$('pause').addEventListener('click', () => {
  synchronizeClock();
  if (game.status === 'paused' && !document.hidden) game.resume();
  else game.pause();
  clearHold();
  render();
});

function chooseLevel(level = game.level) {
  if (document.hidden || !session.prepareRound(level)) return false;
  clearHold();
  resultsShown = false;
  lastTime = performance.now();
  $('results').close();
  render();
  controls[0].button.focus();
  return true;
}
$('level-1').addEventListener('click', () => chooseLevel(1));
$('level-2').addEventListener('click', () => chooseLevel(2));
$('next-level').addEventListener('click', () => chooseLevel(2));
$('retry').addEventListener('click', () => chooseLevel());
$('results').addEventListener('cancel', event => event.preventDefault());

function drawHistory(prefix) {
  const comparison = game.level === 2 ? session.level1History : [];
  const chart = contributionChartData(game.history, game.elapsed, game.contribution, comparison);
  $(`${prefix}-line`).setAttribute('d', chart.line);
  $(`${prefix}-area`).setAttribute('d', chart.area);
  $(`${prefix}-comparison`).setAttribute('d', chart.comparisonLine);
  $(`${prefix}-legend`).hidden = comparison.length === 0;
  $(`${prefix}-max`).textContent = displayContribution(chart.maximum);
  $(prefix).setAttribute('aria-label', `Level ${game.level} contribution over time: ${displayContribution(game.contribution)} points after ${Math.round(game.elapsed)} seconds${comparison.length ? `; dashed line: completed Level 1, ${displayContribution(comparison.at(-1).contribution)} points over ${CONFIG.roundSeconds} seconds` : ''}`);
}

function drawComparison() {
  const baseline = session.level1History.at(-1);
  const visible = game.level === 2 && Boolean(baseline);
  $('result-comparison').hidden = !visible;
  $('results').classList.toggle('has-comparison', visible);
  if (!visible) return;
  const difference = game.contribution - baseline.contribution;
  const same = Math.abs(difference) < 1e-9;
  const magnitude = displayContribution(Math.abs(difference));
  const points = magnitude === '0' ? 'Less than 1 point' : `${magnitude} points`;
  const percent = baseline.contribution > 0 ? Math.round(Math.abs(difference) / baseline.contribution * 100) : null;
  $('comparison-change').textContent = same ? 'Same contribution · 0 points difference'
    : `${points} ${difference > 0 ? 'more' : 'fewer'} · ${percent === null ? 'Level 1 scored zero' : `${percent === 0 ? '<1' : percent}% ${difference > 0 ? 'higher' : 'lower'}`}`;
  $('comparison-message').textContent = same ? 'Your contribution was the same in both levels.'
    : difference > 0 ? 'WIP limit seems to work for you!'
    : 'You contributed more without the WIP limit this time.';
  $('comparison-level1-total').textContent = displayContribution(baseline.contribution);
  $('comparison-level2-total').textContent = displayContribution(game.contribution);
  $('comparison-level1-rate').textContent = displayContribution(baseline.contribution / CONFIG.roundSeconds);
  $('comparison-level2-rate').textContent = displayContribution(game.contribution / CONFIG.roundSeconds);
}

function render() {
  if (game.status !== 'ended') $('result-comparison').hidden = true;
  const running = game.status === 'running';
  const betweenRounds = ['ready', 'ended'].includes(game.status);
  $('level-1').disabled = !betweenRounds;
  $('level-2').disabled = !betweenRounds || !session.level2Unlocked;
  $('level-1').setAttribute('aria-pressed', String(game.level === 1));
  $('level-2').setAttribute('aria-pressed', String(game.level === 2));
  $('level-2').title = session.level2Unlocked ? `WIP limit: ${CONFIG.level2Columns} columns` : 'Complete Level 1 to unlock';
  $('contribution').textContent = displayContribution(game.contribution);
  $('rate').textContent = `Contribution per second: +${displayContribution(game.rate)}`;
  $('timer').textContent = formatTime(game.remaining);
  $('time-fill').style.width = `${game.remaining / CONFIG.roundSeconds * 100}%`;
  $('pause').hidden = game.status === 'ready' || game.status === 'ended';
  $('pause').textContent = game.status === 'paused' ? 'Resume' : 'Pause';
  $('hint').textContent = { ready: 'Hold any button to start.', running: 'Hold to build · release to switch.', paused: 'Paused · Resume to continue.', ended: 'Round complete.' }[game.status];
  controls.forEach((view, index) => {
    const column = game.columns[index];
    const locked = !game.isColumnAvailable(index);
    const active = running && game.activeColumn === index;
    const warming = active && game.warmupProgress < 1;
    const growing = active && column.progress < CONFIG.maximumProgress;
    const motion = growing ? 'Growing' : !active && column.progress > 0 ? 'Decaying' : active ? 'Full' : 'At rest';
    view.column.classList.toggle('is-active', active);
    view.column.classList.toggle('is-locked', locked);
    view.button.disabled = locked || !['ready', 'running'].includes(game.status);
    view.button.setAttribute('aria-label', locked ? `Column ${index + 1} unavailable in Level 2` : `Focus on column ${index + 1}${warming ? ' · Warming up' : ''}`);
    view.track.setAttribute('aria-disabled', String(locked));
    view.button.setAttribute('aria-pressed', String(active));
    const label = active ? 'Focusing' : 'Focus';
    if (view.label.textContent !== label) view.label.textContent = label;
    view.warmup.hidden = !warming;
    view.meter.hidden = !warming;
    view.meter.style.width = `${game.warmupProgress * 100}%`;
    view.fill.style.height = `${column.progress / CONFIG.maximumProgress * 100}%`;
    view.fill.hidden = column.progress === 0;
    view.track.setAttribute('aria-valuenow', String(Math.floor(column.progress + 1e-8)));
    view.track.setAttribute('aria-valuetext', locked ? `Unavailable · WIP limit ${CONFIG.level2Columns}` : `${Math.floor(column.progress + 1e-8)}% · ${running ? motion : game.status === 'ready' ? 'At rest' : 'Frozen'}`);
    view.progress.textContent = `${Math.floor(column.progress + 1e-8)}%`;
  });
  drawHistory('history');
  if (game.status === 'ended' && !resultsShown) {
    resultsShown = true;
    clearHold();
    $('result-title').textContent = `Level ${game.level} complete.`;
    $('next-level').hidden = game.level !== 1;
    $('result-total').textContent = displayContribution(game.contribution);
    $('result-average').textContent = `${displayContribution(game.contribution / CONFIG.roundSeconds)} points/s average`;
    drawHistory('result-history');
    drawComparison();
    $('results').showModal();
  }
}

function frame(now) {
  synchronizeClock(now);
  render();
  requestAnimationFrame(frame);
}
render();
requestAnimationFrame(frame);
