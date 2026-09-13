import Tool from '../DevTools/Tool'
import $ from 'licia/$'
import ms from 'licia/ms'
import each from 'licia/each'
import map from 'licia/map'
import Detail from './Detail'
import throttle from 'licia/throttle'
import { getFileName, classPrefix as c, savePreservedLogs, loadPreservedLogs } from '../lib/util'
import evalCss from '../lib/evalCss'
import Settings from '../Settings/Settings'
import chobitsu from '../lib/chobitsu'
import emitter from '../lib/emitter'
import LunaDataGrid from 'luna-data-grid'
import ResizeSensor from 'licia/ResizeSensor'
import MediaQuery from 'licia/MediaQuery'
import copy from 'licia/copy'
import extend from 'licia/extend'
import {
  curlStr,
  fetchStr,
  getType,
  buildHar,
  harToRecords,
  compileBlockPatterns,
  compilePattern,
  compileFilter,
  isFailed,
  classifyChip,
  parseInitiator,
  initiatorLabel,
  absoluteUrl,
  formatBytes,
  formatMs,
  getTimingSegments,
  THROTTLE_PROFILES,
  setLang,
  getLang,
  t,
} from './util'

const SETTINGS_KEY = 'eruda_network_settings'

// Aligned with Chrome DevTools request filter chips.
const CHIPS = [
  'all',
  'xhr',
  'doc',
  'css',
  'js',
  'font',
  'img',
  'media',
  'manifest',
  'ws',
  'wasm',
  'other',
]

// DevTools-style status cell: paint the number, not the whole row.
function statusCell(request) {
  const span = document.createElement('span')
  let txt = request.displayStatus || request.status || ''
  let cls = 'st-pending'
  if (request.blocked || request.status === 'blocked') {
    // Like DevTools' "(blocked:blocked-by-client)" — show the synthetic 403.
    cls = 'st-blocked'
    txt = '403'
  } else if (request.mock) {
    cls = 'st-mock'
  } else if (request.status === 0) {
    cls = 'st-0'
  } else if (typeof request.status === 'number') {
    if (request.status >= 500) cls = 'st-5xx'
    else if (request.status >= 400) cls = 'st-4xx'
    else if (request.status >= 300) cls = 'st-3xx'
    else if (request.status >= 200) cls = 'st-2xx'
    else if (request.status > 0) cls = 'st-2xx'
  } else if (request.status === 'pending') {
    cls = 'st-pending'
  } else {
    cls = 'st-pending'
  }
  span.className = c('st-badge') + ' ' + c(cls)
  span.textContent = String(txt)
  return span
}

// Colored HTTP method so it stays readable on narrow screens.
function methodCell(request) {
  const span = document.createElement('span')
  const m = String(request.method || 'GET').toLowerCase()
  const known = ['get', 'post', 'put', 'delete', 'patch']
  const cls = known.indexOf(m) >= 0 ? 'm-' + m : 'm-get'
  span.className = c('method-badge') + ' ' + c(cls)
  span.textContent = request.method || 'GET'
  return span
}

export default class Network extends Tool {
  constructor() {
    super()

    this._style = evalCss(require('./Network.scss'))

    this.name = 'network'
    this._requests = {}
    this._selectedRequest = null
    this._isRecording = true

    // Filters
    this._chip = 'all'
    this._filterText = ''
    this._filterFn = null
    this._failedFilterOn = false

    // Rules (block / rewrite / mock)
    this._blockEnabled = false
    this._blockMatchers = []
    this._rewriteRules = []
    this._mockRules = []
    this._panelTab = 'blocked'
    this._interceptorInstalled = false
    this._blockedId = 0

    // Preserve Log (restore requests after page reload)
    this._preserveLog = false

    // Throttling
    this._throttleKey = 'none'

    // Initiator matching queue (url+method -> initiator)
    this._initiatorQueue = []

    this._loadSettings()
  }
  init($el, container) {
    super.init($el)

    this._container = container
    this._initTpl()
    this._detail = new Detail(this._$detail, container)
    this._splitMediaQuery = new MediaQuery('screen and (min-width: 680px)')
    this._splitMode = this._splitMediaQuery.isMatch()
    this._compactMediaQuery = new MediaQuery('screen and (max-width: 479px)')
    this._compactMode = this._compactMediaQuery.isMatch()
    this._requestDataGrid = new LunaDataGrid(this._$requests.get(0), {
      columns: this._gridColumns(),
    })
    emitter.on(emitter.I18N, this._onI18n)
    this._resizeSensor = new ResizeSensor($el.get(0))
    this._installIntercept()
    this._bindEvent()
    this._initCfg()
    this._updateStats()
    this._renderChips()
    this._updateEmptyState()

    if (this._preserveLog) {
      window.addEventListener('pagehide', this._saveNetworkPreserved)
      this._restorePreservedNetwork()
    }
  }
  show() {
    super.show()
    this._updateDataGridHeight()
    this._drawOverview()
  }
  clear() {
    this._requests = {}
    this._requestDataGrid.clear()
    this._updateStats()
    this._drawOverview()
    this._updateEmptyState()
  }
  requests() {
    const ret = []
    each(this._requests, (request) => {
      ret.push(request)
    })
    return ret
  }
  // ---------- public rule & throttle API (site demo / programmatic use) ----------
  // Block requests matching the given pattern(s) and enable blocking.
  block(patterns) {
    const list = Array.isArray(patterns) ? patterns : [patterns]
    const lines = this._blockPatternsText
      ? this._blockPatternsText.split('\n')
      : []
    each(list, (p) => {
      if (typeof p === 'string' && p && lines.indexOf(p) === -1) lines.push(p)
    })
    this._blockPatternsText = lines.join('\n')
    this._blockEnabled = true
    this._blockMatchers = compileBlockPatterns(this._blockPatternsText)
    this._saveSettings()
    this._refreshRulesUi()
    return this
  }
  // Disable blocking; pass a pattern to remove a single entry.
  unblock(pattern) {
    if (typeof pattern === 'string' && pattern) {
      const lines = this._blockPatternsText
        ? this._blockPatternsText.split('\n')
        : []
      const next = lines.filter((line) => line !== pattern)
      this._blockPatternsText = next.join('\n')
      this._blockMatchers = compileBlockPatterns(this._blockPatternsText)
      if (next.length === 0) this._blockEnabled = false
    } else {
      this._blockEnabled = false
      this._blockPatternsText = ''
      this._blockMatchers = []
    }
    this._saveSettings()
    this._refreshRulesUi()
    return this
  }
  // Add a mock rule. Accepts either the flat shape
  // { pattern, status, contentType, body, enabled } (as stored) or the
  // friendlier { url, response: { status, contentType, body } }.
  mock(rule) {
    if (!rule || typeof rule !== 'object') return this
    const response = rule.response || {}
    const body = rule.body != null ? rule.body : response.body != null ? response.body : ''
    const status = Number(
      rule.status != null ? rule.status : response.status != null ? response.status : 200
    )
    const contentType = String(
      rule.contentType || response.contentType || 'application/json'
    )
    this._mockRules.push({
      enabled: rule.enabled !== false,
      pattern: String(rule.pattern || rule.url || ''),
      status: Number.isNaN(status) ? 200 : status,
      contentType,
      body: String(body),
    })
    this._saveSettings()
    this._refreshRulesUi()
    return this
  }
  // Remove mock rules: by pattern, or all when omitted.
  unmock(pattern) {
    if (typeof pattern === 'string' && pattern) {
      this._mockRules = this._mockRules.filter((rule) => rule.pattern !== pattern)
    } else {
      this._mockRules = []
    }
    this._saveSettings()
    this._refreshRulesUi()
    return this
  }
  // Apply a throttling profile: none | slow3g | fast3g | offline.
  throttle(key) {
    return this.throttleProfile(key)
  }
  throttleProfile(key) {
    if (key !== 'none' && !THROTTLE_PROFILES[key]) return this
    this._throttleKey = key
    this._saveSettings()
    this._syncThrottleSelect()
    return this
  }
  // Return the current request log as a HAR object.
  exportHar() {
    return buildHar(this._requests)
  }
  _refreshRulesUi() {
    if (this._$rulesPanel && this._$rulesPanel.hasClass(c('show'))) {
      this._renderRulesPanel()
    }
  }
  _syncThrottleSelect() {
    if (!this._$control) return
    this._$control.find(c('.throttle')).val(this._throttleKey || 'none')
  }
  _updateDataGridHeight() {
    this._requestDataGrid.fit()
  }
  _gridColumns() {
    // Narrow screens drop the secondary columns (Type / Initiator) so
    // Name / Method / Status stay readable — the main mobile pain point.
    if (this._compactMode) {
      return [
        { id: 'name', title: t('Name'), sortable: true, weight: 34 },
        { id: 'method', title: t('Method'), sortable: true, weight: 12 },
        { id: 'status', title: t('Status'), sortable: true, weight: 10 },
        { id: 'size', title: t('Size'), sortable: true, weight: 11 },
        { id: 'time', title: t('Time'), sortable: true, weight: 11 },
        { id: 'waterfall', title: t('Waterfall'), sortable: false, weight: 22 },
      ]
    }
    return [
      { id: 'name', title: t('Name'), sortable: true, weight: 30 },
      { id: 'method', title: t('Method'), sortable: true, weight: 10 },
      { id: 'status', title: t('Status'), sortable: true, weight: 10 },
      { id: 'type', title: t('Type'), sortable: true, weight: 10 },
      { id: 'initiator', title: t('Initiator'), sortable: true, weight: 14 },
      { id: 'size', title: t('Size'), sortable: true, weight: 10 },
      { id: 'time', title: t('Time'), sortable: true, weight: 10 },
      { id: 'waterfall', title: t('Waterfall'), sortable: false, weight: 16 },
    ]
  }
  _gridRowData(id, request) {
    const row = {
      id,
      name: request.name,
      method: methodCell(request),
      status: statusCell(request),
      size: request.size,
      time: request.displayTime,
      waterfall: this._waterfallCell(request),
    }
    if (!this._compactMode) {
      row.type = request.subType
      row.initiator = initiatorLabel(request.initiator)
    }
    return row
  }

