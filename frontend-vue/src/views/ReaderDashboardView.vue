<script setup>
import { ref, onMounted } from 'vue'
import { StatsAPI, BorrowAPI } from '../api.js'
import { authStore } from '../store/auth.js'

const emit = defineEmits(['toast'])

const overview = ref({})
const myBorrows = ref([])
const loading = ref(true)

async function loadAll() {
  loading.value = true
  const readerId = authStore.state.user?.readerId
  if (!readerId) { loading.value = false; return }
  try {
    const [ov, br] = await Promise.all([
      StatsAPI.myOverview(readerId),
      BorrowAPI.myBorrows(readerId)
    ])
    overview.value = ov.data.data || {}
    myBorrows.value = (br.data.data || []).slice(0, 5)
  } catch (e) {
    emit('toast', 'error', '数据加载失败')
  } finally {
    loading.value = false
  }
}

function statusBadge(s) {
  return { BORROWED: 'badge-borrowed', RETURNED: 'badge-returned', OVERDUE: 'badge-overdue' }[s] || 'badge-borrowed'
}

onMounted(loadAll)
defineExpose({ reload: loadAll })
</script>

<template>
  <div class="view-header">
    <div>
      <h1 class="view-title">MY DASHBOARD<span style="color: var(--yellow)">.</span></h1>
      <p class="view-subtitle">// {{ authStore.state.user?.readerName || authStore.state.user?.username }} 的借阅概览</p>
    </div>
    <button class="brutalist-btn primary" @click="loadAll">↻ 刷新</button>
  </div>

  <div v-if="loading" style="padding: 60px; text-align: center;">
    <span style="font-family: var(--font-display); font-size: 24px;">LOADING...</span>
  </div>

  <template v-else>
    <div class="dashboard-grid">
      <div class="metric-card pink">
        <div class="metric-label">累计借阅</div>
        <div class="metric-num">{{ overview.totalBorrows || 0 }}</div>
      </div>
      <div class="metric-card yellow">
        <div class="metric-label">借出中</div>
        <div class="metric-num">{{ overview.activeBorrows || 0 }}</div>
      </div>
      <div class="metric-card orange">
        <div class="metric-label">已逾期</div>
        <div class="metric-num">{{ overview.overdueCount || 0 }}</div>
      </div>
      <div class="metric-card green">
        <div class="metric-label">已归还</div>
        <div class="metric-num">{{ overview.returnedCount || 0 }}</div>
      </div>
      <div class="metric-card blue">
        <div class="metric-label">累计罚款</div>
        <div class="metric-num">¥{{ Number(overview.totalFine || 0).toFixed(2) }}</div>
      </div>
    </div>

    <div style="margin-top: 32px;">
      <h2 class="view-title" style="font-size: 24px; margin-bottom: 12px;">最近借阅</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>图书</th>
            <th>借出日</th>
            <th>应还日</th>
            <th>归还日</th>
            <th>状态</th>
            <th>罚款</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in myBorrows" :key="b.id">
            <td>#{{ String(b.id).padStart(3, '0') }}</td>
            <td style="font-family: var(--font-cn); font-weight: 700;">{{ b.bookName }}</td>
            <td>{{ b.borrowDate }}</td>
            <td>{{ b.dueDate }}</td>
            <td>{{ b.returnDate || '—' }}</td>
            <td><span :class="['badge', statusBadge(b.status)]">{{ b.status }}</span></td>
            <td>¥{{ Number(b.fine || 0).toFixed(2) }}</td>
          </tr>
          <tr v-if="myBorrows.length === 0">
            <td colspan="7" style="text-align: center; padding: 32px; opacity: 0.6;">暂无借阅记录</td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
</template>
