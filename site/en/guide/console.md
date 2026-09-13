# Console

The console is the most-used panel in eruda-plus and one of the focus areas of this enhancement. It is built on the luna-console rendering engine and extends it with Chrome DevTools' error presentation conventions: red error background, expandable call stacks, clickable source links, and the `Uncaught` prefix family. Everyday abilities — logging, object inspection, expression evaluation, timing — are all covered.

## Logging & Levels

The toolbar provides `All / Info / Warning / Error` level tabs, matching DevTools behavior. Other toolbar buttons:

- **Clear**: wipe the current logs; Preserve Log sessions only affect the current buffer.
- **Filter**: plain text or `/regex/`, e.g. `/timeout/i` matches all timeout-related logs.
- **Copy**: select a log entry, then copy it to the clipboard.
- **Watch (eye icon)**: open the watch panel, add expressions and re-evaluate them every second — perfect for tracking value changes.

Object logs expand to reveal all properties, including unenumerable ones and getter values, mirroring the DevTools inspector.

## DevTools-style Errors

This is the flagship enhancement. Three error classes are rendered as follows:

**console.error calls**. The message is displayed as-is (no wrapping `Error:` prefix), followed by the *caller's* stack — the line of your business code that invoked `console.error`, not eruda internals. The stack is expanded by default on the red error background with the error icon, exactly like DevTools.

**Uncaught exceptions**. Prefixed automatically with `Uncaught` (「未捕获」in Chinese):

```
Uncaught TypeError: Cannot read properties of undefined (reading 'foo')
    at renderWidget (app.js:120:15)
```

**Uncaught promise rejections**. Prefixed with `Uncaught (in promise)` (「未捕获（promise 中）」), supporting both Error objects and arbitrary rejection values.

Every `file:line` in the stack is clickable. eruda-plus fetches the file, opens it in the Sources panel and highlights the corresponding line — the same experience as clicking a stack link in desktop DevTools. The stack block toggles collapsed/expanded when the row is clicked.

## Log XMLHttpRequests

Settings now include the DevTools switch "Log XMLHttpRequests". When enabled, every XHR and fetch is echoed into the console as an info-level entry:

```
XHR finished loading: GET /api/user [200]
Fetch finished loading: POST /api/login [401]
```

2xx statuses use the normal info style while everything else is highlighted as an error, making failed requests pop out. The switch is off by default and takes effect immediately — no reload needed.

## Preserve Log

With "Preserve Log" enabled, the last 300 logs are restored after a page reload, preceded by a divider reading "Restored from the previous page session". Mobile WebViews get killed and restarted by the OS all the time; this feature keeps crucial errors available across restarts.

## More Abilities

- **Full console API**: `log / info / warn / error / debug / dir / table / time / timeEnd / count / countReset / assert / group / groupCollapsed / groupEnd`, with native semantics.
- **JS execution**: the bottom input evaluates arbitrary JavaScript with multi-line editing; results echo back as output entries.
- **Max log number**: unbounded by default, adjustable to 250 / 125 / 100 / 50 / 10 to protect long-running pages.
- **Auto-show on error**: with this switch on, any error log pops the console open — great for field devices.
