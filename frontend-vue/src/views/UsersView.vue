<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import { UserAPI, ReaderAPI } from '../api.js'
import { authStore } from '../store/auth.js'

const emit = defineEmits(['toast'])
const confirmFn = inject('confirmFn')

const list = ref([])
const readers = ref([])
const roleFilter = ref('')
const dialogVisible = ref(false)
const form = reactive({ username: '', password: '', role: 'READER', readerId: null })

async function load() {
  const res = await UserAPI.list(roleFilter.value || null)
  if (res.data.code === 200) list.value = res.data.data || []
  else emit('toast', 'error', res.data.message)
}

async function loadReaders() {
  const res = await ReaderAPI.list()
  if (res.data.code === 200) readers.value = res.data.data || []
}

function openAdd() {
  form.username = ''
  form.password = ''
  form.role = 'READER'
  form.readerId = null
  dialogVisible.value = true
}

async function submit() {
  if (!form.username || !form.password) {
    emit('toast', 'error', '用户名和密码必填')
    return
  }
  const res = await UserAPI.add({ ...form })
  if (res.data.code === 200) {
    emit('toast', 'success', '用户创建成功')
    dialogVisible.value = false
    await load()
  } else emit('toast', 'error', res.data.message)
}

async function toggleStatus(u) {
  const res = await UserAPI.toggleStatus(u.id)
  if (res.data.code === 200) {
    emit('toast', 'success', '状态已切换')
    await load()
  } else emit('toast', 'error', res.data.message)
}

async function remove(u) {
  if (authStore.state.user && authStore.state.user.id === u.id) {
    emit('toast', 'error', '不能删除当前登录账号')
    return
  }
  const ok = await confirmFn('删除用户', `确定删除用户 ${u.username}?`)
  if (!ok) return
  const res = await UserAPI.remove(u.id)
  if (res.data.code === 200) { emit('toast', 'warning', '已删除'); await load() }
  else emit('toast', 'error', res.data.message)
}

function statusBadge(s) {
  return s === 'ACTIVE' ? 'badge-active' : 'badge-suspended'
}
function roleBadge(r) {
  return r === 'ADMIN' ? 'badge-overdue' : 'badge-active'
}

onMounted(async () => { await load(); await loadReaders() })
defineExpose({ reload: load })
</script>

<template>
  <div class="view-header">
    <div>
      <h1 class="view-title">USERS<span style="color: var(--yellow)">.</span></h1>
      <p class="view-subtitle">// 系统用户管理</p>
    </div>
    <button class="brutalist-btn primary" @click="openAdd">+ 新增用户</button>
  </div>

  <div class="filter-bar">
    <div class="filter-group">
      <span class="filter-label">角色</span>
      <select v-model="roleFilter" class="filter-input" @change="load">
        <option value="">全部</option>
        <option value="ADMIN">管理员</option>
        <option value="READER">借阅者</option>
      </select>
    </div>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 60px;">ID</th>
        <th>用户名</th>
        <th>角色</th>
        <th>关联读者</th>
        <th>状态</th>
        <th style="width: 240px;">操作</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="u in list" :key="u.id">
        <td>#{{ String(u.id).padStart(3, '0') }}</td>
        <td style="font-family: var(--font-cn); font-weight: 700;">{{ u.username }}</td>
        <td><span :class="['badge', roleBadge(u.role)]">{{ u.role }}</span></td>
        <td>{{ u.readerName || '—' }}</td>
        <td><span :class="['badge', statusBadge(u.status)]">{{ u.status }}</span></td>
        <td>
          <button class="mini-btn" @click="toggleStatus(u)">
            {{ u.status === 'ACTIVE' ? '禁用' : '启用' }}
          </button>
          <button class="mini-btn delete" @click="remove(u)">删除</button>
        </td>
      </tr>
    </tbody>
  </table>

  <transition name="dialog">
    <div v-if="dialogVisible" class="confirm-overlay" @click.self="dialogVisible = false">
      <div class="confirm-box" style="max-width: 480px;">
        <h3 class="confirm-title">新增用户</h3>
        <div style="display: flex; flex-direction: column; gap: 12px; margin: 16px 0;">
          <input v-model="form.username" class="brutalist-input" placeholder="用户名" maxlength="50" />
          <input v-model="form.password" type="password" class="brutalist-input" placeholder="密码" />
          <select v-model="form.role" class="filter-input">
            <option value="READER">借阅者</option>
            <option value="ADMIN">管理员</option>
          </select>
          <select v-if="form.role === 'READER'" v-model="form.readerId" class="filter-input">
            <option :value="null">— 选择读者档案(可选) —</option>
            <option v-for="r in readers" :key="r.id" :value="r.id">
              {{ r.name }} ({{ r.studentId || '无学号' }})
            </option>
          </select>
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
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  border: 1px solid rgba(43, 37, 32, 0.28);
  border-radius: 2px;
  background: var(--white);
  cursor: pointer;
  margin-right: 6px;
  transition: all 0.2s ease;
}
.mini-btn:hover { background: rgba(184, 146, 74, 0.15); color: var(--yellow); border-color: rgba(184, 146, 74, 0.5); }
.mini-btn.delete:hover { background: rgba(139, 58, 58, 0.15); color: var(--pink); border-color: rgba(139, 58, 58, 0.5); }
.dialog-enter-active, .dialog-leave-active { transition: opacity 0.2s; }
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
</style>
