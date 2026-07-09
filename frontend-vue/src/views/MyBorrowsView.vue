<script setup>
import { ref, onMounted } from 'vue'
import { BorrowAPI } from '../api.js'
import { authStore } from '../store/auth.js'

const emit = defineEmits(['toast'])

const list = ref([])
const statusFilter = ref('')
const loading = ref(false)

async function load() {
  loading.value = true
  const readerId = authStore.state.user?.readerId
  if (!readerId) { loading.value = false; return }
  try {
    const res = await BorrowAPI.myBorrows(readerId)
    let all = res.data.data || []
    if (statusFilter.value) {
      all = all.filter(b => b.status === statusFilter.value)
    }
    list.value = all
  } catch (e) { emit('toast', 'error', '加载失败') }
  finally { loading.value = false }
}

function statusBadge(s) {
  return { BORROWED: 'badge-borrowed', RETURNED: 'badge-returned', OVERDUE: 'badge-overdue' }[s] || 'badge-borrowed'
}

onMounted(load)
defineExpose({ reload: load })
</script>

<template>
  <div class="view-header">
    <div>
      <h1 class="view-title">MY BORROWS<span style="color: var(--yellow)">.</span></h1>
      <p class="view-subtitle">// 我的借阅记录</p>
    </div>
  </div>

  <div class="filter-bar">
    <div class="filter-group">
      <span class="filter-label">状态</span>
      <select v-model="statusFilter" class="filter-input" @change="load">
        <option value="">全部</option>
        <option value="BORROWED">借出中</option>
        <option value="RETURNED">已归还</option>
        <option value="OVERDUE">逾期</option>
      </select>
    </div>
  </div>

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
      <tr v-for="b in list" :key="b.id">
        <td>#{{ String(b.id).padStart(3, '0') }}</td>
        <td style="font-family: var(--font-cn); font-weight: 700;">{{ b.bookName }}</td>
        <td>{{ b.borrowDate }}</td>
        <td>{{ b.dueDate }}</td>
        <td>{{ b.returnDate || '—' }}</td>
        <td><span :class="['badge', statusBadge(b.status)]">{{ b.status }}</span></td>
        <td>¥{{ Number(b.fine || 0).toFixed(2) }}</td>
      </tr>
      <tr v-if="list.length === 0">
        <td colspan="7" style="text-align: center; padding: 32px; opacity: 0.6;">暂无记录</td>
      </tr>
    </tbody>
  </table>
</template>
