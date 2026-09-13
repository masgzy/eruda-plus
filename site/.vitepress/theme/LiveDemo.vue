<script setup>
import { onMounted, ref } from 'vue'

// ---------------------------------------------------------------------------
// LiveDemo — a real eruda-plus console embedded on the home page.
//
// - No iframe: the script is injected into this document directly, so the
//   console can use the full screen width on any device.
// - The demo actions are folded into a collapsible "测试" dropdown to keep
//   the page clean (user request).
// ---------------------------------------------------------------------------

const open = ref(false)
const ready = ref(false)
const caretOpen = ref(false)

const JS_URL = `${import.meta.env.BASE_URL}eruda.js`

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-eruda-plus]')
    if (existing) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.dataset.erudaPlus = 'true'
    s.onload = resolve
    s.onerror = () => reject(new Error('failed to load eruda.js'))
    document.head.appendChild(s)
  })
}

async function boot() {
  try {
    await loadScript(JS_URL)
    const eruda = window.eruda
    if (!eruda) return

    if (!eruda._isInit) {
      eruda.init()
      // Give the demo its own browser position default (bottom-right).
      eruda.position({ x: window.innerWidth - 60, y: window.innerHeight - 80 })
    }
    ready.value = true
  } catch (e) {
    console.error('[LiveDemo]', e)
  }
}

onMounted(boot)

// ---- demo actions ---------------------------------------------------------

function withNetwork(name, fn) {
  const eruda = window.eruda
  const network = eruda && eruda.get && eruda.get('network')
  if (!network) {
    alert('Network panel is not ready yet')
    return
  }
  fn(network, eruda)
}

const tests = [
  {
    label: '打印各种数据类型',
    run() {
      console.log('普通字符串', 'hello eruda-plus')
      console.info('数字与数组', 42, [1, 2, 3])
      console.warn('警告信息：性能可能受影响')
      console.log('对象', { name: 'eruda-plus', version: '0.2.0', nested: { ok: true } })
      console.log('DOM 节点', document.body)
    },
  },
  {
    label: 'console.error 调用栈',
    run() {
      console.error('Something went wrong while rendering widgets')
    },
  },
  {
    label: '未捕获异常（Uncaught）',
    run() {
      setTimeout(() => {
        // eslint-disable-next-line no-undef
        nullReferenceDemo()
      }, 50)
    },
  },
  {
    label: '未捕获的 Promise 拒绝',
    run() {
      Promise.reject(new Error('network timeout after 3000ms'))
    },
  },
  {
    label: 'XHR 请求（200）',
    run() {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', `${import.meta.env.BASE_URL}eruda.js`, true)
      xhr.send()
    },
  },
  {
    label: 'fetch 请求（404）',
    run() {
      fetch(`${import.meta.env.BASE_URL}not-found-demo.json`).catch(() => {})
    },
  },
  {
    label: '屏蔽 /blocked-demo（403）',
    run: () =>
      withNetwork('block', (network) => {
        network.block('/blocked-demo')
        fetch(`${import.meta.env.BASE_URL}blocked-demo`).catch(() => {})
      }),
  },
  {
    label: 'Mock /mock-demo → 500',
    run: () =>
      withNetwork('mock', (network) => {
        network.mock({
          url: '/mock-demo',
          response: { status: 500, body: '{"code":500,"message":"mocked server error"}' },
        })
        fetch(`${import.meta.env.BASE_URL}mock-demo`).catch(() => {})
      }),
  },
  {
    label: 'Slow 3G 节流下载',
    run: () =>
      withNetwork('throttle', (network) => {
        network.throttle('slow3g')
        fetch(`${import.meta.env.BASE_URL}eruda.js`)
          .then((r) => r.text())
          .then(() => network.throttle('none'))
          .catch(() => network.throttle('none'))
      }),
  },
  {
    label: 'console.time / count',
    run() {
      console.time('demo-timer')
      let sum = 0
      for (let i = 0; i < 1e6; i++) sum += i
      console.timeEnd('demo-timer')
      console.count('demo-counter')
    },
  },
]

function openConsole() {
  const eruda = window.eruda
  if (eruda) eruda.show()
}
</script>

<template>
  <div class="live-demo">
    <div class="demo-bar">
      <button class="demo-entry" type="button" @click="open = !open; caretOpen = !caretOpen">
        <span class="demo-entry-dot" :class="{ ok: ready }"></span>
        测试
        <span class="demo-caret" :class="{ open: caretOpen }">▾</span>
      </button>
      <span class="demo-hint">
        点击右下角悬浮球
        <a href="javascript:void(0)" @click.prevent="openConsole">打开控制台</a>
      </span>
    </div>

    <div v-show="open" class="demo-panel">
      <div class="demo-panel-title">模拟真实使用场景，在控制台与网络面板中观察结果</div>
      <div class="demo-grid">
        <button v-for="tst in tests" :key="tst.label" type="button" class="demo-btn" @click="tst.run()">
          {{ tst.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.live-demo {
  margin-top: 8px;
}
.demo-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.demo-entry {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
}
.demo-entry:hover {
  background: var(--vp-c-brand-soft);
}
.demo-entry-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-text-3);
}
.demo-entry-dot.ok {
  background: #3dd68c;
  box-shadow: 0 0 6px rgba(61, 214, 140, 0.8);
}
.demo-caret {
  display: inline-block;
  transition: transform 0.2s;
  font-size: 12px;
}
.demo-caret.open {
  transform: rotate(180deg);
}
.demo-hint {
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.demo-hint a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}
.demo-panel {
  margin-top: 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 14px 16px;
  background: var(--vp-c-bg-soft);
}
.demo-panel-title {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: 10px;
}
.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 8px;
}
.demo-btn {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}
.demo-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
@media (max-width: 640px) {
  .demo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
