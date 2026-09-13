import last from 'licia/last'
import detectOs from 'licia/detectOs'
import arrToMap from 'licia/arrToMap'
import each from 'licia/each'
import isJson from 'licia/isJson'
import escape from 'licia/escape'
import pkg from '../../package.json'
import { classPrefix as c } from '../lib/util'

export function getType(contentType) {
  if (!contentType) return 'unknown'

  const type = contentType.split(';')[0].split('/')

  return {
    type: type[0],
    subType: last(type),
  }
}

export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

export function formatMs(ms) {
  if (ms < 1000) return Math.round(ms) + ' ms'
  return (ms / 1000).toFixed(2) + ' s'
}

// Parse query string of a url into an array of { name, value }
export function parseQueryParams(url) {
  const ret = []
  try {
    const urlObj = new URL(url, location.href)
    urlObj.searchParams.forEach((value, name) => {
      ret.push({ name, value })
    })
  } catch {
    // Invalid url.
  }
  return ret
}

// Pretty print json text, returns original text if not valid json.
export function prettyJson(text) {
  if (isJson(text)) {
    try {
      return JSON.stringify(JSON.parse(text), null, 2)
    } catch {
      return text
    }
  }
  return text
}

// Parse document.cookie into an array of { name, value }
export function getCookieList() {
  const cookies = []
  const cookie = document.cookie
  if (!cookie || cookie.trim() === '') return cookies
  each(cookie.split(';'), (pair) => {
    if (pair.trim() === '') return
    const idx = pair.indexOf('=')
    const name = idx === -1 ? pair.trim() : pair.slice(0, idx).trim()
    const value = idx === -1 ? '' : pair.slice(idx + 1).trim()
    try {
      cookies.push({
        name: decodeURIComponent(name),
        value: decodeURIComponent(value),
      })
    } catch {
      cookies.push({ name, value })
    }
  })
  return cookies
}

// Find a performance resource entry matching given url.
export function getResourceTiming(url) {
  try {
    if (!window.performance || !performance.getEntriesByType) return null
    const entries = performance.getEntriesByType('resource')
    let fallback = null
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i]
      if (entry.name === url) return entry
      // Fall back to entry with same path but different query.
      if (!fallback && stripQuery(entry.name) === stripQuery(url)) {
        fallback = entry
      }
    }
    return fallback
  } catch {
    return null
  }
}

function stripQuery(url) {
  const idx = url.indexOf('?')
  return idx === -1 ? url : url.slice(0, idx)
}

// Extract DevTools-like timing segments (in ms) from a resource timing entry.
export function getTimingSegments(request) {
  const entry = getResourceTiming(request.url)

  if (entry) {
    const start = entry.startTime
    const total = entry.responseEnd - start
    if (total >= 0 && total < 1000 * 60 * 60) {
      const abs = (t) => (t > 0 ? t - start : 0)
      const dnsStart = abs(entry.domainLookupStart)
      const dnsEnd = abs(entry.domainLookupEnd)
      const connectStart = abs(entry.connectStart)
      const connectEnd = abs(entry.connectEnd)
      const requestStart = abs(entry.requestStart)
      const responseStart = abs(entry.responseStart)
      const responseEnd = abs(entry.responseEnd)
      const sslStart =
        entry.secureConnectionStart && entry.secureConnectionStart > 0
          ? abs(entry.secureConnectionStart)
          : 0
      return {
        total,
        precise: true,
        segments: [
          { name: 'Queueing', from: 0, to: dnsStart, cls: 'queueing' },
          { name: 'DNS Lookup', from: dnsStart, to: dnsEnd, cls: 'dns' },
          {
            name: 'Initial Connection',
            from: connectStart,
            to: connectEnd,
            cls: 'connect',
          },
          {
            name: 'SSL/TLS',
            from: sslStart,
            to: connectEnd,
            cls: 'ssl',
          },
          { name: 'Request Sent', from: requestStart, to: requestStart, cls: 'sent' },
          {
            name: 'Waiting (TTFB)',
            from: requestStart,
            to: responseStart,
            cls: 'wait',
          },
          {
            name: 'Content Download',
            from: responseStart,
            to: responseEnd,
            cls: 'download',
          },
        ],
      }
    }
  }

  // Fallback: only total time is known.
  const total = request.time || 0
  return {
    total,
    precise: false,
    segments: [
      { name: 'Waiting (TTFB)', from: 0, to: total, cls: 'wait' },
    ],
  }
}

