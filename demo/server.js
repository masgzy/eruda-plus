/*
 * Demo server for eruda enhanced Network panel.
 * Zero dependencies. Run: node server.js [port]
 */
const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.argv[2] || 3456
const ROOT = __dirname

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.har': 'application/json',
}

function json(res, code, obj, delay) {
  setTimeout(() => {
    res.writeHead(code, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(obj))
  }, delay || 0)
}

function readBody(req, cb) {
  let body = ''
  req.on('data', (c) => (body += c))
  req.on('end', () => cb(body))
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost')

    // ---- API endpoints (for network panel demos) ----
    if (url.pathname === '/api/json') {
      return json(res, 200, {
        ok: true,
        method: 'GET',
        message: 'hello from eruda network demo',
        items: [
          { id: 1, name: 'foo', tags: ['a', 'b'] },
          { id: 2, name: 'bar', tags: [] },
        ],
      })
    }
    if (url.pathname === '/api/slow') {
      return json(res, 200, { ok: true, slow: true }, 900)
    }
    if (url.pathname === '/api/echo' && req.method === 'POST') {
      return readBody(req, (body) => {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            ok: true,
            received: body,
            contentType: req.headers['content-type'] || '',
          })
        )
      })
    }
    if (url.pathname === '/api/notfound') {
      return json(res, 404, { ok: false, error: 'Not Found' })
    }
    if (url.pathname === '/api/error') {
      return json(res, 500, { ok: false, error: 'Internal Server Error' })
    }
    if (url.pathname === '/api/text') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
      return res.end('plain text response from demo server')
    }
    if (url.pathname === '/api/form' && req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ ok: true, form: 'received' }))
    }

    // ---- Static files ----
    let filePath = path.join(ROOT, decodeURIComponent(url.pathname))
    if (filePath === path.join(ROOT, '/')) filePath = path.join(ROOT, 'index.html')
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403)
      return res.end('Forbidden')
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        return res.end('Not Found: ' + url.pathname)
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
      })
      res.end(data)
    })
  })
  .listen(PORT, () => console.log('Demo server running at http://localhost:' + PORT))
