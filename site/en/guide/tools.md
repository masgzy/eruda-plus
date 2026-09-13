# Other Panels

Besides the two flagship panels — Console and Network — eruda-plus keeps every base panel from eruda, each aligned with DevTools and fully localized. This page sketches their capabilities and common tricks so you have the complete map.

## Elements

Inspect the DOM tree and styles. The tree supports collapsing, node highlighting and attribute editing; the search bar accepts either plain text (searches content) or a CSS selector for precise targeting. The context menu offers "Copy selector" and "Copy XPath" for automation scripts.

The style view lists every rule source for the selected node: inline styles, stylesheet rules and computed styles. Enabling "Catch Event Listeners" in Settings additionally reveals all event listeners bound to a node.

## Resources

The resources panel aggregates storage and frame info:

- **Local Storage / Session Storage**: key-value tables with add, edit and delete.
- **Cookies**: name, value, domain, path, expiry and friends for the current origin.
- **Frames**: every iframe on the page; click through to inspect each frame's own resources.

All headers and buttons are localized; terminology matches the DevTools UI.

## Sources

View page HTML, script and stylesheet sources. The left tree groups resources by type; the right pane renders the selection read-only with line numbers and long-line wrapping, skipping highlighting for very large files to stay smooth. Files clicked from console stack traces land here with the line highlighted — console errors and Sources are wired together.

## Info

One page with the whole runtime: device model, screen resolution and pixel ratio, OS and browser versions, current URL and referrer, the page load timeline, timezone and language. When "only some devices break", a screenshot of this panel usually pins down the differentiator.

## Snippets

A set of built-in one-tap scripts — dump all cookies, hide all images, visualize touch targets and more. Add your own snippets with persistence to share team-wide debugging one-liners.

## Settings

The control center, grouped per tool:

- **General**: theme (Light / Dark / system), language (中文 / English / auto), transparency, display size.
- **Console**: async rendering, JS execution, catch global errors, override console, auto-show on error, extra info, object inspection switches, preserve log, log XMLHttpRequests, max log number.
- **Network**: disable HTTP cache (the DevTools namesake — forces fetch/XHR to bypass caches).
- **Sources / Resources / Elements**: line numbers, auto refresh, hide eruda's own requests and more.
- **Restore defaults**: clear all local configuration and reload.

Changes apply instantly and persist automatically. Language switching replays recorded settings operations so every open panel follows along.

## EntryBtn

The floating ball is the entry point: tap to open or collapse, long-press and drag to reposition (snapping to screen edges), and tune its opacity in Settings. While the deck is open, the top navigation switches between tools.

## Next Steps

- What's coming for these panels? Read the [Roadmap](/en/guide/roadmap).
- Programmatic control is documented in the API section of [Configuration](/en/guide/config).
