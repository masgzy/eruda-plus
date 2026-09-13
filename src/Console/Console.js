import Tool from '../DevTools/Tool'
import noop from 'licia/noop'
import $ from 'licia/$'
import toStr from 'licia/toStr'
import isFn from 'licia/isFn'
import Emitter from 'licia/Emitter'
import isStr from 'licia/isStr'
import isRegExp from 'licia/isRegExp'
import isErr from 'licia/isErr'
import startWith from 'licia/startWith'
import endWith from 'licia/endWith'
import trim from 'licia/trim'
import upperFirst from 'licia/upperFirst'
import isHidden from 'licia/isHidden'
import isArr from 'licia/isArr'
import extend from 'licia/extend'
import map from 'licia/map'
import evalCss from '../lib/evalCss'
import Settings from '../Settings/Settings'
import emitter from '../lib/emitter'
import { t } from '../lib/i18n'
import LunaConsole from 'luna-console'
import each from 'licia/each'
import escape from 'licia/escape'
import contain from 'licia/contain'
import ajax from 'licia/ajax'
import {
  classPrefix as c,
  safeStringify,
  savePreservedLogs,
  loadPreservedLogs,
} from '../lib/util'
import { absoluteUrl } from '../Network/util'

export default class Console extends Tool {
  constructor({ name = 'console' } = {}) {
    super()

    Emitter.mixin(this)

    this.name = name
    this._selectedLog = null
    this._watchOpen = false
    this._watchExprs = []
    this._watchValues = []
    this._logBuffer = []
    this._uncaughtMap = new WeakMap()
    this._pendingStacks = []
    this._httpHookInstalled = false
  }
  init($el, container) {
    super.init($el)
    this._container = container

    this._appendTpl()

    this._initCfg()

    this._initLogger()
    this._exposeLogger()
    this._bindEvent()

    this._initWatch()
    this._restorePreservedLogs()

    emitter.on(emitter.I18N, this._onI18n)
  }
  show() {
    super.show()
    this._handleShow()
  }
  overrideConsole() {
    const origConsole = (this._origConsole = {})
    const winConsole = window.console

    CONSOLE_METHOD.forEach((name) => {
      let origin = (origConsole[name] = noop)
      if (winConsole[name]) {
        origin = origConsole[name] = winConsole[name].bind(winConsole)
      }

      winConsole[name] = (...args) => {
        if (name === 'error') {
          // Capture the caller stack before luna wraps the args.
          const stackObj = new Error()
          this._pendingStacks.push({
            stack: stackObj.stack || '',
            from: 'override',
            time: Date.now(),
          })
        }
        this[name](...args)
        origin(...args)
      }
    })

    return this
  }
  setGlobal(name, val) {
    this._logger.setGlobal(name, val)
  }
  restoreConsole() {
    if (!this._origConsole) return this

    CONSOLE_METHOD.forEach(
      (name) => (window.console[name] = this._origConsole[name])
    )
    delete this._origConsole

    return this
  }
  catchGlobalErr() {
    window.addEventListener('error', this._handleWindowErr)
    window.addEventListener('unhandledrejection', this._handleRejection)

    return this
  }
  ignoreGlobalErr() {
    window.removeEventListener('error', this._handleWindowErr)
    window.removeEventListener('unhandledrejection', this._handleRejection)

    return this
  }
  // Global errors are prefixed like Chrome DevTools:
  // "Uncaught ..." / "Uncaught (in promise) ..."
  _handleWindowErr = (event) => {
    let err = event && event.error
    if (!isErr(err)) {
      const msg = event && event.message
      if (!msg) return
      err = new Error(msg)
      err.stack =
        `Error: ${msg}\n    at ${event.filename}:${event.lineno}:${event.colno}`
    }
    this._insertUncaught(err, 'Uncaught')
  }
  _handleRejection = (event) => {
    const reason = event && event.reason
    if (isErr(reason))
      return this._insertUncaught(reason, 'Uncaught (in promise)')
    const err = new Error(
      isStr(reason) ? reason : safeStringify(reason, 200)
    )
    err.name = ''
    err.stack = ''
    this._insertUncaught(err, 'Uncaught (in promise)', true)
  }
  _insertUncaught(err, prefix, synthetic) {
    if (!this.config || !this.config.get('catchGlobalErr')) return
    this._uncaughtMap.set(err, { prefix, synthetic })
    this.error(err)
  }
  filter(filter) {
    const $filterText = this._$filterText
    const logger = this._logger

    if (isStr(filter)) {
      $filterText.text(filter)
      logger.setOption('filter', trim(filter))
    } else if (isRegExp(filter)) {
      $filterText.text(toStr(filter))
      logger.setOption('filter', filter)
    } else if (isFn(filter)) {
      $filterText.text('ƒ')
      logger.setOption('filter', filter)
    }
  }
  destroy() {
    emitter.off(emitter.I18N, this._onI18n)
    this._logger.destroy()
    super.destroy()

    this._container.off('show', this._handleShow)
    if (this._watchTimer) clearInterval(this._watchTimer)
    window.removeEventListener('pagehide', this._savePreservedLogs)
    this._setHttpLogging(false)
    this.ignoreGlobalErr()

    if (this._style) {
      evalCss.remove(this._style)
    }
    this.ignoreGlobalErr()
    this.restoreConsole()
    this._rmCfg()
  }
  _handleShow = () => {
    if (isHidden(this._$el.get(0))) return
    this._logger.renderViewport()
  }
  _handleErr = (err) => {
    this.error(err)
  }
  _enableJsExecution(enabled) {
    const $el = this._$el
    const $jsInput = $el.find(c('.js-input'))

    if (enabled) {
      $jsInput.show()
      $el.rmClass(c('js-input-hidden'))
    } else {
      $jsInput.hide()
      $el.addClass(c('js-input-hidden'))
    }
  }
  _appendTpl() {
    const $el = this._$el

    this._style = evalCss(require('./Console.scss'))
    $el.append(
      c(`
      <div class="control">
        <span class="icon-clear clear-console"></span>
        <span class="level active" data-level="all">${t('All')}</span>
        <span class="level" data-level="info">${t('Info')}</span>
        <span class="level" data-level="warning">${t('Warning')}</span>
        <span class="level" data-level="error">${t('Error')}</span>
        <span class="filter-text"></span>
        <span class="icon-filter filter"></span>
        <span class="icon-copy icon-disabled copy"></span>
        <span class="icon-eye watch"></span>
      </div>
      <div class="filter-row">
        <span class="icon-filter"></span>
        <input class="filter-input" placeholder="${t('filterPh')}" spellcheck="false">
      </div>
      <div class="watch-panel">
        <div class="watch-rows"></div>
        <div class="watch-add-row">
          <span class="watch-plus">+</span>
          <input class="watch-input" placeholder="${t('watchPh')}" spellcheck="false">
        </div>
      </div>
      <div class="logs-container"></div>
      <div class="js-input">
        <div class="buttons">
          <div class="button cancel">${t('Cancel')}</div>
          <div class="button execute">${t('Execute')}</div>
        </div>
        <span class="icon-right"></span>
        <textarea></textarea>
      </div>
    `)
    )

    const _$inputContainer = $el.find(c('.js-input'))
    const _$input = _$inputContainer.find('textarea')
    const _$inputBtns = _$inputContainer.find(c('.buttons'))

    extend(this, {
      _$control: $el.find(c('.control')),
      _$logs: $el.find(c('.logs-container')),
      _$inputContainer,
      _$input,
      _$inputBtns,
      _$filterText: $el.find(c('.filter-text')),
      _$filterRow: $el.find(c('.filter-row')),
      _$filterInput: $el.find(c('.filter-input')),
      _$watchPanel: $el.find(c('.watch-panel')),
      _$watchRows: $el.find(c('.watch-rows')),
      _$watchInput: $el.find(c('.watch-input')),
    })
  }
  _initLogger() {
    const cfg = this.config
    let maxLogNum = cfg.get('maxLogNum')
    maxLogNum = maxLogNum === 'infinite' ? 0 : +maxLogNum

    const $level = this._$control.find(c('.level'))
    const logger = new LunaConsole(this._$logs.get(0), {
      asyncRender: cfg.get('asyncRender'),
      maxNum: maxLogNum,
      showHeader: cfg.get('displayExtraInfo'),
      unenumerable: cfg.get('displayUnenumerable'),
      accessGetter: cfg.get('displayGetterVal'),
      lazyEvaluation: cfg.get('lazyEvaluation'),
    })

    logger.on('optionChange', (name, val) => {
      switch (name) {
        case 'level':
          $level.each(function () {
            const $this = $(this)
            const level = $this.data('level')
            const isMatch = level === val || (level === 'all' && isArr(val))

            $this[isMatch ? 'addClass' : 'rmClass'](c('active'))
          })
          break
      }
    })

    if (cfg.get('overrideConsole')) this.overrideConsole()

    this._logger = logger
  }
  _exposeLogger() {
    const logger = this._logger
    const methods = ['html'].concat(CONSOLE_METHOD)

    methods.forEach(
      (name) =>
        (this[name] = (...args) => {
          if (name === 'error') {
            // Every eruda error log gets a capture of the current stack so
            // that non-Error arguments can still show a caller stack.
            const stackObj = new Error()
            this._pendingStacks.push({
              stack: stackObj.stack || '',
              from: 'tool',
              time: Date.now(),
            })
          }
          logger[name](...args)
          this.emit(name, ...args)
          this._bufferLog(name, args)

          return this
        })
    )
  }
  _bufferLog(name, args) {
    if (!this.config || !this.config.get('preserveLog')) return
    if (!contain(CONSOLE_METHOD, name) || name === 'groupEnd') return
    if (name === 'clear') {
      this._logBuffer = []
      return
    }
    if (name === 'group' || name === 'groupCollapsed') return

    const text = map(args, (arg) => safeStringify(arg)).join(' ')
    this._logBuffer.push({
      level: name === 'debug' ? 'verbose' : name,
      text,
      time: Date.now(),
    })
    if (this._logBuffer.length > 300) this._logBuffer.shift()
  }
  _savePreservedLogs = () => {
    if (!this.config || !this.config.get('preserveLog')) return
    if (this._logBuffer.length === 0) return

    const data = loadPreservedLogs('console') || { logs: [] }
    data.logs = this._logBuffer.slice(-300)
    savePreservedLogs('console', data)
  }
  _restorePreservedLogs() {
    if (!this.config.get('preserveLog')) return

    const data = loadPreservedLogs('console')
    if (!data || !data.logs || data.logs.length === 0) return

    this._logger.html(
      `<div class="${c('restored-divider')}">${escape(
        t('restoredFromSession')
      )}</div>`
    )
    each(data.logs.slice(-300), (log) => {
      const level = contain(
        ['verbose', 'info', 'warning', 'error'],
        log.level
      )
        ? log.level
        : 'info'
      const dte = new Date(log.time)
      const pad = (n) => (n < 10 ? '0' + n : '' + n)
      const time = `${pad(dte.getHours())}:${pad(dte.getMinutes())}:${pad(
        dte.getSeconds()
      )}`
      this._logger.html(
        `<div class="${c('restored-log')} ${c('restored-' + level)}">
          <span class="${c('restored-time')}">${time}</span>${escape(
          log.text
        )}
        </div>`
      )
    })
    this._logBuffer = []
  }
  _bindEvent() {
    const container = this._container
    const $input = this._$input
    const $inputBtns = this._$inputBtns
    const $control = this._$control
    const self = this

    const logger = this._logger
    const config = this.config

    $control
      .on('click', c('.clear-console'), () => logger.clear(true))
      .on('click', c('.level'), function () {
        let level = $(this).data('level')
        if (level === 'all') {
          level = ['verbose', 'info', 'warning', 'error']
        }
        logger.setOption('level', level)
      })
      .on('click', c('.filter'), () => {
        this._$filterRow.toggleClass(c('active'))
        if (this._$filterRow.hasClass(c('active'))) {
          this._$filterInput.get(0).focus()
        }
      })
      .on('click', c('.watch'), () => this._toggleWatch())
      .on('click', c('.copy'), () => {
        this._selectedLog.copy()
        container.notify(t('Copied'), { icon: 'success' })
      })

    this._$filterInput
      .on('input', () => {
        const text = this._$filterInput.val() || ''
        this._$filterText.text(text)
        this._applyFilter(text)
      })
      .on('keydown', (e) => {
        if (e.key === 'Escape') {
          this._$filterInput.val('')
          this._$filterText.text('')
          this._applyFilter('')
          this._$filterRow.rmClass(c('active'))
        }
      })

    this._$watchPanel
      .on('click', c('.watch-del'), function () {
        const idx = +$(this).parent().data('idx')
        self._removeWatch(idx)
      })
      .on('click', c('.watch-val'), function () {
        const idx = +$(this).parent().data('idx')
        const val = self._watchValues[idx]
        const sources = self._container.get('sources')
        if (val !== undefined && sources) {
          sources.set('object', val)
          self._container.showTool('sources')
        }
      })

    this._$watchInput.on('keydown', (e) => {
      if (e.key !== 'Enter') return
      const expr = this._$watchInput.val().trim()
      if (expr === '') return
      this._addWatch(expr)
      this._$watchInput.val('')
    })

    $inputBtns
      .on('click', c('.cancel'), () => this._hideInput())
      .on('click', c('.execute'), () => {
        const jsInput = $input.val().trim()
        if (jsInput === '') return

        logger.evaluate(jsInput)
        $input.val('').get(0).blur()
        this._hideInput()
        this._evalWatches()
      })

    $input.on('focusin', () => this._showInput())

    logger.on('insert', (log) => {
      if (log.type === 'error') this._formatErrorLog(log)

      const autoShow = log.type === 'error' && config.get('displayIfErr')

      if (autoShow) container.showTool('console').show()
    })

    // Stack frame links open the file in Sources, like Chrome DevTools.
    // Bound per-link in _formatStack so luna's own handlers can't win.
    logger.on('select', (log) => {
      this._selectedLog = log
      $control.find(c('.icon-copy')).rmClass(c('icon-disabled'))
    })

    logger.on('deselect', () => {
      this._selectedLog = null
      $control.find(c('.icon-copy')).addClass(c('icon-disabled'))
    })

    container.on('show', this._handleShow)
  }
  // --- DevTools-style error rendering -------------------------------
  // - expand stack by default (collapsed on click)
  // - "Uncaught" / "Uncaught (in promise)" prefixes for global errors
  // - each stack frame location becomes a link that opens in Sources
  _formatErrorLog(log) {
    const $row = log.$container
    if (!$row || !$row.get(0)) return
    const flag =
      log.args && isErr(log.args[0]) && this._uncaughtMap.get(log.args[0])
    if (flag) this._uncaughtMap.delete(log.args[0])

    const err = log.args[0]
    const isRealErr = isErr(err)
    const synthetic = flag && flag.synthetic

    // Consume queued stack captures. console.error produces an
    // "override" capture followed by a "tool" one (both describe the
    // same log); direct tool API calls produce only the "tool" one.
    const now = Date.now()
    let captured = null
    while (this._pendingStacks.length) {
      const item = this._pendingStacks.shift()
      if (now - item.time > 3000) continue // stale, drop silently
      captured = item
      if (item.from === 'override') {
        // Drop the paired tool capture emitted by the same call.
        const next = this._pendingStacks[0]
        if (next && next.from === 'tool') this._pendingStacks.shift()
      }
      break
    }

    let stackStr = isRealErr && !synthetic ? String(err.stack || '') : ''
    let replaceStack = false
    let dropNamePrefix = false

    if (!isRealErr && captured) {
      // luna wrapped non-Error args into an internal Error: swap in the
      // captured caller stack so frames point to user code (DevTools).
      stackStr = captured.stack
      replaceStack = true
      dropNamePrefix = true
    }

    const stackEl = $row.find('.luna-console-stack').get(0)

    if (stackEl) {
      if (synthetic) {
        // Synthetic wrapper: hide internal stack entirely.
        stackEl.style.display = 'none'
      } else if (stackStr) {
        this._formatStack(stackEl, stackStr, replaceStack)
        // DevTools expands the stack of an error by default.
        stackEl.classList.remove('luna-console-hidden')
      }
    }

    if ((flag && flag.prefix) || dropNamePrefix) {
      // Chrome DevTools: "Uncaught TypeError: ..." / "msg" for console.error
      const el = $row.find('.luna-console-log-content').get(0)
      if (el && el.firstChild && el.firstChild.nodeType === 3) {
        let text = el.firstChild.textContent
        if (synthetic || dropNamePrefix) {
          text = text.replace(/^\s*Error:\s*/, '')
        }
        const prefix = flag && flag.prefix ? `${t(flag.prefix)} ` : ''
        el.firstChild.textContent = `${prefix}${text}`
      }
    }

    // Source link appended after the message, like DevTools.
    if (stackStr) {
      const m = stackStr.match(ERROR_LOCATION_RE)
      if (m) {
        const msgText = $row.find('.luna-console-log-content').get(0)
        if (msgText) {
          const link = document.createElement('span')
          link.className = c('error-link error-source')
          link.textContent = `${m[1]}:${m[2] || '1'}`
          link.setAttribute('data-url', m[1])
          link.setAttribute('data-line', m[2] || '1')
          link.setAttribute('data-col', m[3] || '1')
          const br = msgText.querySelector('br')
          if (br && br.parentNode) {
            br.parentNode.insertBefore(link, br)
            br.parentNode.insertBefore(document.createTextNode(' '), br)
          }
          const self = this
          link.onclick = (e) => {
            e.preventDefault()
            e.stopPropagation()
            self._openInSources(
              m[1],
              m[2] || '1',
              m[3] || '1'
            )
          }
        }
      }
    }
  }
  _formatStack(stackEl, stackStr, replaceStack) {
    // Drop the "Name: message" header line, keep frames only.
    // For replaced stacks the first two lines are our own capture frames.
    const lines = stackStr.split('\n').slice(replaceStack ? 2 : 1)
    const html = map(lines, (line) => {
      const escaped = escape(line)
      const m = line.match(ERROR_LOCATION_RE)
      if (!m) return escaped
      const url = m[1]
      const lineNum = m[2] || '1'
      const attrs =
        `data-url="${escape(url)}" data-line="${escape(lineNum)}"` +
        ` data-col="${escape(m[3] || '1')}"`
      const linkHtml =
        `<span class="${c('error-link')}" ${attrs}>` +
        `${escape(url)}:${escape(lineNum)}</span>`
      const plainUrl = escape(url)
      const idx = escaped.indexOf(plainUrl)
      if (idx === -1) return escaped
      return (
        escaped.slice(0, idx) +
        linkHtml +
        escaped.slice(idx + plainUrl.length)
      )
    }).join('<br/>')
    stackEl.innerHTML = html
    // Bind clicks directly: delegation is unreliable inside luna's
    // viewport-managed DOM.
    const self = this
    each(stackEl.querySelectorAll('.' + c('error-link')), (el) => {
      el.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        self._openInSources(
          el.getAttribute('data-url'),
          el.getAttribute('data-line'),
          el.getAttribute('data-col')
        )
      }
    })
  }
  _openInSources(url, line, col) {
    if (!url) return
    const container = this._container
    const sources = container.get('sources')
    const absolute = absoluteUrl(url)

    if (!sources) {
      window.open(absolute, '_blank')
      return
    }

    ajax({
      url: absolute,
      dataType: 'raw',
      success: (data) => {
        const ext = (absolute.split('?')[0].match(/\.(\w+)$/) || [])[1] || 'js'
        const type = contain(['js', 'css', 'html'], ext) ? ext : 'raw'
        sources.set(type, data)
        container.showTool('sources')
        this._highlightSourceLine(line)
      },
      error: () => container.notify(t('Failed to load source')),
    })
    void col
  }
  _highlightSourceLine(line) {
    if (!line) return
    setTimeout(() => {
      const rows = $('.luna-text-viewer-table-row')
      const target = rows
        .filter(function () {
          return (
            $(this).find('.luna-text-viewer-line-number').text() ===
            String(line)
          )
        })
        .get(0)
      if (!target) return
      rows.rmClass(c('line-highlight'))
      $(target).addClass(c('line-highlight'))
      target.scrollIntoView({ block: 'center' })
    }, 80)
  }
  // --- Log XMLHttpRequests (DevTools setting) -------------------------
  _setHttpLogging(enabled) {
    if (enabled && !this._httpHookInstalled) {
      this._installHttpHook()
      this._httpHookInstalled = true
    } else if (!enabled && this._httpHookInstalled) {
      this._uninstallHttpHook()
      this._httpHookInstalled = false
    }
  }
  _installHttpHook() {
    const proto = window.XMLHttpRequest.prototype
    this._origXhrSend = proto.send
    const self = this
    proto.send = function (...args) {
      const xhr = this
      xhr.addEventListener('loadend', () => {
        const info = xhr.__erudaInfo || {}
        const url = info.url || xhr.responseURL || ''
        if (!startWith(url, 'data:')) {
          const method = info.method || 'GET'
          const status = String(xhr.status)
          const kind = startWith(status, '2') ? 'info' : 'error'
          self[kind](`${t('XHR finished loading')}: ${method} ${url} [${status}]`)
        }
      })
      return self._origXhrSend.apply(this, args)
    }

    const origFetch = window.fetch
    if (origFetch) {
      this._origFetchLog = origFetch
      const wrapped = function (...args) {
        const input = args[0]
        const url =
          typeof input === 'string'
            ? input
            : input && input.url
              ? input.url
              : String(input)
        const method = String(
          (args[1] && args[1].method) || (input && input.method) || 'GET'
        ).toUpperCase()
        return origFetch.apply(this, args).then(
          (res) => {
            const kind = res.ok ? 'info' : 'error'
            self[kind](
              `${t('Fetch finished loading')}: ${method} ${res.url || url} [${res.status}]`
            )
            return res
          },
          (err) => {
            self.error(`${t('Fetch failed')}: ${method} ${url}`)
            throw err
          }
        )
      }
      this._wrappedFetchLog = wrapped
      window.fetch = wrapped
    }
  }
  _uninstallHttpHook() {
    if (this._origXhrSend) {
      window.XMLHttpRequest.prototype.send = this._origXhrSend
      delete this._origXhrSend
    }
    if (this._origFetchLog) {
      if (window.fetch === this._wrappedFetchLog) {
        window.fetch = this._origFetchLog
      }
      delete this._origFetchLog
      delete this._wrappedFetchLog
    }
  }
  _onI18n = () => {
    const $control = this._$control
    if (!$control) return
    const levels = {
      all: 'All',
      info: 'Info',
      warning: 'Warning',
      error: 'Error',
    }
    $control.find(c('.level')).each(function () {
      const $this = $(this)
      $this.text(t(levels[$this.data('level')]))
    })
    this._$inputBtns.find(c('.cancel')).text(t('Cancel'))
    this._$inputBtns.find(c('.execute')).text(t('Execute'))
    this._$filterInput.attr('placeholder', t('filterPh'))
    this._$watchInput.attr('placeholder', t('watchPh'))
    this._renderWatch()
  }
  _applyFilter(text) {
    text = trim(text)
    if (startWith(text, '/') && endWith(text, '/') && text.length > 2) {
      try {
        this.filter(new RegExp(text.slice(1, -1), 'i'))
        return
      } catch {
        // Invalid regex, fall through to plain text filter
      }
    }
    this.filter(text)
  }
  _initWatch() {
    try {
      const saved = localStorage.getItem('eruda-console-watch')
      if (saved) this._watchExprs = JSON.parse(saved).slice(0, 6)
    } catch {
      this._watchExprs = []
    }
    if (this._watchExprs.length > 0) this._toggleWatch()
    this._renderWatch()
    this._watchTimer = setInterval(() => {
      if (this._watchOpen) this._evalWatches()
    }, 1000)
  }
  _toggleWatch() {
    this._watchOpen = !this._watchOpen
    this._$watchPanel.toggleClass(c('active'))
    this._$control.find(c('.watch')).toggleClass(c('active'))
    if (this._watchOpen) {
      this._evalWatches()
      this._renderWatch()
    }
  }
  _addWatch(expr) {
    if (this._watchExprs.length >= 6) this._watchExprs.shift()
    this._watchExprs.push(expr)
    this._saveWatch()
    this._evalWatches()
    this._renderWatch()
  }
  _removeWatch(idx) {
    this._watchExprs.splice(idx, 1)
    this._watchValues.splice(idx, 1)
    this._saveWatch()
    this._renderWatch()
  }
  _saveWatch() {
    try {
      localStorage.setItem('eruda-console-watch', JSON.stringify(this._watchExprs))
    } catch {
      // Ignore
    }
  }
  _evalWatches() {
    const exprs = this._watchExprs
    this._watchValues = []
    each(exprs, (expr, i) => {
      try {
         
        this._watchValues[i] = (0, eval)(expr)
      } catch (e) {
        this._watchValues[i] = undefined
        this._watchValues['_' + i] = e
      }
    })
    this._renderWatchValues()
  }
  _renderWatchValues() {
    each(this._watchExprs, (expr, i) => {
      const $val = this._$watchRows.find(c('.watch-val')).eq(i)
      if ($val.length === 0) return
      const err = this._watchValues['_' + i]
      if (err) {
        $val.text(`${err.name}: ${err.message}`).addClass(c('watch-err'))
      } else {
        const val = this._watchValues[i]
        const text =
          val === undefined ? 'undefined' : safeStringify(val, 200)
        $val.text(text).rmClass(c('watch-err'))
      }
    })
  }
  _renderWatch() {
    if (!this._$watchRows) return
    const rows = map(this._watchExprs, (expr, i) => {
      return `<div class="${c('watch-row')}" data-idx="${i}">
        <span class="${c('watch-expr')}">${escape(expr)}</span>
        <span class="${c('watch-val')}" data-idx="${i}"></span>
        <span class="${c('icon-delete watch-del')}"></span>
      </div>`
    }).join('')
    this._$watchRows.html(rows)
    this._renderWatchValues()
  }
  _hideInput() {
    this._$inputContainer.rmClass(c('active'))
    this._$inputBtns.css('display', 'none')
  }
  _showInput() {
    this._$inputContainer.addClass(c('active'))
    this._$inputBtns.css('display', 'flex')
  }
  _rmCfg() {
    const cfg = this.config

    const settings = this._container.get('settings')
    if (!settings) return

    settings
      .remove(cfg, 'asyncRender')
      .remove(cfg, 'jsExecution')
      .remove(cfg, 'catchGlobalErr')
      .remove(cfg, 'overrideConsole')
      .remove(cfg, 'displayExtraInfo')
      .remove(cfg, 'displayUnenumerable')
      .remove(cfg, 'displayGetterVal')
      .remove(cfg, 'lazyEvaluation')
      .remove(cfg, 'displayIfErr')
      .remove(cfg, 'maxLogNum')
      .remove(cfg, 'preserveLog')
      .remove(cfg, 'logHttpRequests')
      .remove(upperFirst(this.name))
  }
  _initCfg() {
    const container = this._container

    const cfg = (this.config = Settings.createCfg(this.name, {
      asyncRender: true,
      catchGlobalErr: true,
      jsExecution: true,
      overrideConsole: true,
      displayExtraInfo: false,
      displayUnenumerable: true,
      displayGetterVal: true,
      lazyEvaluation: true,
      displayIfErr: false,
      maxLogNum: 'infinite',
      preserveLog: false,
      logHttpRequests: false,
    }))

    this._enableJsExecution(cfg.get('jsExecution'))
    if (cfg.get('catchGlobalErr')) this.catchGlobalErr()
    if (cfg.get('preserveLog')) {
      window.addEventListener('pagehide', this._savePreservedLogs)
    }
    if (cfg.get('logHttpRequests')) this._setHttpLogging(true)

    cfg.on('change', (key, val) => {
      const logger = this._logger
      switch (key) {
        case 'asyncRender':
          return logger.setOption('asyncRender', val)
        case 'jsExecution':
          return this._enableJsExecution(val)
        case 'catchGlobalErr':
          return val ? this.catchGlobalErr() : this.ignoreGlobalErr()
        case 'overrideConsole':
          return val ? this.overrideConsole() : this.restoreConsole()
        case 'maxLogNum':
          return logger.setOption('maxNum', val === 'infinite' ? 0 : +val)
        case 'displayExtraInfo':
          return logger.setOption('showHeader', val)
        case 'displayUnenumerable':
          return logger.setOption('unenumerable', val)
        case 'displayGetterVal':
          return logger.setOption('accessGetter', val)
        case 'lazyEvaluation':
          return logger.setOption('lazyEvaluation', val)
        case 'preserveLog':
          if (val) {
            window.addEventListener('pagehide', this._savePreservedLogs)
          } else {
            window.removeEventListener('pagehide', this._savePreservedLogs)
            this._logBuffer = []
          }
          return
        case 'logHttpRequests':
          return this._setHttpLogging(val)
      }
    })

    const settings = container.get('settings')
    if (!settings) return

    settings
      .text(upperFirst(this.name))
      .switch(cfg, 'asyncRender', 'Asynchronous Rendering')
      .switch(cfg, 'jsExecution', 'Enable JavaScript Execution')
      .switch(cfg, 'catchGlobalErr', 'Catch Global Errors')
      .switch(cfg, 'overrideConsole', 'Override Console')
      .switch(cfg, 'displayIfErr', 'Auto Display If Error Occurs')
      .switch(cfg, 'displayExtraInfo', 'Display Extra Information')
      .switch(cfg, 'displayUnenumerable', 'Display Unenumerable Properties')
      .switch(cfg, 'displayGetterVal', 'Access Getter Value')
      .switch(cfg, 'lazyEvaluation', 'Lazy Evaluation')
      .switch(cfg, 'preserveLog', 'Preserve Log')
      .switch(cfg, 'logHttpRequests', 'Log XMLHttpRequests')
      .select(cfg, 'maxLogNum', 'Max Log Number', [
        'infinite',
        '250',
        '125',
        '100',
        '50',
        '10',
      ])
      .separator()
  }
}

// Matches stack frame locations: absolute URLs, webpack-internal,
// blob, file, and plain relative paths with optional :line:col.
// The URL part stops before a trailing :line:col via lookahead so the
// link href stays clean.
const ERROR_LOCATION_RE =
  /((?:https?:\/\/|webpack(?:-internal)?:\/\/|blob:|file:|capacitor:|ionic:)[^\s()"']*?(?=:\d+(?::\d+)*(?:$|[\s()"'<,])|[\s()"'<,]|$)|(?:(?:[\w.-]+\/)*[\w.-]+\.(?:js|mjs|cjs|ts|tsx|jsx|vue|svelte|html|json))(?:\?[^\s()"']*)?)(?::(\d+)(?::(\d+))?)?/

const CONSOLE_METHOD = [
  'log',
  'error',
  'info',
  'warn',
  'dir',
  'time',
  'timeLog',
  'timeEnd',
  'clear',
  'table',
  'assert',
  'count',
  'countReset',
  'debug',
  'group',
  'groupCollapsed',
  'groupEnd',
]
