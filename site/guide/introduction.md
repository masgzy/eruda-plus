# eruda-plus 功能简介

eruda-plus 是在 [eruda](https://github.com/liriliri/eruda) 基础上进行全方位增强的移动端网页调试台。它保留了 eruda 轻量、零配置、一行脚本即可接入的优点，同时把界面、交互与功能全面对齐到 Chrome DevTools 的水准。对于需要在手机、平板或 WebView 环境中排查问题的前端工程师来说，它让「移动端调试」第一次拥有了与桌面端相同的工作流。

与原版 eruda 相比，eruda-plus 的增强集中在三个层面。第一是**视觉与交互**：全部面板采用 DevTools 官方设计语言重绘，亮色与暗色主题都使用 Chrome 的官方配色，等宽字体、表格密度、滚动条样式与指示条等细节都经过逐像素对照。第二是**中英双语**：所有面板标题、表头、时序段、弹窗按钮、提示文案都内置了翻译，默认跟随系统语言，也可以在设置中手动切换，切换即时生效、无需刷新页面。第三是**网络能力**：网络面板几乎被重写，新增了请求屏蔽、URL 重写、响应 Mock、弱网节流、HAR 导入导出、Initiator 来源追踪等 DevTools 级能力。

## 适用场景

- **移动端问题排查**：用户反馈「页面上有报错」，但你无法复现？让他们打开 eruda-plus，截图控制台与网络面板即可。
- **WebView / 内嵌页调试**：App 内嵌页面没有桌面 DevTools 的远程调试条件时，eruda-plus 是最快的兜底方案。
- **弱网与故障演练**：通过节流与 Mock 模拟慢速接口、500 错误、断网等真实故障，验证页面的降级与容错。
- **接口联调**：临时屏蔽某个第三方请求、把测试环境 URL 重写为本地代理，无需改动任何业务代码。

## 面板一览

eruda-plus 内置九个面板，全部支持中英双语：

| 面板 | 说明 |
| --- | --- |
| Console 控制台 | 日志分级筛选、对象预览、DevTools 式报错堆栈、Watch 监控、日志保留 |
| Elements 元素 | DOM 树查看与搜索、CSS 查看、选择器/XPath 复制、事件监听捕获 |
| Network 网络 | 请求列表、瀑布图、屏蔽/重写/Mock/节流、HAR、cURL 复制、Initiator |
| Resources 资源 | Local/Session Storage、Cookie、iframe 框架清单 |
| Sources 源码 | 页面 HTML、脚本与样式源码查看、行号显示 |
| Info 信息 | 设备、系统、浏览器、页面、时间等运行环境信息 |
| Snippets 代码片段 | 常用调试脚本一键执行 |
| Settings 设置 | 主题、语言、透明度、各面板行为开关 |
| EntryBtn 悬浮球 | 可拖动的入口按钮，支持透明度与尺寸调节 |

## 核心特点

- **零构建接入**：CDN 一行脚本或 npm 一条命令即可使用，无需修改构建配置。
- **双语即切即用**：语言切换通过设置回放机制实现，所有已渲染面板即时更新。
- **DevTools 式报错**：未捕获异常与 Promise 拒绝自动标注 `Uncaught` / `Uncaught (in promise)` 前缀，堆栈默认展开，每一帧都可点击跳转到源码并高亮对应行。
- **网络全链路**：从请求发出到响应结束，拦截、改写、模拟、限速、导出在同一个面板内闭环完成。
- **开源开放**：基于 MIT License，代码托管于 [GitHub](https://github.com/masgzy/eruda-plus)，欢迎参与贡献。

## 下一步

- 前往 [快速上手](/guide/getting-started) 了解接入方式与基本用法。
- 前往 [安装方式](/guide/installation) 选择 CDN、npm 或 ESM 接入姿势。
- 遇到问题请先查阅 [常见问题](/guide/faq)。
