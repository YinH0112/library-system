<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import { CategoryAPI } from '../api.js'

const emit = defineEmits(['toast'])
const confirmFn = inject('confirmFn')

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({ id: null, name: '', description: '' })

async function load() {
  loading.value = true
  try {
    const res = await CategoryAPI.list()
    if (res.data.code === 200) list.value = res.data.data || []
  } catch (e) { emit('toast', 'error', '加载失败') }
  finally { loading.value = false }
}

function openAdd() {
  isEdit.value = false
  form.id = null
  form.name = ''
  form.description = ''
  dialogVisible.value = true
}

function openEdit(c) {
  isEdit.value = true
  form.id = c.id
  form.name = c.name
  form.description = c.description || ''
  dialogVisible.value = true
}

async function submit() {
  if (!form.name.trim()) { emit('toast', 'error', '名称不能为空'); return }
  try {
    const res = isEdit.value
      ? await CategoryAPI.update({ ...form })
      : await CategoryAPI.add({ name: form.name.trim(), description: form.description.trim() })
    if (res.data.code === 200) {
      emit('toast', 'success', isEdit.value ? '修订完成' : '新增完成')
      dialogVisible.value = false
      await load()
    } else emit('toast', 'error', res.data.message)
  } catch (e) { emit('toast', 'error', '网络错误') }
}

async function remove(c) {
  const ok = await confirmFn('删除分类', `确定删除《${c.name}》?若该分类下仍有图书将无法删除`)
  if (!ok) return
  const res = await CategoryAPI.remove(c.id)
  if (res.data.code === 200) {
    emit('toast', 'warning', '已删除')
    await load()
  } else emit('toast', 'error', res.data.message || '删除失败(可能仍有图书引用)')
}

onMounted(load)
defineExpose({ reload: load })
</script>

<template>
  <div class="view-header">
    <div>
      <h1 class="view-title">CATEGORIES<span style="color: var(--yellow)">.</span></h1>
      <p class="view-subtitle">// 图书分类体系</p>
    </div>
    <button class="brutalist-btn primary" @click="openAdd">+ 新增分类</button>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 80px;">ID</th>
        <th>分类名</th>
        <th>描述</th>
        <th style="width: 100px;">图书数</th>
        <th style="width: 180px;">操作</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="c in list" :key="c.id">
        <td>#{{ String(c.id).padStart(3, '0') }}</td>
        <td style="font-family: var(--font-cn); font-weight: 700; font-size: 16px;">{{ c.name }}</td>
        <td>{{ c.description || '—' }}</td>
        <td><span class="badge badge-borrowed">{{ c.bookCount || 0 }}</span></td>
        <td>
          <button class="mini-btn edit" @click="openEdit(c)">编辑</button>
          <button class="mini-btn delete" @click="remove(c)">删除</button>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- 内联对话框(简化版) -->
  <transition name="dialog">
    <div v-if="dialogVisible" class="confirm-overlay" @click.self="dialogVisible = false">
      <div class="confirm-box" style="max-width: 480px;">
        <h3 class="confirm-title">{{ isEdit ? '编辑分类' : '新增分类' }}</h3>
        <div style="display: flex; flex-direction: column; gap: 12px; margin: 16px 0;">
          <input v-model="form.name" class="brutalist-input" placeholder="分类名(必填)" maxlength="50" />
          <input v-model="form.description" class="brutalist-input" placeholder="描述(选填)" maxlength="200" />
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
.mini-btn.edit:hover { background: rgba(184, 146, 74, 0.15); color: var(--yellow); border-color: rgba(184, 146, 74, 0.5); }
.mini-btn.delete:hover { background: rgba(139, 58, 58, 0.15); color: var(--pink); border-color: rgba(139, 58, 58, 0.5); }
.dialog-enter-active, .dialog-leave-active { transition: opacity 0.2s; }
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
</style>
