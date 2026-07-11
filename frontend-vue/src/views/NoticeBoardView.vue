<script setup>
import { ref, onMounted } from 'vue'
import { NoticeAPI } from '../api.js'

const emit = defineEmits(['toast'])

const list = ref([])
const pinned = ref([])
const typeFilter = ref('')
const loading = ref(false)
const detailNotice = ref(null)
const detailOpen = ref(false)

function openDetail(n) {
  detailNotice.value = n
  detailOpen.value = true
}

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
      <h1 class="view-title">NOTICE BOARD<span style="color: var(--primary)">.</span></h1>
      <p class="view-subtitle">// 公告通知 · 共 {{ list.length }} 条</p>
    </div>
    <button class="brutalist-btn" @click="load">刷新</button>
  </div>

  <!-- 置顶公告 -->
  <div v-if="pinned.length > 0" class="pinned-section">
    <div class="section-label">
      <span class="label-dot"></span>
      置顶公告
    </div>
    <div class="pinned-grid">
      <article v-for="n in pinned" :key="n.id" :class="['pinned-card', `pin-${n.type.toLowerCase()}`]" @click="openDetail(n)">
        <div class="pin-type-bar"></div>
        <div class="pin-body">
          <div class="pin-head">
            <span :class="['type-badge', typeBadge(n.type)]">{{ typeText(n.type) }}</span>
            <span class="pin-date">{{ (n.publishDate || '').replace('T', ' ').slice(0, 10) }}</span>
          </div>
          <h3 class="pin-title">{{ n.title }}</h3>
          <p class="pin-excerpt">{{ (n.content || '').slice(0, 80) }}{{ (n.content || '').length > 80 ? '...' : '' }}</p>
        </div>
      </article>
    </div>
  </div>

  <!-- 筛选 -->
  <div class="inline-filter">
    <div class="filter-chips">
      <button :class="['chip', { active: typeFilter === '' }]" @click="typeFilter = ''; load()">全部</button>
      <button :class="['chip', { active: typeFilter === 'NOTICE' }]" @click="typeFilter = 'NOTICE'; load()">通知</button>
      <button :class="['chip', { active: typeFilter === 'ANNOUNCEMENT' }]" @click="typeFilter = 'ANNOUNCEMENT'; load()">公告</button>
      <button :class="['chip', { active: typeFilter === 'MAINTENANCE' }]" @click="typeFilter = 'MAINTENANCE'; load()">维护</button>
    </div>
    <span class="filter-count">{{ list.length }} 条结果</span>
  </div>

  <!-- Loading -->
  <div v-if="loading" class="state-block">
    <div class="state-spinner"></div>
    <span>加载中...</span>
  </div>

  <!-- Empty -->
  <div v-else-if="list.length === 0" class="state-block">
    <svg viewBox="0 0 80 80" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
      <rect x="12" y="20" width="56" height="44" rx="6"/>
      <line x1="24" y1="32" x2="56" y2="32"/>
      <line x1="24" y1="40" x2="48" y2="40"/>
      <line x1="24" y1="48" x2="40" y2="48"/>
    </svg>
    <span>暂无公告</span>
  </div>

  <!-- 公告列表 -->
  <div v-else class="notice-list">
    <article v-for="n in list" :key="n.id" :class="['notice-card', `type-${n.type.toLowerCase()}`]" @click="openDetail(n)">
      <div class="notice-stripe"></div>
      <div class="notice-body">
        <div class="notice-head">
          <div class="head-left">
            <span :class="['type-badge', typeBadge(n.type)]">{{ typeText(n.type) }}</span>
            <span v-if="n.pinned" class="pin-icon">
              <svg viewBox="0 0 12 12" width="12" height="12" fill="var(--primary)" stroke="none">
                <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z"/>
              </svg>
            </span>
          </div>
          <span class="notice-date">{{ (n.publishDate || '').replace('T', ' ').slice(0, 16) }}</span>
        </div>
        <h3 class="notice-title">{{ n.title }}</h3>
        <p class="notice-excerpt">{{ (n.content || '').slice(0, 120) }}{{ (n.content || '').length > 120 ? '...' : '' }}</p>
        <div class="notice-foot">
          <span class="publisher">{{ n.publisherName || '系统' }}</span>
          <span class="read-hint">点击查看详情 →</span>
        </div>
      </div>
    </article>
  </div>

  <!-- 公告详情弹窗 -->
  <transition name="dialog-fade">
    <div v-if="detailOpen" class="dialog-mask" @click.self="detailOpen = false">
      <div class="dialog-box" @click.stop>
        <!-- 类型色带 -->
        <div :class="['dialog-type-bar', `bar-${(detailNotice?.type || '').toLowerCase()}`]">
          <span class="bar-label">{{ typeText(detailNotice?.type) }}</span>
          <button class="dialog-close" @click="detailOpen = false">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
          </button>
        </div>

        <div class="dialog-body">
          <!-- 标题区 -->
          <div class="dialog-title-area">
            <h2 class="dialog-title">{{ detailNotice?.title }}</h2>
          </div>

          <!-- 元信息 -->
          <div class="dialog-meta">
            <div class="meta-item">
              <div class="meta-icon">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                  <circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
                </svg>
              </div>
              <div class="meta-text">
                <span class="meta-label">发布者</span>
                <span class="meta-val">{{ detailNotice?.publisherName || '系统' }}</span>
              </div>
            </div>
            <div class="meta-divider"></div>
            <div class="meta-item">
              <div class="meta-icon">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M5 1h6v2H5z"/><line x1="8" y1="6" x2="8" y2="11"/>
                </svg>
              </div>
              <div class="meta-text">
                <span class="meta-label">发布时间</span>
                <span class="meta-val">{{ (detailNotice?.publishDate || '').replace('T', ' ').slice(0, 16) }}</span>
              </div>
            </div>
          </div>

          <!-- 正文 -->
          <div class="dialog-content">{{ detailNotice?.content }}</div>

          <!-- 底部 -->
          <div class="dialog-footer">
            <button class="brutalist-btn" @click="detailOpen = false">关闭</button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* 置顶区 */
