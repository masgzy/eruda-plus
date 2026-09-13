---
layout: home

hero:
  name: eruda-plus
  text: 移动端调试台的全方位增强
  tagline: ✨ 以 eruda 为基座，对标 Chrome DevTools —— 中英双语、网络屏蔽/重写/Mock/节流、HAR 导入导出
  image:
    src: /eruda-hero.svg
    alt: eruda-plus 调试面板示意
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 在线体验
      link: #live-demo
    - theme: alt
      text: GitHub
      link: https://github.com/masgzy/eruda-plus

features:
  - title: DevTools 级界面
    details: 逐像素对标 Chrome DevTools 的排版与配色，<br>亮 / 暗两套官方主题，一眼即懂。
    link: /guide/introduction
  - title: 中英双语
    details: 全部面板标题、表头、时序段、弹窗均已本地化，<br>跟随系统语言，也可在设置中手动切换。
    link: /guide/config
  - title: 屏蔽请求
    details: 按关键词或正则屏蔽任意请求，<br>被拦截的请求以 403 呈现在网络面板中。
    link: /guide/network
  - title: 重写与 Mock
    details: URL 重写 + 响应 Mock 双通道，<br>静态页面也能模拟 500、慢速接口等真实故障。
    link: /guide/network
  - title: 网络节流
    details: Slow 3G / Fast 3G / Offline 一键切换，<br>弱网环境下的页面表现尽在掌握。
    link: /guide/network
  - title: HAR 导入导出
    details: 与 Chrome DevTools / 抓包工具无缝互通，<br>录制的请求可导出 HAR 归档或回放。
    link: /guide/network
  - title: DevTools 式报错
    details: 未捕获异常自动标注 Uncaught，<br>堆栈帧可点击直达源码并高亮对应行。
    link: /guide/console
  - title: 零构建接入
    details: 一行 script 引入 CDN 即用，<br>npm / ESM / 内联注入等多种姿势随心选。
    link: /guide/installation
  - title: 开源免费
    details: 基于 MIT License，欢迎 Star / Issue / PR，<br>与社区一起把它打磨得更好。
    link: https://github.com/masgzy/eruda-plus
---

## 在线体验 <a id="live-demo"></a>

这一节就是真实的 eruda-plus——不是截图、不是 iframe。页面加载后右下角会出现 eruda 悬浮球，点开即可使用完整的控制台、元素、网络等面板；展开下方「测试」下拉栏可以模拟日志、报错、弱网、Mock 等真实场景，然后回到面板里观察结果。

<LiveDemo />

::: tip 建议使用手机或浏览器移动端模拟器访问
eruda-plus 专为移动端触控设计，但在桌面浏览器中同样可用。若悬浮球与页面元素冲突，可长按拖动调整位置。
:::

## 快速上手

一行脚本，为任意移动页面装上调试台：

```html
<script src="//cdn.jsdelivr.net/gh/masgzy/eruda-plus@0.2.0/dist/eruda.js"></script>
<script>eruda.init()</script>
```

或者通过 npm 安装后按需初始化：

```bash
npm install eruda-plus
```

```js
import eruda from 'eruda-plus'

eruda.init()
// 需要网络屏蔽 / Mock / 节流？
const network = eruda.get('network')
network.block('/api/private')
network.mock({ url: '/api/user', response: { status: 500, body: '{"err":1}' } })
```

更多用法请阅读 [快速开始](/guide/getting-started) 与 [功能指南](/guide/tools)。

## 为什么是 plus

eruda 让移动端有了调试台，而 eruda-plus 关心的是「好不好用」：界面是否与 DevTools 一致、中文用户能否看得懂、断网和慢网能否模拟、线上问题能否留档。为此我们把网络面板几乎重写了一遍，把全部 UI 换成了 DevTools 的设计语言，并补齐了报错堆栈、HAR、请求编辑等日常刚需。完整的演进计划见 [路线图](/guide/roadmap)。

<Underline />
