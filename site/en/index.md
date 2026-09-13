---
layout: home

hero:
  name: eruda-plus
  text: An all-round enhancement for mobile debugging
  tagline: "✨ Built on eruda, benchmarked against Chrome DevTools — bilingual UI, network blocking/rewriting/mocking/throttling, HAR import & export"
  image:
    src: /eruda-hero.svg
    alt: eruda-plus panel preview
  actions:
    - theme: brand
      text: Get Started
      link: /en/guide/getting-started
    - theme: alt
      text: Live Demo
      link: #live-demo
    - theme: alt
      text: GitHub
      link: https://github.com/masgzy/eruda-plus

features:
  - title: DevTools-grade UI
    details: Pixel-faithful Chrome DevTools typography and palette,<br>with official light & dark themes.
    link: /en/guide/introduction
  - title: Bilingual
    details: Every panel title, table header, timing phase and modal<br>is localized. Follows the system language out of the box.
    link: /en/guide/config
  - title: Request Blocking
    details: Block any request by keyword or regex;<br>blocked entries show up as 403 in the network panel.
    link: /en/guide/network
  - title: Rewriting & Mocking
    details: URL rewrite plus response mock — simulate 500s and<br>slow endpoints even on static pages.
    link: /en/guide/network
  - title: Network Throttling
    details: Slow 3G / Fast 3G / Offline at one tap.<br>See how your page behaves on a weak network.
    link: /en/guide/network
  - title: HAR Import / Export
    details: Interoperates with Chrome DevTools and proxies.<br>Archive or replay captured traffic as HAR.
    link: /en/guide/network
  - title: DevTools-style Errors
    details: Uncaught exceptions are labelled automatically;<br>stack frames link straight to the source line.
    link: /en/guide/console
  - title: Zero-build Setup
    details: One script tag from the CDN — or npm / ESM,<br>whichever fits your workflow.
    link: /en/guide/installation
  - title: Open Source
    details: MIT licensed. Stars, issues and PRs are all welcome —<br>let's polish it together.
    link: https://github.com/masgzy/eruda-plus
---

## Live Demo <a id="live-demo"></a>

This section is the real eruda-plus — not a screenshot, not an iframe. Once the page loads, an eruda floating ball appears at the bottom-right corner; tap it to open the full console, elements and network panels. Unfold the "测试" (Test) dropdown below to simulate logs, errors, slow networks and mocks, then inspect the results inside the panels.

<LiveDemo />

::: tip Best viewed on a phone (or mobile emulation)
eruda-plus is designed for touch-first mobile screens but works fine on desktop too. Long-press and drag the floating ball if it overlaps your content.
:::

## Quick Start

One script tag gives any mobile page a full console:

```html
<script src="//cdn.jsdelivr.net/gh/masgzy/eruda-plus@0.2.0/dist/eruda.js"></script>
<script>eruda.init()</script>
```

Or install from npm:

```bash
npm install eruda-plus
```

```js
import eruda from 'eruda-plus'

eruda.init()
// Need blocking / mocking / throttling?
const network = eruda.get('network')
network.block('/api/private')
network.mock({ url: '/api/user', response: { status: 500, body: '{"err":1}' } })
```

Read the [Getting Started](/en/guide/getting-started) guide and the [feature walkthrough](/en/guide/tools) for more.

## Why plus

eruda gave mobile pages a console; eruda-plus asks whether it is actually good to use: does it look like DevTools, can Chinese users read it, can you simulate offline or slow networks, can you archive issues from the field. To that end we rewrote most of the network panel, adopted the DevTools design language across the UI, and filled in the daily essentials — error stacks, HAR, request editing. The full evolution plan lives in the [roadmap](/en/guide/roadmap).

<Underline />
