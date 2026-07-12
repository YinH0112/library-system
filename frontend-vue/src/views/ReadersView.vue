<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import { ReaderAPI } from '../api.js'
import { showToast } from '../composables/useToast.js'
const confirmFn = inject('confirmFn')

const list = ref([])
const keyword = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({
  id: null, name: '', studentId: '', phone: '', email: '', status: 'ACTIVE', registerDate: ''
})

async function load() {
  const res = await ReaderAPI.list(keyword.value)
  if (res.data.code === 200) list.value = res.data.data || []
  else showToast('error', '加载失败')
}

function openAdd() {
  isEdit.value = false
  Object.assign(form, { id: null, name: '', studentId: '', phone: '', email: '', status: 'ACTIVE', registerDate: '' })
  dialogVisible.value = true
}

function openEdit(r) {
  isEdit.value = true
  Object.assign(form, r)
  dialogVisible.value = true
}

async function submit() {
  if (!form.name.trim()) { showToast('error', '姓名不能为空'); return }
  const payload = { ...form, name: form.name.trim() }
  const res = isEdit.value ? await ReaderAPI.update(payload) : await ReaderAPI.add(payload)
  if (res.data.code === 200) {
    showToast('success', isEdit.value ? '修订完成' : '注册成功')
    dialogVisible.value = false
    await load()
  } else showToast('error', res.data.message)
}

async function remove(r) {
  const ok = await confirmFn('删除读者', `确定删除读者《${r.name}》?`)
  if (!ok) return
  const res = await ReaderAPI.remove(r.id)
  if (res.data.code === 200) { showToast('warning', '已删除'); await load() }
  else showToast('error', res.data.message || '删除失败(可能仍有未还图书)')
}

function statusBadge(s) {
  return s === 'ACTIVE' ? 'badge-active' : 'badge-suspended'
}

onMounted(load)
defineExpose({ reload: load })
</script>

<template>
  <div class="view-header">
    <div>
      <h1 class="view-title">READERS<span style="color: var(--yellow)">.</span></h1>
      <p class="view-subtitle">// 读者档案管理</p>
    </div>
    <button class="brutalist-btn primary" @click="openAdd">+ 新增读者</button>
  </div>

  <div class="filter-bar">
    <div class="filter-group">
      <span class="filter-label">搜索</span>
      <input v-model="keyword" class="filter-input" placeholder="姓名/学号/电话" @keyup.enter="load" />
    </div>
    <button class="brutalist-btn primary" @click="load">GO</button>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 80px;">ID</th>
        <th>姓名</th>
        <th>学号</th>
        <th>电话</th>
        <th>邮箱</th>
        <th style="width: 100px;">状态</th>
        <th style="width: 100px;">借阅中</th>
        <th style="width: 180px;">操作</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="r in list" :key="r.id">
        <td>#{{ String(r.id).padStart(3, '0') }}</td>
        <td style="font-family: var(--font-cn); font-weight: 700;">{{ r.name }}</td>
        <td>{{ r.studentId || '—' }}</td>
        <td>{{ r.phone || '—' }}</td>
        <td>{{ r.email || '—' }}</td>
        <td><span :class="['badge', statusBadge(r.status)]">{{ r.status }}</span></td>
        <td><span class="badge badge-borrowed">{{ r.activeBorrowCount || 0 }}</span></td>
        <td>
          <button class="mini-btn edit" @click="openEdit(r)">编辑</button>
          <button class="mini-btn delete" @click="remove(r)">删除</button>
        </td>
      </tr>
    </tbody>
  </table>

  <transition name="dialog">
    <div v-if="dialogVisible" class="confirm-overlay" @click.self="dialogVisible = false">
      <div class="confirm-box" style="max-width: 540px;">
        <h3 class="confirm-title">{{ isEdit ? '编辑读者' : '新增读者' }}</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0;">
          <input v-model="form.name" class="brutalist-input" placeholder="姓名(必填)" maxlength="50" />
          <input v-model="form.studentId" class="brutalist-input" placeholder="学号/工号" maxlength="20" />
          <input v-model="form.phone" class="brutalist-input" placeholder="电话" maxlength="20" />
          <input v-model="form.email" class="brutalist-input" placeholder="邮箱" maxlength="100" />
          <select v-model="form.status" class="filter-input">
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
          <input v-model="form.registerDate" class="brutalist-input" type="date" />
        </div>
        <div class="confirm-actions">
          <button class="brutalist-btn" @click="dialogVisible = false">取消</button>
          <button class="brutalist-btn primary" @click="submit">确认</button>
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
  margin-right: 6px;
  transition: all 0.16s ease;
}
.mini-btn.edit:hover { background: var(--warning-bg); color: var(--warning); border-color: rgba(217,119,87,0.4); }
.mini-btn.delete:hover { background: #fcdede; color: var(--destructive); border-color: rgba(239,68,68,0.4); }
.dialog-enter-active, .dialog-leave-active { transition: opacity 0.2s; }
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
</style>
