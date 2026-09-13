# Installation

eruda-plus offers several integration paths to match different project shapes. All of them deliver the same build with identical features; they differ only in delivery channel and module format. The rule of thumb: use the CDN for ad-hoc debugging, npm for engineered projects, and console injection for pages you cannot modify.

## CDN

The recommended zero-cost path. jsDelivr serves the file from the edge node closest to your users:

```html
<script src="//cdn.jsdelivr.net/gh/masgzy/eruda-plus@0.2.0/dist/eruda.js"></script>
<script>eruda.init()</script>
```

- Pin the version (`@0.2.0`) for stability, or use `@latest` to always track the newest release.
- `eruda.js` bundles every tool into a single file; no extra plugins needed.
- If you only need the network enhancements (smaller footprint), load `eruda-network-plus.js` alongside stock eruda.

## npm

For projects with a build pipeline. npm makes version pinning and TypeScript hints easy, and lets you load the console conditionally:

```bash
npm install eruda-plus
```

```js
import eruda from 'eruda-plus'

if (import.meta.env.DEV || /debug/.test(location.search)) {
  eruda.init()
}
```

Here the console only appears in development or when the URL carries a `debug` parameter, keeping production bundles clean.

Package essentials:

| Field | Value |
| --- | --- |
| Package | `eruda-plus` |
| Current version | 0.2.0 |
| Entry | `dist/eruda.js` |
| License | MIT |

## ESM

For pages without a bundler, consume the module build through esm.sh or a similar service:

```html
<script type="module">
  import eruda from 'https://esm.sh/eruda-plus@0.2.0'
  eruda.init()
</script>
```

## Console Injection

For pages you cannot edit, inject dynamically from the desktop console or a WebView inspector:

```js
;(function () {
  const s = document.createElement('script')
  s.src = 'https://cdn.jsdelivr.net/gh/masgzy/eruda-plus@0.2.0/dist/eruda.js'
  s.onload = () => eruda.init()
  document.head.appendChild(s)
})()
```

Save it as a bookmarklet to summon the console on any page with one click.

## Init Options

`eruda.init()` accepts a configuration object:

```js
eruda.init({
  container: document.body,   // mount node
  tool: ['console', 'elements', 'network'], // partial panels
  autoScale: true,            // auto scaling on mobile
})
```

All panels are enabled by default; add or remove them at runtime with `eruda.add()` / `eruda.remove()`.

## Versions & Updates

- Release notes live on the [Releases](https://github.com/masgzy/eruda-plus/releases) page.
- npm users can check with `npm outdated eruda-plus`.
- CDN users should pin versions and read the changelog before upgrading.
