<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { BookAPI, CategoryAPI } from '../api.js'
import BookCard from '../components/BookCard.vue'
import BookFormDialog from '../components/BookFormDialog.vue'

const emit = defineEmits(['toast'])
const confirmFn = inject('confirmFn')

const books = ref([])
const categories = ref([])
const loading = ref(false)
const viewMode = ref('grid')
const total = ref(0)

const query = reactive({
  name: '', author: '', publisher: '', categoryId: null,
  page: 1, size: 12
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / query.size)))

const dialogVisible = ref(false)
const isEditMode = ref(false)
const dialogRef = ref(null)

async function loadCategories() {
  const res = await CategoryAPI.list()
  if (res.data.code === 200) categories.value = res.data.data || []
}

async function load() {
  loading.value = true
  try {
    const res = await BookAPI.page(query)
    if (res.data.code === 200) {
      const pr = res.data.data || {}
      books.value = pr.records || []
      total.value = pr.total || 0
    } else emit('toast', 'error', res.data.message)
  } catch (e) { emit('toast', 'error', '网络错误') }
  finally { loading.value = false }
}

function search() { query.page = 1; load() }
function resetFilters() {
  query.name = ''; query.author = ''; query.publisher = ''; query.categoryId = null
  query.page = 1
  load()
}
function goPage(p) {
  if (p < 1 || p > totalPages.value) return
  query.page = p
  load()
}

function openAdd() {
  isEditMode.value = false
  if (dialogRef.value) dialogRef.value.reset()
  dialogVisible.value = true
}
function openEdit(book) {
  isEditMode.value = true
  dialogVisible.value = true
  setTimeout(() => { if (dialogRef.value) dialogRef.value.fill(book) }, 50)
}

async function handleSubmit(payload, done) {
  try {
    const res = payload.id != null ? await BookAPI.update(payload) : await BookAPI.add(payload)
    if (res.data.code === 200) {
      emit('toast', 'success', payload.id != null ? '修订完成' : '入藏完成')
      dialogVisible.value = false
      await load()
    } else emit('toast', 'error', res.data.message)
  } catch (e) { emit('toast', 'error', '网络错误') }
  finally { done && done() }
}

async function handleDelete(book) {
  const ok = await confirmFn('移出馆藏', `确定将《${book.name}》移出馆藏?`)
  if (!ok) return
  const res = await BookAPI.remove(book.id)
  if (res.data.code === 200) { emit('toast', 'warning', '已移出'); await load() }
  else emit('toast', 'error', res.data.message)
}

onMounted(async () => { await loadCategories(); await load() })
defineExpose({ reload: load })
</script>

<template>
  <div class="view-header">
    <div>
      <h1 class="view-title">BOOKS<span style="color: var(--yellow)">.</span></h1>
      <p class="view-subtitle">// 馆藏图书 · 共 {{ total }} 条</p>
    </div>
    <div style="display: flex; gap: 12px;">
      <div class="view-toggle">
        <button :class="['toggle-btn', { active: viewMode === 'grid' }]" @click="viewMode = 'grid'">GRID</button>
        <button :class="['toggle-btn', { active: viewMode === 'table' }]" @click="viewMode = 'table'">LIST</button>
      </div>
      <button class="brutalist-btn primary" @click="openAdd">+ 新增</button>
    </div>
  </div>

  <!-- 筛选条 -->
  <div class="filter-bar">
    <div class="filter-group">
      <span class="filter-label">书名</span>
      <input v-model="query.name" class="filter-input" @keyup.enter="search" />
    </div>
    <div class="filter-group">
      <span class="filter-label">作者</span>
      <input v-model="query.author" class="filter-input" @keyup.enter="search" />
    </div>
    <div class="filter-group">
      <span class="filter-label">出版社</span>
      <input v-model="query.publisher" class="filter-input" @keyup.enter="search" />
    </div>
    <div class="filter-group">
      <span class="filter-label">分类</span>
      <select v-model="query.categoryId" class="filter-input">
        <option :value="null">全部</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>
    <button class="brutalist-btn primary" @click="search">GO</button>
    <button class="brutalist-btn" @click="resetFilters">重置</button>
  </div>

  <!-- 内容 -->
  <div v-if="loading" style="padding: 60px; text-align: center;">
    <span class="loading-box" style="font-family: var(--font-display); font-size: 24px;">LOADING...</span>
  </div>
  <div v-else-if="books.length === 0" style="padding: 60px; text-align: center;">
    <p style="font-family: var(--font-display); font-size: 28px;">[ NO DATA ]</p>
    <p style="font-family: var(--font-mono); opacity: 0.6; margin-top: 8px;">无符合条件的图书</p>
  </div>

  <transition-group v-else-if="viewMode === 'grid'" name="grid" tag="div" class="book-grid">
    <BookCard v-for="(b, i) in books" :key="b.id" :book="b" :index="i"
              @edit="openEdit" @delete="handleDelete" />
  </transition-group>

  <div v-else>
    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th><th>书名</th><th>作者</th><th>分类</th>
          <th>定价</th><th>库存</th><th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="b in books" :key="b.id">
          <td>#{{ String(b.id).padStart(3, '0') }}</td>
          <td style="font-family: var(--font-cn); font-weight: 700;">{{ b.name }}</td>
          <td>{{ b.author || '—' }}</td>
          <td>{{ b.categoryName || '—' }}</td>
          <td>¥{{ Number(b.price || 0).toFixed(2) }}</td>
          <td>{{ b.stock }} / {{ b.totalStock }}</td>
          <td>
            <button class="mini-btn edit" @click="openEdit(b)">编辑</button>
            <button class="mini-btn delete" @click="handleDelete(b)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 分页 -->
  <div v-if="!loading && books.length > 0" class="pagination">
    <button class="page-btn" :disabled="query.page <= 1" @click="goPage(query.page - 1)">PREV</button>
    <button v-for="p in totalPages" v-show="Math.abs(p - query.page) < 5 || p === 1 || p === totalPages"
            :key="p" :class="['page-btn', { active: p === query.page }]" @click="goPage(p)">
      {{ p }}
    </button>
    <button class="page-btn" :disabled="query.page >= totalPages" @click="goPage(query.page + 1)">NEXT</button>
    <span class="page-info">{{ query.page }} / {{ totalPages }} · 共 {{ total }} 条</span>
  </div>

  <BookFormDialog ref="dialogRef" :visible="dialogVisible" :is-edit="isEditMode"
                  :categories="categories" @close="dialogVisible = false" @submit="handleSubmit" />
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
</style>
