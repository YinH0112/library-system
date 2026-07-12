<script setup>
import { ref, onMounted, inject } from 'vue'
import { ReviewAPI } from '../api.js'
import { showToast } from '../composables/useToast.js'
const confirmFn = inject('confirmFn')

const list = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await ReviewAPI.my()
    if (res.data.code === 200) list.value = res.data.data || []
    else showToast('error', '加载失败')
  } catch (e) { showToast('error', '加载失败') }
  finally { loading.value = false }
}

async function remove(rv) {
  const ok = await confirmFn('删除评价', `确定删除对《${rv.bookName}》的评价?`)
  if (!ok) return
  const res = await ReviewAPI.remove(rv.id)
  if (res.data.code === 200) {
    showToast('success', '已删除')
    await load()
  } else showToast('error', res.data.message)
}

function stars(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

onMounted(load)
defineExpose({ reload: load })
</script>

<template>
  <div class="view-header">
    <div>
      <h1 class="view-title">MY REVIEWS<span style="color: var(--yellow)">.</span></h1>
      <p class="view-subtitle">// 我的图书评价 · 共 {{ list.length }} 条</p>
    </div>
    <button class="brutalist-btn" @click="load">刷新</button>
  </div>

  <div v-if="loading" class="loading-block"><span>LOADING...</span></div>

  <div v-else-if="list.length === 0" class="empty-block">
    <span>// 暂无评价</span>
    <p style="margin-top: 12px; opacity: 0.6;">前往「Browse」浏览图书并对已借阅的书发表评价</p>
  </div>

  <div v-else class="review-list">
    <article v-for="rv in list" :key="rv.id" class="review-card">
      <div class="review-head">
        <div class="head-left">
          <h3 class="review-book">{{ rv.bookName }}</h3>
          <span class="review-stars">{{ stars(rv.rating) }}</span>
        </div>
        <span class="review-date mono">{{ (rv.createTime || '').replace('T', ' ').slice(0, 16) }}</span>
      </div>
      <p v-if="rv.content" class="review-content">{{ rv.content }}</p>
      <p v-else class="review-content" style="opacity:0.4;">// 未填写评价内容</p>
      <div class="review-foot">
        <span class="rating-num">{{ rv.rating }} / 5</span>
        <button class="mini-btn danger" @click="remove(rv)">删除</button>
      </div>
    </article>
  </div>
</template>

<style scoped>
.loading-block, .empty-block {
  padding: 60px; text-align: center;
  background: var(--card); border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  font-family: var(--font-sans); font-size: 13px;
  color: var(--muted);
  border-radius: var(--radius);
}
.review-list { display: flex; flex-direction: column; gap: 12px; }
.review-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 16px 20px;
  border-left: 3px solid var(--primary);
  transition: box-shadow 0.16s ease;
}
.review-card:hover { box-shadow: var(--shadow-md); }
.review-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 8px; gap: 12px;
}
.head-left { display: flex; gap: 12px; align-items: baseline; flex-wrap: wrap; }
.review-book {
  font-family: var(--font-sans); font-size: 18px; font-weight: 700;
  color: var(--foreground);
}
.review-stars { color: var(--primary); font-size: 16px; letter-spacing: 2px; }
.review-date { font-size: 11px; color: var(--muted); }
.review-content {
  font-family: var(--font-sans); font-size: 14px;
  line-height: 1.7; color: var(--foreground-secondary);
  padding: 8px 0;
}
.review-foot {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 8px; border-top: 1px solid var(--border-faint);
}
.rating-num {
  font-family: var(--font-display); font-size: 16px;
  color: var(--foreground);
}
.mini-btn {
  font-family: var(--font-sans); font-size: 12px; font-weight: 500;
  padding: 6px 14px; background: var(--card);
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.16s ease;
}
.mini-btn.danger { background: #fcdede; color: var(--destructive); border-color: rgba(239,68,68,0.4); }
.mini-btn.danger:hover { background: var(--destructive); color: white; border-color: var(--destructive); }
</style>
