# 快速上手

本页引导你在三分钟内接入 eruda-plus 并完成一次完整的调试体验。无论你的项目是传统多页应用、SPA 还是纯静态页面，接入方式都是一样的：先加载脚本，再调用初始化。之后页面右下角会出现 eruda 悬浮球，点击即可展开完整的调试面板。

## 1. 接入脚本

最简单的方式是通过 jsDelivr CDN 引入。在生产环境的任意 HTML 页面 `</body>` 前插入以下两行代码即可：

```html
<script src="//cdn.jsdelivr.net/gh/masgzy/eruda-plus@0.2.0/dist/eruda.js"></script>
<script>eruda.init()</script>
```

如果你更倾向于 npm 管理，可以安装后按需初始化：

```bash
npm install eruda-plus
```

```js
import eruda from 'eruda-plus'

eruda.init()
```

关于单文件插件（仅网络面板）、ESM 直接引入、内联注入等更多姿势，请阅读 [安装方式](/guide/installation)。

## 2. 打开控制台

初始化完成后，页面右下角会出现一个半透明的 eruda 悬浮球。单击它即可展开全屏调试面板，再次点击收起。悬浮球可以长按拖动到任意位置，避免遮挡页面关键内容；在设置中还可以调节面板透明度与显示尺寸。

面板顶部的导航栏列出了全部工具：控制台、元素、网络、资源、源码、信息、片段、设置。所有标题都会跟随系统语言显示中文或英文，你也可以在 Settings 里手动切换。

## 3. 体验一次完整调试

以一次典型的接口报错为例，完整走一遍 eruda-plus 的流程：

1. **制造一次报错**。在控制台输入框中输入 `fetch('/api/not-exist')` 并执行，或者展开首页的「测试」下拉栏点击模拟按钮。
2. **查看报错详情**。切到 Console 面板，失败的网络请求会以 DevTools 风格的红色条目呈现，堆栈默认展开，点击堆栈中的 `xxx.js:12` 可以直接跳转到 Sources 并高亮对应行。
3. **观察网络面板**。切到 Network 面板，这次请求会出现在列表里，状态码标红。点击条目查看 Headers、Response、Initiator 等详情标签页。
4. **模拟修复**。在 Network 面板打开「屏蔽 / 重写 / Mock」规则面板，为 `/api/not-exist` 添加一条 Mock 规则返回 200，再次发起请求即可看到 Mock 生效（状态码带 `*` 标记）。
5. **导出归档**。点击 HAR 导出按钮，把整次请求日志保存为 HAR 文件，贴进 Bug 单或与同事分享。

## 4. 常用配置

eruda-plus 的行为可以通过设置面板调整，也可以在 `init()` 时传入配置对象。几个最常用的开关：

| 配置 | 说明 |
| --- | --- |
| 主题 | Light / Dark / 跟随系统，采用 Chrome DevTools 官方配色 |
| 语言 | 中文 / English / 跟随系统，切换即时生效 |
| 捕获全局错误 | 开启后未捕获异常与 Promise 拒绝自动进入控制台 |
| 日志保留 | 开启后刷新页面可恢复上一次会话的日志 |
| 记录 XMLHttpRequest | 像 DevTools 一样把每个请求回显到控制台 |

完整的配置项与默认值列表见 [配置项](/guide/config)。

## 下一步

- 阅读 [控制台 Console](/guide/console) 了解报错堆栈、Watch 监控等进阶用法。
- 阅读 [网络 Network](/guide/network) 掌握屏蔽、重写、Mock、节流四大能力。
- 阅读 [路线图](/guide/roadmap) 看看 plus 还会往哪些方向进化。
