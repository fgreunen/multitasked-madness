import { mkdir, copyFile, rm } from 'node:fs/promises';

export const assets = ['index.html', 'styles.css', 'favicon.svg', 'src/app.js', 'src/game.js', 'src/contribution-chart.js', 'src/config.js'];
const root = new URL('../', import.meta.url);
await mkdir(new URL('dist/src/', root), { recursive: true });
// Remove only known retired outputs, keeping unrelated files untouched.
for (const path of ['src/satisfaction-chart.js', 'src/run-feedback.js', 'src/audio.js']) {
  await rm(new URL(`dist/${path}`, root), { force: true });
}
for (const path of assets) await copyFile(new URL(path, root), new URL(`dist/${path}`, root));
console.log(`Built ${assets.length} static game files in dist/`);
