<script setup>
import { ref, onMounted } from 'vue'
import { NoticeAPI } from '../api.js'

const emit = defineEmits(['toast'])

const list = ref([])
const pinned = ref([])
const typeFilter = ref('')
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const [listRes, pinRes] = await Promise.all([
      NoticeAPI.published(typeFilter.value || null),
      NoticeAPI.pinned()
    ])
    if (listRes.data.code === 200) list.value = listRes.data.data || []
    if (pinRes.data.code === 200) pinned.value = pinRes.data.data || []
  } catch (e) { emit('toast', 'error', '加载失败') }
  finally { loading.value = false }
}

function typeBadge(t) {
  return { NOTICE: 't-notice', ANNOUNCEMENT: 't-announce', MAINTENANCE: 't-maint' }[t] || 't-notice'
}
function typeText(t) {
  return { NOTICE: '通知', ANNOUNCEMENT: '公告', MAINTENANCE: '维护' }[t] || t
}

onMounted(load)
defineExpose({ reload: load })
</script>

<template>
  <div class="view-header">
    <div>
      <h1 class="view-title">NOTICE BOARD<span style="color: var(--yellow)">.</span></h1>
      <p class="view-subtitle">// 公告通知 · 共 {{ list.length }} 条</p>
    </div>
    <button class="brutalist-btn" @click="load">刷新</button>
  </div>

  <!-- 置顶公告轮播 -->
  <div v-if="pinned.length > 0" class="pinned-section">
    <div class="pinned-label">// ★ PINNED</div>
    <div class="pinned-strip">
      <article v-for="n in pinned" :key="n.id" :class="['pinned-card', `pin-${n.type.toLowerCase()}`]">
        <div class="pin-head">
          <span :class="['type-badge', typeBadge(n.type)]">{{ typeText(n.type) }}</span>
          <span class="pin-date">{{ (n.publishDate || '').replace('T', ' ').slice(0, 10) }}</span>
        </div>
        <h3 class="pin-title">{{ n.title }}</h3>
        <p class="pin-content">{{ n.content }}</p>
      </article>
    </div>
  </div>

  <div class="filter-bar">
    <div class="filter-group">
      <span class="filter-label">类型</span>
      <select v-model="typeFilter" class="filter-input" @change="load">
        <option value="">全部</option>
        <option value="NOTICE">通知</option>
        <option value="ANNOUNCEMENT">公告</option>
        <option value="MAINTENANCE">维护</option>
      </select>
    </div>
  </div>

  <div v-if="loading" class="loading-block"><span>LOADING...</span></div>

  <div v-else-if="list.length === 0" class="empty-block"><span>// 暂无公告</span></div>

  <div v-else class="notice-list">
    <article v-for="n in list" :key="n.id" :class="['notice-card', `type-${n.type.toLowerCase()}`]">
      <div class="notice-head">
        <div class="head-left">
          <span :class="['type-badge', typeBadge(n.type)]">{{ typeText(n.type) }}</span>
          <span v-if="n.pinned" class="pin-mark">★</span>
        </div>
        <span class="notice-date mono">{{ (n.publishDate || '').replace('T', ' ').slice(0, 16) }}</span>
      </div>
      <h3 class="notice-title">{{ n.title }}</h3>
      <p class="notice-content">{{ n.content }}</p>
      <div class="notice-foot">
        <span class="publisher mono">// {{ n.publisherName || '系统' }}</span>
      </div>
    </article>
  </div>
</template>

<style scoped>
.pinned-section { margin-bottom: 30px; }
.pinned-label {
  font-family: var(--font-display); font-size: 18px;
  letter-spacing: 0.15em; margin-bottom: 12px;
  color: var(--yellow);
}
.pinned-strip {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}
.pinned-card {
  background: var(--ink); color: var(--bg);
  border: var(--border);
  border-radius: 3px;
  box-shadow: var(--shadow);
  padding: 16px;
}
.pin-notice { border-left: 4px solid var(--yellow); }
.pin-announcement { border-left: 4px solid var(--green); }
.pin-maintenance { border-left: 4px solid var(--pink); }
.pin-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px;
}
.type-badge {
  font-family: var(--font-mono); font-size: 11px;
  padding: 2px 8px; border: 1px solid rgba(253, 251, 246, 0.25);
  border-radius: 2px;
  letter-spacing: 0.1em; background: rgba(184, 146, 74, 0.25); color: var(--yellow);
}
.pin-date {
  font-family: var(--font-mono); font-size: 11px;
  opacity: 0.7;
}
.pin-title {
  font-family: var(--font-cn); font-size: 20px; font-weight: 700;
  margin-bottom: 8px;
}
.pin-content {
  font-family: var(--font-cn); font-size: 13px;
  line-height: 1.7; opacity: 0.9;
  white-space: pre-wrap;
}

.loading-block, .empty-block {
  padding: 60px; text-align: center;
  background: var(--white); border: var(--border);
  box-shadow: var(--shadow);
  font-family: var(--font-mono); letter-spacing: 0.1em;
}
.notice-list { display: flex; flex-direction: column; gap: 12px; }
.notice-card {
  background: var(--white);
  border: var(--border);
  border-radius: 2px;
  box-shadow: var(--shadow-sm);
  padding: 14px 20px;
  transition: box-shadow 0.2s ease;
}
.notice-card:hover { box-shadow: var(--shadow); }
.type-notice { border-left: 4px solid var(--yellow); }
.type-announcement { border-left: 4px solid var(--green); }
.type-maintenance { border-left: 4px solid var(--pink); }
.notice-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 8px;
}
.head-left { display: flex; gap: 8px; align-items: center; }
.type-badge {
  font-family: var(--font-mono); font-size: 11px;
  padding: 2px 8px; border: 1px solid rgba(43, 37, 32, 0.28);
  border-radius: 2px;
  letter-spacing: 0.1em;
}
.t-notice { background: rgba(184, 146, 74, 0.18); color: var(--yellow); border-color: rgba(184, 146, 74, 0.4); }
.t-announce { background: rgba(92, 122, 92, 0.18); color: var(--green); border-color: rgba(92, 122, 92, 0.4); }
.t-maint { background: rgba(139, 58, 58, 0.18); color: var(--pink); border-color: rgba(139, 58, 58, 0.4); }
.pin-mark { color: var(--yellow); font-size: 14px; }
.notice-date { font-size: 11px; opacity: 0.6; }
.notice-title {
  font-family: var(--font-cn); font-size: 20px; font-weight: 700;
  margin-bottom: 6px;
}
.notice-content {
  font-family: var(--font-cn); font-size: 14px;
  line-height: 1.7; opacity: 0.85;
  white-space: pre-wrap;
}
.notice-foot {
  margin-top: 10px; padding-top: 8px;
  border-top: 1px dashed rgba(43, 37, 32, 0.2);
}
.publisher { font-size: 11px; opacity: 0.5; }
</style>
