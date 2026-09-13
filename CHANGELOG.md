# Changelog

所有针对本项目的显著变更都将记录于此文件。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 规范，
版本号遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/) 规范。

---

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- markdownlint-disable MD024 -->

## [Unreleased]

## [0.3.0] - 2026-09-13

DevTools 式报错呈现、DevTools 设置项补齐、Network 编程 API，以及官网全面 VitePress 化（EasyTier 同款设计语言）。

### 中文

#### 新增

- **DevTools 式报错（Console）**：未捕获异常自动加 `Uncaught`、未捕获的 Promise 拒绝自动加 `Uncaught (in promise)` 前缀（中文界面显示「未捕获」「未捕获（promise 中）」）；错误堆栈默认展开，`console.error` 显示调用者堆栈而非 eruda 内部堆栈；堆栈帧与消息行尾的 `文件:行号` 链接可点击，直达 Sources 面板并高亮对应行
- **DevTools 设置项补齐**：Console 新增「记录 XMLHttpRequest」（所有 XHR/fetch 请求回显到控制台，2xx 信息样式、其余错误样式）；Network 新增「禁用 HTTP 缓存」（开启后 fetch 强制 `cache: 'no-store'`、XHR 注入 `Cache-Control: no-cache`）
- **Network 编程 API**：`network.block(pattern) / unblock(pattern?) / mock(rule) / unmock(pattern?) / throttle(key) / throttleProfile(key) / exportHar()`，规则即时同步到规则面板 UI 并持久化，供脚本与自动化测试直接驱动
- **官网全面 VitePress 化**：彻底替换手写 HTML 站点，采用与 EasyTier 相同的技术栈与设计语言——`@theojs/lumen` 主题（水墨笔触标题 + 墨绿渐变 Hero）、无顶部链接栏、亮暗双主题、中英双语（zh 根路径 + /en/）、本地搜索中文化；首页介绍下方直接内嵌真实 eruda-plus 实测（非 iframe），测试动作折叠为「测试」下拉栏
- **双语文档站**：9 个指南页 × 2 语言（功能简介 / 快速上手 / 安装方式 / Console / Network / 其他面板 / 配置项 / 常见问题 / 路线图），路线图覆盖 Console/Elements/Resources/Sources/Info/Settings 全板块的 DevTools 化计划
- **CI**：新增 `publish.yml`——npm OIDC 可信发布（Trusted Publishing，无需 NPM_TOKEN，自动生成 provenance），推送 `v*` tag 或手动触发；`deploy-pages.yml` 修复损坏的 `branches` 触发器并改为 VitePress 构建

#### 变更

- **i18n**：Resources 的 iframe 分组译名修正为「框架」；新增报错与设置相关词条（未捕获 / 记录 XMLHttpRequest / 禁用 HTTP 缓存 等）
- `package.json` 的 `main` 修正指向 `dist/eruda.js`；README 在线体验链接更新为官网首页（demo.html 已移除）

### English

#### Added

- **DevTools-style errors (Console)**: uncaught exceptions are labelled `Uncaught`, unhandled promise rejections `Uncaught (in promise)` (localized in Chinese as 未捕获 / 未捕获（promise 中）); error stacks are expanded by default; `console.error` shows the caller's stack instead of eruda internals; stack frames and the trailing `file:line` link open the file in Sources with the line highlighted
- **DevTools settings parity**: Console gains "Log XMLHttpRequests" (echoes every XHR/fetch into the console); Network gains "Disable HTTP cache" (forces `cache: 'no-store'` on fetch, injects `Cache-Control: no-cache` on XHR)
- **Network programmatic API**: `network.block(pattern) / unblock(pattern?) / mock(rule) / unmock(pattern?) / throttle(key) / throttleProfile(key) / exportHar()`; rules sync into the rules panel UI live and persist
- **VitePress website**: the handwritten HTML site is fully replaced with the same stack and design language as EasyTier — `@theojs/lumen` theme (ink-brush hero underline + gradient), no top link bar, light/dark themes, bilingual zh/en locales with localized local search; the home page embeds a real eruda-plus console (no iframe) with all test actions folded into a collapsible dropdown
- **Bilingual docs**: 9 guide pages × 2 languages (introduction / getting started / installation / console / network / other panels / configuration / FAQ / roadmap) with a full DevTools-parity roadmap across all panels
- **CI**: new `publish.yml` — npm OIDC trusted publishing (no NPM_TOKEN, provenance generated), triggered by `v*` tags or manually; `deploy-pages.yml` fixes the corrupted `branches` trigger and builds with VitePress

