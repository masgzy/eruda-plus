# 安装方式

eruda-plus 提供多种接入方式以适配不同的工程形态。所有方式产出的都是同一份构建产物，功能完全一致，差别只在于加载渠道与模块格式。选择的原则很简单：临时调试用 CDN，工程化项目用 npm，无法改动的存量页面用控制台手动注入。

## CDN 引入

最推荐、最零成本的接入方式。jsDelivr 会把请求自动分发到离用户最近的节点：

```html
<script src="//cdn.jsdelivr.net/gh/masgzy/eruda-plus@0.2.0/dist/eruda.js"></script>
<script>eruda.init()</script>
```

- 指定版本号 `@0.2.0` 可以保证行为稳定；替换为 `@latest` 则始终使用最新版。
- `eruda.js` 已经把全部工具打包为单文件，无需额外加载插件。
- 若只需要网络面板增强（体积更小），可引入 `eruda-network-plus.js` 并配合原版 eruda 使用。

## npm 安装

适合有构建流程的工程化项目。npm 方式便于锁定版本、配合 TypeScript 类型提示，也可以在代码中按环境条件加载：

```bash
npm install eruda-plus
```

```js
import eruda from 'eruda-plus'

if (import.meta.env.DEV || /debug/.test(location.search)) {
  eruda.init()
}
```

上面的写法让调试台只在开发环境或 URL 带 `debug` 参数时出现，生产构建可通过 tree-shaking 与条件加载进一步控制体积。

包的基本信息：

| 字段 | 值 |
| --- | --- |
| 包名 | `eruda-plus` |
| 当前版本 | 0.2.0 |
| 入口 | `dist/eruda.js` |
| 许可 | MIT |

## ESM 直接引入

对于没有构建工具的页面，可以直接使用 esm.sh 等服务提供的 ESM 版本：

```html
<script type="module">
  import eruda from 'https://esm.sh/eruda-plus@0.2.0'
  eruda.init()
</script>
```

## 控制台手动注入

存量页面无法改代码时，可以在桌面浏览器控制台或 WebView 调试工具中动态注入：

```js
;(function () {
  const s = document.createElement('script')
  s.src = 'https://cdn.jsdelivr.net/gh/masgzy/eruda-plus@0.2.0/dist/eruda.js'
  s.onload = () => eruda.init()
  document.head.appendChild(s)
})()
```

也可以把这段代码存成书签（Bookmarklet），在任意页面上点击书签即可唤起调试台。

## 初始化选项

`eruda.init()` 支持传入配置对象，常用项如下：

```js
eruda.init({
  container: document.body,   // 挂载容器，默认 body
  tool: ['console', 'elements', 'network'], // 只启用部分面板
  autoScale: true,            // 移动端自动缩放
})
```

所有面板默认全部启用。若需在运行时动态增删面板，可使用 `eruda.add()` / `eruda.remove()`。

## 版本与更新

- 在 [Releases](https://github.com/masgzy/eruda-plus/releases) 页面查看每个版本的变更摘要。
- npm 用户可以通过 `npm outdated eruda-plus` 检查更新。
- CDN 用户建议锁定具体版本号，升级前阅读变更日志以确认兼容性。
