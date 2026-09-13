import Tool from '../DevTools/Tool'
import $ from 'licia/$'
import isEl from 'licia/isEl'
import nextTick from 'licia/nextTick'
import Emitter from 'licia/Emitter'
import map from 'licia/map'
import MediaQuery from 'licia/MediaQuery'
import isEmpty from 'licia/isEmpty'
import toNum from 'licia/toNum'
import copy from 'licia/copy'
import isMobile from 'licia/isMobile'
import isShadowRoot from 'licia/isShadowRoot'
import trim from 'licia/trim'
import contain from 'licia/contain'
import throttle from 'licia/throttle'
import LunaDomViewer from 'luna-dom-viewer'
import { isErudaEl, classPrefix as c, isChobitsuEl } from '../lib/util'
import evalCss from '../lib/evalCss'
import Detail from './Detail'
import chobitsu from '../lib/chobitsu'
import emitter from '../lib/emitter'
import { t } from '../lib/i18n'
import { formatNodeName } from './util'

export default class Elements extends Tool {
  constructor() {
    super()

    this._style = evalCss(require('./Elements.scss'))

    this.name = 'elements'
    this._selectElement = false
    this._observeElement = true
    this._history = []
    this._searchOpen = false
    this._searchMatches = []
    this._searchIdx = -1

    Emitter.mixin(this)
  }
  init($el, container) {
    super.init($el)

    this._container = container

    this._initTpl()
    this._htmlEl = document.documentElement
    this._detail = new Detail(this._$detail, container)
    this.config = this._detail.config
    this._splitMediaQuery = new MediaQuery('screen and (min-width: 680px)')
    this._splitMode = this._splitMediaQuery.isMatch()
    this._domViewer = new LunaDomViewer(this._$domViewer.get(0), {
      node: this._htmlEl,
      ignore: (node) => isErudaEl(node) || isChobitsuEl(node),
    })
    this._domViewer.expand()
    this._bindEvent()
    chobitsu.domain('Overlay').enable()

    emitter.on(emitter.I18N, this._onI18n)

    nextTick(() => this._updateHistory())
  }
  show() {
    super.show()
    this._isShow = true

    if (!this._curNode) {
      this.select(document.body)
    } else if (this._splitMode) {
      this._showDetail()
    }
  }
  hide() {
    super.hide()
    this._isShow = false

    chobitsu.domain('Overlay').hideHighlight()
  }
  select(node) {
    this._domViewer.select(node)
    this._setNode(node)
    this.emit('change', node)
    return this
  }
  destroy() {
    super.destroy()

    emitter.off(emitter.I18N, this._onI18n)
    emitter.off(emitter.SCALE, this._updateScale)
    evalCss.remove(this._style)
    this._detail.destroy()
    chobitsu
      .domain('Overlay')
      .off('inspectNodeRequested', this._inspectNodeRequested)
    chobitsu.domain('Overlay').disable()
    this._splitMediaQuery.removeAllListeners()
  }
  _updateButtons() {
    const $control = this._$control
    const $showDetail = $control.find(c('.show-detail'))
    const $copyNode = $control.find(c('.copy-node'))
    const $copySelector = $control.find(c('.copy-selector'))
    const $copyXpath = $control.find(c('.copy-xpath'))
    const $deleteNode = $control.find(c('.delete-node'))
    const iconDisabled = c('icon-disabled')

    $showDetail.addClass(iconDisabled)
    $copyNode.addClass(iconDisabled)
    $copySelector.addClass(iconDisabled)
    $copyXpath.addClass(iconDisabled)
    $deleteNode.addClass(iconDisabled)

    const node = this._curNode

    if (!node || isShadowRoot(node)) {
      return
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      $copySelector.rmClass(iconDisabled)
      $copyXpath.rmClass(iconDisabled)
    }

    if (node !== document.documentElement && node !== document.body) {
      $deleteNode.rmClass(iconDisabled)
    }
    $copyNode.rmClass(iconDisabled)

    if (node.nodeType === Node.ELEMENT_NODE) {
      $showDetail.rmClass(iconDisabled)
    }
  }
  _showDetail = () => {
    if (!this._isShow || !this._curNode) {
      return
    }
    if (this._curNode.nodeType === Node.ELEMENT_NODE) {
      this._detail.show(this._curNode)
    } else {
      this._detail.show(this._curNode.parentNode || this._curNode.host)
    }
  }
  _initTpl() {
    const $el = this._$el

    $el.html(
      c(`<div class="elements">
        <div class="control">
          <span class="icon icon-select select"></span>
          <span class="icon icon-eye show-detail"></span>
          <span class="icon icon-copy copy-node"></span>
          <span class="txt-btn copy-selector" title="${t('Copy selector')}">{ }</span>
          <span class="txt-btn copy-xpath" title="${t('Copy XPath')}">//</span>
          <span class="icon icon-delete delete-node"></span>
          <span class="icon icon-search dom-search-btn"></span>
        </div>
        <div class="search-bar">
          <input class="search-input" placeholder="${t('searchDomPh')}" spellcheck="false">
          <span class="search-count"></span>
          <span class="search-nav search-prev">↑</span>
          <span class="search-nav search-next">↓</span>
          <span class="search-close">×</span>
        </div>
        <div class="dom-viewer-container">
          <div class="dom-viewer"></div>
        </div>
        <div class="crumbs"></div>
      </div>
      <div class="detail"></div>`)
    )

    this._$detail = $el.find(c('.detail'))
    this._$domViewer = $el.find(c('.dom-viewer'))
    this._$control = $el.find(c('.control'))
    this._$crumbs = $el.find(c('.crumbs'))
    this._$searchBar = $el.find(c('.search-bar'))
    this._$searchInput = $el.find(c('.search-input'))
    this._$searchCount = $el.find(c('.search-count'))
  }
  _onI18n = () => {
    if (!this._$searchInput) return
    this._$searchInput.attr('placeholder', t('searchDomPh'))
    this._$control.find(c('.copy-selector')).attr('title', t('Copy selector'))
    this._$control.find(c('.copy-xpath')).attr('title', t('Copy XPath'))
    this._$control.find(c('.dom-search-btn')).attr('title', t('Search DOM'))
    if (this._searchMatches.length === 0 && this._$searchCount) {
      const val = this._$searchInput.val()
      if (val && this._searchOpen) this._$searchCount.text(t('noMatches'))
    }
  }
  _renderCrumbs() {
    const crumbs = getCrumbs(this._curNode)
    let html = ''
    if (!isEmpty(crumbs)) {
      html = map(crumbs, ({ text, idx }) => {
        return `<li class="${c('crumb')}" data-idx="${idx}">${text}</div></li>`
      }).join('')
    }
    this._$crumbs.html(html)
  }
  _back = () => {
    if (this._curNode === this._htmlEl) return

    const parentQueue = this._curParentQueue
    let parent = parentQueue.shift()

    while (!isElExist(parent)) {
      parent = parentQueue.shift()
    }

    this.set(parent)
  }
  _bindEvent() {
    const self = this

    this._$el.on('click', c('.crumb'), function () {
      let idx = toNum($(this).data('idx'))
      let node = self._curNode

      while (idx-- && node.parentElement) {
        node = node.parentElement
      }

      if (isElExist(node)) {
        self.select(node)
      }
    })

    this._$control
      .on('click', c('.select'), this._toggleSelect)
      .on('click', c('.show-detail'), this._showDetail)
      .on('click', c('.copy-node'), this._copyNode)
      .on('click', c('.copy-selector'), this._copySelector)
      .on('click', c('.copy-xpath'), this._copyXpath)
      .on('click', c('.delete-node'), this._deleteNode)
      .on('click', c('.dom-search-btn'), this._toggleSearch)

    this._$searchInput.on('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        this._runDomSearch(e.shiftKey ? 'prev' : 'next')
      } else if (e.key === 'Escape') {
        this._toggleSearch()
      }
    })
    this._$searchInput.on('input', this._onSearchInput)
    this._$searchBar
      .on('click', c('.search-next'), () => this._runDomSearch('next'))
      .on('click', c('.search-prev'), () => this._runDomSearch('prev'))
      .on('click', c('.search-close'), this._toggleSearch)

    this._domViewer.on('select', this._setNode).on('deselect', this._back)

    chobitsu
      .domain('Overlay')
      .on('inspectNodeRequested', this._inspectNodeRequested)

    this._splitMediaQuery.on('match', () => {
      this._splitMode = true
      this._showDetail()
    })
    this._splitMediaQuery.on('unmatch', () => {
      this._splitMode = false
      this._detail.hide()
    })

    emitter.on(emitter.SCALE, this._updateScale)
  }
  _updateScale = (scale) => {
    this._splitMediaQuery.setQuery(`screen and (min-width: ${680 * scale}px)`)
  }
  _deleteNode = () => {
    const node = this._curNode

    if (node.parentNode) {
      node.parentNode.removeChild(node)
    }
  }
  _copyNode = () => {
    const node = this._curNode

    if (node.nodeType === Node.ELEMENT_NODE) {
      copy(node.outerHTML)
    } else {
      copy(node.nodeValue)
    }

    this._container.notify(t('Copied'), { icon: 'success' })
  }
  _copySelector = () => {
    const node = this._curNode
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return

    copy(getCssPath(node))
    this._container.notify(t('Copied'), { icon: 'success' })
  }
  _copyXpath = () => {
    const node = this._curNode
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return

    copy(getXPath(node))
    this._container.notify(t('Copied'), { icon: 'success' })
  }
  _toggleSearch = () => {
    const active = c('active')
    this._searchOpen = !this._searchOpen
    this._$searchBar.toggleClass(active)
    this._$control.find(c('.dom-search-btn')).toggleClass(active)
    if (this._searchOpen) {
      this._$searchInput.get(0).focus()
    } else {
      this._$searchInput.val('')
      this._$searchCount.text('')
      this._searchMatches = []
      this._searchIdx = -1
    }
  }
  _onSearchInput = throttle(() => {
    this._searchIdx = -1
    this._runDomSearch()
  }, 300)
  _runDomSearch = (goNext) => {
    const query = trim(this._$searchInput.val() || '')
    const matches = []

    if (query !== '') {
      // Try CSS selector first, then fall back to full-text search.
      try {
        const els = document.querySelectorAll(query)
        for (let i = 0; i < els.length && matches.length < 500; i++) {
          matches.push(els[i])
        }
      } catch {
        // Invalid selector, treat as text search below.
      }
      if (matches.length === 0) {
        const lower = query.toLowerCase()
        const walker = document.createTreeWalker(
          document.documentElement,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              const parent = node.parentElement
              if (!parent || isErudaEl(parent)) return NodeFilter.FILTER_REJECT
              const tag = parent.tagName
              if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
                return NodeFilter.FILTER_REJECT
              }
              if (node.nodeValue && contain(node.nodeValue.toLowerCase(), lower)) {
                return NodeFilter.FILTER_ACCEPT
              }
              return NodeFilter.FILTER_SKIP
            },
          }
        )
        while (walker.nextNode() && matches.length < 500) {
          const el = walker.currentNode.parentElement
          if (el && !contain(matches, el)) matches.push(el)
        }
      }
    }

    this._searchMatches = matches
    if (matches.length === 0) {
      this._$searchCount.text(query === '' ? '' : t('noMatches'))
      return
    }

    if (goNext === 'next') {
      this._searchIdx = (this._searchIdx + 1) % matches.length
    } else if (goNext === 'prev') {
      this._searchIdx =
        (this._searchIdx - 1 + matches.length) % matches.length
    } else {
      this._searchIdx = this._searchIdx >= 0 ? this._searchIdx : 0
    }

    this._$searchCount.text(`${this._searchIdx + 1} / ${matches.length}`)
    const node = matches[this._searchIdx]
    try {
      if (isElExist(node)) this.select(node)
    } catch {
      // Node may be detached between search and select.
    }
  }
  _toggleSelect = () => {
    this._$el.find(c('.select')).toggleClass(c('active'))
    this._selectElement = !this._selectElement

    if (this._selectElement) {
      chobitsu.domain('Overlay').setInspectMode({
        mode: 'searchForNode',
        highlightConfig: {
          showInfo: !isMobile(),
          showRulers: false,
          showAccessibilityInfo: !isMobile(),
          showExtensionLines: false,
          contrastAlgorithm: 'aa',
          contentColor: 'rgba(111, 168, 220, .66)',
          paddingColor: 'rgba(147, 196, 125, .55)',
          borderColor: 'rgba(255, 229, 153, .66)',
          marginColor: 'rgba(246, 178, 107, .66)',
        },
      })
      this._container.hide()
    } else {
      chobitsu.domain('Overlay').setInspectMode({
        mode: 'none',
      })
      chobitsu.domain('Overlay').hideHighlight()
    }
  }
  _inspectNodeRequested = ({ backendNodeId }) => {
    this._container.show()
    this._toggleSelect()
    try {
      const { node } = chobitsu.domain('DOM').getNode({ nodeId: backendNodeId })
      this.select(node)
    } catch {
      // No op
    }
  }
  _setNode = (node) => {
    if (node === this._curNode) return

    this._curNode = node
    this._renderCrumbs()

    const parentQueue = []

    let parent = node.parentNode
    while (parent) {
      parentQueue.push(parent)
      parent = parent.parentNode
    }
    this._curParentQueue = parentQueue

    if (this._splitMode) {
      this._showDetail()
    }
    this._updateButtons()
    this._updateHistory()
  }
  _updateHistory() {
    const console = this._container.get('console')
    if (!console) return

    const history = this._history
    history.unshift(this._curNode)
    if (history.length > 5) history.pop()
    for (let i = 0; i < 5; i++) {
      console.setGlobal(`$${i}`, history[i])
    }
  }
}

