<script setup>
import { computed } from 'vue'

const props = defineProps({
  book: { type: Object, required: true },
  index: { type: Number, default: 0 }
})

const emit = defineEmits(['edit', 'delete'])

// 循环色板：根据 index 给卡片不同的色块
const palette = ['pink', 'yellow', 'blue', 'green', 'purple', 'orange']
const colorClass = computed(() => `card-${palette[props.index % palette.length]}`)

const formattedPrice = computed(() => {
  if (props.book.price == null) return '—'
  return '¥' + Number(props.book.price).toFixed(2)
})

const paddedId = computed(() => String(props.book.id).padStart(3, '0'))

const stockClass = computed(() => {
  if (!props.book.stock || props.book.stock <= 0) return 'stock-out'
  if (props.book.stock <= 1) return 'stock-low'
  return 'stock-ok'
})
</script>

<template>
  <article
    class="book-card"
    :class="colorClass"
    :style="{ animationDelay: (index * 0.08) + 's' }">

    <!-- 顶部色块标签 -->
    <div class="card-tag">
      <span class="tag-id">#{{ paddedId }}</span>
      <span class="tag-label">VOL</span>
    </div>

    <!-- 书名（超大） -->
    <h3 class="card-title" :title="book.name">{{ book.name }}</h3>

    <!-- 作者 -->
    <p class="card-author">
      <span class="author-label">BY</span>
      <span class="author-name">{{ book.author || '佚名' }}</span>
    </p>

    <!-- 信息块 -->
    <div class="card-info">
      <div v-if="book.categoryName" class="info-row">
        <span class="info-key">分类</span>
        <span class="info-val">{{ book.categoryName }}</span>
      </div>
      <div class="info-row">
        <span class="info-key">出版社</span>
        <span class="info-val">{{ book.publisher || '—' }}</span>
      </div>
      <div class="info-row">
        <span class="info-key">定价</span>
        <span class="info-val price">{{ formattedPrice }}</span>
      </div>
      <div class="info-row">
        <span class="info-key">库存</span>
        <span :class="['info-val', 'stock-badge', stockClass]">{{ book.stock }} / {{ book.totalStock }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="card-actions">
      <button class="action-btn edit" @click="emit('edit', book)">
        <span>编辑</span>
      </button>
      <button class="action-btn delete" @click="emit('delete', book)">
        <span>删除</span>
      </button>
    </div>
  </article>
</template>

<style scoped>
.book-card {
  background: var(--white);
  border: var(--border-thick);
  box-shadow: var(--shadow);
  padding: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  opacity: 0;
  animation: bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  transition: transform 0.15s, box-shadow 0.15s;
}

.book-card:hover {
  transform: translate(-4px, -4px);
  box-shadow: var(--shadow-lg);
}

/* 顶部色块 */
.card-tag {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  border-bottom: var(--border);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.tag-id {
  font-family: var(--font-display);
  font-size: 18px;
}

.tag-label {
  opacity: 0.6;
}

/* 各色系 */
.card-pink .card-tag { background: var(--pink); color: var(--white); }
.card-yellow .card-tag { background: var(--yellow); }
.card-blue .card-tag { background: var(--blue); }
.card-green .card-tag { background: var(--green); }
.card-purple .card-tag { background: var(--purple); }
.card-orange .card-tag { background: var(--orange); color: var(--white); }

/* 标题 */
.card-title {
  font-family: var(--font-cn);
  font-size: 26px;
  font-weight: 900;
  line-height: 1.15;
  padding: 18px 16px 8px;
  color: var(--ink);
  word-break: break-word;
  min-height: 60px;
}

/* 作者 */
.card-author {
  padding: 0 16px 14px;
  font-family: var(--font-mono);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 2px dashed var(--ink);
}

.author-label {
  background: var(--ink);
  color: var(--bg);
  padding: 2px 6px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.author-name {
  font-weight: 700;
}

/* 信息块 */
.card-info {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.info-key {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.7;
}

.info-val {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 700;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-val.price {
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--ink);
  background: var(--yellow);
  padding: 2px 8px;
  border: 2px solid var(--ink);
}

/* 操作 */
.card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: var(--border);
}

.action-btn {
  font-family: var(--font-display);
  font-size: 14px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 12px;
  cursor: pointer;
  border: none;
  transition: all 0.1s;
}

.action-btn.edit {
  background: var(--white);
  color: var(--ink);
  border-right: 2px solid var(--ink);
}

.action-btn.edit:hover {
  background: var(--yellow);
}

.action-btn.delete {
  background: var(--white);
  color: var(--ink);
}

.action-btn.delete:hover {
  background: var(--pink);
  color: var(--white);
}

.action-btn:active {
  transform: scale(0.96);
}

.stock-badge {
  font-family: var(--font-display);
  font-size: 14px;
  padding: 2px 8px;
  border: 2px solid var(--ink);
}
.stock-ok { background: var(--green); }
.stock-low { background: var(--yellow); }
.stock-out { background: var(--pink); color: var(--white); }
</style>
