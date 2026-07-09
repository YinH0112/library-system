<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import { NoticeAPI } from '../api.js'

const emit = defineEmits(['toast'])
const confirmFn = inject('confirmFn')

const list = ref([])
const typeFilter = ref('')
const loading = ref(false)

const dialogVisible = ref(false)
const editing = ref(false)
const form = reactive({ id: null, title: '', content: '', type: 'NOTICE', status: 'PUBLISHED', pinned: 0 })

async function load() {
  loading.value = true
  try {
    const res = await NoticeAPI.list(typeFilter.value || null)
    if (res.data.code === 200) list.value = res.data.data || []
    else emit('toast', 'error', '加载失败')
  } catch (e) { emit('toast', 'error', '加载失败') }
  finally { loading.value = false }
}

function openCreate() {
  editing.value = false
  form.id = null; form.title = ''; form.content = ''
  form.type = 'NOTICE'; form.status = 'PUBLISHED'; form.pinned = 0
  dialogVisible.value = true
}

function openEdit(n) {
  editing.value = true
  form.id = n.id; form.title = n.title; form.content = n.content
  form.type = n.type; form.status = n.status; form.pinned = n.pinned || 0
  dialogVisible.value = true
}

async function submit() {
  if (!form.title.trim() || !form.content.trim()) {
    emit('toast', 'error', '标题和正文不能为空')
    return
  }
  const res = editing.value
    ? await NoticeAPI.update({ ...form })
    : await NoticeAPI.add({ ...form })
  if (res.data.code === 200) {
    emit('toast', 'success', editing.value ? '已更新' : '已发布')
    dialogVisible.value = false
    await load()
  } else emit('toast', 'error', res.data.message)
}

async function togglePin(n) {
  const res = await NoticeAPI.togglePinned(n.id, !n.pinned)
  if (res.data.code === 200) {
    emit('toast', 'success', n.pinned ? '已取消置顶' : '已置顶')
    await load()
  } else emit('toast', 'error', res.data.message)
}

async function remove(n) {
  const ok = await confirmFn('删除确认', `确定删除公告「${n.title}」?`)
  if (!ok) return
  const res = await NoticeAPI.remove(n.id)
  if (res.data.code === 200) {
    emit('toast', 'success', '已删除')
    await load()
  } else emit('toast', 'error', res.data.message)
}

function typeBadge(t) {
  return { NOTICE: 't-notice', ANNOUNCEMENT: 't-announce', MAINTENANCE: 't-maint' }[t] || 't-notice'
}
function typeText(t) {
  return { NOTICE: '通知', ANNOUNCEMENT: '公告', MAINTENANCE: '维护' }[t] || t
}
function statusText(s) {
  return { DRAFT: '草稿', PUBLISHED: '已发布', ARCHIVED: '已归档' }[s] || s
}

onMounted(load)
defineExpose({ reload: load })
</script>

