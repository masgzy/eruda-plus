import { defineConfig } from 'vitepress'

import { en } from './en.mts'

// ---------------------------------------------------------------------------
// eruda-plus official site — VitePress, EasyTier-style.
//
// Design language copied from easytier.cn (EasyTier/easytier.github.io):
//   - No custom top bar; the default VitePress nav only carries the logo,
//     search box, language dropdown, theme switch and the GitHub icon.
//   - The ink-brush underline + gradient hero name comes from the lumen
//     theme (`@theojs/lumen`), injected on the home page via <Underline />.
//   - zh is the root locale, English lives under /en/.
// ---------------------------------------------------------------------------

const zhSidebar = [
  {
    text: '开始',
    items: [
      { text: '功能简介', link: '/guide/introduction' },
      { text: '快速上手', link: '/guide/getting-started' },
      { text: '安装方式', link: '/guide/installation' },
      { text: '常见问题', link: '/guide/faq' },
    ],
  },
  {
    text: '功能指南',
    link: '/guide/tools',
    items: [
      { text: '控制台 Console', link: '/guide/console' },
      { text: '网络 Network', link: '/guide/network' },
      { text: '其他面板', link: '/guide/tools' },
    ],
  },
  {
    text: '其他',
    items: [
      { text: '配置项', link: '/guide/config' },
      { text: '路线图', link: '/guide/roadmap' },
      { text: '更新日志', link: 'https://github.com/masgzy/eruda-plus/releases' },
      { text: '参与贡献', link: 'https://github.com/masgzy/eruda-plus/issues' },
    ],
  },
]

const zhSearch = {
  translations: {
    button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
    modal: {
      noResultsText: '无法找到相关结果',
      resetButtonTitle: '清除查询条件',
      footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
    },
  },
}

export default defineConfig({
  base: '/',
  lastUpdated: true,
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh',
      title: 'eruda-plus - 移动端网页调试的全方位增强',
      description:
        'eruda-plus 在 eruda 的基础上全方位增强：Chrome DevTools 级界面、中英双语、网络面板屏蔽/重写/Mock/节流、HAR 导入导出，一行脚本即可为任意移动页面装上调试台。',
      themeConfig: {
        sidebar: zhSidebar,
        footer: {
          message: '基于 MIT License 许可发布',
          copyright:
            '版权所有 © 2024-present <a href="https://github.com/masgzy" target="_blank">masgzy</a>',
        },
        editLink: {
          pattern:
            'https://github.com/masgzy/eruda-plus/edit/main/site/:path',
          text: '在 GitHub 上编辑此页面',
        },
        docFooter: { prev: '上一页', next: '下一页' },
        outline: { label: '页面导航' },
        lastUpdated: {
          text: '最后更新于',
          formatOptions: { dateStyle: 'short', timeStyle: 'medium' },
        },
        langMenuLabel: '多语言',
        returnToTopLabel: '回到顶部',
        sidebarMenuLabel: '菜单',
        darkModeSwitchLabel: '主题',
        lightModeSwitchTitle: '切换到浅色模式',
        darkModeSwitchTitle: '切换到深色模式',
      },
    },
    en: { label: 'English', ...en },
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'author', content: 'masgzy' }],
    [
      'meta',
      {
        name: 'keywords',
        content:
          'eruda-plus, eruda, mobile console, devtools, 移动端调试, 网络面板',
      },
    ],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'eruda-plus' }],
    ['meta', { property: 'og:site_name', content: 'eruda-plus' }],
    [
      'meta',
      {
        property: 'og:description',
        content: '移动端网页调试的全方位增强 —— Chrome DevTools 级体验',
      },
    ],
    ['link', { rel: 'canonical', href: 'https://eruda.cc.cd' }],
  ],
  sitemap: { hostname: 'https://eruda.cc.cd' },
  themeConfig: {
    siteTitle: 'eruda-plus',
    logo: '/logo.svg',
    search: {
      provider: 'local',
      options: { locales: { root: { ...zhSearch } } },
    },
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/masgzy/eruda-plus',
        ariaLabel: 'GitHub',
      },
    ],
  },
  vite: {
    build: { chunkSizeWarningLimit: 2048 },
  },
})
