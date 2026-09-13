import { defineConfig } from 'vitepress'

const enSidebar = [
  {
    text: 'Getting Started',
    items: [
      { text: 'Introduction', link: '/en/guide/introduction' },
      { text: 'Getting Started', link: '/en/guide/getting-started' },
      { text: 'Installation', link: '/en/guide/installation' },
      { text: 'FAQ', link: '/en/guide/faq' },
    ],
  },
  {
    text: 'Guides',
    link: '/en/guide/tools',
    items: [
      { text: 'Console', link: '/en/guide/console' },
      { text: 'Network', link: '/en/guide/network' },
      { text: 'Other Panels', link: '/en/guide/tools' },
    ],
  },
  {
    text: 'Misc',
    items: [
      { text: 'Configuration', link: '/en/guide/config' },
      { text: 'Roadmap', link: '/en/guide/roadmap' },
      { text: 'Changelog', link: 'https://github.com/masgzy/eruda-plus/releases' },
      { text: 'Contributing', link: 'https://github.com/masgzy/eruda-plus/issues' },
    ],
  },
]

const enSearch = {
  translations: {
    button: { buttonText: 'Search Docs', buttonAriaLabel: 'Search Docs' },
    modal: {
      noResultsText: 'No results found',
      resetButtonTitle: 'Reset query',
      footer: { selectText: 'Select', navigateText: 'Navigate', closeText: 'Close' },
    },
  },
}

export const en = defineConfig({
  lang: 'en',
  title: 'eruda-plus - An all-round enhancement for mobile web consoles',
  description:
    'eruda-plus upgrades eruda with a Chrome DevTools-grade UI, bilingual interface, network blocking/rewriting/mocking/throttling, HAR import & export and more. One script tag gives any mobile page a full console.',
  themeConfig: {
    sidebar: enSidebar,
    footer: {
      message: 'Released under the MIT License.',
      copyright:
        'Copyright © 2024-present <a href="https://github.com/masgzy" target="_blank">masgzy</a>',
    },
    editLink: {
      pattern: 'https://github.com/masgzy/eruda-plus/edit/main/site/:path',
      text: 'Edit this page on GitHub',
    },
    docFooter: { prev: 'Previous', next: 'Next' },
    outline: { label: 'On this page' },
    lastUpdated: {
      text: 'Updated at',
      formatOptions: { dateStyle: 'short', timeStyle: 'medium' },
    },
    langMenuLabel: 'Language',
    returnToTopLabel: 'Back to top',
    sidebarMenuLabel: 'Menu',
    darkModeSwitchLabel: 'Theme',
    lightModeSwitchTitle: 'Switch to light theme',
    darkModeSwitchTitle: 'Switch to dark theme',
  },
})
