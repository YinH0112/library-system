<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { BookAPI, CategoryAPI, BorrowRequestAPI, ReviewAPI } from '../api.js'
import { authStore } from '../store/auth.js'

const emit = defineEmits(['toast'])

const books = ref([])
const categories = ref([])
const loading = ref(false)
const total = ref(0)
const query = reactive({ name: '', author: '', publisher: '', categoryId: null, page: 1, size: 12 })
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / query.size)))

// 申请借阅对话框
const applyDialog = ref(false)
const applyTarget = ref(null)
const applyForm = reactive({ dueDays: 30, readerRemark: '' })

// 评价对话框
const reviewDialog = ref(false)
const reviewTarget = ref(null)
const reviewForm = reactive({ rating: 5, content: '' })
const myExistingReview = ref(null)

// 评价列表抽屉
const reviewsDrawer = ref(false)
const reviewsTarget = ref(null)
const reviewsList = ref([])
const reviewsSummary = ref(null)

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
    }
  } catch (e) { emit('toast', 'error', '加载失败') }
  finally { loading.value = false }
}

function search() { query.page = 1; load() }
function resetFilters() {
  query.name = ''; query.author = ''; query.publisher = ''; query.categoryId = null
  query.page = 1; load()
}
function goPage(p) {
  if (p < 1 || p > totalPages.value) return
  query.page = p; load()
}

function stockBadge(b) {
  if (!b.stock || b.stock <= 0) return { cls: 'badge-out', text: '已借完' }
  if (b.stock <= 1) return { cls: 'badge-low', text: `仅剩 ${b.stock}` }
  return { cls: 'badge-available', text: `可借 ${b.stock}` }
}

// === 申请借阅 ===
function openApplyDialog(b) {
  applyTarget.value = b
  applyForm.dueDays = 30
  applyForm.readerRemark = ''
  applyDialog.value = true
}

async function submitApply() {
  if (!applyTarget.value) return
  const res = await BorrowRequestAPI.apply({
    bookId: applyTarget.value.id,
    dueDays: applyForm.dueDays,
    readerRemark: applyForm.readerRemark
  })
  if (res.data.code === 200) {
    emit('toast', 'success', '申请已提交,等待管理员审批')
    applyDialog.value = false
  } else emit('toast', 'error', res.data.message)
}

// === 评价 ===
async function openReviewDialog(b) {
  reviewTarget.value = b
  reviewForm.rating = 5
  reviewForm.content = ''
  myExistingReview.value = null
  // 查询是否已评价
  try {
    const r = await ReviewAPI.myForBook(b.id)
    if (r.data.code === 200 && r.data.data) {
      myExistingReview.value = r.data.data
      reviewForm.rating = r.data.data.rating
      reviewForm.content = r.data.data.content || ''
    }
  } catch (e) {}
  reviewDialog.value = true
}

async function submitReview() {
  if (!reviewTarget.value) return
  if (reviewForm.rating < 1 || reviewForm.rating > 5) {
    emit('toast', 'error', '评分须为 1-5')
    return
  }
  const res = await ReviewAPI.submit({
    bookId: reviewTarget.value.id,
    rating: reviewForm.rating,
    content: reviewForm.content
  })
  if (res.data.code === 200) {
    emit('toast', 'success', myExistingReview.value ? '评价已更新' : '评价已提交')
    reviewDialog.value = false
  } else emit('toast', 'error', res.data.message)
}

// === 查看评价 ===
async function openReviewsDrawer(b) {
  reviewsTarget.value = b
  reviewsList.value = []
  reviewsSummary.value = null
  reviewsDrawer.value = true
  const [listRes, sumRes] = await Promise.all([ReviewAPI.listByBook(b.id), ReviewAPI.summary(b.id)])
  if (listRes.data.code === 200) reviewsList.value = listRes.data.data || []
  if (sumRes.data.code === 200) reviewsSummary.value = sumRes.data.data
}

