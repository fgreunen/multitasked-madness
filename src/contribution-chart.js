import { CONFIG } from './config.js';

// Fixed full-round time axis. The live endpoint is derived, never stored by a
// render, so pause/end freeze history and retry starts a genuinely empty chart.
export function contributionChartData(history, elapsed, total, comparison = []) {
  const points = history.slice();
  if (points.at(-1)?.time !== elapsed) points.push({ time: elapsed, contribution: total });
  const maximum = Math.max(10, Math.ceil(Math.max(total, ...comparison.map(point => point.contribution)) / 10) * 10);
  const x = time => 12 + time / CONFIG.roundSeconds * 336;
  const y = value => 82 - value / maximum * 66;
  const path = values => values.map((point, index) => `${index ? 'L' : 'M'}${x(point.time).toFixed(2)},${y(point.contribution).toFixed(2)}`).join(' ');
  const line = path(points);
  return { maximum, line, comparisonLine: path(comparison), area: `${line} L${x(elapsed).toFixed(2)},82 L12,82 Z` };
}