// Normalize a headers object / Headers instance into an array of { name, value }
export function toHeadersArray(headers) {
  if (!headers) return []
  const ret = []
  if (typeof headers.forEach === 'function') {
    headers.forEach((value, name) => ret.push({ name, value }))
    return ret
  }
  each(headers, (value, name) => ret.push({ name, value }))
  return ret
}

// Build a HAR 1.2 log object from network requests.
export function buildHar(requests) {
  const entries = []
  each(requests, (request) => {
    if (!request.done && request.status !== 'blocked') return
    entries.push(requestToHarEntry(request))
  })
  entries.sort((a, b) => a._startDateTime - b._startDateTime)
  each(entries, (entry) => delete entry._startDateTime)

  const startedDateTime =
    entries.length > 0 ? entries[0].startedDateTime : new Date().toISOString()

  return {
    log: {
      version: '1.2',
      creator: { name: 'eruda', version: pkg.version || '3.4.3' },
      pages: [
        {
          startedDateTime,
          id: 'page_1',
          title: document.title || location.href,
          pageTimings: { onContentLoad: -1, onLoad: -1 },
        },
      ],
      entries,
    },
  }
}

function requestToHarEntry(request) {
  const startedDateTime = new Date(
    request.startTime || Date.now()
  ).toISOString()
  const time = request.time || 0
  const timing = getTimingSegments(request)
  const toSec = (ms) => ms / 1000
  const reqHeaders = toHeadersArray(request.reqHeaders)
  const resHeaders = toHeadersArray(request.resHeaders)
  const contentTypeHeader = resHeaders.find(
    (h) => h.name.toLowerCase() === 'content-type'
  )
  const mimeType = contentTypeHeader ? contentTypeHeader.value : ''

  const entry = {
    pageref: 'page_1',
    startedDateTime,
    time: toSec(time),
    _resourceTime: timing.precise ? toSec(timing.total) : -1,
    request: {
      method: request.method,
      url: request.url,
      httpVersion: 'HTTP/1.1',
      headers: reqHeaders,
      queryString: parseQueryParams(request.url),
      cookies: [],
      headersSize: -1,
      bodySize: request.data ? request.data.length : 0,
    },
    response: {
      status: request.status === 'blocked' ? 403 : request.status || 0,
      statusText:
        request.status === 'blocked'
          ? t('Blocked by eruda')
          : request.statusText || '',
      httpVersion: 'HTTP/1.1',
      headers: resHeaders,
      cookies: [],
      content: {
        size: request.size || 0,
        mimeType,
        text: request.resTxt || '',
      },
      redirectURL: getHeader(resHeaders, 'location') || '',
      headersSize: -1,
      bodySize: request.size || 0,
    },
    cache: {},
    timings: {
      blocked: -1,
      dns: -1,
      connect: -1,
      send: -1,
      wait: toSec(time),
      receive: -1,
      ssl: -1,
    },
    _resourceType: request.subType,
  }

  if (request.data) {
    const reqContentType = getHeader(reqHeaders, 'content-type') || ''
    entry.request.postData = {
      mimeType: reqContentType,
      text: request.data,
    }
  }

  if (timing.precise) {
    const segs = timing.segments
    entry.timings = {
      blocked: toSec(segVal(segs, 'Queueing')),
      dns: toSec(segVal(segs, 'DNS Lookup')),
      connect: toSec(segVal(segs, 'Initial Connection')),
      send: toSec(segVal(segs, 'Request Sent')),
      wait: toSec(segVal(segs, 'Waiting (TTFB)')),
      receive: toSec(segVal(segs, 'Content Download')),
      ssl: toSec(segVal(segs, 'SSL/TLS')),
    }
  }

  if (request.status === 'blocked') {
    entry._blocked = true
  }

  entry._startDateTime = request.startTime || 0

  return entry
}

function segVal(segments, name) {
  const seg = segments.find((s) => s.name === name)
  return seg ? Math.max(0, seg.to - seg.from) : 0
}

function getHeader(headers, name) {
  const header = headers.find((h) => h.name.toLowerCase() === name)
  return header ? header.value : ''
}

