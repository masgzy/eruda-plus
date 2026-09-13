# Getting Started

This page gets you from zero to a full debugging session in about three minutes. Whether your project is a classic multi-page site, a SPA or a static page, the recipe is the same: load the script, call init, then tap the floating ball. Everything else — panels, language, theming — is ready out of the box.

## 1. Add the Script

The simplest path is the jsDelivr CDN. Drop these two lines before `</body>` on any page you want to debug:

```html
<script src="//cdn.jsdelivr.net/gh/masgzy/eruda-plus@0.2.0/dist/eruda.js"></script>
<script>eruda.init()</script>
```

If you prefer npm, install and initialize on demand:

```bash
npm install eruda-plus
```

```js
import eruda from 'eruda-plus'

eruda.init()
```

For the network-only plugin, direct ESM usage or console injection, see [Installation](/en/guide/installation).

## 2. Open the Console

Once initialized, a translucent floating ball appears at the bottom-right of the page. Tap it to expand the full-screen tool deck; tap again to collapse. The ball can be long-pressed and dragged anywhere, and the Settings panel lets you tune transparency and deck height.

The top navigation lists every tool: Console, Elements, Network, Resources, Sources, Info, Snippets and Settings. Titles follow the system language; you can also switch languages manually in Settings and every panel updates immediately.

## 3. A Guided Debugging Session

Walk through a typical failing-API scenario end to end:

1. **Produce an error.** Type `fetch('/api/not-exist')` in the console input, or use the "测试" (Test) dropdown on the home page.
2. **Inspect the error.** Switch to the Console panel: the failure appears as a DevTools-style red entry with the stack expanded. Click the `xxx.js:12` frame to jump to Sources with the line highlighted.
3. **Check the network.** In the Network panel the request shows a red status code. Open the entry to browse Headers, Response, Preview, Initiator and Timing tabs.
4. **Simulate a fix.** Open the rules panel, add a Mock rule for `/api/not-exist` returning 200, and repeat the request — the mocked status carries a `*` marker.
5. **Archive it.** Export the session as a HAR file and attach it to your bug report.

## 4. Essential Settings

Behavior is configurable in the Settings panel or through `init()` options. The most-used switches:

| Option | Description |
| --- | --- |
| Theme | Light / Dark / system, using the official DevTools palettes |
| Language | 中文 / English / system, applied instantly |
| Catch Global Errors | Route uncaught exceptions and rejections into the console |
| Preserve Log | Restore the previous session's logs after a reload |
| Log XMLHttpRequests | Echo every request into the console, DevTools-style |

The full list with defaults lives in [Configuration](/en/guide/config).

## Next Steps

- Learn advanced console tricks in [Console](/en/guide/console).
- Master blocking, rewriting, mocking and throttling in [Network](/en/guide/network).
- See where plus is heading in the [Roadmap](/en/guide/roadmap).
