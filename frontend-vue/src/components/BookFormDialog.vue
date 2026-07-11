<script setup>
import { ref, reactive, watch, nextTick } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  isEdit: { type: Boolean, default: false },
  categories: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'submit'])

const nameInput = ref(null)
const submitting = ref(false)

const form = reactive({
  id: null, name: '', author: '', price: 0, publisher: '',
  isbn: '', categoryId: null, totalStock: 1, stock: 1, publishDate: '', description: ''
})

function fill(book) {
  form.id = book.id
  form.name = book.name
  form.author = book.author || ''
  form.price = book.price != null ? Number(book.price) : 0
  form.publisher = book.publisher || ''
  form.isbn = book.isbn || ''
  form.categoryId = book.categoryId || null
  form.totalStock = book.totalStock != null ? book.totalStock : 1
  form.stock = book.stock != null ? book.stock : 1
  form.publishDate = book.publishDate || ''
  form.description = book.description || ''
  nextTick(() => { if (nameInput.value) nameInput.value.focus() })
}

function reset() {
  form.id = null; form.name = ''; form.author = ''; form.price = 0; form.publisher = ''
  form.isbn = ''; form.categoryId = null; form.totalStock = 1; form.stock = 1
  form.publishDate = ''; form.description = ''
}

defineExpose({ fill, reset })

async function handleSubmit() {
  if (!form.name || !form.name.trim()) {
    return
  }
  submitting.value = true
  const payload = {
    id: form.id,
    name: form.name.trim(),
    author: form.author ? form.author.trim() : null,
    price: form.price,
    publisher: form.publisher ? form.publisher.trim() : null,
    isbn: form.isbn ? form.isbn.trim() : null,
    categoryId: form.categoryId,
    totalStock: form.totalStock,
    stock: form.stock,
    publishDate: form.publishDate || null,
    description: form.description ? form.description.trim() : null
  }
  emit('submit', payload, () => {
    submitting.value = false
  })
}
</script>

<template>
  <transition name="dialog">
    <div v-if="visible" class="dialog-overlay" @click.self="emit('close')">
      <div class="dialog-box">
        <!-- 头部 -->
        <header class="dialog-header">
          <div class="header-stripe"></div>
          <div class="header-content">
            <div class="header-top">
              <span class="header-tag">{{ isEdit ? '编辑' : '新增' }}</span>
              <button class="header-close" @click="emit('close')">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
              </button>
            </div>
            <h2 class="dialog-title">{{ isEdit ? '修订馆藏' : '入藏新书' }}</h2>
            <p class="dialog-subtitle">{{ isEdit ? '修改现有图书信息' : '录入新的馆藏图书' }}</p>
          </div>
        </header>

        <!-- 表单 -->
        <form class="dialog-form" @submit.prevent="handleSubmit">
          <!-- 基本信息 -->
          <div class="form-section">
            <div class="section-label">基本信息</div>
            <div class="form-group">
              <label class="form-label">书名 <span class="req">*</span></label>
              <input ref="nameInput" v-model="form.name" class="brutalist-input" placeholder="请输入书名" maxlength="100" />
            </div>
            <div class="form-group">
              <label class="form-label">作者</label>
              <input v-model="form.author" class="brutalist-input" placeholder="请输入作者" maxlength="50" />
            </div>
            <div class="form-group">
              <label class="form-label">分类</label>
              <select v-model="form.categoryId" class="brutalist-input">
                <option :value="null">— 无分类 —</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">简介</label>
              <textarea v-model="form.description" class="form-textarea" rows="2" placeholder="选填" maxlength="500"></textarea>
            </div>
          </div>

          <!-- 出版信息 -->
          <div class="form-section">
            <div class="section-label">出版信息</div>
            <div class="form-row two-col">
              <div class="form-group">
                <label class="form-label">出版社</label>
                <input v-model="form.publisher" class="brutalist-input" placeholder="选填" maxlength="100" />
              </div>
              <div class="form-group">
                <label class="form-label">出版日期</label>
                <input v-model="form.publishDate" type="date" class="brutalist-input" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">ISBN</label>
              <input v-model="form.isbn" class="brutalist-input" placeholder="选填" maxlength="20" />
            </div>
          </div>

          <!-- 库存信息 -->
          <div class="form-section">
            <div class="section-label">库存与定价</div>
            <div class="form-row three-col">
              <div class="form-group">
                <label class="form-label">定价</label>
                <input v-model.number="form.price" type="number" step="0.01" min="0" class="brutalist-input" placeholder="0.00" />
              </div>
              <div class="form-group">
                <label class="form-label">总馆藏</label>
                <input v-model.number="form.totalStock" type="number" min="1" class="brutalist-input" />
              </div>
              <div class="form-group">
                <label class="form-label">可借库存</label>
                <input v-model.number="form.stock" type="number" min="0" :max="form.totalStock" class="brutalist-input" />
              </div>
            </div>
          </div>

          <footer class="dialog-footer">
            <button type="button" class="brutalist-btn" @click="emit('close')">取消</button>
            <button type="submit" class="brutalist-btn primary" :disabled="submitting">
              {{ submitting ? '处理中...' : (isEdit ? '保存修改' : '确认入藏') }}
            </button>
          </footer>
        </form>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 19, 0.4);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.dialog-box {
  background: var(--card);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 580px;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: var(--radius-lg);
}

