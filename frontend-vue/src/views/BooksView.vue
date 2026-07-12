<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { BookAPI, CategoryAPI } from '../api.js'
import BookCard from '../components/BookCard.vue'
import BookFormDialog from '../components/BookFormDialog.vue'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import EmptyState from '../components/EmptyState.vue'
import { showToast } from '../composables/useToast.js'
const confirmFn = inject('confirmFn')

const books = ref([])
const categories = ref([])
const loading = ref(false)
const viewMode = ref('grid')
const total = ref(0)
const showFilters = ref(false)

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
    } else showToast('error', res.data.message)
  } catch (e) { showToast('error', '网络错误') }
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
      showToast('success', payload.id != null ? '修订完成' : '入藏完成')
      dialogVisible.value = false
      await load()
    } else showToast('error', res.data.message)
  } catch (e) { showToast('error', '网络错误') }
  finally { done && done() }
}

async function handleDelete(book) {
  const ok = await confirmFn('移出馆藏', `确定将《${book.name}》移出馆藏?`)
  if (!ok) return
  const res = await BookAPI.remove(book.id)
  if (res.data.code === 200) { showToast('warning', '已移出'); await load() }
  else showToast('error', res.data.message)
}

function toggleFilters() { showFilters.value = !showFilters.value }

const hasActiveFilters = computed(() =>
  query.author || query.publisher || query.categoryId
)

onMounted(async () => { await loadCategories(); await load() })
defineExpose({ reload: load })
</script>

<template>
  <!-- 页头 -->
  <div class="books-header">
    <div class="header-left">
      <h1 class="view-title">BOOKS<span style="color: var(--primary)">.</span></h1>
      <p class="view-subtitle">// 馆藏图书 · 共 {{ total }} 条记录</p>
    </div>
    <div class="header-right">
      <div class="view-toggle">
        <button :class="['toggle-btn', { active: viewMode === 'grid' }]" @click="viewMode = 'grid'">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="5.5" height="5.5" rx="1"/><rect x="9.5" y="1" width="5.5" height="5.5" rx="1"/><rect x="1" y="9.5" width="5.5" height="5.5" rx="1"/><rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1"/></svg>
        </button>
        <button :class="['toggle-btn', { active: viewMode === 'table' }]" @click="viewMode = 'table'">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="1" y1="3.5" x2="15" y2="3.5"/><line x1="1" y1="8" x2="15" y2="8"/><line x1="1" y1="12.5" x2="15" y2="12.5"/></svg>
        </button>
      </div>
      <button class="brutalist-btn primary" @click="openAdd">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>
        新增
      </button>
    </div>
  </div>

  <!-- 搜索栏 -->
  <div class="search-bar">
    <div class="search-main">
      <svg class="search-icon" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="8.5" cy="8.5" r="5.5"/><line x1="13" y1="13" x2="18" y2="18"/>
      </svg>
      <input v-model="query.name" class="search-input" placeholder="搜索书名..." @keyup.enter="search" />
      <button v-if="query.name" class="search-clear" @click="query.name = ''; search()">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
      </button>
    </div>
    <div class="search-actions">
      <button :class="['filter-toggle', { active: showFilters || hasActiveFilters }]" @click="toggleFilters">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <line x1="1" y1="3" x2="15" y2="3"/><line x1="3" y1="8" x2="13" y2="8"/><line x1="5" y1="13" x2="11" y2="13"/>
        </svg>
        筛选
      </button>
      <button class="brutalist-btn primary search-go" @click="search">搜索</button>
    </div>
  </div>

  <!-- 展开的筛选项 -->
  <transition name="filter-expand">
    <div v-if="showFilters || hasActiveFilters" class="filter-row">
      <div class="filter-chip">
        <span class="chip-label">作者</span>
        <input v-model="query.author" class="chip-input" placeholder="作者名" @keyup.enter="search" />
      </div>
      <div class="filter-chip">
        <span class="chip-label">出版社</span>
        <input v-model="query.publisher" class="chip-input" placeholder="出版社" @keyup.enter="search" />
      </div>
      <div class="filter-chip">
        <span class="chip-label">分类</span>
        <select v-model="query.categoryId" class="chip-input">
          <option :value="null">全部</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <button v-if="hasActiveFilters" class="filter-reset" @click="resetFilters">
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
        清除筛选
      </button>
    </div>
  </transition>

  <!-- 内容 -->
  <SkeletonLoader v-if="loading" type="card" :count="6" />
  <EmptyState v-else-if="books.length === 0" icon="search" title="未找到图书" description="请尝试调整筛选条件或搜索关键词">
    <template #action>
      <button class="brutalist-btn" @click="resetFilters">重置筛选</button>
    </template>
  </EmptyState>

  <transition-group v-else-if="viewMode === 'grid'" name="grid" tag="div" class="book-grid">
    <BookCard v-for="(b, i) in books" :key="b.id" :book="b" :index="i"
              @edit="openEdit" @delete="handleDelete" />
  </transition-group>

  <div v-else class="table-wrapper">
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 60px;">ID</th>
          <th>书名</th>
          <th>作者</th>
          <th>分类</th>
          <th style="width: 90px;">定价</th>
          <th style="width: 90px;">库存</th>
          <th style="width: 120px;">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="b in books" :key="b.id">
          <td style="font-family: var(--font-mono); font-size: 12px; color: var(--muted);">#{{ String(b.id).padStart(3, '0') }}</td>
          <td style="font-weight: 700; color: var(--foreground);">{{ b.name }}</td>
          <td style="color: var(--foreground-secondary);">{{ b.author || '—' }}</td>
          <td><span :class="['badge', 'badge-available']" style="font-size: 10px;">{{ b.categoryName || '—' }}</span></td>
          <td style="font-family: var(--font-editorial); font-weight: 700;">¥{{ Number(b.price || 0).toFixed(2) }}</td>
          <td style="font-family: var(--font-mono); font-feature-settings: 'tnum';">
            <span :style="{ color: b.stock <= 0 ? 'var(--destructive)' : b.stock <= 1 ? 'var(--warning)' : 'var(--success)' }">{{ b.stock }}</span>
            <span style="color: var(--muted);"> / {{ b.totalStock }}</span>
          </td>
          <td>
            <div class="table-actions">
              <button class="mini-btn edit" @click="openEdit(b)">编辑</button>
              <button class="mini-btn delete" @click="handleDelete(b)">删除</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 分页 -->
  <div v-if="!loading && books.length > 0" class="pagination-bar">
    <span class="page-info">{{ query.page }} / {{ totalPages }} · {{ total }} 条</span>
    <div class="pagination">
      <button class="page-btn" :disabled="query.page <= 1" @click="goPage(query.page - 1)">
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="10,3 5,8 10,13"/></svg>
      </button>
      <button v-for="p in totalPages" v-show="Math.abs(p - query.page) < 3 || p === 1 || p === totalPages"
              :key="p" :class="['page-btn', { active: p === query.page }]" @click="goPage(p)">
        {{ p }}
      </button>
      <button class="page-btn" :disabled="query.page >= totalPages" @click="goPage(query.page + 1)">
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6,3 11,8 6,13"/></svg>
      </button>
    </div>
  </div>

  <BookFormDialog ref="dialogRef" :visible="dialogVisible" :is-edit="isEditMode"
                  :categories="categories" @close="dialogVisible = false" @submit="handleSubmit" />
