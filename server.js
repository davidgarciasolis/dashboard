import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const files = { '/': 'index.html', '/index.html': 'index.html', '/styles.css': 'styles.css', '/app.js': 'app.js', '/core.js': 'core.js' };
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
const server = http.createServer(async (req, res) => {
  const file = files[new URL(req.url, 'http://localhost').pathname];
  if (!file) { res.writeHead(404); res.end('No encontrado'); return; }
  try {
    const content = await readFile(path.join(root, file));
    res.writeHead(200, { 'Content-Type': `${types[path.extname(file)]}; charset=utf-8`, 'Cache-Control': 'no-cache' });
    res.end(content);
  } catch { res.writeHead(500); res.end('No se pudo cargar la página'); }
});
const port = Number(process.env.PORT || 5173);
server.listen(port, '0.0.0.0', () => console.log(`día. disponible en http://localhost:${port}`));
