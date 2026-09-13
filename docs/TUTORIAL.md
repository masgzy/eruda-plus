# eruda-network-enhanced · DevTools Edition 使用教程

> 把手机上的 eruda 整体变成「移动端版 Chrome DevTools」，并把 Network 面板升级为 ProxyPin 式抓包工具
>
> 适用版本：v3.0.0（基于 eruda v3.4.3）
>
> **v3 重大变化**：不再只美化 Network —— ① eruda **全部面板**（控制台/元素/资源/源代码/信息/设置/导航栏）都按 Chrome DevTools 亮暗双主题重塑；② **全部工具**支持中英文（默认跟随系统语言，设置里手动切换）；③ 新增源码补丁 `patch/eruda-devtools-edition.patch`（50 文件，可直接提 PR）

---

## 目录

1. [这是什么](#1-这是什么)
2. [功能总览](#2-功能总览)
3. [三十秒上手（插件方式，推荐）](#3-三十秒上手插件方式推荐)
4. [三十秒上手（源码替换方式）](#4-三十秒上手源码替换方式)
5. [界面导览](#5-界面导览)
6. [中英文双语](#6-中英文双语)
7. [请求筛选：chips、正则、排除](#7-请求筛选chips正则排除)
8. [请求详情：六个标签页](#8-请求详情六个标签页)
9. [重放与复制：Replay / cURL / fetch / 响应](#9-重放与复制replay--curl--fetch--响应)
10. [HAR 导入与导出](#10-har-导入与导出)
11. [阻断（Block）：拦截请求返回模拟 403](#11-阻断block拦截请求返回模拟-403)
12. [重写（Rewrite）：请求前改写 URL](#12-重写rewrite请求前改写-url)
13. [Mock：自定义响应，不访问网络](#13-mock自定义响应不访问网络)
14. [网络节流：Slow 3G / Fast 3G / Offline](#14-网络节流slow-3g--fast-3g--offline)
15. [Initiator：定位请求发起的源码位置](#15-initiator定位请求发起的源码位置)
16. [Live Expressions：实时表达式监控（v3.1）](#16-live-expressions实时表达式监控v31)
17. [Preserve Log：刷新不丢日志（v3.1）](#17-preserve-log刷新不丢日志v31)
18. [Console 内联筛选（v3.1）](#18-console-内联筛选v31)
19. [Elements：DOM 搜索与复制选择器（v3.1）](#19-elementsdom-搜索与复制选择器v31)
20. [运行 Demo](#20-运行-demo)
21. [JavaScript API](#21-javascript-api)
22. [常见问题 FAQ](#22-常见问题-faq)

---

## 1. 这是什么

`eruda-network-plus` 是 [eruda](https://github.com/liriliri/eruda)（移动端网页调试控制台）的 Network 面板增强方案。eruda 自带的 Network 面板只有一张请求列表，本工具把它补齐到接近桌面端 Chrome DevTools 的体验，同时吸收了抓包工具 [ProxyPin](https://github.com/wanghongenpin/proxypin) 的核心能力：**阻断、重写、Mock、节流**。

提供两种交付形态，按需选择：

| 形态 | 文件 | 适合谁 |
|------|------|--------|
| A. 独立插件 | `eruda-network-plus.js`（UMD 单文件，零依赖，约 60KB） | 已在使用官方 eruda，不想替换文件，通过 `eruda.add()` 挂载 |
| B. 增强构建 | `eruda.js`（eruda 全量构建，Network 已重构）或 `patch/eruda-network-enhanced.patch` | 想深度定制 / 提 PR 到 eruda 官方 |

## 2. 功能总览

**界面（对标 Chrome DevTools Network 面板）**

- 工具栏：录制开关、清空、HAR 导出/导入、规则面板、网络节流下拉框、中英文切换
- 类型筛选 chips：全部 / Fetch-XHR / JS / CSS / 图片 / 媒体 / 字体 / 文档 / 其他
- Overview 概览图：按时间轴绘制全部请求（绿=成功、红=失败、橙=重定向、蓝=Mock），点击可折叠
- 请求列表：Name / Status / Type / Initiator / Size / Time 列，全部可排序；构建版内嵌七段式瀑布列
- 底部状态栏：请求总数、传输大小、Finish 总耗时、失败数（点击可筛选失败请求）

**调试能力**

- 请求捕获：fetch + XHR 双通道、响应体、请求/响应头、Cookie
- 详情面板：Headers / Payload / Preview（JSON 树、图片预览）/ Response / Cookies / Initiator / Timing（七段式瀑布：Queueing、DNS、Connect、SSL、Sent、TTFB、Download）
- 请求重放（Replay）
- 复制为 cURL / 复制为 fetch 代码 / 复制响应内容
- HAR 1.2 导出（可导入 Charles、Chrome DevTools）与 HAR 导入回放查看
- Initiator 列 + 发起者标签页：显示发起请求的 `源文件:行号`

**DevTools 功能对齐（v3.1 新增，Console / Elements 面板）**

- Live Expressions：Console 眼睛图标，实时表达式监控，每秒自动求值
- 内联筛选：Console 漏斗图标展开输入框，支持 `/regex/`，Esc 清除
- Preserve Log：刷新后自动恢复日志（Console，300 条）与请求（Network，100 条）
- DOM 搜索：Elements 放大镜图标，文本 / CSS 选择器 + 计数 + 上下导航
- Copy selector / Copy XPath：`{ }` 与 `//` 按钮，一键复制唯一选择器或标准 XPath

**ProxyPin 式规则（在「滑块」图标面板中配置）**

- 阻断（Block）：命中规则的请求不访问服务器，直接返回模拟的 HTTP 403
- 重写（Rewrite）：请求发出前改写 URL（字面替换或正则替换），支持接口迁移、环境切换
- Mock：命中的请求不访问网络，直接返回自定义 状态码 / Content-Type / 响应体
- 网络节流（Throttling）：Slow 3G / Fast 3G / Offline，验证弱网与断网页面表现

**所有规则与界面语言均持久化在 localStorage**，刷新页面、下次访问依然生效。

## 3. 三十秒上手（插件方式，推荐）

第 1 步：把 `eruda-network-plus.js` 放到你的站点或 CDN。

第 2 步：页面中按顺序引入：

```html
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script src="eruda-network-plus.js"></script>
<script>
  eruda.init()
  eruda.remove('network')            // 移除官方内置 Network 面板
  eruda.add(new erudaNetworkPlus())  // 挂载增强版，标签名显示为 network+
</script>
```

第 3 步：手机打开页面，点击右下角悬浮球，切到 `network+` 面板，随便触发几个请求即可看到列表。

> 注意：必须先 `eruda.remove('network')` 再 `add`，否则两套面板会同时记录请求（数据会重复）。

## 4. 三十秒上手（源码替换方式）

如果不想用插件，直接用增强构建替换官方文件：

```html
<!-- 用本仓库的 eruda.js 代替官方 eruda -->
<script src="eruda.js"></script>
<script>eruda.init()</script>
```

工具名仍然是 `network`，无需任何额外代码。

想自己维护源码：把 `patch/eruda-network-enhanced.patch` 应用到 eruda v3.4.3 源码上：

```bash
git clone https://github.com/liriliri/eruda.git
cd eruda && git checkout v3.4.3
git apply /path/to/eruda-network-enhanced.patch
npx webpack --config build/webpack.prod.js   # 产物在 dist/eruda.js
```

修改涉及 4 个文件：`src/Network/{Network.js, Detail.js, util.js, Network.scss}`。

## 5. 界面导览

打开面板后自上而下分五段：

```
┌──────────────────────────────────────────┐
│ ● ⊘ ⬇ ⬆ ☰      [不限速 ▾] [中文]  │ ← 工具栏
│ 全部 Fetch/XHR JS CSS 图片 …  [筛选框] │ ← 类型 chips + 搜索
│ ▁▂▅▃▁▆▂▄ (按时间轴的彩色概览图)         │ ← Overview
│ Name  Status  Type  Initiator  Size  Time│ ← 请求列表（可排序）
│ …                                        │
│ 8 个请求 | 608B 已传输 | 完成 1.2s | 2 失败│ ← 状态栏
└──────────────────────────────────────────┘
```

- **录制按钮 ●**：红色为录制中；熄灭后新请求不再进入列表（调试时先关录制再触发噪音请求很实用）
- **Overview 概览图**：每根条代表一个请求，颜色即状态；条的位置和宽度对应发生时间与耗时。点击整条区域可折叠/展开
- **状态栏 failed 数字**：点击切换「只看失败请求」，再点一次恢复

## 6. 中英文双语（v3：全界面生效）

v3 起 i18n 覆盖 eruda **每一个工具**，不再是仅 Network 面板：

- **默认跟随系统语言**：`navigator.language` 以 `zh` 开头显示中文，其余显示英文
- **切换入口 ①**：设置（Settings）→ **语言 / Language** 下拉（跟随系统 / English / 中文）
- **切换入口 ②**：Network 面板工具栏的 `中文 / EN` 快捷按钮（两处双向同步）
- **切换即时生效**，无需刷新，包括：
  - 底部导航工具名：控制台 / 元素 / 网络 / 资源 / 源代码 / 信息 / 代码片段 / 设置
  - Console：级别页签（全部/信息/警告/错误）、过滤弹窗标题、取消/执行按钮、全部设置项
  - Elements：属性 / 样式 / 计算样式 / 事件监听 标题、刷新/复制提示
  - Resources：本地存储 / 会话存储 / Cookie 标题、表头 键/值、各刷新提示
  - Info：位置 / 用户代理 / 设备（屏幕/视口/像素比）/ 系统（操作系统/浏览器）/ 赞助此项目 / 关于
  - Snippets：全部脚本名称与描述（元素边框 / 刷新页面 / 搜索文本…）
  - Settings：主题（跟随系统/浅色/深色）、透明度、显示大小等全部条目
  - 弹窗按钮：确定 / 取消（联动 luna-modal 内建 i18n）
  - Network：全部界面、表头列名（名称/方法/状态/类型/发起者/大小/耗时）、时序七段（排队等待/DNS 解析/…）
- 语言选择保存在 `localStorage`（键 `eruda-lang`），刷新后保持
- 构建版编程接口：`eruda.get().config.set('language', 'zh' | 'en' | 'auto')`；插件版：`erudaNetworkPlus.setLang('zh' | 'en')`
- **主题搭配**：设置 → 主题 可选 19 套配色；其中「浅色 / 深色」已按 Chrome DevTools 官方调色板重塑（其余 Material/Dracula 等保留原样）

> 插件方式的说明：插件只能覆盖自身 Network 面板的样式与语言；其他内置工具是官方 eruda 构建时写死的，插件无法翻译。需要全套效果请使用方式 A（`eruda.js` 完整构建）或源码补丁。

## 7. 请求筛选：chips、正则、排除

三套筛选可叠加使用：

1. **类型 chips**：点击即按资源类型过滤（依据 Content-Type 与 URL 后缀综合判断）
2. **搜索框**，支持三种语法（可组合、空格分隔）：
   - 普通关键字：`api` — 匹配 URL / 方法 / 文件名包含 `api` 的请求
   - 正则：`/user\/\d+/` — 两根斜杠包裹的部分按正则匹配
   - 排除：`-track` — 剔除包含 `track` 的请求
   - 组合示例：`/api -/track|log/` 表示「包含 api 但不含 track 或 log」
3. **失败筛选**：点击状态栏红色 `N 失败`

## 8. 请求详情：六个标签页

点击任意请求打开详情（插件在手机上直接进入详情；构建版在窄屏需点工具栏的“眼睛”图标，宽屏 ≥680px 自动左右分屏）：

| 标签页 | 内容 |
|--------|------|
| Headers | 常规（URL / 方法 / 状态码，若被重写会附「原始网址」）+ 响应头 + 请求头 + 查询参数，被阻断/Mock 的请求会显示红/蓝提示条 |
| Payload | 表单数据（urlencoded 自动解析成表格）、JSON 载荷自动美化 |
| Preview | JSON 自动渲染成可折叠的语法高亮树；图片直接预览 |
| Response | 原始响应文本 + 大小与类型元信息 |
| Cookies | `document.cookie` 可见的部分（HttpOnly 的 Cookie 页面 JS 拿不到，属浏览器安全限制） |
| Initiator | 发起这次请求的 `源文件:行号` |
| Timing | 七段式耗时瀑布：Queueing → DNS → Initial Connection → SSL/TLS → Request Sent → Waiting (TTFB) → Content Download，附总耗时 |

> Timing 依赖 Performance API。跨域接口若未返回 `Timing-Allow-Origin` 头，浏览器不暴露阶段数据，此时仅展示总耗时并有提示——这是浏览器安全策略，不是 bug。

## 9. 重放与复制：Replay / cURL / fetch / 响应

详情页右上角四个动作：

- **▶ Replay**：用原方法、原头、原请求体重新发起一次请求；新记录会出现在列表顶部区域，方便对比接口变化
- **cURL**：复制等价的 curl 命令（含方法、头、`--data-raw`），可直接贴到终端
- **{ } fetch**：复制等价的 `fetch()` 代码片段，贴回 Console 即可复现请求
- **复制响应**：复制响应体文本

## 10. HAR 导入与导出

- **导出 ⬇**：把当前全部记录（含重写前的原始 URL 标记、七段 timings、`_initiator` 扩展字段）导出为标准 **HAR 1.2** 文件，可直接用 Chrome DevTools 或 Charles 打开
- **导入 ⬆**：选择 `.har` 文件，记录会以只读形式并入列表（带 `har-` 前缀 id），适合把桌面端抓包带到手机上查看、或保留问题现场

## 11. 阻断（Block）：拦截请求返回模拟 403

工具栏「滑块」图标 → **阻断** 标签：

1. 勾选「开启阻断」
2. 文本框每行一条规则：
   - 字面子串：`/api/track` — URL 包含该子串即命中
   - 正则：`/track|analytics/` — 两根斜杠包裹
   - `#` 开头的行是注释
3. 点「保存」

命中后：请求**完全不发出**（Network 层面无任何流量），页面拿到一个模拟的 403 响应；列表中该请求显示 `已阻断`（红色、文件名划线）。适合验证「埋点/广告脚本被拦截后页面是否正常」。

## 12. 重写（Rewrite）：请求前改写 URL

滑块面板 → **重写** 标签 → 「+ 添加规则」：

```
[✓] 启用  [/api/v1/old]  →  [/api/v1/new]   [×]
```

- 匹配模式：字面子串或 `/正则/`（正则全局替换）
- 替换为：替换文本
- 规则自上而下依次生效；勾选框控制单条启用
- 修改即时保存（无需点保存按钮），对后续所有 fetch / XHR 生效

典型用法：

| 场景 | 模式 | 替换为 |
|------|------|--------|
| 接口迁移 | `/api/v1` | `/api/v2` |
| 切换测试环境 | `https://prod.example.com` | `https://test.example.com` |
| 加参数 | `?v=1` | `?v=2&debug=1` |

列表中的重写请求显示最终 URL；详情页 Headers 会多一行「原始网址（重写前）」。

## 13. Mock：自定义响应，不访问网络

滑块面板 → **Mock** 标签 → 「+ 添加规则」：

- 匹配模式：字面子串或 `/正则/`
- 状态码：如 `200`、`404`、`500`
- Content-Type：如 `application/json`
- 响应体：任意文本（JSON 字符串最常用）

命中的请求**完全不访问服务器**，直接收到合成响应：

- fetch 通道：返回真正的 `Response` 对象，`res.json()` 等方法全部可用
- XHR 通道：模拟 `status` / `responseText` / `getResponseHeader` / `load` 事件，axios 等库无感知

列表中 Mock 记录的状态码带星号（如 `200 *`，蓝色），详情页顶部有蓝色提示条说明该响应来自 Mock 规则。适合：后端接口未就绪时先联调前端、构造异常响应测试容错逻辑。

## 14. 网络节流：Slow 3G / Fast 3G / Offline

工具栏下拉框，三种档位：

| 档位 | 行为 |
|------|------|
| Slow 3G | 400ms 固定延迟 + 按响应大小模拟下载耗时（约 400kbps） |
| Fast 3G | 150ms 延迟 + 约 1.4Mbps 下载模拟 |
| Offline | fetch 直接 `TypeError: Failed to fetch`；XHR 触发 `error` 事件、`status=0` |

细节说明：

- fetch 通道完整模拟「发前延迟 + 下载时长」；XHR 通道在发送前加延迟（浏览器不暴露 XHR 的流式下载钩子，下载整形仅 fetch 可做到）
- 节流会叠加在阻断/Mock 之后：被 Mock 的请求不受 Offline 影响（合成响应不经过网络）
- 选择即时生效并持久化

## 15. Initiator：定位请求发起的源码位置

捕获钩子在记录请求的同时解析 `new Error().stack`，过滤掉钩子自身帧后取第一个脚本帧：

- 列表 **Initiator 列**：`index.html:87` 这样的缩写
- 详情 **发起者标签页**：完整 `file:line:col`，长按可复制

典型用途：页面上十几个埋点请求不知道谁发的？点开 Initiator 直接定位到业务代码行。

## 16. Live Expressions：实时表达式监控（v3.1）

Console 工具栏最右边的 **眼睛图标 👁** 点击展开 Watch 面板（Chrome DevTools 同款交互）：

- 底部输入框输入任意 JS 表达式后回车，例如：
  - `window.innerWidth` —— 实时观察窗口宽度（旋转屏幕/缩放时变化）
  - `document.querySelectorAll('li').length` —— 观察 DOM 数量
  - `store.getState().user.name` —— 观察 Redux/Vuex 状态
- 面板内最多 6 个表达式，**每秒自动求值**，手动执行代码后也会立即刷新
- 求值出错（如引用未定义变量）以红色显示错误信息，不影响其他表达式
- **点击值** 可跳转到 Sources 面板深挖对象内部结构
- 表达式保存在 localStorage，下次打开页面自动恢复并展开面板
- 每行右侧 × 删除该表达式

## 17. Preserve Log：刷新不丢日志（v3.1）

eruda 挂在页面里，传统上页面一刷新日志和请求记录就全没了。v3.1 借鉴 DevTools 的 Preserve log：

**Console 侧**：设置 → Console → 打开「保留日志 / Preserve Log」。之后每次刷新/跳转前自动保存最近 300 条日志，回来后日志面板顶部出现灰色斜体分隔线「恢复自上次页面会话」，下方按原级别着色（错误红/警告黄）列出恢复的日志，并带 `HH:mm:ss` 时间戳。

**Network 侧**：Network 工具栏筛选条右侧勾选「保留日志」。刷新后自动恢复最近 100 条请求（半透明显示），URL/方法/状态/类型/大小/耗时/发起者/响应体全部保留 —— 恢复的请求可以直接进详情、Replay、Copy as cURL。

两个开关独立持久化，数据存 `sessionStorage`（`eruda-preserved-console` / `eruda-preserved-network`），单次上限约 300KB，超出自动放弃（不影响页面本身）。

## 18. Console 内联筛选（v3.1）

老版本点漏斗图标弹出输入框，v3.1 改为 DevTools 式内联筛选：

- 点击 Console 工具栏漏斗图标，日志区上方展开输入框
- 输入即过滤；支持两种模式：
  - 普通文本：`payment` —— 只显示包含该关键字的日志
  - 正则：`/paid|refund/i` —— 包裹在斜杠内按正则匹配
- `Esc` 一键清空并收起；`filter()` JavaScript API 行为不变（编程式过滤仍显示在工具栏）

## 19. Elements：DOM 搜索与复制选择器（v3.1）

**DOM 搜索**（DevTools Ctrl+F 同款）：

1. Elements 工具栏点击放大镜图标，展开搜索栏
2. 输入内容后自动搜索，支持两种模式：
   - **CSS 选择器**：`.grid button`、`#login-form`、`div > p:nth-child(2)`、`img[alt]`
   - **文本**：选择器无匹配时自动降级为全文搜索（如 `登录`、`Submit`），大小写不敏感
3. 计数器显示 `当前 / 总数`；`Enter` 或 ↓ 跳到下一个，`Shift+Enter` 或 ↑ 上一个
4. 命中节点自动选中：DOM 树高亮定位，桌面分屏时右侧同步打开属性/样式详情
5. `Esc` 或 × 关闭搜索栏

**复制选择器 / XPath**：

- 选中节点后，工具栏 `{ }` 按钮复制该元素的唯一 CSS 选择器，如 `#app > div.main:nth-of-type(2) > ul.nav`
- `//` 按钮复制标准 XPath，如 `//*[@id="app"]/div[2]/ul[1]`
- 复制成功有 Copied 通知；非元素节点时按钮置灰

## 20. 运行 Demo

仓库内附带零依赖 Node 演示服务器与两个演示页：

```bash
cd demo
node server.js 3456
# 浏览器打开（建议用无头浏览器或手机访问 http://<局域网IP>:3456）
#   http://localhost:3456/index.html        ← 方式 A：增强构建
#   http://localhost:3456/plugin-demo.html  ← 方式 B：原版 eruda + 插件
```

两个演示页都预置了演示规则（阻断 `/api/track`、重写 `/api/legacy/data → /api/json`、Mock `/api/user/123`），页面上每个按钮对应一类请求场景，逐个点击对照面板观察即可。

## 21. JavaScript API

插件形态暴露的静态成员：

```js
erudaNetworkPlus.version   // '2.0.0'
erudaNetworkPlus.setLang('zh')  // 或 'en'，立即生效并持久化
erudaNetworkPlus.getLang() // 'zh' | 'en'
```

工具实例（构建版 `eruda.get('network')`，插件版 `eruda.get('network+')`）：

```js
const tool = eruda.get('network+')
tool.requests()   // 当前全部记录数组（含 url/status/headers/resTxt/timing 等）
```

每条记录的形状（可用于自动化断言）：

```js
{
  id, name, url, originalUrl,   // originalUrl 仅被重写过的请求存在
  method, status, type, subType,
  size, time, startTime,
  reqHeaders, resHeaders, resTxt,
  done, blocked, mock, netError,
  initiator: { file, line, col },
  chipType,                     // 资源分类：xhr/js/css/img/...
}
```

## 22. 常见问题 FAQ

**Q1：Cookie 标签页里看不到某些 Cookie？**
`document.cookie` 拿不到 `HttpOnly` Cookie，这是浏览器安全模型决定的。如需完整 Cookie 请用真机抓包工具（如 ProxyPin）。

**Q2：Timing 只有总耗时，没有七段明细？**
跨域响应缺少 `Timing-Allow-Origin` 头时浏览器不暴露阶段计时。调试自有接口时在后端加上该头即可看到完整瀑布。

**Q3：Slow 3G 下 XHR 请求的总耗时没有明显变长？**
XHR 通道的节流只模拟「发送前延迟」（浏览器不提供流式下载拦截）；fetch 通道是完整模拟。需要严格弱网测试请用系统级代理工具。

**Q4：图片 / 静态资源为什么不出现在列表里？**
捕获范围是页面发起的 fetch 与 XHR。构建版经由 eruda 的 chobitsu 层，也以 XHR/fetch 为主。页面静态 `<img>`/`<script>` 标签的加载不在捕获范围内（与 eruda 官方行为一致）。

**Q5：规则会立即生效吗？**
会。重写/Mock/节流修改即时保存即时生效；阻断文本框点「保存」后生效。全部规则存于 localStorage，跨刷新保留。

**Q6：和官方 eruda Network 面板有什么区别？**
官方面板提供基础列表与详情；本工具在其上补齐了 DevTools 的筛选/排序/概览/Initiator/预览/HAR 导入，以及 ProxyPin 的阻断/重写/Mock/节流，并增加中英文双语界面。

**Q7：二次开发注意什么？**
构建版基于 eruda 源码，模板字符串会经 licia 的 html parser 做 class 前缀处理——**模板里禁止使用 `<input ... />` 自闭合写法**（parser 会返回空串），请写 `<input ...>`。样式使用 `var(--xxx)` 保持主题兼容，深色主题下颜色变量自动适配。