// Compile blocklist text (one pattern per line) into matcher list.
// A pattern can be a literal substring or a /regexp/.
export function compileBlockPatterns(text) {
  const matchers = []
  each(text.split('\n'), (line) => {
    line = line.trim()
    if (line === '' || line.startsWith('#')) return
    if (line.length > 2 && line.startsWith('/') && line.endsWith('/')) {
      try {
        const regex = new RegExp(line.slice(1, -1), 'i')
        matchers.push({ pattern: line, test: (url) => regex.test(url) })
        return
      } catch {
        // Invalid regex, fall back to literal matching.
      }
    }
    const keyword = line.toLowerCase()
    matchers.push({ pattern: line, test: (url) => url.toLowerCase().includes(keyword) })
  })
  return matchers
}

export function absoluteUrl(url) {
  try {
    return new URL(url, location.href).href
  } catch {
    return url
  }
}

export function curlStr(request) {
  let platform = detectOs()
  if (platform === 'windows') {
    platform = 'win'
  }
  let command = []
  const ignoredHeaders = arrToMap([
    'accept-encoding',
    'host',
    'method',
    'path',
    'scheme',
    'version',
  ])

  function escapeStringWin(str) {
    const encapsChars = /[\r\n]/.test(str) ? '^"' : '"'
    return (
      encapsChars +
      str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/[^a-zA-Z0-9\s_\-:=+~'/.',?;()*`&]/g, '^$&')
        .replace(/%(?=[a-zA-Z0-9_])/g, '%^')
        .replace(/\r?\n/g, '^\n\n') +
      encapsChars
    )
  }

  function escapeStringPosix(str) {
    function escapeCharacter(x) {
      const code = x.charCodeAt(0)
      let hexString = code.toString(16)
      while (hexString.length < 4) {
        hexString = '0' + hexString
      }

      return '\\u' + hexString
    }

    // eslint-disable-next-line no-control-regex
    if (/[\0-\x1F\x7F-\x9F!]|'/.test(str)) {
      return (
        "$'" +
        str
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\'")
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          // eslint-disable-next-line no-control-regex
          .replace(/[\0-\x1F\x7F-\x9F!]/g, escapeCharacter) +
        "'"
      )
    }
    return "'" + str + "'"
  }

  const escapeString = platform === 'win' ? escapeStringWin : escapeStringPosix

  command.push(escapeString(request.url()).replace(/[[{}\]]/g, '\\$&'))

  let inferredMethod = 'GET'
  const data = []
  const formData = request.requestFormData()
  if (formData) {
    data.push('--data-raw ' + escapeString(formData))
    ignoredHeaders['content-length'] = true
    inferredMethod = 'POST'
  }

  if (request.requestMethod !== inferredMethod) {
    command.push('-X ' + escapeString(request.requestMethod))
  }

  const requestHeaders = request.requestHeaders()
  for (let i = 0; i < requestHeaders.length; i++) {
    const header = requestHeaders[i]
    const name = header.name.replace(/^:/, '')
    if (ignoredHeaders[name.toLowerCase()]) {
      continue
    }
    command.push('-H ' + escapeString(name + ': ' + header.value))
  }
  command = command.concat(data)
  command.push('--compressed')

  return (
    'curl ' +
    command.join(
      command.length >= 3 ? (platform === 'win' ? ' ^\n  ' : ' \\\n  ') : ' '
    )
  )
}

// ---------------- i18n (English / Chinese) ----------------
// Re-exported from the global i18n module so that every eruda tool
// shares the same language state (Settings -> Language).
import { detectLang, getLang, setLang, t } from '../lib/i18n'

export { detectLang, getLang, setLang, t }

// ---------------- request matching / classification ----------------

// Compile a pattern that is either "/regex/" or a literal substring.
export function compilePattern(pattern) {
  pattern = String(pattern == null ? '' : pattern).trim()
  if (pattern.length > 2 && pattern.startsWith('/') && pattern.endsWith('/')) {
    try {
      const regex = new RegExp(pattern.slice(1, -1), 'i')
      return {
        test: (url) => regex.test(url),
        replace: (url, to) => url.replace(new RegExp(pattern.slice(1, -1), 'g'), to),
      }
    } catch {
      // Invalid regex, fall back to literal matching.
    }
  }
  const keyword = pattern.toLowerCase()
  return {
    test: (url) => keyword !== '' && url.toLowerCase().includes(keyword),
    replace: (url, to) => url.split(pattern).join(to),
  }
}

// Filter text supports /regex/ and -negative tokens.
export function compileFilter(text) {
  const tokens = String(text || '')
    .trim()
    .split(/\s+/)
  const rules = []
  each(tokens, (token) => {
    if (!token) return
    let negative = false
    if (token.length > 1 && token.startsWith('-')) {
      negative = true
      token = token.slice(1)
    }
    const matcher = compilePattern(token)
    rules.push({ negative, test: matcher.test })
  })
  if (rules.length === 0) return null
  return (r) => {
    const haystack = (r.url + ' ' + r.method + ' ' + r.name).toLowerCase()
    for (let i = 0; i < rules.length; i++) {
      const hit = rules[i].test(haystack)
      if (rules[i].negative && hit) return false
      if (!rules[i].negative && !hit) return false
    }
    return true
  }
}

export function isFailed(r) {
  return (
    r.blocked ||
    r.status === 0 ||
    (typeof r.status === 'number' && r.status >= 400)
  )
}

export function classifyChip(r) {
  if (r.chipType) return r.chipType
  const resHeaders = toHeadersArray(r.resHeaders)
  const contentTypeHeader = resHeaders.find((h) => h.name.toLowerCase() === 'content-type')
  const ct = contentTypeHeader ? contentTypeHeader.value.toLowerCase() : ''
  const url = String(r.url || '').toLowerCase()
  // WebSocket / Wasm / Web manifest (same groups as DevTools chips).
  if (r.subType === 'websocket' || ct.includes('websocket') || /^(ws|wss):/.test(url)) return 'ws'
  if (ct.includes('wasm') || /\.wasm([?#]|$)/.test(url)) return 'wasm'
  if (ct.includes('manifest') || /manifest\.(json|webmanifest)([?#]|$)/.test(url)) return 'manifest'
  if (ct.includes('image/') || /\.(png|jpe?g|gif|webp|svg|ico|bmp)([?#]|$)/.test(url)) return 'img'
  if (ct.includes('video/') || ct.includes('audio/') || /\.(mp4|webm|mp3|wav|ogg|m4a)([?#]|$)/.test(url))
    return 'media'
  if (ct.includes('font') || /\.(woff2?|ttf|otf|eot)([?#]|$)/.test(url)) return 'font'
  if (ct.includes('text/css') || /\.css([?#]|$)/.test(url)) return 'css'
  if (ct.includes('javascript') || ct.includes('ecmascript') || /\.m?js([?#]|$)/.test(url)) return 'js'
  if (ct.includes('text/html') || /\.html?([?#]|$)/.test(url)) return 'doc'
  return 'other'
}

// Detect the initiator (first script frame outside this module).
export function parseInitiator() {
  let stack = ''
  try {
    stack = new Error().stack || ''
  } catch {
    return null
  }
  const frames = []
  each(stack.split('\n'), (line) => {
    const m = line.match(/((?:https?:\/\/|file:\/\/)[^\s)(]+?):(\d+):(\d+)/)
    if (m) frames.push({ file: m[1], line: +m[2], col: +m[3] })
  })
  if (frames.length === 0) return null
  const own = frames[0].file
  for (let i = 0; i < frames.length; i++) {
    if (frames[i].file !== own) return frames[i]
  }
  return frames[frames.length - 1]
}

export function initiatorLabel(frame) {
  if (!frame) return ''
  return getFileName(frame.file) + ':' + frame.line
}

export function getFileName(url) {
  let ret = String(url).split('?')[0].split('#')[0].split('/').pop()
  if (ret === '') {
    try {
      ret = new URL(url, location.href).hostname
    } catch {
      ret = url
    }
  }
  return ret
}

// Copy as fetch snippet.
export function fetchStr(request) {
  const method = request.method.toUpperCase()
  const headers = toHeadersArray(request.reqHeaders).filter((h) => {
    const name = h.name.toLowerCase()
    return name !== 'content-length' && name !== 'host'
  })
  const lines = [`fetch('${request.url}', {`]
  if (method !== 'GET') lines.push(`  method: '${method}',`)
  if (headers.length > 0) {
    lines.push('  headers: {')
    each(headers, (h) => {
      lines.push(`    '${h.name}': '${String(h.value).replace(/'/g, "\\'")}',`)
    })
    lines.push('  },')
  }
  if (method !== 'GET' && method !== 'HEAD' && request.data) {
    lines.push(
      `  body: '${String(request.data).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}',`
    )
  }
  lines.push('})')
  return lines.join('\n')
}

