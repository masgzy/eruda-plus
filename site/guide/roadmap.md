# 路线图

eruda-plus 的目标是「全方位的 plus」：不只是网络面板，而是让每一个面板都达到 Chrome DevTools 的使用体验。本页公开记录演进计划，顺序大体反映优先级，但不保证严格按序交付——社区的反馈会随时影响排序。如果你对某一项有强烈诉求，欢迎到 [Issues](https://github.com/masgzy/eruda-plus/issues) 中留言催更或直接认领。

## ✅ 已完成（v0.1.0 - v0.2.0）

- **界面全面对齐 DevTools**：亮暗双主题采用 Chrome 官方配色，表格、滚动条、弹窗、指示条逐像素对照。
- **中英双语**：约 230 个词条覆盖全部面板，跟随系统语言，设置中即时切换。
- **网络面板重写**：七列表格 + 瀑布图 + Overview 概览、详情多标签（Headers/Response/Preview/Initiator/Timing）、失败计数徽标。
- **请求编辑四件套**：屏蔽（关键词/正则）、URL 重写、响应 Mock、网络节流（Slow 3G / Fast 3G / Offline），全部持久化。
- **HAR 导入导出**：与 DevTools、ProxyPin 等抓包工具互通，支持导入回放。
- **DevTools 式报错**：`Uncaught` / `Uncaught (in promise)` 前缀、堆栈默认展开、堆栈帧点击直达源码并高亮对应行、`console.error` 显示调用者堆栈。
- **DevTools 设置项补齐**：记录 XMLHttpRequest、禁用 HTTP 缓存。
- **编程 API**：`network.block / unblock / mock / unmock / throttle / exportHar`，官网在线演示直接驱动真实面板。
- **VitePress 官网**：EasyTier 同款设计语言（墨触标题、渐变 Hero），首页内嵌真实调试台。

## 🚧 进行中

- **移动端密度优化**：继续压缩小屏下的行高与内边距，保证 320px 宽度下表头不截断。
- **网络面板细节**：WebSocket 帧查看、请求体格式化增强、Copy as fetch（含 credentials）。

## 📋 计划中

### Console 控制台

- **命令行 API**：`$` / `$$` / `$0`、`copy()`、`inspect()`、`monitorEvents()`、`getEventListeners()` 等 DevTools 命令行工具全集。
- **Live Expressions**：工具条实时表达式，持续显示变量当前值。
- **日志分组增强**：跨 group 的级别筛选、按来源（脚本）过滤、正则高亮。
- **性能计时面板**：console.time 数据以甘特图呈现。

### Elements 元素

- **盒模型可视化**：Margin/Border/Padding/Content 四色嵌套图，可点击编辑。
- **伪类与伪元素**：`::before / ::after` 内容查看，`:hover / :active` 状态强制模拟。
- **CSS 编辑器**：声明级增删改、颜色选择器、禁用单条规则。
- **DOM 断点**：子树修改 / 属性修改 / 节点移除三类断点（依赖运行环境能力评估）。

### Resources 资源

- **IndexedDB 与 Web SQL**：对象仓库浏览、记录增删改查。
- **Cache Storage**：Service Worker 缓存查看与删除。
- **存储配额视图**：各存储源占用统计。

### Sources 源码

- **断点调试**：行断点、暂停/继续/单步（长期目标，依赖 debugger 协议可行性）。
- ** Pretty-print**：压缩代码一键格式化。
- **代码搜索**：跨文件全文搜索。

### Info / Settings

- **Performance 速览**：帧率、内存的轻量时序图（不做完整 Profiler，聚焦移动端感知）。
- **设置导入导出**：把整套面板配置导出为 JSON，团队内共享。
- **主题跟随系统自动化**：prefers-color-scheme 实时切换无需刷新。

## 长期方向

- **插件系统**：允许第三方以标准接口扩展面板（参考 DevTools Extensions）。
- **远程协作**：生成带现场快照的调试链接，他人可直接打开复现上下文。
- **性能预算**：资源体积与请求数的预算告警。

> 计划赶不上变化，具体的交付节奏以 [Releases](https://github.com/masgzy/eruda-plus/releases) 为准。每个版本的中英双语变更说明都会同步发布。
