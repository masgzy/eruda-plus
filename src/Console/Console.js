import Tool from '../DevTools/Tool'
import noop from 'licia/noop'
import $ from 'licia/$'
import toStr from 'licia/toStr'
import isFn from 'licia/isFn'
import Emitter from 'licia/Emitter'
import isStr from 'licia/isStr'
import isRegExp from 'licia/isRegExp'
import startWith from 'licia/startWith'
import endWith from 'licia/endWith'
import uncaught from 'licia/uncaught'
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
import {
  classPrefix as c,
  safeStringify,
  savePreservedLogs,
  loadPreservedLogs,
} from '../lib/util'

uncaught.start()

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
    uncaught.addListener(this._handleErr)

    return this
  }
  ignoreGlobalErr() {
    uncaught.rmListener(this._handleErr)

    return this
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
      const autoShow = log.type === 'error' && config.get('displayIfErr')

      if (autoShow) container.showTool('console').show()
    })

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
        // eslint-disable-next-line no-eval
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
    }))

    this._enableJsExecution(cfg.get('jsExecution'))
    if (cfg.get('catchGlobalErr')) this.catchGlobalErr()
    if (cfg.get('preserveLog')) {
      window.addEventListener('pagehide', this._savePreservedLogs)
    }

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
