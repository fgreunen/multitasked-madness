import { CONFIG } from './config.js';
export { CONFIG };

export function contributionRate(progress) {
  return (progress / CONFIG.maximumProgress) ** 2 * CONFIG.contributionAtFullPerSecond;
}

export function decayRate() {
  return CONFIG.decayPerSecond;
}

// Integrate progress AND contribution analytically, including cap/zero crossings.
// Results do not depend on animation frame sizes or refresh rate.
function rise(progress, seconds, speed, acceleration = 0) {
  const max = CONFIG.maximumProgress;
  const distance = max - progress;
  const untilFull = distance <= 0 ? 0 : acceleration > 0
    ? 2 * distance / (speed + Math.sqrt(speed * speed + 2 * acceleration * distance))
    : distance / speed;
  const rising = Math.min(seconds, untilFull);
  return {
    progress: Math.min(max, progress + speed * seconds + acceleration * seconds * seconds / 2),
    // Integral of (progress + speed*t + acceleration*t²/2)², clipped at full.
    area: progress ** 2 * rising + progress * speed * rising ** 2
      + (speed ** 2 + progress * acceleration) * rising ** 3 / 3
      + speed * acceleration * rising ** 4 / 4 + acceleration ** 2 * rising ** 5 / 20
      + max ** 2 * (seconds - rising),
  };
}

function evolve(progress, seconds, held, heldSeconds) {
  if (held) {
    const warming = Math.min(seconds, Math.max(0, CONFIG.warmupSeconds - heldSeconds));
    const ramp = warming > 0 ? rise(progress, warming,
      CONFIG.growthPerSecond * heldSeconds / CONFIG.warmupSeconds, CONFIG.growthPerSecond / CONFIG.warmupSeconds)
      : { progress, area: 0 };
    const steady = rise(ramp.progress, seconds - warming, CONFIG.growthPerSecond);
    return { progress: steady.progress, area: ramp.area + steady.area };
  }
  if (progress === 0) return { progress: 0, area: 0 };
  const falling = Math.min(seconds, progress / CONFIG.decayPerSecond);
  return {
    progress: Math.max(0, progress - CONFIG.decayPerSecond * seconds),
    area: Math.max(0, progress ** 2 * falling - progress * CONFIG.decayPerSecond * falling ** 2
      + CONFIG.decayPerSecond ** 2 * falling ** 3 / 3),
  };
}

export class Game {
  constructor(level = 1) { this.reset(level); }

  reset(level = this.level ?? 1) {
    if (![1, 2].includes(level)) throw new RangeError('Unknown level');
    this.level = level;
    this.playableColumns = level === 2 ? CONFIG.level2Columns : CONFIG.columns;
    this.status = 'ready';
    this.elapsed = 0;
    this.activeColumn = null;
    this.heldSeconds = 0;
    this.focusedSeconds = 0;
    this.holdCount = 0;
    this.switches = 0;
    this.previousColumn = null;
    this.columns = Array.from({ length: CONFIG.columns }, (_, index) => ({ progress: index < this.playableColumns ? CONFIG.startingProgress : 0, contribution: 0 }));
    this.history = [{ time: 0, contribution: 0 }];
  }

  start() {
    if (this.status !== 'ready') return false;
    this.status = 'running';
    return true;
  }

  isColumnAvailable(index) {
    return Number.isInteger(index) && index >= 0 && index < this.playableColumns;
  }

  hold(index) {
    if (this.status !== 'running' || !this.isColumnAvailable(index)) return false;
    if (this.activeColumn === index) return true;
    if (this.previousColumn !== null && this.previousColumn !== index) this.switches++;
    this.previousColumn = index;
    this.heldSeconds = 0;
    this.holdCount++;
    this.activeColumn = index;
    return true;
  }

  release() { this.activeColumn = null; this.heldSeconds = 0; }

  pause() {
    if (this.status !== 'running') return false;
    this.release();
    this.status = 'paused';
    return true;
  }

  resume() {
    if (this.status !== 'paused') return false;
    this.status = 'running';
    return true;
  }

  advance(seconds) {
    if (this.status !== 'running' || !Number.isFinite(seconds) || seconds <= 0) return;
    const remaining = CONFIG.roundSeconds - this.elapsed;
    const target = seconds >= remaining ? CONFIG.roundSeconds : this.elapsed + seconds;
    // Sample at exact running-time boundaries, even across a long frame.
    while (this.elapsed < target) {
      const nextSample = this.history.length * CONFIG.historySampleSeconds;
      const boundary = Math.min(target, nextSample);
      const dt = boundary - this.elapsed;
      for (const [index, column] of this.columns.entries()) {
        if (!this.isColumnAvailable(index)) continue;
        const next = evolve(column.progress, dt, index === this.activeColumn, this.heldSeconds);
        column.progress = next.progress;
        column.contribution += next.area / CONFIG.maximumProgress ** 2 * CONFIG.contributionAtFullPerSecond;
      }
      if (this.activeColumn !== null) { this.heldSeconds += dt; this.focusedSeconds += dt; }
      this.elapsed = boundary;
      if (boundary === nextSample) this.history.push({ time: boundary, contribution: this.contribution });
    }
    if (this.elapsed === CONFIG.roundSeconds) {
      if (this.history.at(-1).time !== this.elapsed) this.history.push({ time: this.elapsed, contribution: this.contribution });
      this.release();
      this.status = 'ended';
    }
  }

  get contribution() { return this.columns.reduce((sum, column) => sum + column.contribution, 0); }
  get averageFocusSeconds() { return this.holdCount ? this.focusedSeconds / this.holdCount : 0; }
  get warmupProgress() { return this.activeColumn === null ? 0 : Math.min(1, this.heldSeconds / CONFIG.warmupSeconds); }
  get rate() { return this.columns.reduce((sum, column) => sum + contributionRate(column.progress), 0); }
  get remaining() { return Math.max(0, CONFIG.roundSeconds - this.elapsed); }
}

// Progression lasts for one open page; Game continues to own each round's rules.
export class PageSession {
  #game = new Game();
  #level1History = Object.freeze([]);

  get game() { return this.#game; }
  get level1History() { return this.#level1History; }
  get level2Unlocked() { return this.#level1History.length > 0; }

  // Retry defaults to the current level. Neither action can interrupt a round.
  prepareRound(level = this.game.level) {
    if (![1, 2].includes(level) || (level === 2 && !this.level2Unlocked)
      || !['ready', 'ended'].includes(this.game.status)) return false;
    this.game.reset(level);
    return true;
  }

  advance(seconds) {
    const wasRunning = this.game.status === 'running';
    this.game.advance(seconds);
    if (wasRunning && this.game.status === 'ended' && this.game.level === 1) {
      this.#level1History = Object.freeze(this.game.history.map(point => Object.freeze({ ...point })));
    }
  }
}