#### Changed

- **i18n**: the Resources iframe group is now translated as 「框架」; new strings for errors and settings
- `package.json` `main` now points to `dist/eruda.js`; README live-demo links point to the site root (demo.html removed)

## [0.2.0] - 2026-09-13

以 Chrome DevTools 真实前端（chrome-devtools-frontend.appspot.com serve_rev，Chrome 151 同版）为像素级参照的 UI 保真版本；官网按 VitePress / EasyTier 设计语言重做并内嵌在线实测。

### 中文

#### 新增

- **筛选 Chips 对齐官方分组**：新增 `Manifest / WS / Wasm` 分组（共 12 个），未选中态带 1px 描边，选中态为色调蓝胶囊，与 DevTools 请求过滤条一致
- **状态码列着色**：2xx 绿 / 3xx 橙 / 4xx·5xx 红 / pending 灰 / 屏蔽 403 红，数字着色而非整行变色（对齐 DevTools）
- **HTTP 方法着色**：GET 蓝 / POST 绿 / PUT 橙 / DELETE 红 / PATCH 紫，窄屏一眼可辨
- **Network 空状态**：`正在录制网络活动` + `刷新页面` 按钮（对齐 DevTools "Currently recording network activity"）
- **详情面板 Provisional headers 黄色提示条**：请求标头缺失时显示（对齐 DevTools 同名机制），附官方文档链接
- **详情顶部单行化**：关闭按钮 + 七个 Tab + 重放/复制操作合并为一行，不再遮挡标头内容
- **移动端紧凑列**：<480px 自动隐藏 Type / Initiator 列，名称、方法、状态、瀑布图保持可读
- **官网重做**：VitePress（EasyTier 同款设计语言）极简风，首页直接内嵌 eruda-plus 在线实测（iframe 自动打开 Network 面板），支持亮暗主题切换

#### 变更

- **中文术语全表对齐 Chrome DevTools 官方 l10n**（zh.json 逐条核对）：标头 / 载荷 / 启动器 / 时间 / 瀑布 / 保留日志 / 已停用节流模式 / 屏蔽 / DNS 查找 / 初始连接 / 正在排队 / 已发送请求 / 下载内容 等；Sources → 来源、Snippets → 代码段、Event Listeners → 事件监听器
- **Overview 时序带重写**：按真实 timing 分段着色（排队灰 / DNS 青 / 连接橙 / SSL 紫 / 等待绿 / 下载蓝），失败整段红，与 DevTools NetworkOverview 行为一致
- **数据行高 21px → 24px**（触控友好），名称列改等宽字体（对齐 DevTools monospace 风格）
- **Timing 面板配色统一**为 DevTools NetworkTimingColumn 同款色板
- **键值表样式**：键名改为常规灰色（对齐官方），状态码前加彩色圆点

### English

#### Added