  // Build the mini waterfall cell (DevTools NetworkWaterfallColumn style).
  // Segment left/width are relative to the request's own duration; the
  // container is aligned to the global timeline in _updateWaterfallBars().
  _waterfallCell(request) {
    const div = document.createElement('div')
    div.className = c('wf-cell')
    request._wfEl = div
    const timing = getTimingSegments(request)
    const total = timing.total || request.time || 0
    if (!(total > 0)) return div
    if (isFailed(request) || request.blocked) {
      const seg = document.createElement('div')
      seg.className = c('wf-seg') + ' ' + c('wf-error')
      div.appendChild(seg)
      return div
    }
    each(timing.segments, (seg) => {
      if (!(seg.to > seg.from)) return
      const el = document.createElement('div')
      let cls = c('wf-seg') + ' ' + c('wf-' + seg.cls)
      if (seg.cls === 'wait') cls += ' ' + c('wf-line')
      el.className = cls
      el.style.left = (seg.from / total) * 100 + '%'
      el.style.width = Math.max(((seg.to - seg.from) / total) * 100, 0.8) + '%'
      div.appendChild(el)
    })
    return div
  }
  _updateWaterfallBars() {
    const range = this._wfRange
    if (!range || !(range.span > 0)) return
    each(this._requests, (request) => {
      const el = request._wfEl
      if (!el) return
      const start = ((request.startTime - range.t0) / range.span) * 100
      const width = Math.max(((request.time || 0) / range.span) * 100, 0.5)
      el.style.left = start + '%'
      el.style.width = width + '%'
    })
  }
  _onI18n = () => {
    this._applyI18n()
    if (this._requestDataGrid) {
      const grid = this._requestDataGrid
      grid.setOption('columns', this._gridColumns())
      if (grid.renderHeader) grid.renderHeader()
    }
    const $preserveLabel = this._$network.find(c('.preserve-toggle'))
    if ($preserveLabel.length) {
      $preserveLabel.attr('title', t('Preserve Log'))
      $preserveLabel.find('span').text(t('Preserve Log'))
    }
    this._updateEmptyState()
  }

