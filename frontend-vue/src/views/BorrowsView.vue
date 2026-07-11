<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import { BorrowAPI, BookAPI, ReaderAPI } from '../api.js'

const emit = defineEmits(['toast'])
const confirmFn = inject('confirmFn')

const list = ref([])
const statusFilter = ref('')
const borrowDialogVisible = ref(false)
const books = ref([])
const readers = ref([])
const action = reactive({ bookId: null, readerId: null, days: 30 })

async function load() {
  const res = await BorrowAPI.list(statusFilter.value || null, null)
  if (res.data.code === 200) list.value = res.data.data || []
  else emit('toast', 'error', '加载失败')
}

async function openBorrowDialog() {
  const [bRes, rRes] = await Promise.all([BookAPI.list(), ReaderAPI.list()])
  books.value = (bRes.data.data || []).filter(b => b.stock > 0)
  readers.value = (rRes.data.data || []).filter(r => r.status === 'ACTIVE')
  action.bookId = null
  action.readerId = null
  action.days = 30
  borrowDialogVisible.value = true
}

async function submitBorrow() {
  if (!action.bookId || !action.readerId) {
    emit('toast', 'error', '请选择图书和读者')
    return
  }
  const res = await BorrowAPI.borrow({ ...action })
  if (res.data.code === 200) {
    emit('toast', 'success', '借出成功')
    borrowDialogVisible.value = false
    await load()
  } else emit('toast', 'error', res.data.message)
}

async function returnBook(b) {
  const ok = await confirmFn('归还确认', `确定归还《${b.bookName}》?`)
  if (!ok) return
  const res = await BorrowAPI.returnBook(b.id)
  if (res.data.code === 200) {
    emit('toast', 'success', '归还成功')
    await load()
  } else emit('toast', 'error', res.data.message)
}

function statusBadge(s) {
  return {
    BORROWED: 'badge-borrowed',
    RETURNED: 'badge-returned',
    OVERDUE: 'badge-overdue'
  }[s] || 'badge-borrowed'
}

onMounted(load)
defineExpose({ reload: load })
</script>

<template>
  <div class="view-header">
    <div>
      <h1 class="view-title">BORROWS<span style="color: var(--yellow)">.</span></h1>
      <p class="view-subtitle">// 借阅记录与归还</p>
    </div>
    <button class="brutalist-btn primary" @click="openBorrowDialog">+ 新借阅</button>
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
        <th style="width: 80px;">ID</th>
        <th>图书</th>
        <th>读者</th>
        <th>借出日</th>
        <th>应还日</th>
        <th>归还日</th>
        <th style="width: 90px;">状态</th>
        <th style="width: 90px;">罚款</th>
        <th style="width: 120px;">操作</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="b in list" :key="b.id">
        <td>#{{ String(b.id).padStart(3, '0') }}</td>
        <td style="font-family: var(--font-cn); font-weight: 700;">{{ b.bookName }}</td>
        <td>{{ b.readerName }}</td>
        <td>{{ b.borrowDate }}</td>
        <td>{{ b.dueDate }}</td>
        <td>{{ b.returnDate || '—' }}</td>
        <td><span :class="['badge', statusBadge(b.status)]">{{ b.status }}</span></td>
        <td>¥{{ Number(b.fine || 0).toFixed(2) }}</td>
        <td>
          <button v-if="b.status !== 'RETURNED'"
                  class="mini-btn edit" @click="returnBook(b)">归还</button>
          <span v-else style="opacity: 0.4; font-size: 11px;">已完结</span>
        </td>
      </tr>
    </tbody>
  </table>

  <transition name="dialog">
    <div v-if="borrowDialogVisible" class="confirm-overlay" @click.self="borrowDialogVisible = false">
      <div class="confirm-box" style="max-width: 480px;">
        <h3 class="confirm-title">新借阅</h3>
        <div style="display: flex; flex-direction: column; gap: 12px; margin: 16px 0;">
          <div>
            <div class="filter-label" style="margin-bottom: 4px;">图书(仅显示可借)</div>
            <select v-model="action.bookId" class="filter-input">
              <option :value="null">— 选择图书 —</option>
              <option v-for="b in books" :key="b.id" :value="b.id">
                {{ b.name }} (库存:{{ b.stock }})
              </option>
            </select>
          </div>
          <div>
            <div class="filter-label" style="margin-bottom: 4px;">读者(仅显示 ACTIVE)</div>
            <select v-model="action.readerId" class="filter-input">
              <option :value="null">— 选择读者 —</option>
              <option v-for="r in readers" :key="r.id" :value="r.id">
                {{ r.name }} ({{ r.studentId || '无学号' }})
              </option>
            </select>
          </div>
          <div>
            <div class="filter-label" style="margin-bottom: 4px;">借阅天数</div>
            <input v-model.number="action.days" type="number" min="1" max="90" class="brutalist-input" />
          </div>
        </div>
        <div class="confirm-actions">
          <button class="brutalist-btn" @click="borrowDialogVisible = false">取消</button>
          <button class="brutalist-btn primary" @click="submitBorrow">确认借出</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.mini-btn {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card);
  cursor: pointer;
  transition: all 0.16s ease;
}
.mini-btn.edit:hover { background: var(--success-bg); color: var(--success); border-color: rgba(140,160,111,0.4); }
.dialog-enter-active, .dialog-leave-active { transition: opacity 0.2s; }
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
</style>
