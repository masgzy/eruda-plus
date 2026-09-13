# Introduction to eruda-plus

eruda-plus is an all-round enhancement of [eruda](https://github.com/liriliri/eruda), the lightweight mobile web console. It keeps everything people love about eruda — zero configuration, one script tag, instant availability — and brings the whole experience up to the standard of Chrome DevTools. If you debug pages on phones, tablets or inside WebViews, eruda-plus gives you the same workflow you already know from the desktop.

The enhancements land on three layers. First, **visuals and interaction**: every panel is redrawn with the official DevTools design language, light and dark themes both use Chrome's own palettes, and details such as monospaced fonts, table density, scrollbar styling and tab indicators are matched pixel by pixel. Second, **bilingual UI**: all panel titles, table headers, timing phases, modal buttons and hints ship with both English and Simplified Chinese, following the system language by default and switchable in Settings without a page reload. Third, **network capabilities**: the network panel is largely rewritten, adding request blocking, URL rewriting, response mocking, throttling, HAR import/export and initiator tracking.

## Use Cases

- **Field debugging**: a user reports "there is an error on my phone" and you cannot reproduce it locally. Ask them to open eruda-plus and screenshot the console and network panel.
- **WebView troubleshooting**: when remote debugging is unavailable inside an app's WebView, eruda-plus is the fastest fallback.
- **Fault drills**: simulate slow endpoints, 500 errors and offline conditions with throttling and mocking to verify your degradation paths.
- **API integration**: temporarily block a third-party request or rewrite a staging URL to your local proxy without touching business code.

## Panels at a Glance

eruda-plus ships nine panels, all fully localized:

| Panel | Description |
| --- | --- |
| Console | Level filtering, object previews, DevTools-style error stacks, watch expressions, log preservation |
| Elements | DOM tree with search, style inspection, selector/XPath copy, event listener capture |
| Network | Request table, waterfall, blocking/rewriting/mocking/throttling, HAR, cURL copy, initiator |
| Resources | Local/Session Storage, Cookies, iframe list |
| Sources | Page HTML, script and stylesheet source with line numbers |
| Info | Device, OS, browser, page and timing environment details |
| Snippets | One-tap debugging scripts with custom persistence |
| Settings | Theme, language, transparency and per-panel behavior |
| EntryBtn | Draggable floating entry with opacity and size controls |

## Key Highlights

- **Zero-build integration**: a CDN script tag or one npm command; no bundler changes required.
- **Instant bilingual switching**: language changes replay through the settings system so every rendered panel updates immediately.
- **DevTools-style errors**: uncaught exceptions and rejections get `Uncaught` / `Uncaught (in promise)` prefixes, stacks are expanded by default, and each frame links to the source line.
- **Full network loop**: intercept, rewrite, simulate, throttle and export in a single panel.
- **Open source**: MIT licensed, hosted on [GitHub](https://github.com/masgzy/eruda-plus).

## Next Steps

- Read [Getting Started](/en/guide/getting-started) for integration and a guided tour.
- Check [Installation](/en/guide/installation) for CDN, npm and ESM options.
- Troubleshoot with the [FAQ](/en/guide/faq).