// ---------------- throttling ----------------

export const THROTTLE_PROFILES = {
  none: null,
  slow3g: { latency: 400, bps: 50 * 1024, label: 'Slow 3G' },
  fast3g: { latency: 150, bps: 180 * 1024, label: 'Fast 3G' },
  offline: { offline: true, label: 'Offline' },
}

// ---------------- HAR import ----------------

// Convert HAR entries into records shown in the list.
export function harToRecords(har) {
  if (!har || !har.log || !Array.isArray(har.log.entries)) return null
  const records = []
  each(har.log.entries, (entry, idx) => {
    const req = entry.request || {}
    const res = entry.response || {}
    const content = res.content || {}
    const reqHeaders = {}
    each(req.headers || [], (h) => (reqHeaders[h.name] = h.value))
    const resHeaders = {}
    each(res.headers || [], (h) => (resHeaders[h.name.toLowerCase()] = h.value))
    const mime = content.mimeType || ''
    const tt = getType(mime)
    let startTime = Date.now()
    try {
      startTime = Date.parse(entry.startedDateTime) || Date.now()
    } catch {
      // Keep fallback.
    }
    records.push({
      id: 'har-' + Date.now() + '-' + idx,
      name: getFileName(req.url || ''),
      url: req.url || '',
      method: (req.method || 'GET').toUpperCase(),
      reqHeaders,
      data: req.postData && req.postData.text ? req.postData.text : '',
      status: res.status || 0,
      type: tt.type,
      subType: tt.subType,
      size: content.size || 0,
      time: Math.round((entry.time || 0) * 1000),
      displayTime: formatMs(Math.round((entry.time || 0) * 1000)),
      startTime,
      resTxt: content.text || '',
      resHeaders,
      done: true,
      imported: true,
    })
  })
  return records
}

