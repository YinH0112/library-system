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

// 暴露给父组件填充数据
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
        <!-- 装饰角标 -->
        <div class="corner-deco top-left"></div>
        <div class="corner-deco top-right"></div>

        <!-- 头部 -->
        <header class="dialog-header">
          <div class="header-bar">
            <span class="dot pink"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
            <span class="header-label">{{ isEdit ? 'EDIT_MODE' : 'NEW_ENTRY' }}</span>
          </div>
          <h2 class="dialog-title">
            {{ isEdit ? '编辑图书' : '新增图书' }}
          </h2>
          <p class="dialog-subtitle">
            // {{ isEdit ? 'MODIFY EXISTING RECORD' : 'CREATE NEW RECORD' }}
          </p>
        </header>

        <!-- 表单 -->
        <form class="dialog-form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label">
              <span class="label-num">01</span>
              <span class="label-text">书名 / TITLE</span>
            </label>
            <input
              ref="nameInput"
              v-model="form.name"
              class="brutalist-input"
              placeholder="必填"
              maxlength="100" />
          </div>

          <div class="form-group">
            <label class="form-label">
              <span class="label-num">02</span>
              <span class="label-text">作者 / AUTHOR</span>
            </label>
            <input v-model="form.author" class="brutalist-input" placeholder="选填" maxlength="50" />
          </div>

          <div class="form-row two-col">
            <div class="form-group">
              <label class="form-label">
                <span class="label-num">03</span>
                <span class="label-text">定价 / PRICE</span>
              </label>
              <input v-model.number="form.price" type="number" step="0.01" min="0" class="brutalist-input" placeholder="0.00" />
            </div>

            <div class="form-group">
              <label class="form-label">
                <span class="label-num">04</span>
                <span class="label-text">出版社 / PUBLISHER</span>
              </label>
              <input v-model="form.publisher" class="brutalist-input" placeholder="选填" maxlength="100" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              <span class="label-num">05</span>
              <span class="label-text">ISBN</span>
            </label>
            <input v-model="form.isbn" class="brutalist-input" placeholder="选填" maxlength="20" />
          </div>

          <div class="form-row two-col">
            <div class="form-group">
              <label class="form-label">
                <span class="label-num">06</span>
                <span class="label-text">分类</span>
              </label>
              <select v-model="form.categoryId" class="brutalist-input">
                <option :value="null">— 无分类 —</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">
                <span class="label-num">07</span>
                <span class="label-text">出版日期</span>
              </label>
              <input v-model="form.publishDate" type="date" class="brutalist-input" />
            </div>
          </div>

          <div class="form-row two-col">
            <div class="form-group">
              <label class="form-label">
                <span class="label-num">08</span>
                <span class="label-text">总馆藏</span>
              </label>
              <input v-model.number="form.totalStock" type="number" min="1" class="brutalist-input" />
            </div>
            <div class="form-group">
              <label class="form-label">
                <span class="label-num">09</span>
                <span class="label-text">可借库存</span>
              </label>
              <input v-model.number="form.stock" type="number" min="0" :max="form.totalStock" class="brutalist-input" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              <span class="label-num">10</span>
              <span class="label-text">简介</span>
            </label>
            <textarea v-model="form.description" class="brutalist-input" rows="2" maxlength="500"></textarea>
          </div>

          <footer class="dialog-footer">
            <button type="button" class="brutalist-btn" @click="emit('close')">
              取消
            </button>
            <button type="submit" class="brutalist-btn primary" :disabled="submitting">
              {{ submitting ? '处理中...' : '确认' }}
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
  background: rgba(10, 10, 10, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.dialog-box {
  background: var(--bg);
  border: var(--border-thick);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 560px;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}

/* 装饰角 */
.corner-deco {
  position: absolute;
  width: 24px;
  height: 24px;
  border: 4px solid var(--ink);
  z-index: 2;
}
.corner-deco.top-left {
  top: -8px;
  left: -8px;
  background: var(--pink);
}
.corner-deco.top-right {
  top: -8px;
  right: -8px;
  background: var(--yellow);
}

/* 头部 */
.dialog-header {
  background: var(--ink);
  color: var(--bg);
  padding: 16px 20px 20px;
  border-bottom: var(--border-thick);
}

.header-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.dot {
  width: 10px;
  height: 10px;
  border: 2px solid var(--bg);
  display: inline-block;
}
.dot.pink { background: var(--pink); }
.dot.yellow { background: var(--yellow); }
.dot.green { background: var(--green); }

.header-label {
  margin-left: 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  opacity: 0.7;
}

.dialog-title {
  font-family: var(--font-cn);
  font-size: 32px;
  font-weight: 900;
  line-height: 1.1;
  margin-bottom: 4px;
}

.dialog-subtitle {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.1em;
  opacity: 0.6;
}

/* 表单 */
.dialog-form {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.label-num {
  font-family: var(--font-display);
  font-size: 16px;
  background: var(--ink);
  color: var(--bg);
  padding: 2px 8px;
  letter-spacing: 0.05em;
}

.label-text {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.15em;
  font-weight: 700;
  text-transform: uppercase;
}

/* 底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
  padding-top: 20px;
  border-top: 2px dashed var(--ink);
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
  transform: scale(0.85) rotate(-2deg);
}

@media (max-width: 600px) {
  .form-row.two-col { grid-template-columns: 1fr; }
  .dialog-title { font-size: 26px; }
}
</style>
