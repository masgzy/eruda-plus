# Roadmap

The goal of eruda-plus is to be "plus in every direction": not just the network panel, but DevTools-grade experience for every panel. This page tracks the plan publicly. Order roughly reflects priority, but community feedback reshuffles it constantly — if you care about an item, say so on [Issues](https://github.com/masgzy/eruda-plus/issues) or grab it yourself.

## ✅ Done (v0.1.0 – v0.2.0)

- **DevTools-aligned UI**: light/dark themes with the official Chrome palettes; tables, scrollbars, modals and indicators matched pixel by pixel.
- **Bilingual UI**: ~230 strings covering every panel, following the system language with instant manual switching.
- **Network panel rewrite**: seven-column table + waterfall + overview, multi-tab details (Headers/Response/Preview/Initiator/Timing), failure counter badge.
- **Request editing suite**: blocking (keyword/regex), URL rewriting, response mocking, throttling (Slow 3G / Fast 3G / Offline), all persisted.
- **HAR import/export**: interoperable with DevTools and proxies such as ProxyPin, with replay support.
- **DevTools-style errors**: `Uncaught` / `Uncaught (in promise)` prefixes, stacks expanded by default, frames linking to highlighted source lines, caller stacks for `console.error`.
- **DevTools settings parity**: Log XMLHttpRequests, Disable HTTP cache.
- **Programmatic API**: `network.block / unblock / mock / unmock / throttle / exportHar`, driving the live demo on this site.
- **VitePress website**: EasyTier-style design language (ink-brush hero) with a real console embedded on the home page.

## 🚧 In Progress

- **Mobile density**: tighter row heights and paddings so headers never truncate at 320px.
- **Network details**: WebSocket frame viewer, request body formatting enhancements, Copy as fetch with credentials.

## 📋 Planned

### Console

- **Command Line API**: `$` / `$$` / `$0`, `copy()`, `inspect()`, `monitorEvents()`, `getEventListeners()` and friends.
- **Live Expressions**: toolbar expressions showing live values.
- **Filtering upgrades**: cross-group level filters, per-source filters, regex highlighting.
- **Timing panel**: console.time data as a Gantt view.

### Elements

- **Box model visualizer**: nested Margin/Border/Padding/Content diagram with inline editing.
- **Pseudo classes & elements**: `::before / ::after` content plus `:hover / :active` forcing.
- **CSS editor**: declaration-level add/edit/disable with a color picker.
- **DOM breakpoints**: subtree/attribute/removal breakpoints (pending feasibility).

### Resources

- **IndexedDB & Web SQL**: object store browsing and record CRUD.
- **Cache Storage**: Service Worker cache inspection and deletion.
- **Quota view**: per-origin storage usage.

### Sources

- **Breakpoints**: line breakpoints with pause/step (long-term, pending debugger protocol feasibility).
- **Pretty-print**: one-tap formatting of minified code.
- **Search**: cross-file full-text search.

### Info / Settings

- **Performance snapshot**: lightweight FPS and memory timelines (not a full profiler).
- **Settings import/export**: share panel configurations as JSON.
- **Live theme following**: react to `prefers-color-scheme` changes without reload.

## Long-term Directions

- **Plugin system**: third-party panel extensions behind a standard interface.
- **Remote collaboration**: shareable debug links with a captured snapshot of the session.
- **Performance budgets**: alerts on asset weight and request count.

> Plans change; delivery rhythm is best tracked on [Releases](https://github.com/masgzy/eruda-plus/releases), where every version ships bilingual notes.
