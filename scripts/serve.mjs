import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const project = fileURLToPath(new URL('../', import.meta.url));
const root = process.argv.includes('--dist') ? resolve(project, 'dist') : project;
const port = Number(process.env.PORT || 4173);
const files = new Map([
  ['/index.html', 'text/html; charset=utf-8'],
  ['/styles.css', 'text/css; charset=utf-8'],
  ['/favicon.svg', 'image/svg+xml'],
  ['/src/app.js', 'text/javascript; charset=utf-8'],
  ['/src/game.js', 'text/javascript; charset=utf-8'],
  ['/src/contribution-chart.js', 'text/javascript; charset=utf-8'],
  ['/src/config.js', 'text/javascript; charset=utf-8'],
]);

const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  const path = new URL(request.url, 'http://localhost').pathname;
  const route = path === '/' ? '/index.html' : path;
  if (!files.has(route)) {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    const body = await readFile(resolve(root, `.${route}`));
    response.writeHead(200, {
      'Content-Type': files.get(route),
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404).end('File not found. For production preview, run npm run build first.');
  }
});
server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} is already in use. Set PORT to another port and try again.`
    : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
