<div align="center">

# eruda-plus

**A Chrome DevTools-grade debugging console for mobile web**

Fully enhanced on top of [eruda](https://github.com/liriliri/eruda): DevTools-style UI,
bilingual (zh/en) tooling, request blocking / rewrite / mock / throttling, HAR import & export,
Live Expressions, DOM search and more…

[![Release](https://img.shields.io/github/v/release/masgzy/eruda-plus?logo=semver&color=1a73e8)](https://github.com/masgzy/eruda-plus/releases)
[![License: MIT](https://img.shields.io/github/license/masgzy/eruda-plus?color=8ab4f8)](./LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/masgzy/eruda-plus?style=flat&logo=github&color=fbbc04)](https://github.com/masgzy/eruda-plus/stargazers)
[![Site](https://img.shields.io/website?url=https%3A%2F%2Feruda.cc.cd&logo=googlechrome&color=34a853)](https://eruda.cc.cd)
[![Upstream](https://img.shields.io/badge/upstream-eruda%20v3.4.3-blueviolet)](https://github.com/liriliri/eruda)

[简体中文](./README.md) | English

**🌐 Website: <https://eruda.cc.cd>**

<img src="./docs/screenshots/v3_en_network_desktop.png" alt="eruda-plus Network Panel" width="880">

</div>

## ✨ Features

### 🎨 Full DevTools makeover for every tool

- **Design tokens aligned with Chrome DevTools**: light / dark themes, compact 13px typography,
  monospace data fonts, flat modals, slim scrollbars, active-nav indicator
- Covers **every built-in tool** — Console / Elements / Network / Resources / Sources / Info /
  Snippets / Settings — while keeping all 17 upstream third-party themes compatible

### 🌍 Global i18n

- Defaults to your system language (`navigator.language`); switch **中文 / English** manually in Settings
- Instant switch without reload; the choice persists

### 🛜 Network panel (DevTools style, inspired by [ProxyPin](https://github.com/wanghongenpin/proxypin))

- **9 filter chips, overview timeline, 7-column sortable table, mini waterfall, status bar, auto split view**
- **Six detail tabs**: Headers / Payload / Preview (JSON tree) / Response / Initiator (call chain) /
  Timing (7-segment waterfall)
- **Request blocking**: URL blacklist (literal + `/regex/`), intercepting both fetch and XHR with simulated 403
- **Rewrite / Mock response / Throttling** (Slow 3G / Fast 3G / Offline)
- **HAR 1.2 import & export, Copy as fetch / cURL, regex search, red highlighting for failed requests, Preserve Log**

### 🧰 DevTools parity features

| Tool | New capabilities |
| --- | --- |
| Console | Live Expressions, inline filter input (regex), Preserve Log |
| Elements | DOM search (selector + full-text fallback), Copy selector / Copy XPath |
| Network | Preserve Log (with details and Initiator) |

## 📦 Installation

### CDN (recommended)

```html
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init();</script>
```

Use the enhanced build from this repository:

```html
<script src="https://cdn.jsdelivr.net/gh/masgzy/eruda-plus@0.1.0/dist/eruda.js"></script>
<script>eruda.init();</script>
```

> Pin to `@main` for the latest build: `https://cdn.jsdelivr.net/gh/masgzy/eruda-plus@main/dist/eruda.js`

### Network panel only (standalone plugin)

Don't want to replace the whole eruda? Plug in the standalone plugin on top of official eruda:

```html
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script src="https://cdn.jsdelivr.net/gh/masgzy/eruda-plus@0.1.0/dist/eruda-network-plus.js"></script>
<script>
  eruda.init();
  eruda.remove('network');
  eruda.add(new window.erudaNetworkPlus());
</script>
```

### npm

> The npm package is coming soon. Please use the CDN options above for now.

```bash
npm install eruda-plus   # not published yet, stay tuned
```

```js
import erudaPlus from 'eruda-plus';

erudaPlus.init();
```

### Source patch

Apply the enhancements to any eruda v3.4.3 source tree:

```bash
git clone https://github.com/liriliri/eruda.git eruda && cd eruda
git checkout v3.4.3
git apply /path/to/eruda-devtools-edition.patch
npx webpack --config build/webpack.prod.js
```

## 🚀 Quick start

```html
<script src="./dist/eruda.js"></script>
<script>
  eruda.init();

  // Network: block / rewrite / mock / throttle (also configurable in the "Rules" panel)
  eruda.get('network').block('/api\\/tracker/');
  eruda.get('network').rewrite('http://old.api.com', 'http://new.api.com');
  eruda.get('network').mock('/api/user', { status: 200, body: '{"mock":true}' });
  eruda.get('network').throttle('slow3g');

  // Console: live expressions
  eruda.get('console').watch('performance.now()');

  // Elements: DOM search
  eruda.get('elements').search('.item');

  // Language (follows system by default, can be pinned)
  eruda.setConfig('settings:lang', 'en'); // 'en' | 'zh'
</script>
```

## 🖼️ Screenshots

| Chinese · Network | English · Desktop split view |
| :---: | :---: |
| ![Chinese Network](./docs/screenshots/v3_zh_network.png) | ![Split view](./docs/screenshots/v3_en_detail_split.png) |

| Rules panel (block / rewrite / mock) | Console · Watch + Preserve Log |
| :---: | :---: |
| ![Rules panel](./docs/screenshots/v3_en_rules.png) | ![Console](./docs/screenshots/08-console-watch-preserve-zh.png) |

| Elements · DOM search | Dark theme · Network Preserve Log |
| :---: | :---: |
| ![DOM search](./docs/screenshots/10-elements-dom-search-zh.png) | ![Dark](./docs/screenshots/12-network-preserve-dark.png) |

See more in [docs/screenshots](./docs/screenshots/).

## 🧪 Run the demo locally

```bash
git clone https://github.com/masgzy/eruda-plus.git
cd eruda-plus
node demo/server.js   # zero dependencies
# open http://localhost:3456           → enhanced full build demo
# open http://localhost:3456/plugin    → official eruda + standalone plugin demo
```

Try it online: <https://eruda.cc.cd/demo.html>

## 📖 Documentation

- [Changelog](./CHANGELOG.md) — following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
- Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- 图文使用教程（18 章，中文）：[docs/TUTORIAL.md](./docs/TUTORIAL.md)

## 🗺️ Roadmap

- [ ] Publish to the npm registry (GitHub + jsdelivr work today)
- [ ] Enhanced WebSocket / SSE capture
- [ ] More locales (日本語 / Español …)
- [ ] Request diff view
- [ ] Cloud sync & import/export for rules

Suggestions are welcome via Issues / PRs!

## 🤝 Contributing

All kinds of contributions are welcome:

1. Fork the repo and create a feature branch (`git checkout -b feat/amazing-feature`)
2. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/en/) (`feat: ...`, `fix: ...`)
3. Push the branch and open a Pull Request

Local development:

```bash
npm install
npx webpack --config build/webpack.dev.js   # dev server
npx eslint .                                # lint
```

## 🙏 Acknowledgements

- [eruda](https://github.com/liriliri/eruda) — this project is built on top of its v3.4.3 source; thanks [@liriliri](https://github.com/liriliri) for the outstanding work
- [ProxyPin](https://github.com/wanghongenpin/proxypin) — design inspiration for block / rewrite / mock
- [Chrome DevTools (devtools-frontend)](https://github.com/ChromeDevTools/devtools-frontend) — UI / UX reference
- [licia](https://github.com/liriliri/licia) / [luna](https://github.com/liriliri/luna) components / [chobitsu](https://github.com/liriliri/chobitsu)

> ⚠️ This project is not affiliated with Google Chrome or the official Chrome DevTools. "DevTools" only describes the UI style and the feature alignment goal.

## 📄 License

[MIT](./LICENSE) © liriliri (original eruda) & masgzy and eruda-plus contributors (enhancements)