function stars(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

onMounted(async () => { await loadCategories(); await load() })
defineExpose({ reload: load })
</script>

<template>
  <div class="view-header">
    <div>
      <h1 class="view-title">BROWSE<span style="color: var(--yellow)">.</span></h1>
      <p class="view-subtitle">// 图书浏览 · 共 {{ total }} 条</p>
    </div>
  </div>

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
      <span class="filter-label">分类</span>
      <select v-model="query.categoryId" class="filter-input">
        <option :value="null">全部</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>
    <button class="brutalist-btn primary" @click="search">GO</button>
    <button class="brutalist-btn" @click="resetFilters">重置</button>
  </div>

  <div v-if="loading" style="padding: 60px; text-align: center;">
    <span style="font-family: var(--font-display); font-size: 24px;">LOADING...</span>
  </div>

  <div v-else class="browse-grid">
    <article v-for="b in books" :key="b.id" class="browse-card">
      <div class="card-tag">
        <span class="tag-id">#{{ String(b.id).padStart(3, '0') }}</span>
        <span v-if="b.categoryName" class="tag-cat">{{ b.categoryName }}</span>
      </div>
      <h3 class="card-title">{{ b.name }}</h3>
      <p class="card-author">BY {{ b.author || '佚名' }}</p>
      <div class="card-meta">
        <div class="meta-row">
          <span class="meta-key">出版社</span>
          <span class="meta-val">{{ b.publisher || '—' }}</span>
        </div>
        <div class="meta-row">
          <span class="meta-key">定价</span>
          <span class="meta-val price">¥{{ Number(b.price || 0).toFixed(2) }}</span>
        </div>
        <div class="meta-row">
          <span class="meta-key">库存</span>
          <span :class="['meta-val', 'badge', stockBadge(b).cls]">{{ stockBadge(b).text }}</span>
        </div>
      </div>
      <p v-if="b.description" class="card-desc">{{ b.description }}</p>
      <div class="card-actions">
        <button class="card-btn primary" @click="openApplyDialog(b)">申请借阅</button>
        <button class="card-btn" @click="openReviewDialog(b)">评价</button>
        <button class="card-btn ghost" @click="openReviewsDrawer(b)">查看评价</button>
      </div>
    </article>
  </div>

  <div v-if="!loading && books.length > 0" class="pagination">
    <button class="page-btn" :disabled="query.page <= 1" @click="goPage(query.page - 1)">PREV</button>
    <button v-for="p in totalPages" v-show="Math.abs(p - query.page) < 5 || p === 1 || p === totalPages"
            :key="p" :class="['page-btn', { active: p === query.page }]" @click="goPage(p)">{{ p }}</button>
    <button class="page-btn" :disabled="query.page >= totalPages" @click="goPage(query.page + 1)">NEXT</button>
    <span class="page-info">{{ query.page }} / {{ totalPages }}</span>
  </div>

  <!-- 申请借阅对话框 -->
  <div v-if="applyDialog" class="dialog-mask" @click.self="applyDialog = false">
    <div class="dialog-box">
      <div class="dialog-head">
        <span class="dialog-tag">// APPLY FOR BORROW</span>
        <button class="dialog-close" @click="applyDialog = false">×</button>
      </div>
      <div class="dialog-body">
        <h3 class="dialog-title" v-if="applyTarget">{{ applyTarget.name }}</h3>
        <p class="dialog-sub" v-if="applyTarget">BY {{ applyTarget.author || '佚名' }}</p>

        <div class="form-row">
          <label class="form-label">借阅天数</label>
          <select v-model.number="applyForm.dueDays" class="form-input">
            <option :value="7">7 天</option>
            <option :value="14">14 天</option>
            <option :value="30">30 天(默认)</option>
            <option :value="60">60 天</option>
            <option :value="90">90 天(最长)</option>
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">申请备注</label>
          <textarea v-model="applyForm.readerRemark" class="form-input" rows="3"
                    placeholder="可填写备注,如急需阅读理由等(选填)"></textarea>
        </div>
        <div class="dialog-tip">
          // 提交后等待管理员审批,通过后将自动生成借阅记录。可在「My Requests」查看进度。
        </div>
      </div>
      <div class="dialog-foot">
        <button class="brutalist-btn" @click="applyDialog = false">取消</button>
        <button class="brutalist-btn primary" @click="submitApply">提交申请</button>
      </div>
    </div>
  </div>

  <!-- 评价对话框 -->
  <div v-if="reviewDialog" class="dialog-mask" @click.self="reviewDialog = false">
    <div class="dialog-box">
      <div class="dialog-head">
        <span class="dialog-tag">// REVIEW</span>
        <button class="dialog-close" @click="reviewDialog = false">×</button>
      </div>
      <div class="dialog-body">
        <h3 class="dialog-title" v-if="reviewTarget">{{ reviewTarget.name }}</h3>
        <p class="dialog-sub" v-if="myExistingReview">// 您已评价过此书,本次将更新评价</p>
        <p class="dialog-sub" v-else>// 仅可评价已借阅过的图书</p>

        <div class="form-row">
          <label class="form-label">评分</label>
          <div class="rating-input">
            <button v-for="n in 5" :key="n" :class="['star-btn', { active: n <= reviewForm.rating }]"
                    @click="reviewForm.rating = n">★</button>
            <span class="rating-num">{{ reviewForm.rating }} / 5</span>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">评价内容</label>
          <textarea v-model="reviewForm.content" class="form-input" rows="4"
                    placeholder="分享您的阅读感受..."></textarea>
        </div>
      </div>
      <div class="dialog-foot">
        <button class="brutalist-btn" @click="reviewDialog = false">取消</button>
        <button class="brutalist-btn primary" @click="submitReview">提交</button>
      </div>
    </div>
  </div>

  <!-- 查看评价抽屉 -->
  <div v-if="reviewsDrawer" class="dialog-mask" @click.self="reviewsDrawer = false">
    <div class="drawer-box">
      <div class="dialog-head">
        <span class="dialog-tag">// REVIEWS</span>
        <button class="dialog-close" @click="reviewsDrawer = false">×</button>
      </div>
      <div class="dialog-body">
        <h3 class="dialog-title" v-if="reviewsTarget">{{ reviewsTarget.name }}</h3>
        <div v-if="reviewsSummary" class="summary-row">
          <div class="summary-avg">
            <span class="avg-num">{{ reviewsSummary.avgRating }}</span>
            <span class="avg-label">平均分</span>
          </div>
          <div class="summary-total">
            <span class="total-num">{{ reviewsSummary.total }}</span>
            <span class="avg-label">条评价</span>
          </div>
        </div>
        <div v-if="reviewsList.length === 0" class="empty-tip">// 暂无评价</div>
        <div v-else class="review-list">
          <div v-for="rv in reviewsList" :key="rv.id" class="review-item">
            <div class="review-head">
              <span class="review-reader">{{ rv.readerName || '匿名读者' }}</span>
              <span class="review-stars">{{ stars(rv.rating) }}</span>
              <span class="review-date">{{ (rv.createTime || '').slice(0, 10) }}</span>
            </div>
            <p v-if="rv.content" class="review-content">{{ rv.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.browse-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.browse-card {
  background: var(--white);
  border: var(--border);
  border-radius: 2px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s ease;
}
.browse-card:hover { box-shadow: var(--shadow); }
.card-tag {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  border-bottom: var(--border);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  background: rgba(184, 146, 74, 0.14);
  color: var(--yellow);
}
.tag-id { font-family: var(--font-display); font-size: 16px; color: var(--ink); }
.tag-cat { background: var(--ink); color: var(--bg); padding: 2px 6px; border-radius: 2px; }
.card-title {
  font-family: var(--font-cn);
  font-size: 22px;
  font-weight: 700;
  padding: 16px 14px 6px;
  line-height: 1.2;
}
.card-author {
  padding: 0 14px 12px;
  font-family: var(--font-mono);
  font-size: 12px;
  border-bottom: 1px dashed rgba(43, 37, 32, 0.2);
}
.card-meta { padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.meta-row { display: flex; justify-content: space-between; align-items: baseline; }
.meta-key {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.7;
}
.meta-val { font-family: var(--font-mono); font-size: 13px; font-weight: 700; }
.meta-val.price {
  font-family: var(--font-display);
  font-size: 18px;
  background: var(--bg);
  padding: 2px 6px;
  border: 1px solid rgba(43, 37, 32, 0.16);
  border-radius: 2px;
}
.card-desc {
  padding: 0 14px 14px;
  font-size: 12px;
  font-family: var(--font-cn);
  opacity: 0.75;
  line-height: 1.6;
  border-top: 1px dashed rgba(43, 37, 32, 0.2);
  padding-top: 10px;
}
.badge-available { background: rgba(92, 122, 92, 0.18); color: var(--green); border: 1px solid rgba(92, 122, 92, 0.4); }
.badge-low { background: rgba(184, 146, 74, 0.18); color: var(--yellow); border: 1px solid rgba(184, 146, 74, 0.4); }
.badge-out { background: rgba(139, 58, 58, 0.18); color: var(--pink); border: 1px solid rgba(139, 58, 58, 0.4); }

.card-actions {
  display: flex;
  gap: 6px;
  padding: 10px 14px 14px;
  border-top: 1px dashed rgba(43, 37, 32, 0.2);
  margin-top: auto;
}
.card-btn {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 8px 6px;
  background: var(--white);
  color: var(--ink);
  border: 1px solid rgba(43, 37, 32, 0.28);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.card-btn:hover { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.card-btn.primary { background: rgba(184, 146, 74, 0.15); color: var(--yellow); border-color: rgba(184, 146, 74, 0.5); }
.card-btn.primary:hover { background: var(--ink); color: var(--yellow); border-color: var(--ink); }
.card-btn.ghost { background: transparent; }

.dialog-mask {
  position: fixed; inset: 0;
  background: rgba(43, 37, 32, 0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: 20px;
}
.dialog-box, .drawer-box {
  background: var(--bg);
  border: var(--border);
  border-radius: 3px;
  box-shadow: var(--shadow-lg);
  width: 100%; max-width: 520px;
  max-height: 90vh; overflow-y: auto;
}
.dialog-head {
  display: flex; justify-content: space-between; align-items: center;
  background: var(--ink); color: var(--bg);
  padding: 10px 16px;
  font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.15em;
}
.dialog-close {
  background: rgba(255, 255, 255, 0.12); color: var(--bg);
  border: 1px solid rgba(253, 251, 246, 0.25);
  border-radius: 2px;
  width: 28px; height: 28px;
  font-size: 18px; font-weight: 700;
  cursor: pointer; line-height: 1;
  transition: all 0.2s ease;
}
.dialog-close:hover { background: rgba(139, 58, 58, 0.6); }
.dialog-body { padding: 20px; }
.dialog-title {
  font-family: var(--font-cn); font-size: 24px; font-weight: 700;
  margin-bottom: 4px;
}
.dialog-sub {
  font-family: var(--font-mono); font-size: 11px;
  opacity: 0.7; margin-bottom: 16px;
  letter-spacing: 0.1em;
}
.form-row { margin-bottom: 14px; }
.form-label {
  display: block;
  font-family: var(--font-mono); font-size: 11px;
  letter-spacing: 0.1em; text-transform: uppercase;
  margin-bottom: 6px; opacity: 0.8;
}
.form-input {
  width: 100%;
  font-family: var(--font-mono); font-size: 13px;
  padding: 8px 10px;
  background: var(--white);
  border: 1px solid rgba(43, 37, 32, 0.28);
  border-radius: 2px;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}
.form-input:focus { outline: none; border-color: var(--yellow); }
textarea.form-input { resize: vertical; }
.dialog-tip {
  font-family: var(--font-cn); font-size: 12px;
  opacity: 0.75; margin-top: 12px;
  padding: 10px; background: rgba(184, 146, 74, 0.12);
  color: var(--ink);
  border: 1px solid rgba(184, 146, 74, 0.3);
  border-radius: 2px;
  line-height: 1.6;
}
.dialog-foot {
  display: flex; gap: 10px; justify-content: flex-end;
  padding: 14px 20px;
  border-top: 1px solid rgba(43, 37, 32, 0.16);
  background: var(--white);
}

.rating-input { display: flex; align-items: center; gap: 4px; }
.star-btn {
  font-size: 28px; line-height: 1;
  background: transparent; border: none;
  color: var(--ink); opacity: 0.3;
  cursor: pointer; padding: 2px;
  transition: opacity 0.2s ease;
}
.star-btn.active { opacity: 1; color: var(--yellow); }
.star-btn:hover { opacity: 1; }
.rating-num {
  font-family: var(--font-display); font-size: 16px;
  margin-left: 10px;
}

.summary-row {
  display: flex; gap: 16px; margin-bottom: 16px;
  padding: 12px; background: rgba(184, 146, 74, 0.12);
  border: 1px solid rgba(184, 146, 74, 0.3);
  border-radius: 2px;
}
.summary-avg, .summary-total {
  display: flex; flex-direction: column; align-items: center;
  flex: 1;
}
.avg-num, .total-num {
  font-family: var(--font-display); font-size: 32px;
  color: var(--yellow);
}
.avg-label {
  font-family: var(--font-mono); font-size: 10px;
  letter-spacing: 0.15em; opacity: 0.7;
}
.empty-tip {
  padding: 30px; text-align: center;
  font-family: var(--font-mono); opacity: 0.5;
}
.review-list { display: flex; flex-direction: column; gap: 12px; }
.review-item {
  padding: 12px; background: var(--white);
  border: 1px solid rgba(43, 37, 32, 0.16);
  border-radius: 2px;
}
.review-head {
  display: flex; justify-content: space-between; align-items: center;
  gap: 8px; margin-bottom: 6px;
}
.review-reader {
  font-family: var(--font-cn); font-weight: 700;
}
.review-stars { color: var(--yellow); letter-spacing: 1px; }
.review-date {
  font-family: var(--font-mono); font-size: 10px; opacity: 0.5;
}
.review-content {
  font-size: 13px; line-height: 1.7;
  font-family: var(--font-cn);
}
</style>