/* 头部 — 暖色渐变，和 BookCard 书脊呼应 */
.dialog-header {
  position: relative;
  background: linear-gradient(135deg, #1a1917 0%, #2c2a27 50%, #1f1e1b 100%);
  color: var(--bg);
  padding: 24px 24px 20px;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  overflow: hidden;
}

.dialog-header::before {
  content: '';
  position: absolute;
  top: -30%;
  right: -10%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(217,119,87,0.15) 0%, transparent 65%);
  pointer-events: none;
}

.header-stripe {
  height: 3px;
  background: linear-gradient(90deg, var(--primary) 0%, #e8946a 50%, var(--primary-hover) 100%);
  margin: -24px -24px 16px;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.header-content { position: relative; }

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.header-tag {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--primary);
  background: rgba(217,119,87,0.15);
  padding: 3px 10px;
  border-radius: var(--radius-xs);
}

.header-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  background: rgba(255,255,255,0.08);
  color: var(--bg);
  cursor: pointer;
  transition: all 0.15s;
  opacity: 0.5;
}
.header-close:hover {
  opacity: 1;
  background: rgba(255,255,255,0.15);
}

.dialog-title {
  font-family: var(--font-editorial);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 4px;
  letter-spacing: -0.01em;
}

.dialog-subtitle {
  font-family: var(--font-sans);
  font-size: 13px;
  opacity: 0.45;
  font-weight: 400;
}

/* 表单 */
.dialog-form {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 分区 */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-label {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-faint);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-row.three-col {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14px;
}

.form-label {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  color: var(--foreground-secondary);
  letter-spacing: 0.01em;
}

.req {
  color: var(--destructive);
  font-weight: 700;
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg);
  color: var(--foreground);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font: 400 13px/1.5 var(--font-sans);
  outline: none;
  resize: vertical;
  min-height: 60px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-textarea:focus {
  border-color: var(--ring);
  box-shadow: 0 0 0 3px var(--primary-glow);
}
.form-textarea::placeholder { color: var(--muted-foreground); }

/* 底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

/* 过渡 */
.dialog-enter-active, .dialog-leave-active {
  transition: opacity 0.2s;
}
.dialog-enter-active .dialog-box,
.dialog-leave-active .dialog-box {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-from .dialog-box,
.dialog-leave-to .dialog-box {
  transform: scale(0.95) translateY(10px);
}

@media (max-width: 600px) {
  .form-row.two-col, .form-row.three-col { grid-template-columns: 1fr; }
  .dialog-title { font-size: 20px; }
  .dialog-form { padding: 20px 16px; }
  .dialog-header { padding: 20px 16px 16px; }
  .header-stripe { margin: -20px -16px 14px; }
}
</style>