<template>
  <div class="view-header">
    <div>
      <h1 class="view-title">NOTICES<span style="color: var(--yellow)">.</span></h1>
      <p class="view-subtitle">// 公告通知管理 · 共 {{ list.length }} 条</p>
    </div>
    <button class="brutalist-btn primary" @click="openCreate">+ 发布公告</button>
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
          <span v-if="n.pinned" class="pin-badge">★ 置顶</span>
          <span class="status-text">{{ statusText(n.status) }}</span>
        </div>
        <span class="notice-date mono">{{ (n.publishDate || '').replace('T', ' ').slice(0, 16) }}</span>
      </div>
      <h3 class="notice-title">{{ n.title }}</h3>
      <p class="notice-content">{{ n.content }}</p>
      <div class="notice-foot">
        <span class="publisher mono">// 发布人:{{ n.publisherName || '系统' }}</span>
        <div class="foot-actions">
          <button class="mini-btn" @click="togglePin(n)">{{ n.pinned ? '取消置顶' : '置顶' }}</button>
          <button class="mini-btn" @click="openEdit(n)">编辑</button>
          <button class="mini-btn danger" @click="remove(n)">删除</button>
        </div>
      </div>
    </article>
  </div>

  <!-- 编辑对话框 -->
  <div v-if="dialogVisible" class="dialog-mask" @click.self="dialogVisible = false">
    <div class="dialog-box">
      <div class="dialog-head">
        <span class="dialog-tag">// {{ editing ? 'EDIT' : 'NEW' }} NOTICE</span>
        <button class="dialog-close" @click="dialogVisible = false">×</button>
      </div>
      <div class="dialog-body">
        <div class="form-row">
          <label class="form-label">标题</label>
          <input v-model="form.title" class="form-input" maxlength="100" />
        </div>
        <div class="form-row">
          <label class="form-label">类型</label>
          <select v-model="form.type" class="form-input">
            <option value="NOTICE">通知</option>
            <option value="ANNOUNCEMENT">公告</option>
            <option value="MAINTENANCE">维护</option>
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">状态</label>
          <select v-model="form.status" class="form-input">
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">已发布</option>
            <option value="ARCHIVED">已归档</option>
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">正文</label>
          <textarea v-model="form.content" class="form-input" rows="6"></textarea>
        </div>
        <div class="form-row check-row">
          <label>
            <input type="checkbox" :checked="form.pinned === 1" @change="form.pinned = $event.target.checked ? 1 : 0" />
            <span>置顶显示</span>
          </label>
        </div>
      </div>
      <div class="dialog-foot">
        <button class="brutalist-btn" @click="dialogVisible = false">取消</button>
        <button class="brutalist-btn primary" @click="submit">{{ editing ? '保存' : '发布' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading-block, .empty-block {
  padding: 60px; text-align: center;
  background: var(--white); border: var(--border);
  box-shadow: var(--shadow);
  font-family: var(--font-mono); letter-spacing: 0.1em;
}
.notice-list { display: flex; flex-direction: column; gap: 14px; }
.notice-card {
  background: var(--white);
  border: var(--border);
  border-radius: 2px;
  box-shadow: var(--shadow-sm);
  padding: 16px 20px;
  transition: box-shadow 0.2s ease;
}
.notice-card:hover { box-shadow: var(--shadow); }
.type-notice { border-left: 4px solid var(--yellow); }
.type-announcement { border-left: 4px solid var(--green); }
.type-maintenance { border-left: 4px solid var(--pink); }
.notice-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px;
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
.pin-badge {
  font-family: var(--font-mono); font-size: 11px;
  background: var(--ink); color: var(--yellow);
  padding: 2px 6px; letter-spacing: 0.1em;
  border-radius: 2px;
}
.status-text {
  font-family: var(--font-mono); font-size: 10px;
  opacity: 0.6; letter-spacing: 0.1em;
}
.notice-date { font-size: 11px; opacity: 0.6; }
.notice-title {
  font-family: var(--font-cn); font-size: 22px; font-weight: 700;
  margin-bottom: 8px;
}
.notice-content {
  font-family: var(--font-cn); font-size: 14px;
  line-height: 1.7; opacity: 0.85;
  white-space: pre-wrap;
}
.notice-foot {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 12px; padding-top: 10px;
  border-top: 1px dashed rgba(43, 37, 32, 0.2);
}
.publisher { font-size: 11px; opacity: 0.6; }
.foot-actions { display: flex; gap: 6px; }
.mini-btn {
  font-family: var(--font-mono); font-size: 11px; font-weight: 700;
  padding: 4px 10px; background: var(--white);
  border: 1px solid rgba(43, 37, 32, 0.28); border-radius: 2px;
  cursor: pointer;
  letter-spacing: 0.05em;
  transition: all 0.2s ease;
}
.mini-btn:hover { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.mini-btn.danger { background: rgba(139, 58, 58, 0.15); color: var(--pink); border-color: rgba(139, 58, 58, 0.5); }
.mini-btn.danger:hover { background: rgba(139, 58, 58, 0.25); color: var(--pink); border-color: rgba(139, 58, 58, 0.7); }

.dialog-mask {
  position: fixed; inset: 0;
  background: rgba(43, 37, 32, 0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: 20px;
}
.dialog-box {
  background: var(--bg); border: var(--border);
  border-radius: 3px;
  box-shadow: var(--shadow-lg);
  width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto;
}
.dialog-head {
  display: flex; justify-content: space-between; align-items: center;
  background: var(--ink); color: var(--bg);
  padding: 10px 16px;
  font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.15em;
}
.dialog-close {
  background: rgba(255, 255, 255, 0.12); color: var(--bg);
  border: 1px solid rgba(253, 251, 246, 0.25);
  border-radius: 2px;
  width: 28px; height: 28px;
  font-size: 18px; font-weight: 700;
  cursor: pointer; line-height: 1;
  transition: all 0.2s ease;
}
.dialog-close:hover { background: rgba(139, 58, 58, 0.6); }
.dialog-body { padding: 20px; }
.form-row { margin-bottom: 14px; }
.form-label {
  display: block; font-family: var(--font-mono); font-size: 11px;
  letter-spacing: 0.1em; text-transform: uppercase;
  margin-bottom: 6px; opacity: 0.8;
}
.form-input {
  width: 100%; font-family: var(--font-mono); font-size: 13px;
  padding: 8px 10px; background: var(--white);
  border: 1px solid rgba(43, 37, 32, 0.28); border-radius: 2px;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}
.form-input:focus { outline: none; border-color: var(--yellow); }
textarea.form-input { resize: vertical; }
.check-row label {
  display: flex; align-items: center; gap: 8px;
  font-family: var(--font-mono); font-size: 13px;
  cursor: pointer;
}
.dialog-foot {
  display: flex; gap: 10px; justify-content: flex-end;
  padding: 14px 20px; border-top: 1px solid rgba(43, 37, 32, 0.16);
  background: var(--white);
}
</style>
