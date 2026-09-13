import { Underline } from '@theojs/lumen'
import DefaultTheme from 'vitepress/theme'

import LiveDemo from './LiveDemo.vue'

import '@theojs/lumen/style'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // <Underline /> renders the hero text with the ink-brush stroke
    // (EasyTier's signature "那一抹墨").
    app.component('Underline', Underline)
    // <LiveDemo /> embeds a real eruda-plus console on the home page.
    app.component('LiveDemo', LiveDemo)
  },
}