  // DevTools-style empty state below the stats bar.
  _updateEmptyState() {
    if (!this._$empty) return
    const empty = Object.keys(this._requests).length === 0
    this._$empty.css('display', empty ? 'flex' : 'none')
    if (empty) {
      this._$empty.find(c('.np-empty-title')).text(t('currentlyRecording'))
      this._$empty.find(c('.np-empty-hint')).text(t('recordingHint'))
      this._$empty.find(c('.np-empty-btn')).text(t('reloadPage'))
    }
  }
  _reloadPage = () => {
    location.reload()
  }
  _loadSettings() {
    try {
      const data = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
      if (data.block) {
        if (typeof data.block.enabled === 'boolean') this._blockEnabled = data.block.enabled
        if (typeof data.block.patterns === 'string') this._blockPatternsText = data.block.patterns
      }
      if (Array.isArray(data.rewrite)) this._rewriteRules = data.rewrite
      if (Array.isArray(data.mock)) this._mockRules = data.mock
      if (THROTTLE_PROFILES[data.throttle]) this._throttleKey = data.throttle
      if (typeof data.preserveLog === 'boolean') this._preserveLog = data.preserveLog
    } catch {
      // Ignore corrupted storage.
    }
    if (typeof this._blockPatternsText !== 'string') {
      this._blockPatternsText = ''
    }
    this._blockMatchers = compileBlockPatterns(this._blockPatternsText)
  }
  _saveSettings() {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          block: { enabled: this._blockEnabled, patterns: this._blockPatternsText },
          rewrite: this._rewriteRules,
          mock: this._mockRules,
          throttle: this._throttleKey,
          preserveLog: this._preserveLog,
        })
      )
    } catch {
      // Storage unavailable, keep in memory only.
    }
  }

  // ---------- preserve log ----------
  _saveNetworkPreserved = () => {
    if (!this._preserveLog) return
    const ids = Object.keys(this._requests)
    if (ids.length === 0) return
    const cap = (s) =>
      typeof s === 'string' && s.length > 50000 ? s.slice(0, 50000) : s
    const records = []
    each(ids.slice(-100), (id) => {
      const r = this._requests[id]
      if (!r || r.fromSession) return
      records.push({
        id: r.id || id,
        name: r.name,
        url: r.url,
        originalUrl: r.originalUrl,
        method: r.method,
        status: r.status,
        displayStatus: r.displayStatus,
        type: r.type,
        subType: r.subType,
        chipType: r.chipType,
        size: r.size,
        startTime: r.startTime,
        time: r.time,
        displayTime: r.displayTime,
        done: r.done,
        blocked: r.blocked,
        mock: r.mock,
        netError: r.netError,
        hasErr: r.hasErr,
        initiator: r.initiator,
        data: cap(r.data),
        resTxt: cap(r.resTxt),
        reqHeaders: r.reqHeaders || {},
        resHeaders: r.resHeaders || {},
      })
    })
    if (records.length === 0) return
    savePreservedLogs('network', { records })
  }
  _restorePreservedNetwork() {
    const data = loadPreservedLogs('network')
    if (!data || !Array.isArray(data.records) || data.records.length === 0) return

    each(data.records.slice(-100), (record) => {
      const id = record.id
      const request = extend({ fromSession: true }, record)
      request.render = () => {
        const gridData = this._gridRowData(id, request)
        if (request._gridNode) {
          request._gridNode.data = gridData
          request._gridNode.render()
        } else {
          request._gridNode = this._requestDataGrid.append(gridData, { selectable: true })
          $(request._gridNode.container).data('id', id)
        }
        this._updateRowClass(request._gridNode, request)
      }
      request.render()
      this._requests[id] = request
    })
    this._updateStats()
    this._drawOverview()
    this._updateEmptyState()
  }

  // ---------- rules ----------
  _applyRewrite(url) {
    let result = url
    each(this._rewriteRules, (rule) => {
      if (!rule.enabled || !rule.pattern) return
      const matcher = compilePattern(rule.pattern)
      if (matcher.test(result)) {
        result = matcher.replace(result, String(rule.replacement || ''))
      }
    })
    return result
  }
  _matchMock(url) {
    let found = null
    each(this._mockRules, (rule) => {
      if (found || !rule.enabled || !rule.pattern) return
      if (compilePattern(rule.pattern).test(url)) found = rule
    })
    return found
  }
  _isBlocked(url) {
    if (!this._blockEnabled || this._blockMatchers.length === 0) {
      return false
    }
    return this._blockMatchers.some((matcher) => matcher.test(url))
  }
  _throttleProfile() {
    return THROTTLE_PROFILES[this._throttleKey] || null
  }
  _pushInitiator(entry) {
    this._initiatorQueue.push(entry)
    if (this._initiatorQueue.length > 200) {
      this._initiatorQueue = this._initiatorQueue.slice(-100)
    }
  }
  _takeInitiator(url, method) {
    const queue = this._initiatorQueue
    for (let i = queue.length - 1; i >= 0; i--) {
      const entry = queue[i]
      if (entry.url === url && entry.method === method) {
        queue.splice(i, 1)
        if (Date.now() - entry.ts < 30000) return entry.initiator
        return null
      }
    }
    return null
  }

  // ---------- unified intercept: rewrite -> mock -> block -> throttle ----------
  _installIntercept() {
    if (this._interceptorInstalled) {
      return
    }
    this._interceptorInstalled = true

    const self = this

    // ---- XHR ----
    const proto = window.XMLHttpRequest.prototype
    const origOpen = proto.open
    const origSend = proto.send
    const origSetHeader = proto.setRequestHeader

    proto.open = function (method, url) {
      const urlStr = String(url)
      const rewritten = self._applyRewrite(absoluteUrl(urlStr))
      this.__erudaInfo = {
        method: String(method).toUpperCase(),
        original: absoluteUrl(urlStr),
        url: rewritten,
        headers: {},
        initiator: parseInitiator(),
        mock: self._matchMock(rewritten),
        blocked: self._isBlocked(rewritten),
      }
      return origOpen.call(this, method, rewritten)
    }
    proto.setRequestHeader = function (key, value) {
      if (this.__erudaInfo && key && value) this.__erudaInfo.headers[key] = value
      return origSetHeader.apply(this, arguments)
    }
    proto.send = function (data) {
      const info = this.__erudaInfo
      if (!info) return origSend.apply(this, arguments)

      // Best-effort HTTP cache bypass, like DevTools "Disable cache".
      if (self._disableCache && !info.headers['Cache-Control']) {
        try {
          origSetHeader.call(this, 'Cache-Control', 'no-cache, no-store, max-age=0')
          origSetHeader.call(this, 'Pragma', 'no-cache')
        } catch {
          // Some headers may be forbidden; ignore.
        }
      }

      const body = typeof data === 'string' ? data : ''

      if (info.blocked) {
        self._recordSynthetic('xhr', info, body, {
          status: 403,
          displayStatus: 'blocked',
          resTxt: '',
          blocked: true,
        })
        self._simulateXhr(this, {
          status: 403,
          statusText: t('Blocked by eruda'),
          body: '',
          contentType: '',
        })
        return
      }
      if (info.mock) {
        const rule = info.mock
        const mockBody = String(rule.body == null ? '' : rule.body)
        const status = Number(rule.status) || 200
        const contentType = rule.contentType || 'application/json'
        self._recordSynthetic('xhr', info, body, {
          status,
          displayStatus: status + ' *',
          resTxt: mockBody,
          resHeaders: { 'content-type': contentType },
          mock: true,
        })
        const xhr = this
        setTimeout(() => {
          self._simulateXhr(xhr, { status, statusText: 'OK', body: mockBody, contentType })
        }, 0)
        return
      }

      const profile = self._throttleProfile()
      if (profile && profile.offline) {
        self._recordSynthetic('xhr', info, body, {
          status: 0,
          displayStatus: '0',
          resTxt: '',
          netError: true,
        })
        self._simulateXhr(this, { networkError: true })
        return
      }

      self._pushInitiator({
        url: info.url,
        method: info.method,
        ts: Date.now(),
        initiator: info.initiator,
      })

      if (profile && profile.latency) {
        const args = arguments
        const xhr = this
        setTimeout(() => {
          origSend.apply(xhr, args)
        }, profile.latency)
        return
      }
      return origSend.apply(this, arguments)
    }

    // ---- fetch ----
    const origFetch = window.fetch
    if (origFetch) {
      window.fetch = function (input, init) {
        const outerArgs = arguments
        const rawUrl = typeof input === 'string' ? input : input && input.url ? input.url : ''
        const method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase()
        const headers = (init && init.headers) || (input && input.headers) || {}
        const body = init && typeof init.body === 'string' ? init.body : ''
        const urlStr = String(rawUrl)
        const rewritten = self._applyRewrite(absoluteUrl(urlStr))
        const mockRule = self._matchMock(rewritten)
        const blocked = self._isBlocked(rewritten)
        const profile = self._throttleProfile()

        const recordFetch = (displayStatus, opts) => {
          self._recordSynthetic(
            'fetch',
            {
              method,
              original: absoluteUrl(urlStr),
              url: rewritten,
              headers,
              initiator: parseInitiator(),
            },
            body,
            opts
          )
        }

        if (blocked) {
          recordFetch('blocked', {
            status: 403,
            displayStatus: 'blocked',
            resTxt: '',
            blocked: true,
          })
          return Promise.resolve(
          new Response('', { status: 403, statusText: t('Blocked by eruda') })
        )
        }
        if (mockRule) {
          const mockBody = String(mockRule.body == null ? '' : mockRule.body)
          const status = Number(mockRule.status) || 200
          const resHeaders = { 'content-type': mockRule.contentType || 'application/json' }
          recordFetch(status + ' *', {
            status,
            displayStatus: status + ' *',
            resTxt: mockBody,
            resHeaders,
            mock: true,
          })
          return new Promise((resolve) => {
            setTimeout(() => {
              try {
                resolve(new Response(mockBody, { status, headers: resHeaders }))
              } catch {
                resolve(new Response(mockBody, { status }))
              }
            }, 0)
          })
        }
        if (profile && profile.offline) {
          recordFetch('0', { status: 0, displayStatus: '0', resTxt: '', netError: true })
          return Promise.reject(new TypeError('Failed to fetch'))
        }

        self._pushInitiator({
          url: rewritten,
          method,
          ts: Date.now(),
          initiator: parseInitiator(),
        })

        const run = () => {
          let fetchArgs = outerArgs
          if (rewritten !== urlStr) {
            if (typeof input === 'string') {
              fetchArgs = [rewritten, init]
            } else {
              try {
                fetchArgs = [new Request(rewritten, input), init]
              } catch {
                fetchArgs = outerArgs
              }
            }
          }
          // DevTools "Disable HTTP cache" parity: force no-store.
          if (self._disableCache) {
            const url0 = fetchArgs[0]
            const init0 = fetchArgs[1]
            if (typeof url0 === 'string') {
              fetchArgs = [url0, { ...(init0 || {}), cache: 'no-store' }]
            } else if (init0 || (url0 && url0.cache !== 'no-store')) {
              try {
                fetchArgs = [
                  new Request(url0, { ...(init0 || {}), cache: 'no-store' }),
                  init0,
                ]
              } catch {
                // Non-GET with cache option may throw; keep original.
              }
            }
          }
          return origFetch.apply(this, fetchArgs).then(
            (res) => {
              let extra = 0
              if (profile && profile.bps) {
                const len = +(res.headers.get('content-length') || 0)
                extra = len > 0 ? Math.min(8000, (len / profile.bps) * 1000) : profile.latency
              }
              if (extra > 0) {
                return new Promise((resolve) => setTimeout(() => resolve(res), extra))
              }
              return res
            },
            (err) => {
              throw err
            }
          )
        }

        if (profile && profile.latency) {
          return new Promise((resolve) => setTimeout(resolve, profile.latency)).then(run)
        }
        return run()
      }
    }
  }
  _simulateXhr(xhr, opts) {
    const define = (name, value) => {
      try {
        Object.defineProperty(xhr, name, {
          value,
          configurable: true,
        })
      } catch {
        // Ignore.
      }
    }
    if (opts.networkError) {
      define('readyState', 4)
      define('status', 0)
      define('statusText', '')
      define('response', '')
      if (xhr.responseType === '' || xhr.responseType === 'text') {
        define('responseText', '')
      }
      setTimeout(() => {
        try {
          xhr.dispatchEvent(new Event('readystatechange'))
          const ProgressEventCtor = window.ProgressEvent || Event
          xhr.dispatchEvent(new ProgressEventCtor('error'))
          xhr.dispatchEvent(new ProgressEventCtor('loadend'))
        } catch {
          // Ignore.
        }
      }, 0)
      return
    }
    define('readyState', 4)
    define('status', opts.status)
    define('statusText', opts.statusText || 'OK')
    define('response', opts.body)
    if (xhr.responseType === '' || xhr.responseType === 'text') {
      define('responseText', opts.body)
    }
    define('getAllResponseHeaders', () =>
      opts.contentType ? 'content-type: ' + opts.contentType + '\r\n' : ''
    )
    define('getResponseHeader', (name) => {
      if (name && String(name).toLowerCase() === 'content-type') return opts.contentType || null
      return null
    })

    setTimeout(() => {
      try {
        xhr.dispatchEvent(new Event('readystatechange'))
        const ProgressEventCtor = window.ProgressEvent || Event
        xhr.dispatchEvent(new ProgressEventCtor('load'))
        xhr.dispatchEvent(new ProgressEventCtor('loadend'))
      } catch {
        // Ignore.
      }
    }, 0)
  }
  _recordSynthetic(kind, info, body, opts) {
    if (!this._isRecording) {
      return
    }

    const id = 'synthetic-' + this._blockedId++
    const startTime = Date.now()
    const resHeaders = opts.resHeaders || {}
    const contentType = resHeaders['content-type'] || ''
    const tt = getType(contentType)
    const request = {
      name: getFileName(info.url),
      url: info.url,
      originalUrl: info.original && info.original !== info.url ? info.original : null,
      status: opts.status,
      displayStatus: opts.displayStatus,
      type: opts.mock || opts.blocked ? tt.type : kind,
      subType: opts.mock || opts.blocked ? tt.subType : kind,
      chipType: 'xhr',
      size: (opts.resTxt || '').length,
      data: typeof body === 'string' ? body : '',
      method: info.method,
      startTime,
      time: 0,
      displayTime: '0 ms',
      resTxt: opts.resTxt || '',
      done: true,
      blocked: opts.blocked,
      mock: opts.mock,
      netError: opts.netError,
      initiator: info.initiator || null,
      reqHeaders: info.headers || {},
      resHeaders,
    }
    request.render = () => {
      const data = this._gridRowData(id, request)
      if (request._gridNode) {
        request._gridNode.data = data
        request._gridNode.render()
      } else {
        request._gridNode = this._requestDataGrid.append(data, { selectable: true })
        $(request._gridNode.container).data('id', id)
      }
      this._updateRowClass(request._gridNode, request)
    }
    request.render()
    this._requests[id] = request
    this._updateStats()
    this._drawOverview()
    this._updateEmptyState()
  }

  // ---------- chobitsu events ----------
  _reqWillBeSent = (params) => {
    if (!this._isRecording) {
      return
    }

    const initiator = this._takeInitiator(params.request.url, params.request.method)
    const request = {
      name: getFileName(params.request.url),
      url: params.request.url,
      status: 'pending',
      type: 'unknown',
      subType: 'unknown',
      chipType: initiator ? 'xhr' : null,
      size: 0,
      data: params.request.postData,
      method: params.request.method,
      startTime: params.timestamp * 1000,
      time: 0,
      resTxt: '',
      done: false,
      initiator,
      reqHeaders: params.request.headers || {},
      resHeaders: {},
    }
    request.render = () => {
      const data = this._gridRowData(params.requestId, request)
      if (request._gridNode) {
        request._gridNode.data = data
        request._gridNode.render()
      } else {
        request._gridNode = this._requestDataGrid.append(data, { selectable: true })
        $(request._gridNode.container).data('id', params.requestId)
      }
      this._updateRowClass(request._gridNode, request)
    }
    request.render()
    this._requests[params.requestId] = request
    this._updateStats()
    this._drawOverview()
    this._updateEmptyState()
  }
  _updateRowClass(node, request) {
    const $node = $(node.container)
    $node.rmClass(c('request-error'))
    $node.rmClass(c('request-warn'))
    $node.rmClass(c('request-blocked'))
    $node.rmClass(c('request-mock'))
    $node.rmClass(c('request-restored'))
    if (request.fromSession) {
      $node.addClass(c('request-restored'))
    }
    if (request.blocked) {
      $node.addClass(c('request-blocked'))
    } else if (request.mock) {
      $node.addClass(c('request-mock'))
    } else if (request.status === 0) {
      $node.addClass(c('request-error'))
    } else if (typeof request.status === 'number' && request.status >= 400) {
      $node.addClass(c('request-error'))
    } else if (
      typeof request.status === 'number' &&
      request.status >= 300 &&
      request.status < 400
    ) {
      $node.addClass(c('request-warn'))
    } else if (request.hasErr) {
      $node.addClass(c('request-error'))
    }
  }
  _resReceivedExtraInfo = (params) => {
    const request = this._requests[params.requestId]
    if (!this._isRecording || !request) {
      return
    }

    request.resHeaders = params.headers

    this._updateType(request)
    request.render()
  }
  _updateType(request) {
    const contentType = request.resHeaders['content-type'] || ''
    const { type, subType } = getType(contentType)
    request.type = type
    request.subType = subType
    request.chipType = classifyChip(request)
  }
  _resReceived = (params) => {
    const request = this._requests[params.requestId]
    if (!this._isRecording || !request) {
      return
    }

    const { response } = params
    const { status, headers } = response
    request.status = status
    if (status < 200 || status >= 300) {
      request.hasErr = true
    }
    if (headers) {
      request.resHeaders = headers
      this._updateType(request)
    }

    request.render()
  }
  _loadingFinished = (params) => {
    const request = this._requests[params.requestId]
    if (!this._isRecording || !request) {
      return
    }

    const time = params.timestamp * 1000
    request.time = time - request.startTime
    request.displayTime = ms(request.time)

    request.size = params.encodedDataLength
    request.done = true
    request.resTxt = chobitsu.domain('Network').getResponseBody({
      requestId: params.requestId,
    }).body

    request.render()
    this._updateStats()
    this._drawOverview()
  }
  _loadingFailed = (params) => {
    const request = this._requests[params.requestId]
    if (!this._isRecording || !request) {
      return
    }

    const time = params.timestamp * 1000
    request.time = time - request.startTime
    request.displayTime = ms(request.time)

    request.hasErr = true
    request.status = 0
    request.done = true

    request.render()
    this._updateStats()
    this._drawOverview()
  }
  _copyCurl = () => {
    const request = this._selectedRequest

    copy(
      curlStr({
        requestMethod: request.method,
        url() {
          return request.url
        },
        requestFormData() {
          return request.data
        },
        requestHeaders() {
          const reqHeaders = request.reqHeaders || {}
          if (typeof reqHeaders.forEach === 'function') {
            const ret = []
            reqHeaders.forEach((value, name) => ret.push({ name, value }))
            ret.push({ name: 'User-Agent', value: navigator.userAgent })
            ret.push({ name: 'Referer', value: location.href })
            return ret
          }
          extend(reqHeaders, {
            'User-Agent': navigator.userAgent,
            Referer: location.href,
          })

          return map(reqHeaders, (value, name) => {
            return {
              name,
              value,
            }
          })
        },
      })
    )

    this._container.notify(t('copied'), { icon: 'success' })
  }
  _copyFetch = () => {
    const request = this._selectedRequest

    copy(fetchStr(request))

    this._container.notify(t('copied'), { icon: 'success' })
  }
  _updateButtons() {
    const $control = this._$control
    const $showDetail = $control.find(c('.show-detail'))
    const $copyCurl = $control.find(c('.copy-curl'))
    const $copyFetch = $control.find(c('.copy-fetch'))
    const iconDisabled = c('icon-disabled')

    $showDetail.addClass(iconDisabled)
    $copyCurl.addClass(iconDisabled)
    $copyFetch.addClass(iconDisabled)

    if (this._selectedRequest) {
      $showDetail.rmClass(iconDisabled)
      $copyCurl.rmClass(iconDisabled)
      $copyFetch.rmClass(iconDisabled)
    }
  }
  _toggleRecording = () => {
    this._$control.find(c('.record')).toggleClass(c('recording'))
    this._isRecording = !this._isRecording
  }
  _showDetail = () => {
    if (this._selectedRequest) {
      if (this._splitMode) {
        this._$network.css('width', '50%')
      }
      this._detail.show(this._selectedRequest)
    }
  }
  _updateStats = () => {
    if (!this._$statTotal) {
      return
    }

    let count = 0
    let size = 0
    let failed = 0
    let first = Infinity
    let last = 0
    each(this._requests, (request) => {
      count++
      size += request.size || 0
      if (isFailed(request)) {
        failed++
      }
      if (request.startTime && request.startTime < first) {
        first = request.startTime
      }
      if (request.done && request.time > 0) {
        const end = request.startTime + request.time
        if (end > last) last = end
      }
    })
    const finish = count > 0 && last > first ? last - first : 0

    this._$statTotal.text(`${count} ${t('requests')}`)
    this._$statSize.text(`${formatBytes(size)} ${t('transferred')}`)
    this._$statTime.text(`${t('finish')}: ${formatMs(finish)}`)
    this._$statFailed.text(`${failed} ${t('failed')}`)
    this._$statFailed.toggleClass(c('stat-zero'), failed === 0)
  }

  // ---------- filters ----------
  _matchFilters(request) {
    if (this._failedFilterOn && !isFailed(request)) return false
    if (this._chip !== 'all' && classifyChip(request) !== this._chip) return false
    if (this._filterFn && !this._filterFn(request)) return false
    return true
  }
  _applyGridFilter() {
    const grid = this._requestDataGrid
    const self = this
    const noFilter =
      !this._failedFilterOn && this._chip === 'all' && !this._filterFn
    // Rebuild rows first, then set the filter: luna-data-grid applies the
    // filter option by re-rendering existing nodes, but rows removed by a
    // previous filter are not restored when the filter is cleared.
    grid.clear()
    each(this._requests, (request) => {
      request._gridNode = null
      request.render()
    })
    if (noFilter) {
      grid.setOption('filter', '')
    } else {
      grid.setOption('filter', (node) => {
        const request = node.data && self._requests[node.data.id]
        if (!request) return true
        return self._matchFilters(request)
      })
    }
  }
  _renderChips() {
    if (!this._$chips) return
    const self = this
    let html = ''
    each(CHIPS, (chip) => {
      html += `<span class="${c('chip')}${self._chip === chip ? ' ' + c('chip-on') : ''}" data-chip="${chip}">${t(chip)}</span>`
    })
    this._$chips.html(html)
  }
  _toggleFailedFilter = () => {
    if (this._failedFilterOn) {
      this._failedFilterOn = false
      this._$filterText.text('')
      this._$statFailed.rmClass(c('active'))
    } else {
      this._failedFilterOn = true
      this._$filterText.text(t('(failed)'))
      this._$statFailed.addClass(c('active'))
    }
    this._applyGridFilter()
  }
  _onSearchInput = () => {
    this._filterText = this._$search.val() || ''
    this._filterFn = compileFilter(this._filterText)
    this._applyGridFilter()
  }
  _exportHar = () => {
    const har = buildHar(this._requests)
    const blob = new Blob([JSON.stringify(har, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'eruda-' + Date.now() + '.har'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)

    this._container.notify(t('harExported'), { icon: 'success' })
  }
  _importHar = (file) => {
    if (!file) return
    const self = this
    const reader = new FileReader()
    reader.onload = function () {
      try {
        const records = harToRecords(JSON.parse(String(reader.result)))
        if (!records) throw new Error('bad har')
        each(records, (record) => {
          const id = record.id
          record.render = () => {
            const data = self._gridRowData(id, record)
            if (record._gridNode) {
              record._gridNode.data = data
              record._gridNode.render()
            } else {
              record._gridNode = self._requestDataGrid.append(data, { selectable: true })
              $(record._gridNode.container).data('id', id)
            }
            self._updateRowClass(record._gridNode, record)
          }
          record.render()
          self._requests[id] = record
        })
        self._updateStats()
        self._drawOverview()
        self._container.notify(`${t('harImported')} (${records.length})`, { icon: 'success' })
      } catch {
        self._container.notify(t('harImportFailed'), { icon: 'error' })
      }
    }
    reader.readAsText(file)
  }

  // ---------- overview ----------
  _drawOverview = () => {
    const canvas = this._$overview
    if (!canvas || this._overviewHidden) return
    const el = canvas.get(0)
    const w = el.clientWidth
    const h = el.clientHeight
    if (!w || !h) return
    const dpr = window.devicePixelRatio || 1
    if (el.width !== Math.round(w * dpr)) {
      el.width = Math.round(w * dpr)
      el.height = Math.round(h * dpr)
    }
    const ctx = el.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const rows = []
    each(this._requests, (request) => rows.push(request))
    let t0 = Infinity
    let t1 = -Infinity
    each(rows, (r) => {
      if (r.startTime < t0) t0 = r.startTime
      const end = r.startTime + (r.time || 0)
      if (end > t1) t1 = end
    })
    if (!isFinite(t0)) {
      this._wfRange = null
      return
    }
    const span = Math.max(t1 - t0, 1)
    this._wfRange = { t0, span }
    this._updateWaterfallBars()

    // Chrome DevTools NetworkOverview: each request renders as a thin band
    // painted with its actual timing segments (queueing / dns / connect /
    // ssl / wait / download), failing requests in red.
    const BAND_HEIGHT = 3
    const PADDING = 5
    const numBands = Math.max((((h - PADDING - 1) / BAND_HEIGHT) - 1) | 0, 1)
    const bandH = h / numBands
    const SEG_COLORS = {
      queueing: '#c9cdd4',
      dns: '#12b5cb',
      connect: '#f9ab00',
      ssl: '#a142f4',
      sent: '#7baaf7',
      wait: '#1e8e3e',
      download: '#1a73e8',
    }
    ctx.globalAlpha = 0.95
    each(rows, (r, i) => {
      const y = (i % numBands) * bandH + 1
      const bh = Math.max(bandH - 2, 2)
      const failed = r.blocked || r.status === 0 || (typeof r.status === 'number' && r.status >= 400)
      if (failed) {
        const x = ((r.startTime - t0) / span) * w
        ctx.fillStyle = '#d93025'
        ctx.fillRect(x, y, Math.max(((r.time || 20) / span) * w, 2), bh)
        return
      }
      const timing = getTimingSegments(r)
      const total = timing.total || r.time || 0
      if (!(total > 0)) {
        // Pending request: gray dot at its start position.
        const x = ((r.startTime - t0) / span) * w
        ctx.fillStyle = 'rgba(154,160,166,0.7)'
        ctx.fillRect(x, y, 2, bh)
        return
      }
      each(timing.segments, (seg) => {
        if (!(seg.to > seg.from)) return
        // Map segments onto the request's wall-clock span.
        const baseX = (r.startTime - t0) / span * w
        const spanW = ((r.time || total) / span) * w
        const sx = baseX + (seg.from / total) * spanW
        const sw = Math.max(((seg.to - seg.from) / total) * spanW, 1)
        ctx.fillStyle = SEG_COLORS[seg.cls] || '#9aa0a6'
        ctx.fillRect(sx, y, sw, bh)
      })
    })
    ctx.globalAlpha = 1
  }

  // ---------- rules panel ----------
  _toggleRulesPanel = () => {
    const $panel = this._$rulesPanel
    if ($panel.hasClass(c('show'))) {
      $panel.rmClass(c('show'))
    } else {
      this._renderRulesPanel()
      $panel.addClass(c('show'))
    }
  }
  _renderRulesPanel() {
    const tab = this._panelTab
    const tabs = ['blocked', 'rewrite', 'mock']
    let tabsHtml = ''
    each(tabs, (id) => {
      tabsHtml += `<span class="${c('pn-tab')}${id === tab ? ' ' + c('active') : ''}" data-ptab="${id}">${t(id)}</span>`
    })

    let body = ''
    if (tab === 'blocked') {
      body = `<label class="${c('pn-enable-row')}"><input type="checkbox" class="${c('bp-enable')}"> ${t('enableBlocking')}</label>
        <textarea class="${c('bp-patterns')}" spellcheck="false"></textarea>
        <div class="${c('pn-hint')}">${t('blockHint')}</div>
        <div class="${c('pn-actions')}"><button class="${c('bp-save')}">${t('save')}</button></div>`
    } else if (tab === 'rewrite') {
      let rules = ''
      each(this._rewriteRules, (rule, i) => {
        rules += `<div class="${c('rule')}" data-rid="${i}">
          <label class="${c('rule-en')}"><input type="checkbox" class="${c('rr-en')}"${rule.enabled ? ' checked' : ''}> ${t('enable')}</label>
          <input class="${c('rr-pattern')}" placeholder="/api-old" value="${rule.pattern || ''}" spellcheck="false">
          <span class="${c('rule-arrow')}">→</span>
          <input class="${c('rr-replacement')}" placeholder="/api-new" value="${rule.replacement || ''}" spellcheck="false">
          <span class="${c('rule-del')}">×</span>
        </div>`
      })
      body = `<div class="${c('rules')}">${rules}</div>
        <button class="${c('add')} ${c('add-rewrite')}">+ ${t('addRule')}</button>
        <div class="${c('pn-hint')}">${t('rewriteHint')}</div>`
    } else {
      let rules = ''
      each(this._mockRules, (rule, i) => {
        rules += `<div class="${c('rule')} ${c('mock-rule')}" data-rid="${i}">
          <div class="${c('rule-line')}">
            <label class="${c('rule-en')}"><input type="checkbox" class="${c('mr-en')}"${rule.enabled ? ' checked' : ''}> ${t('enable')}</label>
            <input class="${c('mr-pattern')}" placeholder="/api/user/123" value="${rule.pattern || ''}" spellcheck="false">
            <input class="${c('mr-status')}" placeholder="200" value="${rule.status || ''}">
            <input class="${c('mr-type')}" placeholder="application/json" value="${rule.contentType || ''}" spellcheck="false">
            <span class="${c('rule-del')}">×</span>
          </div>
          <textarea class="${c('mr-body')}" placeholder='{"ok": true}' spellcheck="false">${rule.body || ''}</textarea>
        </div>`
      })
      body = `<div class="${c('rules')}">${rules}</div>
        <button class="${c('add')} ${c('add-mock')}">+ ${t('addRule')}</button>
        <div class="${c('pn-hint')}">${t('mockHint2')}</div>`
    }

    this._$rulesPanel.html(
      `<div class="${c('pn-header')}">${t('rules')}<span class="${c('pn-close')}">×</span></div>
      <div class="${c('pn-tabs')}">${tabsHtml}</div>
      <div class="${c('pn-body')}">${body}</div>`
    )

    if (tab === 'blocked') {
      this._$rulesPanel.find(c('.bp-enable')).get(0).checked = this._blockEnabled
      this._$rulesPanel.find(c('.bp-patterns')).val(this._blockPatternsText)
    }
  }
  _syncRuleFields(rowEl, rid) {
    const get = (sel) => {
      const el = rowEl.querySelector(c(sel))
      return el ? el.value : undefined
    }
    const checked = (sel) => {
      const el = rowEl.querySelector(c(sel))
      return el ? el.checked : undefined
    }
    if (this._panelTab === 'rewrite' && this._rewriteRules[rid]) {
      const rule = this._rewriteRules[rid]
      const en = checked('.rr-en')
      if (typeof en === 'boolean') rule.enabled = en
      const pattern = get('.rr-pattern')
      if (pattern != null) rule.pattern = pattern
      const replacement = get('.rr-replacement')
      if (replacement != null) rule.replacement = replacement
    } else if (this._panelTab === 'mock' && this._mockRules[rid]) {
      const rule = this._mockRules[rid]
      const en = checked('.mr-en')
      if (typeof en === 'boolean') rule.enabled = en
      const pattern = get('.mr-pattern')
      if (pattern != null) rule.pattern = pattern
      const status = get('.mr-status')
      if (status != null) rule.status = status
      const contentType = get('.mr-type')
      if (contentType != null) rule.contentType = contentType
      const body = get('.mr-body')
      if (body != null) rule.body = body
    }
  }

  // ---------- language ----------
  _toggleLang = () => {
    // Global setLang emits the I18N event, which triggers _onI18n.
    setLang(getLang() === 'zh' ? 'en' : 'zh')
  }
  _applyI18n() {
    if (!this._$control) return
    this._$control.find(c('.record')).attr('title', this._isRecording ? t('record') : t('stop'))
    this._$control.find(c('.clear-request')).attr('title', t('clear'))
    this._$control.find(c('.har-export')).attr('title', t('exportHar'))
    this._$control.find(c('.har-import')).attr('title', t('importHar'))
    this._$control.find(c('.rules')).attr('title', t('rules'))
    this._$control.find(c('.copy-fetch')).attr('title', t('copyFetch'))
    this._$control.find(c('.show-detail')).attr('title', t('headers'))
    this._$control.find(c('.copy-curl')).attr('title', t('copyCurl'))
    this._$langBtn.text(t('lang'))
    this._$search.attr('placeholder', t('searchPh'))
    // Throttle select option labels.
    const $sel = this._$control.find(c('.throttle'))
    const throttleLabels = {
      none: t('throttleOff'),
      slow3g: t('Slow 3G'),
      fast3g: t('Fast 3G'),
      offline: t('offline'),
    }
    $sel.find('option').each(function () {
      const $opt = $(this)
      const label = throttleLabels[$opt.val()]
      if (label) $opt.text(label)
    })
    this._renderChips()
    this._updateStats()
    if (this._$rulesPanel.hasClass(c('show'))) {
      this._renderRulesPanel()
    }
  }
  _bindEvent() {
    const $control = this._$control
    const requestDataGrid = this._requestDataGrid
    const self = this

    $control
      .on('click', c('.clear-request'), () => this.clear())
      .on('click', c('.show-detail'), this._showDetail)
      .on('click', c('.copy-curl'), this._copyCurl)
      .on('click', c('.copy-fetch'), this._copyFetch)
      .on('click', c('.record'), this._toggleRecording)
      .on('click', c('.har-export'), this._exportHar)
      .on('click', c('.har-import'), () => this._$file.click())
      .on('click', c('.rules'), this._toggleRulesPanel)
      .on('click', c('.lang-btn'), this._toggleLang)
      .on('change', c('.throttle'), function () {
        self._throttleKey = $(this).val() || 'none'
        self._saveSettings()
      })

    this._$file.on('change', function () {
      const files = this.files || this.get(0).files
      self._importHar(files && files[0])
      this.value = ''
    })

    this._$chips.on('click', c('.chip'), function () {
      const chip = $(this).data('chip')
      if (!chip) return
      self._chip = chip
      self._renderChips()
      self._applyGridFilter()
    })

    this._$empty.on('click', c('.np-empty-btn'), this._reloadPage)

    this._$search.on('input', this._onSearchInput)

    const $preserve = this._$network.find(c('.preserve-log'))
    $preserve.get(0).checked = this._preserveLog
    $preserve.on('change', () => {
      this._preserveLog = $preserve.get(0).checked
      if (this._preserveLog) {
        window.addEventListener('pagehide', this._saveNetworkPreserved)
      } else {
        window.removeEventListener('pagehide', this._saveNetworkPreserved)
      }
      this._saveSettings()
    })

    this._$statTotal.on('click', () => {
      if (this._failedFilterOn) this._toggleFailedFilter()
      else {
        this._failedFilterOn = false
        this._$filterText.text('')
        this._applyGridFilter()
      }
    })
    this._$statFailed.on('click', this._toggleFailedFilter)

    this._$rulesPanel
      .on('click', c('.pn-close'), this._toggleRulesPanel)
      .on('click', c('.pn-tab'), function () {
        const ptab = $(this).data('ptab')
        if (!ptab) return
        self._panelTab = ptab
        self._renderRulesPanel()
      })
      .on('click', c('.bp-save'), () => {
        this._blockEnabled = this._$rulesPanel.find(c('.bp-enable')).get(0).checked
        this._blockPatternsText = this._$rulesPanel.find(c('.bp-patterns')).val()
        this._blockMatchers = compileBlockPatterns(this._blockPatternsText)
        this._saveSettings()
        this._$rulesPanel.rmClass(c('show'))
        this._container.notify(
          this._blockEnabled ? t('rulesApplied') : t('blockedSaved'),
          { icon: 'success' }
        )
      })
      .on('click', c('.add-rewrite'), () => {
        this._rewriteRules.push({ enabled: true, pattern: '', replacement: '' })
        this._saveSettings()
        this._renderRulesPanel()
      })
      .on('click', c('.add-mock'), () => {
        this._mockRules.push({
          enabled: true,
          pattern: '',
          status: '200',
          contentType: 'application/json',
          body: '',
        })
        this._saveSettings()
        this._renderRulesPanel()
      })
      .on('click', c('.rule-del'), function () {
        const row = this.closest ? this.closest(c('.rule')) : null
        if (!row) return
        const rid = +row.getAttribute('data-rid')
        self._syncRuleFields(row, rid)
        if (self._panelTab === 'rewrite') self._rewriteRules.splice(rid, 1)
        else self._mockRules.splice(rid, 1)
        self._saveSettings()
        self._renderRulesPanel()
      })

    this._$rulesPanel
      .get(0)
      .addEventListener(
        'input',
        (e) => {
          const row = e.target.closest ? e.target.closest(c('.rule')) : null
          if (!row) return
          self._syncRuleFields(row, +row.getAttribute('data-rid'))
          self._saveSettings()
        },
        true
      )

    requestDataGrid.on('select', (node) => {
      const id = $(node.container).data('id')
      const request = self._requests[id]
      this._selectedRequest = request
      this._updateButtons()
      if (this._splitMode) {
        this._showDetail()
      }
    })

    requestDataGrid.on('deselect', () => {
      this._selectedRequest = null
      this._updateButtons()
      this._detail.hide()
    })

    this._resizeSensor.addListener(
      throttle(() => {
        this._updateDataGridHeight()
        this._drawOverview()
      }, 15)
    )

    this._splitMediaQuery.on('match', () => {
      this._detail.hide()
      this._splitMode = true
    })
    this._splitMediaQuery.on('unmatch', () => {
      this._detail.hide()
      this._splitMode = false
    })
    const onCompactChange = () => {
      const compact = this._compactMediaQuery.isMatch()
      if (compact === this._compactMode) return
      this._compactMode = compact
      this._requestDataGrid.setOption('columns', this._gridColumns())
      // Re-render all rows so removed/added columns get their data back.
      this._applyGridFilter()
    }
    this._compactMediaQuery.on('match', onCompactChange)
    this._compactMediaQuery.on('unmatch', onCompactChange)
    this._detail.on('hide', () => {
      if (this._splitMode) {
        this._$network.css('width', '100%')
      }
    })

    chobitsu.domain('Network').enable()

    const network = chobitsu.domain('Network')
    network.on('requestWillBeSent', this._reqWillBeSent)
    network.on('responseReceivedExtraInfo', this._resReceivedExtraInfo)
    network.on('responseReceived', this._resReceived)
    network.on('loadingFinished', this._loadingFinished)
    network.on('loadingFailed', this._loadingFailed)

    emitter.on(emitter.SCALE, this._updateScale)
  }
  _updateScale = (scale) => {
    this._splitMediaQuery.setQuery(`screen and (min-width: ${680 * scale}px)`)
  }
  // ---------- settings panel (DevTools parity) ----------
  _initCfg() {
    const settings = this._container.get('settings')
    if (!settings) return

    const cfg = (this.config = Settings.createCfg('network', {
      disableCache: false,
    }))
    this._disableCache = !!cfg.get('disableCache')

    cfg.on('change', (key, val) => {
      if (key === 'disableCache') this._disableCache = val
    })

    settings
      .text('Network')
      .switch(cfg, 'disableCache', 'Disable HTTP cache')
      .separator()
  }
  _rmCfg() {
    const cfg = this.config
    const settings = this._container.get('settings')
    if (!settings || !cfg) return
    settings.remove(cfg, 'disableCache').remove('Network')
  }

  destroy() {
    super.destroy()

    this._rmCfg()
    emitter.off(emitter.I18N, this._onI18n)
    if (this._detail) this._detail.destroy()
    this._resizeSensor.destroy()
    evalCss.remove(this._style)
    this._splitMediaQuery.removeAllListeners()

    const network = chobitsu.domain('Network')
    network.off('requestWillBeSent', this._reqWillBeSent)
    network.off('responseReceivedExtraInfo', this._resReceivedExtraInfo)
    network.off('responseReceived', this._resReceived)
    network.off('loadingFinished', this._loadingFinished)
    network.off('loadingFailed', this._loadingFailed)

    emitter.off(emitter.SCALE, this._updateScale)
  }
  _initTpl() {
    const $el = this._$el
    $el.html(
      c(`<div class="network">
        <div class="control">
          <span class="icon-record record recording" title="${t('record')}"></span>
          <span class="icon-clear clear-request" title="${t('clear')}"></span>
          <span class="icon-har har-export" title="${t('exportHar')}"></span>
          <span class="icon-import har-import" title="${t('importHar')}"></span>
          <span class="icon-rules rules" title="${t('rules')}"></span>
          <span class="icon-eye icon-disabled show-detail"></span>
          <span class="icon-copy icon-disabled copy-curl" title="${t('copyCurl')}"></span>
          <span class="icon-fetch icon-disabled copy-fetch" title="${t('copyFetch')}">{ }</span>
          <span class="spacer"></span>
          <select class="throttle" title="${t('throttle')}">
            <option value="none">${t('throttleOff')}</option>
            <option value="slow3g">${t('Slow 3G')}</option>
            <option value="fast3g">${t('Fast 3G')}</option>
            <option value="offline">${t('offline')}</option>
          </select>
          <button class="lang-btn">${t('lang')}</button>
        </div>
        <div class="filter-bar">
          <div class="chips"></div>
          <label class="preserve-toggle" title="${t('Preserve Log')}">
            <input type="checkbox" class="preserve-log">
            <span>${t('Preserve Log')}</span>
          </label>
          <input class="search" placeholder="${t('searchPh')}" spellcheck="false">
        </div>
        <canvas class="overview" height="44"></canvas>
        <div class="stats-bar">
          <span class="stat stat-total"></span>
          <span class="stat stat-size"></span>
          <span class="stat stat-time"></span>
          <span class="stat stat-failed"></span>
          <span class="filter-text"></span>
        </div>
        <div class="np-empty">
          <div class="np-empty-title"></div>
          <div class="np-empty-hint"></div>
          <button class="np-empty-btn"></button>
        </div>
        <div class="requests"></div>
        <div class="rules-panel"></div>
        <input type="file" class="file-input" accept=".har,application/json">
      </div>
      <div class="detail"></div>`)
    )
    this._$network = $el.find(c('.network'))
    this._$detail = $el.find(c('.detail'))
    this._$requests = $el.find(c('.requests'))
    this._$control = $el.find(c('.control'))
    this._$chips = $el.find(c('.chips'))
    this._$search = $el.find(c('.search'))
    this._$overview = $el.find(c('.overview'))
    this._$file = $el.find(c('.file-input'))
    this._$langBtn = $el.find(c('.lang-btn'))
    this._$filterText = $el.find(c('.filter-text'))
    this._$statTotal = $el.find(c('.stat-total'))
    this._$statSize = $el.find(c('.stat-size'))
    this._$statTime = $el.find(c('.stat-time'))
    this._$statFailed = $el.find(c('.stat-failed'))
    this._$empty = $el.find(c('.np-empty'))
    this._$rulesPanel = $el.find(c('.rules-panel'))
    this._$control.find(c('.throttle')).val(this._throttleKey)
  }
}
