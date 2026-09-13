# Configuration

eruda-plus exposes two configuration layers: options passed to `eruda.init()` (mount point, enabled tools) and runtime switches in the Settings panel (per-panel behavior). Both persist automatically and survive reloads.

## Init Options

```js
eruda.init({
  container: document.body, // mount node
  tool: [...],              // panels to enable
  autoScale: true,          // auto scaling on mobile
})
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `container` | Element | `document.body` | Node the console mounts into |
| `tool` | Array | all panels | Which panels appear in the navigation, e.g. `['console','network']` |
| `autoScale` | Boolean | `true` | Scale the deck on mobile to avoid oversizing |

## Global API

```js
eruda.init()               // initialize
eruda.show('network')      // open and focus a panel
eruda.hide()               // collapse the deck
eruda.destroy()            // tear down and restore overridden console
eruda.position({x, y})     // read/set the floating ball position
eruda.scale(1)             // read/set the scale
eruda.get('network')       // fetch a panel instance (its API is callable)
eruda.add(tool)            // register a custom panel
eruda.remove(name)         // remove a panel
```

## Network Panel API

The network panel instance exposes programmatic controls for scripts and automated tests:

```js
const network = eruda.get('network')

// Blocking: add patterns (keyword or /regex/) and enable
network.block('/api/private')
network.unblock('/api/private')  // remove one
network.unblock()                // disable and clear

// Mocking: flat or nested shape
network.mock({
  url: '/api/user',
  response: { status: 500, contentType: 'application/json', body: '{"code":500}' },
})
network.unmock('/api/user')      // remove; omit to clear all

// Throttling: none | slow3g | fast3g | offline
network.throttle('slow3g')
network.throttle('none')

// HAR: the current log as a HAR object
const har = network.exportHar()
```

Rules sync into the rules panel UI (refreshed live when open) and persist to localStorage.

## Runtime Settings Reference

| Group | Setting | Default | Description |
| --- | --- | --- | --- |
| General | Theme | System preference | Light / Dark / system plus 17 extended themes |
| General | Language | auto | `auto` / `en` / `zh`, applied instantly |
| Console | Catch Global Errors | on | Route uncaught errors and rejections to the console |
| Console | Override Console | on | Intercept window.console into the panel |
| Console | Display Extra Information | off | Show time and source per log |
| Console | Preserve Log | off | Restore logs after reload |
| Console | Log XMLHttpRequests | off | Echo XHR/fetch into the console |
| Console | Max Log Number | infinite | Cap the buffer to protect memory |
| Network | Disable HTTP cache | off | Force fetch/XHR to bypass HTTP caches |
| Sources | Show Line Numbers | on | Line numbers in source view |
| Elements | Catch Event Listeners | off | Capture node event listeners |

## Persistence

Configuration lives in `localStorage` under `eruda`-prefixed keys: language, network rules, preserve-log and so on each get their own namespace. The "Restore defaults and reload" button at the bottom of Settings clears every `eruda*` key and reloads — handy after a misconfiguration or an upgrade. In storage-restricted environments (private mode), eruda-plus degrades to in-memory config with full functionality intact.
