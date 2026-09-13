# 控制台 Console

控制台是 eruda-plus 使用频率最高的面板，也是本次增强的重点之一。它基于 luna-console 渲染引擎，并在此基础上补齐了 Chrome DevTools 的报错呈现规范：红色错误底、可展开的调用堆栈、可点击的源码链接、以及 `Uncaught` 系列前缀。日常的日志输出、对象检查、表达式求值、性能计时等能力一应俱全。

## 日志与分级

顶部工具条提供 `全部 / Info / Warning / Error` 四个级别页签，点击即可过滤对应日志，与 DevTools 的行为一致。控制条上还有几个实用按钮：

- **清空**：清除当前日志，保留日志开启时只影响当前会话。
- **筛选**：支持纯文本与 `/正则/` 两种写法，例如输入 `/timeout/i` 可以匹配所有超时相关日志。
- **复制**：点击一条日志后，工具条上的复制按钮会把它复制到剪贴板。
- **监控（眼睛图标）**：打开 Watch 面板，添加任意表达式后每秒自动求值，适合跟踪变量变化。

对象日志支持展开查看全部属性，包括不可枚举属性与 getter 值，行为与 DevTools 的对象检查器一致。

## DevTools 式报错

这是 plus 版本的重点增强。三类错误的呈现方式如下：

**console.error 调用**。显示消息本身（不再套一层 `Error:` 前缀），下方紧跟调用者堆栈——注意是调用 `console.error` 的那一行业务代码，而不是 eruda 内部堆栈。堆栈默认展开，红色底色与错误图标与 DevTools 完全一致。

**未捕获异常**。自动加上 `Uncaught` 前缀（中文界面显示「未捕获」），例如：

```
未捕获 TypeError: Cannot read properties of undefined (reading 'foo')
    at renderWidget (app.js:120:15)
```

**未捕获的 Promise 拒绝**。自动加上 `Uncaught (in promise)` 前缀（中文显示「未捕获（promise 中）」），支持 Error 与任意值（字符串、对象等）作为拒绝原因。

每一行堆栈帧中的 `文件:行号` 都是可点击的链接。点击后 eruda-plus 会拉取该文件源码并在 Sources 面板中打开，同时高亮对应行——与你在桌面 DevTools 里点击堆栈链接的体验相同。堆栈区整体支持点击行切换展开/收起。

## 记录 XMLHttpRequest

设置面板中新增了 DevTools 同款开关「记录 XMLHttpRequest」。开启后，页面发出的每个 XHR 与 fetch 请求都会以信息级日志回显到控制台：

```
XHR 已完成加载: GET /api/user [200]
Fetch 已完成加载: POST /api/login [401]
```

状态码为 2xx 时使用普通信息样式，其余状态码以错误样式高亮，方便快速发现失败请求。该开关默认关闭，开启后无需刷新页面。

## 日志保留

开启「保留日志（Preserve Log）」后，最近 300 条日志会随页面刷新自动恢复，恢复区顶部有一条分隔线标注「恢复自上次页面会话」。移动端 WebView 场景下页面经常被系统回收重启，这个功能可以让关键报错在重启后依然可查。

## 其他能力

- **console API 全量支持**：`log / info / warn / error / debug / dir / table / time / timeEnd / count / countReset / assert / group / groupCollapsed / groupEnd`，与原生控制台语义一致。
- **JS 执行**：底部输入框可以执行任意 JavaScript 表达式，支持多行编辑，点击「执行」后结果以 output 形式回显。
- **最大日志条数**：默认无上限，可在设置中调整为 250 / 125 / 100 / 50 / 10，避免长跑页面内存膨胀。
- **自动弹出**：开启「发生错误时自动显示」后，任何错误日志都会直接唤起控制台，适合埋在用户设备上抓现场。