</template>

<style scoped>
/* 页头 */
.books-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.header-left { flex: 1; min-width: 200px; }
.header-right { display: flex; align-items: center; gap: 10px; }

/* 搜索栏 — 紧凑工具条 */
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 0;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 6px 6px 6px 16px;
  transition: box-shadow 0.2s;
}
.search-bar:focus-within {
  box-shadow: var(--shadow-sm), 0 0 0 3px var(--primary-glow);
  border-color: var(--ring);
}
.search-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}
.search-icon {
  color: var(--muted);
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  height: 36px;
  padding: 0;
  border: none;
  background: transparent;
  font: 500 15px/1 var(--font-sans);
  color: var(--foreground);
  outline: none;
  letter-spacing: 0.01em;
}
.search-input::placeholder { color: var(--muted-foreground); }
.search-clear {
  background: var(--bg-muted);
  border: none;
  color: var(--muted);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.16s;
  flex-shrink: 0;
}
.search-clear:hover { background: var(--destructive); color: white; }
.search-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.search-go {
  min-height: 36px;
  padding: 0 18px;
  border-radius: var(--radius);
  font-size: 12px;
}
.filter-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: var(--bg-subtle);
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  font: 500 12px/1 var(--font-sans);
  transition: all 0.2s;
}
.filter-toggle:hover { background: var(--bg-muted); color: var(--foreground); }
.filter-toggle.active {
  background: var(--warning-bg);
  color: var(--warning);
  border-color: rgba(217,119,87,0.3);
}

/* 展开的筛选行 */
.filter-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  padding: 14px 16px;
  margin-top: 10px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-2xs);
  animation: slideIn 0.2s ease;
}
.filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  padding: 4px 4px 4px 12px;
  transition: all 0.2s;
}
.filter-chip:focus-within {
  border-color: var(--ring);
  box-shadow: 0 0 0 2px var(--primary-glow);
}
.chip-label {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  white-space: nowrap;
}
.chip-input {
  border: none;
  background: transparent;
  font: 400 13px/1 var(--font-sans);
  color: var(--foreground);
  outline: none;
  width: 120px;
  padding: 4px 0;
}
.chip-input::placeholder { color: var(--muted-foreground); }
select.chip-input { cursor: pointer; appearance: auto; width: 100px; }
.filter-reset {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font: 500 12px/1 var(--font-sans);
  transition: color 0.16s;
}
.filter-reset:hover { color: var(--destructive); }

/* 网格视图 */
.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 20px;
}
.grid-enter-active { transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
.grid-leave-active { transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1); position: absolute; }
.grid-enter-from { opacity: 0; transform: translateY(12px) scale(0.95); }
.grid-leave-to { opacity: 0; transform: scale(0.95); }
.grid-move { transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1); }

/* 表格视图 */
.table-wrapper {
  margin-top: 20px;
  border-radius: var(--radius);
  overflow: hidden;
}
.table-actions {
  display: flex;
  gap: 6px;
}
.mini-btn {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  padding: 5px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card);
  cursor: pointer;
  transition: all 0.16s ease;
  letter-spacing: 0.02em;
}
.mini-btn.edit:hover { background: var(--warning-bg); color: var(--warning); border-color: rgba(217,119,87,0.4); }
.mini-btn.delete:hover { background: #fde8e8; color: var(--destructive); border-color: rgba(239,68,68,0.4); }

/* 分页栏 */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--border-faint);
}
.pagination-bar .page-info {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 0.06em;
}
.pagination-bar .pagination {
  margin-top: 0;
}

/* 过渡 */
.filter-expand-enter-active { transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
.filter-expand-leave-active { transition: all 0.2s ease; }
.filter-expand-enter-from, .filter-expand-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
