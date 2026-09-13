# FAQ

Answers to the questions eruda-plus users ask most. Before digging in, make sure you are on the latest version — most historical issues are marked as fixed in the changelog.

## General

**The floating ball doesn't show up?**

First confirm `eruda.init()` actually ran: type `eruda && eruda._isInit` in the page console. Then check whether the page CSS sets `overflow: hidden` on `body` or collapses the mount container to zero height. Some sites hide foreign elements — try a different `container` in init. Finally rule out aggressive browser power-saving or forced-dark extensions.

**The page errors out or styles break after init?**

eruda-plus injects its own styles into the document; aggressive CSS resets on some sites can override panel styles. In that case file an [Issue](https://github.com/masgzy/eruda-plus/issues) with a screenshot and the site URL — we adapt case by case. Try incognito mode first to exclude extensions.

**How do I restore the native console?**

The console is restored automatically on destroy. To temporarily let logs through while eruda is active, turn off "Override Console" in Settings — logs then go to the native console only. For a full teardown call `eruda.destroy()`.

## Network Panel

**Why do some responses show no content?**

Binary responses (images) render as previews. Cross-origin responses without CORS headers never expose their body to scripts, so the pane stays empty — same as desktop DevTools. Requests intercepted by Service Workers follow their own rules.

**Why isn't my Mock rule matching?**

Check in order: is the rule enabled; does the pattern match the full URL (keyword matching is substring-based, so `/api` matches everything containing it); did an earlier rewrite change the URL before matching; was the request already blocked — blocking takes precedence over mocking. A starred status such as `200 *` means a mock hit.

**Which comes first, blocking or mocking?**

The chain is rewrite → block → mock → throttle. The rewritten URL feeds into blocking and mocking; blocked requests never reach mocks or the real network.

**Does throttling affect images?**

No. Throttling covers XHR and fetch; `<img>` and other resource loads are scheduled by the browser itself, the same limitation desktop DevTools has. For image-heavy weak-network testing, combine with system-level network conditioning.

## Errors & Stacks

**Source code looks truncated when I click a stack link?**

Very large files skip syntax highlighting to stay responsive, but line numbers and content remain complete. If you see "Failed to load source", the file is likely cross-origin or no longer served.

**Line numbers don't match my source?**

On minified production builds the numbers refer to the bundled artifact. If sourcemaps are published same-origin, Sources can show the mapped file; cross-origin maps are blocked by browser security policy.

## Publishing & Deployment

**What does the npm package contain?**

`dist/eruda.js` (full build), `dist/eruda-network-plus.js` (network-only plugin), type declarations and the README. Releases go through npm's OIDC trusted publishing; every release tag triggers the automated publish workflow.

**How do I disable the console in production?**

Gate initialization behind a URL parameter or env flag, e.g. `if (location.search.includes('debug')) eruda.init()`. Uninitialized, eruda-plus only costs the bundle load and intercepts nothing. If already initialized, `eruda.destroy()` removes it at runtime.

Still stuck? Search or ask on [GitHub Issues](https://github.com/masgzy/eruda-plus/issues) — replies usually land within 48 hours.