- **Filter chips aligned with official groups**: added `Manifest / WS / Wasm` (12 total), unselected pills with 1px outline, selected with tonal-blue fill, matching the DevTools request filter bar
- **Status column coloring**: 2xx green / 3xx amber / 4xx·5xx red / pending gray / blocked 403 red — the number is painted, not the whole row
- **HTTP method coloring**: GET blue / POST green / PUT amber / DELETE red / PATCH purple
- **Network empty state**: "Currently recording network activity" with a "Reload page" button, matching DevTools
- **Provisional headers banner** in the detail view when request headers are unavailable, with the official docs link
- **Single-row detail header**: close button + seven tabs + replay/copy actions on one line, no more overlap
- **Compact mobile columns**: below 480px the Type / Initiator columns hide automatically
- **New website**: VitePress design language (same family as the EasyTier site) with an embedded live demo that auto-opens the Network panel, plus light/dark toggle

#### Changed

- **All Chinese terms aligned with Chrome DevTools official zh-CN l10n** (verified against zh.json)
- **Overview band now paints real timing segments** per request, matching NetworkOverview behavior
- **Row height 21px → 24px** for touch; request names rendered in monospace
- **Timing panel palette** unified with NetworkTimingColumn colors

## [0.1.1] - 2026-09-13

UI 保真度版本：将网络面板与全局设计令牌进一步对齐 Chrome DevTools 官方源码。

### 中文

#### 变更

- **网络面板新增 Waterfall（时间线）列**：构建版列表与插件形态对齐，彩色分段按全局时间轴对齐（与 DevTools NetworkWaterfallColumn 同色系：DNS 青 / 连接黄 / SSL 紫 / 等待绿线 / 下载蓝），失败请求整条红色
- **Overview 时间轴重写**：采用 DevTools NetworkOverview.js 同款常量（3px 条带 / 5px 顶部留白 / 最小 10px 条宽），改为中性的双主题可读配色
- **设计令牌对齐 Material 3（devtools-frontend design_system_tokens.css）**：主色 `#1a73e8` → `#0b57d0`（primary40），选中行 `#e8f0fe` → `#d3e3fd`（primary90），工具栏底色 → `#f1f4fa`（surface1），正文 `#202124` → `#1f1f1f`（neutral10），暗色选中行 → `#004a77`（tonal container）
- **数据网格密度对齐 networkLogView.css**：表头 27px / 数据行 21px / 12px 字号，新增 1px 列分隔线，选中行为色调蓝底而非实色蓝底
- **筛选 Chip 重绘**：无边框透明底，选中态浅蓝胶囊（DevTools filter 风格）
- **移除数据表格斑马纹**（DevTools 所有表格均无斑马纹），修复暗色主题下原生斑马纹白底穿透的问题

#### 修复

- 暗色主题下部分数据行被 luna 原生斑马纹渲染为白底，导致"白底白字"不可读的问题

### English

UI fidelity release: aligns the Network panel and global design tokens closer
to the official Chrome DevTools source.

#### Changed

- **New Waterfall column in the Network list**: the full build now matches the
  plugin form — colored segments aligned to a global timeline using the same
  palette as DevTools' NetworkWaterfallColumn (cyan DNS / yellow connecting /
  purple SSL / green waiting line / blue download); failed requests render a
  full red bar
- **Overview timeline rewritten** with the exact constants from DevTools'
  NetworkOverview.js (3px bands / 5px padding / 10px min band width) and
  theme-neutral readable colors
- **Design tokens aligned to Material 3** (devtools-frontend
  design_system_tokens.css): primary `#1a73e8` → `#0b57d0` (primary40),
  selection `#e8f0fe` → `#d3e3fd` (primary90), toolbar → `#f1f4fa` (surface1),
  text `#202124` → `#1f1f1f` (neutral10), dark selection → `#004a77`
- **Data grid density per networkLogView.css**: 27px header / 21px rows /
  12px font, 1px column separators, tonal-blue selection instead of solid blue
- **Filter chips redrawn**: borderless with a tonal pill for the active chip
  (DevTools filter style)
- **Zebra stripes removed** from all data grids (DevTools has none), which
  also fixes the native luna zebra leaking through in dark theme

#### Fixed

- Rows rendered with a white background under dark theme caused by luna's
  native `tr:nth-child(even)` zebra color

