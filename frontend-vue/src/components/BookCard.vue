<script setup>
import { computed } from 'vue'

const props = defineProps({
  book: { type: Object, required: true },
  index: { type: Number, default: 0 }
})

const emit = defineEmits(['edit', 'delete'])

const formattedPrice = computed(() => {
  if (props.book.price == null) return '—'
  return '¥' + Number(props.book.price).toFixed(2)
})

const paddedId = computed(() => String(props.book.id).padStart(3, '0'))

const stockInfo = computed(() => {
  const s = props.book.stock || 0
  if (s <= 0) return { label: '缺货', cls: 'badge-out' }
  if (s <= 2) return { label: '库存紧张', cls: 'badge-low' }
  return { label: '可借', cls: 'badge-available' }
})
</script>

<template>
  <article class="book-card" :style="{ animationDelay: (index * 0.04) + 's' }">
    <!-- 书脊色条 -->
    <div class="spine"></div>

    <div class="card-body">
      <!-- 顶部：分类 + ID -->
      <div class="card-top">
        <span class="card-tag" v-if="book.categoryName">{{ book.categoryName }}</span>
        <span class="card-id">#{{ paddedId }}</span>
      </div>

      <!-- 书名 -->
      <h3 class="card-title" :title="book.name">{{ book.name }}</h3>

      <!-- 作者 -->
      <p class="card-author">{{ book.author || '佚名' }}</p>

      <!-- 元数据 -->
      <div class="card-meta">
        <span class="meta-label">出版社</span>
        <span class="meta-val">{{ book.publisher || '—' }}</span>
      </div>
      <div class="card-meta" v-if="book.isbn">
        <span class="meta-label">ISBN</span>
        <span class="meta-val">{{ book.isbn }}</span>
      </div>

      <!-- 分割线 -->
      <div class="card-divider"></div>

      <!-- 底部 -->
      <div class="card-foot">
        <div class="foot-left">
          <span class="card-price">{{ formattedPrice }}</span>
          <span :class="['badge', stockInfo.cls]">{{ stockInfo.label }}</span>
        </div>
        <div class="foot-right">
          <button class="action edit" title="编辑" @click="emit('edit', book)">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 1.5l3 3L5 14H2v-3z"/><path d="M9.5 3.5l3 3"/></svg>
          </button>
          <button class="action delete" title="删除" @click="emit('delete', book)">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 4h12M5.3 4V2.7a.7.7 0 01.7-.7h4a.7.7 0 01.7.7V4m1.3 0v9.3a.7.7 0 01-.7.7H5.7a.7.7 0 01-.7-.7V4h6.6"/></svg>
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.book-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
  display: flex;
  opacity: 0;
  animation: cardReveal 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.25s cubic-bezier(0.22, 1, 0.36, 1),
              border-color 0.25s;
}

.book-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
  border-color: var(--border-subtle);
}

/* 书脊色条 — 暖色渐变 */
.spine {
  width: 4px;
  flex-shrink: 0;
  background: linear-gradient(180deg, var(--primary) 0%, #e8946a 50%, var(--primary-hover) 100%);
}

.card-body {
  flex: 1;
  padding: 18px 20px 16px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* 顶部行 */
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-tag {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--primary);
  background: var(--warning-bg);
  padding: 3px 9px;
  border-radius: var(--radius-xs);
}

.card-id {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted-foreground);
  letter-spacing: 0.04em;
  opacity: 0.5;
}

/* 书名 — 衬线字体，书卷气 */
.card-title {
  font-family: var(--font-editorial);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--foreground);
  letter-spacing: -0.01em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 4px;
}

/* 作者 */
.card-author {
  font-family: var(--font-sans);
  font-size: 13px;
  font-style: italic;
  color: var(--muted);
  margin-bottom: 14px;
  line-height: 1.4;
}

/* 元数据 — label + value 行 */
.card-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}
.meta-label {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted-foreground);
  min-width: 42px;
  flex-shrink: 0;
}
.meta-val {
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--foreground-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 分割线 */
.card-divider {
  flex: 1;
  border-top: 1px solid var(--border-faint);
  margin: 10px 0 0;
  min-height: 10px;
}

/* 底部 */
.card-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  gap: 8px;
}
.foot-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

/* 价格 — 衬线字体 */
.card-price {
  font-family: var(--font-editorial);
  font-size: 18px;
  font-weight: 800;
  color: var(--foreground);
  letter-spacing: -0.01em;
  font-feature-settings: 'tnum';
  line-height: 1;
}

/* 操作 */
.foot-right {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}
.action {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted-foreground);
  cursor: pointer;
  transition: all 0.15s;
}
.action.edit:hover {
  background: var(--warning-bg);
  color: var(--primary);
}
.action.delete:hover {
  background: #fde8e8;
  color: var(--destructive);
}
.action:active {
  transform: scale(0.88);
}

@keyframes cardReveal {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
