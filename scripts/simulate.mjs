import { Game, CONFIG } from '../src/game.js';
import { writeFile } from 'node:fs/promises';

export function simulate(policy, step = 0.1, level = 1) {
  const game = new Game(level);
  game.start();
  let nextDecision = 0;
  let index = 0;
  const interval = policy === 'switch every 2s' ? 2 : 10;
  while (game.status === 'running') {
    if (policy !== 'idle' && game.elapsed >= nextDecision - 1e-8) {
      game.hold(policy === 'hold one' ? 0 : index++ % game.playableColumns);
      nextDecision += interval;
    }
    const decisionIn = policy === 'idle' ? Infinity : nextDecision - game.elapsed;
    game.advance(Math.min(step, decisionIn, game.remaining));
  }
  return { level, policy, seconds: game.elapsed, contribution: Number(game.contribution.toFixed(6)),
    perColumn: game.columns.map(column => Number(column.contribution.toFixed(6))) };
}

const results = [1, 2].flatMap(level => ['idle', 'hold one', 'switch every 2s', 'switch every 10s'].map(policy => simulate(policy, 0.1, level)));
console.table(results.map(({ perColumn, ...row }) => row));
console.log('Deterministic scripted probes, not human pacing/fairness evidence or an optimal strategy search.');
if (process.argv.includes('--audit')) {
  await writeFile(new URL('../CONTRIBUTION-AUDIT.json', import.meta.url), JSON.stringify({
    rules: 'quadratic-contribution-warmup-v6', config: CONFIG,
    limitations: 'Scripted decisions; no human playtesting, fairness claim or optimality claim.', results,
  }, null, 2) + '\n');
}
