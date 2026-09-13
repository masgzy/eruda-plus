import $ from 'licia/$'
import trim from 'licia/trim'
import isEmpty from 'licia/isEmpty'
import each from 'licia/each'
import map from 'licia/map'
import escape from 'licia/escape'
import copy from 'licia/copy'
import Emitter from 'licia/Emitter'
import truncate from 'licia/truncate'
import emitter from '../lib/emitter'
import contain from 'licia/contain'
import { classPrefix as c } from '../lib/util'
import {
  curlStr,
  fetchStr,
  parseQueryParams,
  prettyJson,
  getCookieList,
  getTimingSegments,
  toHeadersArray,
  formatMs,
  jsonTreeHtml,
  initiatorLabel,
  t,
} from './util'

const TABS = [
  { id: 'headers', key: 'headers' },
  { id: 'payload', key: 'payload' },
  { id: 'preview', key: 'preview' },
  { id: 'response', key: 'response' },
  { id: 'cookies', key: 'cookies' },
  { id: 'initiator', key: 'initiator' },
  { id: 'timing', key: 'timing' },
]

const MAX_RES_LEN = 100000

export default class Detail extends Emitter {
  constructor($container, devtools) {
    super()
    this._$container = $container
    this._devtools = devtools

    this._request = null
    this._activeTab = 'headers'
    this._bindEvent()
    emitter.on(emitter.I18N, this._onI18n)
  }
  destroy() {
    emitter.off(emitter.I18N, this._onI18n)
  }
  _onI18n = () => {
    // Re-render the open detail view so labels follow the new language.
    if (this._request && this._$container.css('display') !== 'none') {
      this._render()
    }
  }
  show(data) {
    this._request = data
    this._activeTab = 'headers'
    this._render()
    this._$container.show()
  }
  hide() {
    this._$container.hide()
    this.emit('hide')
  }
  _render() {
    const data = this._request
    const tabsHtml = map(TABS, (tab) => {
      const active = tab.id === this._activeTab ? c('active') : ''
      return `<div class="${c('tab')} ${active}" data-tab="${tab.id}">${t(tab.key)}</div>`
    }).join('')

    const html = `<div class="${c('control')}">
      <span class="${c('icon-left back')}"></span>
      <span class="${c('icon-delete back')}"></span>
      <span class="${c('url')}">${escape(data.method)} ${escape(data.url)}</span>
      <span class="${c('icon-play replay')}" title="${t('replay')}"></span>
      <span class="${c('icon-curl copy-curl')}" title="${t('copyCurl')}"></span>
      <span class="${c('copy-fetch')}" title="${t('copyFetch')}">{ }</span>
      <span class="${c('icon-copy copy-res')}" title="${t('copyResponse')}"></span>
    </div>
    <div class="${c('tabs')}">${tabsHtml}</div>
    <div class="${c('tab-content')}"></div>`

    this._$container.html(html)
    this._$content = this._$container.find(c('.tab-content'))
    this._renderTab()
  }
  _renderTab() {
    const data = this._request

    // Update active tab class.
    each(TABS, (tab) => {
      const $tab = this._$container.find(`[data-tab="${tab.id}"]`)
      if (tab.id === this._activeTab) {
        $tab.addClass(c('active'))
      } else {
        $tab.rmClass(c('active'))
      }
    })

    let html = ''
    switch (this._activeTab) {
      case 'headers':
        html = this._headersHtml(data)
        break
      case 'payload':
        html = this._requestHtml(data)
        break
      case 'preview':
        html = this._previewHtml(data)
        break
      case 'response':
        html = this._responseHtml(data)
        break
      case 'cookies':
        html = this._cookiesHtml()
        break
      case 'initiator':
        html = this._initiatorHtml(data)
        break
      case 'timing':
        html = this._timingHtml(data)
        break
    }

    this._$content.html(html)
  }
  _section(title, body, startCollapsed = false) {
    const collapsed = startCollapsed ? c('collapsed') : ''
    return `<div class="${c('section')} ${collapsed}">
      <h2 class="${c('sec-title')}"><span class="${c('icon-caret-down caret')}"></span>${escape(title)}</h2>
      <div class="${c('section-body')}">${body}</div>
    </div>`
  }
  _kvTable(rows, keyTitle = t('Name'), valTitle = t('Value')) {
    if (isEmpty(rows)) {
      return `<table class="${c('headers')}"><tbody><tr><td>${t(
        'Empty'
      )}</td></tr></tbody></table>`
    }
    const tr = map(rows, (row) => {
      return `<tr>
        <td class="${c('key')}">${escape(row.name)}</td>
        <td>${escape(row.value)}</td>
      </tr>`
    }).join('')
    return `<table class="${c('headers')}"><thead><tr><th class="${c(
      'key'
    )}">${escape(keyTitle)}</th><th>${escape(
      valTitle
    )}</th></tr></thead><tbody>${tr}</tbody></table>`
  }
  _generalRows(data) {
    const rows = [
      { name: t('Request URL'), value: data.url },
      { name: t('Request Method'), value: data.method },
    ]
    let statusVal
    let cls = 'st-ok'
    if (data.status === 'blocked') {
      statusVal = t('blocked (403)')
      cls = 'st-err'
    } else if (data.status === 0 || data.status === 'pending') {
      statusVal = String(data.status)
      cls = data.status === 0 ? 'st-err' : 'st-warn'
    } else {
      statusVal = `${data.status}`
      if (data.status < 200 || data.status >= 400) cls = 'st-err'
      else if (data.status >= 300) cls = 'st-warn'
    }
    rows.push({ name: t('Status Code'), value: statusVal, cls })
    return rows
  }
  _headersHtml(data) {
    const generalRows = map(this._generalRows(data), (row) => {
      return `<tr>
        <td class="${c('key')}">${escape(row.name)}</td>
        <td class="${row.cls ? c(row.cls) : ''}">${escape(row.value)}</td>
      </tr>`
    }).join('')
    const general = `<table class="${c('headers')}"><tbody>${generalRows}</tbody></table>`

    const resHeaders = toHeadersArray(data.resHeaders)
    const reqHeaders = toHeadersArray(data.reqHeaders)
    const queryParams = parseQueryParams(data.url)

    let html = this._section(t('general'), general)
    html += this._section(
      t('responseHeaders'),
      this._kvTable(resHeaders, t('Header'), t('Value'))
    )
    html += this._section(
      t('requestHeaders'),
      this._kvTable(reqHeaders, t('Header'), t('Value'))
    )
    if (queryParams.length > 0) {
      html += this._section(
        t('queryParams'),
        this._kvTable(queryParams)
      )
    }
    if (data.blocked || data.status === 'blocked') {
      html += `<div class="${c('hint')} ${c('st-err')}">${t('blockedHint')}</div>`
    } else if (data.mock) {
      html += `<div class="${c('hint')} ${c('st-mock')}">${t('mockHint')}</div>`
    }

    return html
  }
  _cookiesHtml() {
    const cookies = getCookieList()
    return this._section(t('cookies'), this._kvTable(cookies))
  }
  _requestHtml(data) {
    if (isEmpty(data.data)) {
      return `<div class="${c('hint')}">${t('emptyBody')}</div>`
    }

    const reqHeaders = toHeadersArray(data.reqHeaders)
    const contentType = getHeaderName(reqHeaders, 'content-type') || ''

    let html = ''
    if (contain(contentType, 'application/x-www-form-urlencoded')) {
      const formData = parseBodyPairs(data.data)
      html += this._section(t('formData'), this._kvTable(formData))
    }
    const pretty = prettyJson(data.data)
    if (pretty !== data.data) {
      html += this._section(
        t('requestPayload') + ' (JSON)',
        `<pre class="${c('code')}">${escape(pretty)}</pre>`
      )
    } else if (html === '') {
      html += this._section(
        t('requestPayload'),
        `<pre class="${c('code')}">${escape(truncateStr(data.data))}</pre>`
      )
    }

    return html
  }
  _previewHtml(data) {
    if (data.type === 'image' && !data.mock) {
      return `<div class="${c('image-preview')}"><img src="${escape(
        data.url
      )}" alt="preview" /></div>`
    }
    if (!isEmpty(data.resTxt) && trim(data.resTxt) !== '') {
      const tree = jsonTreeHtml(data.resTxt)
      if (tree) return tree
    }
    return `<div class="${c('hint')}">${t('previewUnavailable')}</div>`
  }
  _initiatorHtml(data) {
    if (!data.initiator) {
      return `<div class="${c('hint')}">${t('noStack')}</div>`
    }
    return `<div class="${c('init-block')}">
      <div class="${c('hint')}">${t('initiatorHint')}</div>
      <div class="${c('init-file')}">${escape(initiatorLabel(data.initiator))}</div>
      <div class="${c('init-url')}">${escape(
        data.initiator.file + ':' + data.initiator.line + ':' + data.initiator.col
      )}</div>
    </div>`
  }
  _responseHtml(data) {
    const resHeaders = toHeadersArray(data.resHeaders)
    const contentType = getHeaderName(resHeaders, 'content-type') || ''

    let statusHtml = ''
    if (data.blocked || data.status === 'blocked') {
      statusHtml = `<div class="${c('hint')} ${c('st-err')}">${t('blockedHint')}</div>`
    } else if (data.mock) {
      statusHtml = `<div class="${c('hint')} ${c('st-mock')}">${t('mockHint')}</div>`
    }

    if (data.type === 'image') {
      return `${statusHtml}<div class="${c('image-preview')}"><img src="${escape(
        data.url
      )}" alt="response image" /></div>`
    }

    const resTxt = data.resTxt
    if (isEmpty(resTxt) || trim(resTxt) === '') {
      return `${statusHtml}<div class="${c('hint')}">${t('emptyRes')}</div>`
    }

    const pretty = prettyJson(resTxt)
    const isJsonPretty = pretty !== resTxt
    const title = isJsonPretty ? t('response') + ' (JSON)' : t('response')
    const body = `<pre class="${c('code')}">${escape(
      truncateStr(pretty)
    )}</pre>`

    return `${statusHtml}${this._section(
      `${title}  |  ${contentType || t('unknown type')}`,
      body
    )}`
  }
  _timingHtml(data) {
    const timing = getTimingSegments(data)
    const total = timing.total || data.time || 0

    let rows = ''
    each(timing.segments, (seg) => {
      const dur = Math.max(0, seg.to - seg.from)
      const left = timing.total > 0 ? (seg.from / timing.total) * 100 : 0
      const width =
        timing.total > 0 ? ((seg.to - seg.from) / timing.total) * 100 : 0
      rows += `<div class="${c('timing-row')}">
        <span class="${c('t-label')}">${escape(t(seg.name))}</span>
        <div class="${c('t-track')}"><div class="${c(
        't-bar'
      )} ${c(seg.cls)}" style="left:${left}%;width:${width}%"></div></div>
        <span class="${c('t-val')}">${escape(formatMs(dur))}</span>
      </div>`
    })

    rows += `<div class="${c('timing-row')} ${c('t-total')}">
      <span class="${c('t-label')}">${t('Total')}</span>
      <div class="${c('t-track')}"><div class="${c(
      't-bar'
    )} ${c('total')}" style="left:0;width:100%"></div></div>
      <span class="${c('t-val')}">${escape(formatMs(total))}</span>
    </div>`

    const note = timing.precise
      ? ''
      : `<div class="${c('hint')}">${t('timingHint')}</div>`

    return `<div class="${c('timing')}">${rows}</div>${note}`
  }
  _replay = async () => {
    const data = this._request
    if (!data) return

    const headers = {}
    const rh = data.reqHeaders
    if (rh) {
      if (typeof rh.forEach === 'function') {
        rh.forEach((value, name) => (headers[name] = value))
      } else {
        each(rh, (value, name) => (headers[name] = value))
      }
    }
    delete headers['content-length']

    const init = { method: data.method, headers }
    if (!contain(['GET', 'HEAD'], data.method) && data.data) {
      init.body = data.data
    }

    try {
      await fetch(data.url, init)
      this._devtools.notify(t('replayed'), { icon: 'success' })
    } catch (e) {
      this._devtools.notify(t('replayFailed') + e.message, { icon: 'error' })
    }
  }
  _copyCurl = () => {
    const data = this._request
    if (!data) return

    copy(
      curlStr({
        requestMethod: data.method,
        url() {
          return data.url
        },
        requestFormData() {
          return data.data
        },
        requestHeaders() {
          const reqHeaders = toHeadersArray(data.reqHeaders)
          reqHeaders.push({ name: 'User-Agent', value: navigator.userAgent })
          reqHeaders.push({ name: 'Referer', value: location.href })

          return reqHeaders
        },
      })
    )

    this._devtools.notify(t('Copied'), { icon: 'success' })
  }
  _copyFetch = () => {
    const data = this._request
    if (!data) return

    copy(fetchStr(data))
    this._devtools.notify(t('copied'), { icon: 'success' })
  }
  _copyRes = () => {
    const data = this._request
    if (!data) return

    let out = `${data.method} ${data.url} ${data.status}\n`
    if (!isEmpty(data.data)) {
      out += `\n${t('Request Data')}\n\n`
      out += `${data.data}\n`
    }
    const reqHeaders = toHeadersArray(data.reqHeaders)
    const resHeaders = toHeadersArray(data.resHeaders)
    if (!isEmpty(reqHeaders)) {
      out += `\n${t('requestHeaders')}\n\n`
      each(reqHeaders, (h) => (out += `${h.name}: ${h.value}\n`))
    }
    if (!isEmpty(resHeaders)) {
      out += `\n${t('responseHeaders')}\n\n`
      each(resHeaders, (h) => (out += `${h.name}: ${h.value}\n`))
    }
    if (data.resTxt) {
      out += `\n${data.resTxt}\n`
    }

    copy(out)
    this._devtools.notify(t('Copied'), { icon: 'success' })
  }
  _bindEvent() {
    const devtools = this._devtools
    const self = this

    this._$container
      .on('click', c('.back'), () => this.hide())
      .on('click', c('.copy-res'), this._copyRes)
      .on('click', c('.copy-curl'), this._copyCurl)
      .on('click', c('.copy-fetch'), this._copyFetch)
      .on('click', c('.replay'), this._replay)
      .on('click', c('.tab'), function () {
        const tab = $(this).data('tab')
        if (!tab) return
        self._activeTab = tab
        self._renderTab()
      })
      .on('click', c('.sec-title'), function () {
        $(this)
          .parent(c('.section'))
          .toggleClass(c('collapsed'))
      })
      .on('click', c('.code'), () => {
        const data = this._request
        const resTxt = data.resTxt
        if (this._activeTab === 'response' && resTxt) {
          if (isJsonStr(resTxt)) {
            return showSources('object', resTxt)
          }
          switch (data.subType) {
            case 'css':
              return showSources('css', resTxt)
            case 'html':
              return showSources('html', resTxt)
            case 'javascript':
              return showSources('js', resTxt)
            case 'json':
              return showSources('object', resTxt)
          }
        }
        if (this._activeTab === 'request' && data.data && isJsonStr(data.data)) {
          return showSources('object', data.data)
        }
      })

    const showSources = (type, data) => {
      const sources = devtools.get('sources')
      if (!sources) {
        return
      }

      sources.set(type, data)

      devtools.showTool('sources')
    }
  }
}

function getHeaderName(headers, name) {
  const header = headers.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  )
  return header ? header.value : ''
}

function parseBodyPairs(text) {
  const ret = []
  each(text.split('&'), (pair) => {
    if (pair === '') return
    const idx = pair.indexOf('=')
    const name = idx === -1 ? pair : pair.slice(0, idx)
    const value = idx === -1 ? '' : pair.slice(idx + 1)
    let dName = name
    let dValue = value
    try {
      dName = decodeURIComponent(name.replace(/\+/g, ' '))
      dValue = decodeURIComponent(value.replace(/\+/g, ' '))
    } catch {
      // Keep raw values.
    }
    ret.push({ name: dName, value: dValue })
  })
  return ret
}

function truncateStr(text) {
  if (text.length > MAX_RES_LEN) return truncate(text, MAX_RES_LEN)
  return text
}

function isJsonStr(str) {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}
