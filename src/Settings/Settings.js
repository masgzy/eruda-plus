import Tool from '../DevTools/Tool'
import $ from 'licia/$'
import LocalStore from 'licia/LocalStore'
import uniqId from 'licia/uniqId'
import each from 'licia/each'
import filter from 'licia/filter'
import isStr from 'licia/isStr'
import isObj from 'licia/isObj'
import contain from 'licia/contain'
import clone from 'licia/clone'
import evalCss from '../lib/evalCss'
import LunaSetting from 'luna-setting'
import emitter from '../lib/emitter'
import { t } from '../lib/i18n'

export default class Settings extends Tool {
  constructor() {
    super()

    this._style = evalCss(require('./Settings.scss'))

    this.name = 'settings'
    this._settings = []
    // Recorded entry operations, replayed when the language changes.
    this._ops = []
  }
  init($el) {
    super.init($el)

    this._setting = new LunaSetting($el.get(0))

    this._bindEvent()

    emitter.on(emitter.I18N, this._onI18n)
  }
  destroy() {
    emitter.off(emitter.I18N, this._onI18n)
    this._setting.destroy()
    super.destroy()

    evalCss.remove(this._style)
  }
  remove(config, key) {
    if (isStr(config)) {
      const self = this
      this._$el.find('.luna-setting-item-title').each(function () {
        const $this = $(this)
        if ($this.text() === config || $this.text() === t(config)) {
          self._setting.remove(this.settingItem)
        }
      })
    } else {
      this._settings = filter(this._settings, (setting) => {
        if (setting.config === config && setting.key === key) {
          this._setting.remove(setting.item)
          return false
        }

        return true
      })
    }

    this._cleanSeparator()

    return this
  }
  clear() {
    this._settings = []
    this._ops = []
    this._setting.clear()
  }
  switch(config, key, desc) {
    const id = this._genId()

    const item = this._setting.appendCheckbox(id, !!config.get(key), t(desc))
    this._settings.push({ config, key, id, item })
    this._ops.push({ method: 'switch', args: [config, key, desc] })

    return this
  }
  select(config, key, desc, selections) {
    const id = this._genId()

    // Accept either an array of values (label = t(value)) or a
    // { value: label } map (label = t(label)) so that stored config
    // values stay stable while displayed labels get translated.
    // NB: luna-setting expects a { displayText: value } map.
    const isMap = isObj(selections) && !Array.isArray(selections)
    const selectOptions = {}
    if (isMap) {
      each(selections, (label, value) => (selectOptions[t(label)] = value))
    } else {
      each(selections, (selection) => (selectOptions[t(selection)] = selection))
    }
    const item = this._setting.appendSelect(
      id,
      config.get(key),
      '',
      t(desc),
      selectOptions
    )
    this._settings.push({ config, key, id, item })
    this._ops.push({ method: 'select', args: [config, key, desc, selections] })

    return this
  }
  range(config, key, desc, { min = 0, max = 1, step = 0.1 }) {
    const id = this._genId()

    const item = this._setting.appendNumber(id, config.get(key), t(desc), {
      max,
      min,
      step,
      range: true,
    })
    this._settings.push({ config, key, min, max, step, id, item })
    this._ops.push({
      method: 'range',
      args: [config, key, desc, { min, max, step }],
    })

    return this
  }
  button(text, handler) {
    this._setting.appendButton(t(text), handler)
    this._ops.push({ method: 'button', args: [text, handler] })

    return this
  }
  separator() {
    this._setting.appendSeparator()
    this._ops.push({ method: 'separator', args: [] })

    return this
  }
  text(text) {
    this._setting.appendTitle(t(text))
    this._ops.push({ method: 'text', args: [text] })

    return this
  }
  _onI18n = () => {
    // Rebuild every entry so titles follow the new language.
    const ops = this._ops
    this.clear()
    each(ops, (op) => this[op.method].apply(this, op.args))
    this._cleanSeparator()
  }
  // Merge adjacent separators
  _cleanSeparator() {
    const children = clone(this._$el.get(0).children)

    function isSeparator(node) {
      return contain(node.getAttribute('class'), 'luna-setting-item-separator')
    }

    for (let i = 0, len = children.length; i < len - 1; i++) {
      if (isSeparator(children[i]) && isSeparator(children[i + 1])) {
        $(children[i]).remove()
      }
    }
  }
  _genId() {
    return uniqId('eruda-settings')
  }
  _getSetting(id) {
    let ret

    each(this._settings, (setting) => {
      if (setting.id === id) ret = setting
    })

    return ret
  }
  _bindEvent() {
    this._setting.on('change', (id, val) => {
      const setting = this._getSetting(id)
      setting.config.set(setting.key, val)
    })
  }
  static createCfg(name, data) {
    return new LocalStore('eruda-' + name, data)
  }
}
