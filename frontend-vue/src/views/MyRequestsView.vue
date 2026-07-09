<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { BorrowRequestAPI } from '../api.js'
import { authStore } from '../store/auth.js'

const emit = defineEmits(['toast'])
const confirmFn = inject('confirmFn')

const list = ref([])
const statusFilter = ref('')
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await BorrowRequestAPI.my(statusFilter.value || null)
    if (res.data.code === 200) list.value = res.data.data || []
    else emit('toast', 'error', '加载失败')
  } catch (e) { emit('toast', 'error', '加载失败') }
  finally { loading.value = false }
}

async function cancel(r) {
  const ok = await confirmFn('取消申请', `确定取消对《${r.bookName}》的借阅申请?`)
  if (!ok) return
  const res = await BorrowRequestAPI.cancel(r.id)
  if (res.data.code === 200) {
    emit('toast', 'success', '已取消')
    await load()
  } else emit('toast', 'error', res.data.message)
}

function statusBadge(s) {
  return {
    PENDING: 'badge-pending',
    APPROVED: 'badge-approved',
    REJECTED: 'badge-rejected',
    CANCELLED: 'badge-cancelled'
  }[s] || 'badge-pending'
}
function statusText(s) {
  return { PENDING: '待审批', APPROVED: '已批准', REJECTED: '已拒绝', CANCELLED: '已取消' }[s] || s
}

onMounted(load)
defineExpose({ reload: load })
</script>

<template>
  <div class="view-header">
    <div>
      <h1 class="view-title">MY REQUESTS<span style="color: var(--yellow)">.</span></h1>
      <p class="view-subtitle">// 我的借阅申请 · 共 {{ list.length }} 条</p>
    </div>
    <button class="brutalist-btn" @click="load">刷新</button>
  </div>

  <div class="filter-bar">
    <div class="filter-group">
      <span class="filter-label">状态</span>
      <select v-model="statusFilter" class="filter-input" @change="load">
        <option value="">全部</option>
        <option value="PENDING">待审批</option>
        <option value="APPROVED">已批准</option>
        <option value="REJECTED">已拒绝</option>
        <option value="CANCELLED">已取消</option>
      </select>
    </div>
  </div>

  <div v-if="loading" class="loading-block"><span>LOADING...</span></div>

  <div v-else-if="list.length === 0" class="empty-block">
    <span>// 暂无申请记录</span>
    <p style="margin-top: 12px; opacity: 0.6;">前往「Browse」浏览图书并发起借阅申请</p>
  </div>

  <div v-else>
    <table class="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>图书</th>
          <th>申请日期</th>
          <th>借期</th>
          <th>状态</th>
          <th>审批日期</th>
          <th>管理员备注</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in list" :key="r.id">
          <td class="mono">#{{ String(r.id).padStart(3, '0') }}</td>
          <td class="bold">{{ r.bookName }}</td>
          <td class="mono">{{ r.requestDate }}</td>
          <td class="mono">{{ r.dueDays }} 天</td>
          <td><span :class="['badge', statusBadge(r.status)]">{{ statusText(r.status) }}</span></td>
          <td class="mono">{{ r.approveDate || '—' }}</td>
          <td class="mono small">{{ r.adminRemark || '—' }}</td>
          <td>
            <button v-if="r.status === 'PENDING'" class="mini-btn danger" @click="cancel(r)">取消</button>
            <span v-else class="mono small" style="opacity:0.4;">—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.loading-block, .empty-block {
  padding: 60px;
  text-align: center;
  background: var(--white);
  border: var(--border);
  box-shadow: var(--shadow);
  font-family: var(--font-mono);
  letter-spacing: 0.1em;
}
.badge-pending { background: rgba(184, 146, 74, 0.18); color: var(--yellow); border: 1px solid rgba(184, 146, 74, 0.4); }
.badge-approved { background: rgba(92, 122, 92, 0.18); color: var(--green); border: 1px solid rgba(92, 122, 92, 0.4); }
.badge-rejected { background: rgba(139, 58, 58, 0.18); color: var(--pink); border: 1px solid rgba(139, 58, 58, 0.4); }
.badge-cancelled { background: rgba(43, 37, 32, 0.12); color: var(--ink); opacity: 0.7; border: 1px solid rgba(43, 37, 32, 0.2); }
.mono { font-family: var(--font-mono); }
.bold { font-weight: 700; }
.small { font-size: 11px; }
.mini-btn {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  background: var(--white);
  border: 1px solid rgba(43, 37, 32, 0.28);
  border-radius: 2px;
  cursor: pointer;
  letter-spacing: 0.05em;
  transition: all 0.2s ease;
}
.mini-btn:hover { background: rgba(184, 146, 74, 0.15); color: var(--yellow); border-color: rgba(184, 146, 74, 0.5); }
.mini-btn.danger { background: rgba(139, 58, 58, 0.15); color: var(--pink); border-color: rgba(139, 58, 58, 0.5); }
.mini-btn.danger:hover { background: rgba(139, 58, 58, 0.25); color: var(--pink); border-color: rgba(139, 58, 58, 0.7); }
</style>
