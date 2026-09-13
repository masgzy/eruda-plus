# Network

The network panel is where eruda-plus departs most from stock eruda — it is largely rebuilt around the Chrome DevTools information architecture. It covers the full request lifecycle: capture, filtering, inspection, editing (block/rewrite/mock), throttling and export. This page walks through each module.

## Request Table & Details

Requests appear in a seven-column table: name, method, status, type, size, time and waterfall. The waterfall aligns every request on a shared timeline with color-coded queueing, waiting and download phases. Clicking a row opens the detail view with:

- **Headers**: general info (URL, method, status) plus the full request and response header lists.
- **Response / Preview**: the raw body and a formatted preview; JSON expands as a tree.
- **Initiator**: where the request was triggered from, answering "who sent this?".
- **Timing**: queueing, DNS, connection, waiting and download phases.

The toolbar filters by type (All / Doc / XHR / JS / CSS / Img / Failed) and supports keyword and regex text filters. The `{ }` button copies the request as a fetch call; the cURL button generates a terminal-ready command for instant replay.

## Blocking

Open the rules panel from the toolbar; the first tab is Blocked. Enter match patterns (one per line, keyword or `/regex/`) and toggle the enable switch — every matching request is then intercepted:

- Blocked entries appear with status 403 and a `blocked` badge.
- fetch receives the synthetic `Blocked by eruda` response; XHR behaves like a dropped connection.
- Rules persist in localStorage and survive reloads.

Typical uses: silencing a misbehaving third-party script, testing ad-blocker impact, or suppressing analytics to clean up the log.

## Rewriting

The Rewrite tab maps `pattern → replacement` pairs applied to the URL before the request leaves the page. Rewriting runs first in the chain — the rewritten URL is what blocking and mocking later see. Common scenarios:

- Rewrite `https://api.example.com` to `http://localhost:3000` so a real device talks to your local server.
- Swap staging and production domains to compare behavior.
- Maintain per-environment switch rules for the same endpoint.

## Mocking

The Mock tab synthesizes complete responses: status code, Content-Type and body are all yours to define. Mocked requests carry a starred status such as `200 *` to distinguish them from real traffic, and each rule has its own enable switch plus a multi-line JSON body editor.

Combine it with the home page "测试" (Test) dropdown for an instant demo: add a `500 + {"code":500}` mock for `/mock-demo`, fire the request, and watch the full "server error" chain appear in both the console and the network panel. Like other rules, mocks persist across sessions.

## Throttling

The throttle dropdown in the toolbar mirrors DevTools profiles:

| Profile | Latency | Bandwidth |
| --- | --- | --- |
| None | 0 | unlimited |
| Slow 3G | 400ms | 50 KB/s |
| Fast 3G | 150ms | 180 KB/s |
| Offline | — | fully blocked |

Throttling affects both XHR and fetch: requests queue with the profile latency, then download at the profiled bandwidth. Offline rejects immediately with a network error, ideal for verifying offline fallbacks. Programmatic control works too: `eruda.get('network').throttle('slow3g')`.

## HAR Import / Export

- **Export**: the toolbar download button packages the current log into a standard HAR file, ready to drag into desktop DevTools.
- **Import**: HAR captures from proxies (ProxyPin, Charles) or DevTools can be replayed here; entries appear in their original order with full detail inspection.

## Quick Language Switch

The 中/EN button at the toolbar's right end switches the entire UI language without leaving the panel — headers, timing phases and status badges translate instantly. It is a shortcut equivalent to the language option in Settings.