const isElExist = (val) => isEl(val) && val.parentNode

function getCrumbs(el) {
  const ret = []
  let i = 0

  while (el) {
    ret.push({
      text: formatNodeName(el, { noAttr: true }),
      idx: i++,
    })

    if (isShadowRoot(el)) {
      el = el.host
    }
    if (!el.parentElement && isShadowRoot(el.parentNode)) {
      el = el.parentNode
    } else {
      el = el.parentElement
    }
  }

  return ret.reverse()
}

function getCssPath(el) {
  if (!(el instanceof Element)) return ''

  const parts = []
  while (el && el.nodeType === Node.ELEMENT_NODE) {
    if (el.id) {
      parts.unshift(`#${el.id}`)
      break
    }

    let selector = el.tagName.toLowerCase()

    // nth-of-type index among same-tag siblings
    let nth = 1
    let sib = el.previousElementSibling
    while (sib) {
      if (sib.tagName === el.tagName) nth++
      sib = sib.previousElementSibling
    }

    if (el.className && typeof el.className === 'string') {
      const classes = trim(el.className)
        .split(/\s+/)
        .filter((name) => name && name.indexOf('eruda-') !== 0)
        .slice(0, 2)
      if (classes.length > 0) selector += `.${classes.join('.')}`
    }

    parts.unshift(`${selector}:nth-of-type(${nth})`)
    el = el.parentElement
  }

  return parts.join(' > ')
}

function getXPath(el) {
  if (!(el instanceof Element)) return ''

  if (el.id) return `//*[@id="${el.id}"]`

  const parts = []
  while (el && el.nodeType === Node.ELEMENT_NODE) {
    let idx = 1
    let sib = el.previousElementSibling
    while (sib) {
      if (sib.tagName === el.tagName) idx++
      sib = sib.previousElementSibling
    }
    parts.unshift(`${el.tagName.toLowerCase()}[${idx}]`)
    el = el.parentElement
  }

  return parts.length > 0 ? `/${parts.join('/')}` : ''
}
