# 配置项

eruda-plus 提供两层配置：一是 `eruda.init()` 时的初始化选项，控制挂载点、默认启用的工具等；二是设置面板（Settings）中的运行时开关，控制各面板的行为细节。两层配置都会自动持久化，刷新页面后依然有效。

## 初始化选项

```js
eruda.init({
  container: document.body, // 挂载容器
  tool: [...],              // 启用的面板清单
  autoScale: true,          // 移动端按设备缩放自动调整
})
```

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `container` | Element | `document.body` | 调试台挂载的容器节点 |
| `tool` | Array | 全部面板 | 控制导航中出现哪些面板，例如只开 `['console','network']` |
| `autoScale` | Boolean | `true` | 移动端下自动按视口缩放，避免面板过大 |

## 全局 API

```js
eruda.init()               // 初始化
eruda.show('network')      // 打开调试台并定位到指定面板
eruda.hide()               // 收起调试台
eruda.destroy()            // 销毁实例，恢复被覆写的 console 等
eruda.position({x, y})     // 读取/设置悬浮球位置
eruda.scale(1)             // 读取/设置缩放
eruda.get('network')       // 获取面板实例（可调用其公开方法）
eruda.add(tool)            // 注册自定义面板
eruda.remove(name)         // 移除面板
```

## 网络面板 API

网络面板实例暴露了一组编程接口，方便在脚本或自动化测试中直接控制：

```js
const network = eruda.get('network')

// 屏蔽：添加模式并启用（关键词或 /正则/）
network.block('/api/private')
network.unblock('/api/private')  // 移除单条
network.unblock()                // 关闭屏蔽并清空

// Mock：合成响应，支持扁平或嵌套写法
network.mock({
  url: '/api/user',
  response: { status: 500, contentType: 'application/json', body: '{"code":500}' },
})
network.unmock('/api/user')      // 移除；不传参清空全部

// 节流：none | slow3g | fast3g | offline
network.throttle('slow3g')
network.throttle('none')

// HAR：返回当前请求日志的 HAR 对象
const har = network.exportHar()
```

所有规则都会同步到规则面板 UI（若面板处于打开状态会即时刷新），并写入 localStorage 持久化。

## 运行时设置项速查

| 分组 | 设置项 | 默认 | 说明 |
| --- | --- | --- | --- |
| 通用 | Theme | System preference | Light / Dark / 系统跟随及 17 套扩展主题 |
| 通用 | Language | auto | `auto` / `en` / `zh`，切换即时生效 |
| Console | Catch Global Errors | on | 捕获未捕获异常与 Promise 拒绝 |
| Console | Override Console | on | 覆写 window.console 使日志进入面板 |
| Console | Display Extra Information | off | 每条日志显示时间与来源 |
| Console | Preserve Log | off | 刷新后恢复上一会话日志 |
| Console | Log XMLHttpRequests | off | 把 XHR/fetch 请求回显到控制台 |
| Console | Max Log Number | infinite | 日志上限，防内存膨胀 |
| Network | Disable HTTP cache | off | 开启后 fetch/XHR 强制绕过 HTTP 缓存 |
| Sources | Show Line Numbers | on | 源码视图显示行号 |
| Elements | Catch Event Listeners | off | 捕获并展示节点事件监听 |

## 持久化机制

配置数据保存在 `localStorage` 中，键名以 `eruda` 前缀命名空间化，例如语言偏好、网络规则、日志保留开关各自独立存储。设置面板底部的「恢复默认并刷新」按钮会清空全部 `eruda*` 键后自动刷新页面，适合在配置混乱或升级后出现异常时使用。若页面运行在隐私模式等存储受限环境，eruda-plus 会自动退化为内存配置，不影响功能使用。