## [0.1.0] - 2026-09-13

首个开源版本。基于 [eruda](https://github.com/liriliri/eruda) v3.4.3 深度增强，
全面对齐 Chrome DevTools 的视觉与交互体验。

### 中文

#### 新增

**Network 网络面板（对标 Chrome DevTools + 借鉴 ProxyPin）**

- DevTools 风格界面：工具栏、9 个快捷筛选 Chip（All / Fetch/XHR / JS / CSS / Img / Media / Font / Doc / WS）、Overview 时间轴画布（高分屏适配）、七列可排序表格（Name / Status / Type / Initiator / Size / Time / Waterfall 迷你瀑布列）、底部状态栏（请求数 / 传输量 / 总耗时）
- 详情六页签：Headers（请求/响应头，含 General 区）、Payload、Preview（JSON 树形预览）、Response、Initiator（调用链）、Timing（Queueing / Stalled / DNS / TCP / SSL / Request / Response 七段时序瀑布）
- 680px 阈值自动分屏，列表与详情同屏对照
- 请求阻断（Block）：URL 黑名单，支持字面量与 `/regex/` 规则，fetch 与 XMLHttpRequest 双通道拦截并模拟 403
- Rewrite 重写：自上而下依次匹配的 URL 重写规则
- Mock 响应：自定义 status / contentType / body，fetch 返回真实 `Response`，XHR 经属性拦截模拟
- 网络节流（Throttling）：Slow 3G / Fast 3G / Offline 三档
- HAR 1.2 导入 / 导出；Copy as fetch / Copy as cURL 一键复制
- 搜索：支持纯文本与 `/regex/` 正则，支持 `-` 排除语法
- 失败请求（4xx / 5xx / 网络错误）红色高亮

**全工具国际化（i18n）**

- 覆盖全部内置工具：Console / Elements / Network / Resources / Sources / Info / Snippets / Settings 及导航、弹窗、通知
- 默认跟随系统语言（`navigator.language`），可在设置中手动切换中文 / English，即时生效、无需刷新，选择持久化

**Console 控制台**

- Live Expressions 实时表达式监控：Watch 面板（最多 6 个表达式，1s 自动求值，错误红色高亮，点值跳转 Sources）
- 内联筛选框：支持 `/regex/` 正则与普通文本，Esc 快捷清除（替代原弹窗式筛选）
- Preserve Log 保留日志：页面刷新后自动恢复最近 300 条日志，带时间戳与分隔线

**Elements 元素面板**

- DOM 搜索：CSS 选择器优先、全文文本降级匹配，支持 ↑/↓/Enter 导航与 x/y 计数
- Copy selector / Copy XPath 一键复制

**其他**

- Network Preserve Log：刷新后恢复最近 100 条请求（含详情、Initiator）
- 独立插件形态 `eruda-network-plus.js`：无需改造源码，挂在官方 eruda 上即可获得增强网络面板
- 提供 `patch/` 目录：基于 v3.4.3 的 `git apply` 补丁
- 本地演示服务（`demo/server.js`）与在线演示站点

#### 变更

- 全局设计令牌对齐 Chrome DevTools：亮色（`#ffffff` / `#f1f3f4` / `#1a73e8`）与暗色（`#202124` / `#292a2d` / `#8ab4f8`）双主题、13px 基准字号、等宽字体栈、扁平弹窗与细滚动条
- 工具栏与图标视觉重绘，导航选中态增加 DevTools 式顶部指示条
- 上游 17 套第三方主题兼容性不受影响（仅替换令牌值，不改结构）

#### 修复

- 被阻断请求经 chobitsu 二次捕获导致的重复记录问题
- 跨域响应缺失 `Timing-Allow-Origin` 时时序信息降级为总时长展示
- fetch 拦截层参数透传错误导致的请求参数丢失问题

#### 下载

- `dist/eruda.js` —— 增强版完整构建（单文件、零依赖）
- `dist/eruda-network-plus.js` —— 独立网络面板插件
- `patch/eruda-devtools-edition.patch` —— 基于 eruda v3.4.3 的源码补丁

### English

Initial open-source release. Deeply enhanced on top of
[eruda](https://github.com/liriliri/eruda) v3.4.3 to bring the full
Chrome DevTools experience to mobile web debugging.

#### Added

**Network panel (Chrome DevTools style, inspired by ProxyPin)**

- DevTools-style UI: toolbar, 9 quick filter chips (All / Fetch/XHR / JS / CSS / Img / Media / Font / Doc / WS), overview timeline canvas (HiDPI aware), 7-column sortable table (Name / Status / Type / Initiator / Size / Time / mini Waterfall), status bar (requests / transferred / total time)
- Six detail tabs: Headers (with General section), Payload, Preview (JSON tree), Response, Initiator (call chain), Timing (7-segment waterfall: Queueing / Stalled / DNS / TCP / SSL / Request / Response)
- Automatic split view at 680px for side-by-side list and detail
- Request blocking: URL blacklist with literal and `/regex/` rules, intercepting both fetch and XMLHttpRequest with simulated 403
- Rewrite: ordered URL rewrite rules (literal and `/regex/`)
- Mock responses: custom status / contentType / body — real `Response` for fetch, property interception for XHR
- Network throttling: Slow 3G / Fast 3G / Offline
- HAR 1.2 import / export; Copy as fetch / Copy as cURL
- Search: plain text and `/regex/` patterns with `-` exclusion syntax
- Failed requests (4xx / 5xx / network errors) highlighted in red

**Global i18n for every tool**

- Covers all built-in tools: Console / Elements / Network / Resources / Sources / Info / Snippets / Settings plus nav, modals and notifications
- Defaults to system language (`navigator.language`); manual Chinese / English switch in Settings takes effect instantly without reload and persists

**Console**

- Live Expressions: watch panel (up to 6 expressions, 1s auto evaluation, red highlighting on errors, click value to jump into Sources)
- Inline filter input: `/regex/` and plain text modes, Esc to clear (replaces the old modal filter)
- Preserve Log: automatically restores the last 300 log entries after reload, with timestamps and a session divider

**Elements**

- DOM search: CSS selector first with full-text fallback, ↑/↓/Enter navigation and x/y counter
- Copy selector / Copy XPath buttons

**Misc**

- Network Preserve Log: restores the last 100 requests (with details and Initiator) after reload
- Standalone plugin `eruda-network-plus.js`: plug the enhanced Network panel onto official eruda without touching source
- `patch/` directory: `git apply` patch based on eruda v3.4.3
- Local demo server (`demo/server.js`) and online demo site

#### Changed

- Global design tokens aligned with Chrome DevTools: light (`#ffffff` / `#f1f3f4` / `#1a73e8`) and dark (`#202124` / `#292a2d` / `#8ab4f8`) themes, 13px base font size, monospace data font stack, flat modals and slim scrollbars
- Redrawn toolbar and icons; DevTools-style top indicator on active navigation items
- All 17 upstream third-party themes keep working (token values only, no structural change)

#### Fixed

- Duplicated entries caused by chobitsu double-capturing blocked requests
- Timing info gracefully degrades to total duration when cross-origin responses lack `Timing-Allow-Origin`
- Lost request arguments caused by mis-forwarded arguments in the fetch interception layer

#### Downloads

- `dist/eruda.js` — enhanced full build (single file, zero dependencies)
- `dist/eruda-network-plus.js` — standalone network panel plugin
- `patch/eruda-devtools-edition.patch` — source patch based on eruda v3.4.3

[Unreleased]: https://github.com/masgzy/eruda-plus/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/masgzy/eruda-plus/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/masgzy/eruda-plus/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/masgzy/eruda-plus/releases/tag/v0.1.0