.pinned-section { margin-bottom: 28px; }
.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 14px;
}
.label-dot {
  width: 6px;
  height: 6px;
  background: var(--primary);
  border-radius: 50%;
}
.pinned-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}
.pinned-card {
  background: linear-gradient(160deg, #1a1917 0%, #2c2a26 50%, #222120 100%);
  color: var(--bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  display: flex;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
}
.pinned-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-xl);
}
.pin-type-bar {
  width: 4px;
  flex-shrink: 0;
}
.pin-notice .pin-type-bar { background: linear-gradient(180deg, var(--primary), #e8946a); }
.pin-announcement .pin-type-bar { background: linear-gradient(180deg, var(--success), #a8c080); }
.pin-maintenance .pin-type-bar { background: linear-gradient(180deg, var(--destructive), #f87171); }
.pin-body {
  flex: 1;
  padding: 18px 18px 16px;
}
.pin-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.pin-date {
  font-family: var(--font-mono);
  font-size: 10px;
  opacity: 0.4;
  letter-spacing: 0.06em;
}
.pin-title {
  font-family: var(--font-sans);
  font-size: 17px;
  font-weight: 800;
  margin-bottom: 8px;
  line-height: 1.3;
  letter-spacing: -0.01em;
}
.pin-excerpt {
  font-family: var(--font-sans);
  font-size: 12px;
  line-height: 1.7;
  opacity: 0.5;
  white-space: pre-wrap;
}

/* 类型徽章 */
.type-badge {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.t-notice { background: var(--warning-bg); color: var(--primary); border: 1px solid rgba(217,119,87,0.2); }
.t-announce { background: var(--success-bg); color: var(--success); border: 1px solid rgba(140,160,111,0.2); }
.t-maint { background: #fde8e8; color: var(--destructive); border: 1px solid rgba(239,68,68,0.2); }
.pin-mark { color: var(--primary); font-size: 14px; }

/* 筛选 */
.inline-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
}
.filter-chips {
  display: flex;
  gap: 4px;
  background: var(--bg-subtle);
  padding: 3px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-faint);
}
.chip {
  padding: 6px 16px;
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  background: transparent;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all 0.2s;
}
.chip:hover { color: var(--foreground); }
.chip.active {
  background: var(--card);
  color: var(--foreground);
  font-weight: 700;
  box-shadow: var(--shadow-xs);
}
.filter-count {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 0.06em;
}

/* Loading / Empty */
.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 20px;
  background: var(--card);
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  color: var(--muted);
  font-family: var(--font-sans);
  font-size: 13px;
}
.state-spinner {
  width: 24px;
  height: 24px;
  border: 2.5px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* 公告列表 */
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.notice-card {
  display: flex;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-2xs);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  overflow: hidden;
}
.notice-card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateX(3px);
}
.notice-stripe {
  width: 4px;
  flex-shrink: 0;
}
.type-notice .notice-stripe { background: linear-gradient(180deg, var(--primary), #e8946a); }
.type-announcement .notice-stripe { background: linear-gradient(180deg, var(--success), #a8c080); }
.type-maintenance .notice-stripe { background: linear-gradient(180deg, var(--destructive), #f87171); }
.notice-body {
  flex: 1;
  padding: 16px 20px;
}
.notice-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.head-left { display: flex; gap: 8px; align-items: center; }
.pin-icon { display: flex; align-items: center; }
.notice-date {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 0.06em;
  font-feature-settings: 'tnum';
}
.notice-title {
  font-family: var(--font-sans);
  font-size: 17px;
  font-weight: 800;
  margin-bottom: 6px;
  color: var(--foreground);
  line-height: 1.3;
  letter-spacing: -0.01em;
}
.notice-excerpt {
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 1.7;
  color: var(--foreground-secondary);
  white-space: pre-wrap;
}
.notice-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-faint);
}
.publisher {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 0.06em;
}
.read-hint {
  font-family: var(--font-sans);
  font-size: 11px;
  color: var(--primary);
  font-weight: 600;
  letter-spacing: 0.02em;
  opacity: 0.7;
  transition: opacity 0.16s;
}
.notice-card:hover .read-hint { opacity: 1; }

/* ============================================================
   详情弹窗 — 杂志风格
   ============================================================ */
.dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 19, 0.5);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
}
.dialog-box {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 类型色带头部 */
.dialog-type-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  position: relative;
  overflow: hidden;
}
.dialog-type-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 100%);
  pointer-events: none;
}
.bar-notice {
  background: linear-gradient(135deg, #1a1917 0%, #2c2620 100%);
  color: var(--primary);
}
.bar-announcement {
  background: linear-gradient(135deg, #1a1d17 0%, #1f261c 100%);
  color: var(--success);
}
.bar-maintenance {
  background: linear-gradient(135deg, #1d1717 0%, #261c1c 100%);
  color: var(--destructive);
}
.bar-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  position: relative;
  z-index: 1;
}
.dialog-close {
  background: rgba(255,255,255,0.1);
  color: var(--bg);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: var(--radius-sm);
  width: 30px;
  height: 30px;
  cursor: pointer;
  line-height: 1;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}
.dialog-close:hover { background: rgba(239,68,68,0.8); border-color: transparent; }

/* 弹窗主体 */
.dialog-body {
  padding: 28px 28px 20px;
  overflow-y: auto;
  flex: 1;
}
.dialog-title-area {
  margin-bottom: 20px;
}
.dialog-title {
  font-family: var(--font-editorial);
  font-size: 28px;
  font-weight: 800;
  line-height: 1.2;
  color: var(--foreground);
  letter-spacing: -0.02em;
}

/* 元信息 */
.dialog-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 14px 16px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-faint);
  border-radius: var(--radius);
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}
.meta-icon {
  width: 32px;
  height: 32px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  flex-shrink: 0;
}
.meta-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.meta-label {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 600;
}
.meta-val {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 700;
  color: var(--foreground);
}
.meta-divider {
  width: 1px;
  height: 28px;
  background: var(--border);
  flex-shrink: 0;
}

/* 正文 */
.dialog-content {
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.9;
  color: var(--foreground-secondary);
  white-space: pre-wrap;
  padding: 20px;
  background: var(--bg);
  border: 1px solid var(--border-faint);
  border-radius: var(--radius);
}

/* 弹窗底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 28px;
  border-top: 1px solid var(--border-faint);
  background: var(--bg-subtle);
}

/* 弹窗过渡 */
.dialog-fade-enter-active { transition: opacity 0.25s ease; }
.dialog-fade-enter-active .dialog-box { transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease; }
.dialog-fade-leave-active { transition: opacity 0.2s ease; }
.dialog-fade-leave-active .dialog-box { transition: transform 0.2s ease, opacity 0.2s ease; }
.dialog-fade-enter-from { opacity: 0; }
.dialog-fade-enter-from .dialog-box { transform: scale(0.92) translateY(12px); opacity: 0; }
.dialog-fade-leave-to { opacity: 0; }
.dialog-fade-leave-to .dialog-box { transform: scale(0.95); opacity: 0; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