// ---------------- JSON tree (Preview) ----------------

const JSON_NODE_CAP = 300

function jsonNode(value, keyLabel, counter) {
  if (counter.count > JSON_NODE_CAP) return ''
  counter.count++
  const isObj = value && typeof value === 'object'
  if (isObj) {
    const keys = Object.keys(value)
    const summary = keys.length
      ? keys.length + ' ' + (Array.isArray(value) ? 'items' : 'keys')
      : Array.isArray(value)
        ? '[]'
        : '{}'
    let html = `<details class="${c('j-node')}" open><summary><span class="${c(
      'j-key'
    )}">${escape(keyLabel)}</span><span class="${c('j-brace')}">${escape(
      summary
    )}</span></summary>`
    const limit = Math.min(keys.length, 60)
    for (let i = 0; i < limit; i++) {
      html += jsonNode(value[keys[i]], keys[i], counter)
    }
    if (keys.length > limit) {
      html += `<div class="${c('j-more')}">… ${keys.length - limit} ${t('more')}</div>`
    }
    html += '</details>'
    return html
  }
  let cls = 'j-null'
  let text = 'null'
  if (typeof value === 'string') {
    cls = 'j-str'
    text = '"' + (value.length > 500 ? value.slice(0, 500) + '…' : value) + '"'
  } else if (typeof value === 'number') {
    cls = 'j-num'
    text = String(value)
  } else if (typeof value === 'boolean') {
    cls = 'j-bool'
    text = String(value)
  }
  return `<div class="${c('j-line')}"><span class="${c('j-key')}">${escape(
    keyLabel
  )}</span><span class="${c(cls)}">${escape(text)}</span></div>`
}

// Returns collapsible JSON tree html, or null when text is not json.
export function jsonTreeHtml(text) {
  try {
    const data = JSON.parse(text)
    return `<div class="${c('tree')}">${jsonNode(data, '', { count: 0 })}</div>`
  } catch {
    return null
  }
}
