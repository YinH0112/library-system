<script setup>
import { ref, onMounted, computed } from 'vue'
import { StatsAPI } from '../api.js'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import EmptyState from '../components/EmptyState.vue'

const emit = defineEmits(['toast'])

const overview = ref({})
const categoryData = ref([])
const topBooks = ref([])
const recentList = ref([])
const loading = ref(true)
const loadError = ref(false)

const maxCategoryCount = computed(() =>
  Math.max(1, ...categoryData.value.map(c => Number(c.count || 0)))
)

const maxBorrowCount = computed(() =>
  Math.max(1, ...topBooks.value.map(b => Number(b.borrow_count || 0)))
)

function statusBadge(status) {
  return {
    BORROWED: 'badge-borrowed',
    RETURNED: 'badge-returned',
    OVERDUE: 'badge-overdue'
  }[status] || 'badge-borrowed'
}

function timelineDot(status) {
  return { BORROWED: 'dot-borrow', RETURNED: 'dot-return', OVERDUE: 'dot-overdue' }[status] || 'dot-borrow'
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  return dateStr.slice(5, 16) // MM-DD HH:MM
}

const barColors = ['var(--primary)', 'var(--success)', 'var(--blue)', 'var(--purple)', 'var(--orange)', 'var(--destructive)']

async function loadAll() {
  loading.value = true
  loadError.value = false
  try {
    const [ov, cat, top, recent] = await Promise.all([
      StatsAPI.overview(),
      StatsAPI.booksPerCategory(),
      StatsAPI.topBorrowed(5),
      StatsAPI.recentBorrows(8)
    ])
    overview.value = ov.data.data || {}
    categoryData.value = cat.data.data || []
    topBooks.value = top.data.data || []
    recentList.value = recent.data.data || []
  } catch (e) {
    loadError.value = true
    emit('toast', 'error', '仪表盘数据加载失败')
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
defineExpose({ reload: loadAll })
</script>

<template>
  <div class="view-header">
    <div>
      <h1 class="view-title">DASHBOARD<span style="color: var(--yellow)">.</span></h1>
      <p class="view-subtitle">// 实时馆藏运营快照</p>
    </div>
    <button class="brutalist-btn primary" @click="loadAll">↻ 刷新</button>
  </div>

  <!-- Loading -->
  <SkeletonLoader v-if="loading" type="dashboard" :count="4" />

  <!-- Error -->
  <EmptyState v-else-if="loadError" icon="error" title="数据加载失败" description="无法获取仪表盘数据，请检查网络连接后重试">
    <template #action>
      <button class="brutalist-btn primary" @click="loadAll">重试</button>
    </template>
  </EmptyState>

  <template v-else>
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="welcome-text">
        <div class="welcome-greeting">LIBRARY ADMIN</div>
        <div class="welcome-name">馆藏运营总览</div>
        <div class="welcome-sub">实时监控借阅动态与馆藏状态</div>
      </div>
      <div class="welcome-stats">
        <div class="welcome-stat">
          <div class="welcome-stat-num">{{ overview.activeBorrows || 0 }}</div>
          <div class="welcome-stat-label">借出中</div>
        </div>
        <div class="welcome-stat">
          <div class="welcome-stat-num">{{ overview.overdueCount || 0 }}</div>
          <div class="welcome-stat-label">逾期</div>
        </div>
        <div class="welcome-stat">
          <div class="welcome-stat-num">{{ overview.availableStock || 0 }}</div>
          <div class="welcome-stat-label">可借</div>
        </div>
      </div>
    </div>

    <!-- 指标卡 -->
    <div class="dashboard-grid">
      <div class="metric-card pink">
        <div class="metric-label">藏书种类</div>
        <div class="metric-num">{{ overview.bookCount || 0 }}</div>
      </div>
      <div class="metric-card yellow">
        <div class="metric-label">总馆藏</div>
        <div class="metric-num">{{ overview.totalStock || 0 }}</div>
      </div>
      <div class="metric-card green">
        <div class="metric-label">可借</div>
        <div class="metric-num">{{ overview.availableStock || 0 }}</div>
      </div>
      <div class="metric-card blue">
        <div class="metric-label">读者</div>
        <div class="metric-num">{{ overview.readerCount || 0 }}</div>
      </div>
      <div class="metric-card orange">
        <div class="metric-label">借出中</div>
        <div class="metric-num">{{ overview.activeBorrows || 0 }}</div>
      </div>
      <div class="metric-card pink">
        <div class="metric-label">逾期</div>
        <div class="metric-num">{{ overview.overdueCount || 0 }}</div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="split-panel">
      <div>
        <h2 class="view-title" style="font-size: 24px; margin-bottom: 12px;">分类分布</h2>
        <div class="bar-chart">
          <div v-for="(c, i) in categoryData" :key="c.category" class="bar-row">
            <span class="bar-label">{{ c.category }}</span>
            <div class="bar-track">
              <div class="bar-fill"
                   :style="{ width: ((Number(c.count || 0) / maxCategoryCount) * 100) + '%', background: barColors[i % barColors.length] }">
              </div>
            </div>
            <span class="bar-value">{{ c.count || 0 }}</span>
          </div>
          <div v-if="categoryData.length === 0" style="padding: 24px; text-align: center; opacity: 0.5; font-size: 13px;">暂无数据</div>
        </div>
      </div>

      <div>
        <h2 class="view-title" style="font-size: 24px; margin-bottom: 12px;">借阅 TOP5</h2>
        <div class="bar-chart">
          <div v-for="(b, i) in topBooks" :key="b.book" class="bar-row">
            <span class="bar-label" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ b.book }}</span>
            <div class="bar-track">
              <div class="bar-fill"
                   :style="{ width: ((Number(b.borrow_count || 0) / maxBorrowCount) * 100) + '%', background: barColors[(i + 2) % barColors.length] }">
              </div>
            </div>
            <span class="bar-value">{{ b.borrow_count || 0 }}</span>
          </div>
          <div v-if="topBooks.length === 0" style="padding: 24px; text-align: center; opacity: 0.5; font-size: 13px;">暂无数据</div>
        </div>
      </div>
    </div>

    <!-- 最近借阅 — 活动时间线 -->
    <div class="section-divider">
      <span class="section-divider-text">最近活动</span>
    </div>

    <div v-if="recentList.length === 0" style="padding: 32px; text-align: center; opacity: 0.5;">
      <p style="font-size: 13px;">暂无借阅活动</p>
    </div>
    <div v-else class="activity-timeline">
      <div class="timeline-title">RECENT ACTIVITY</div>
      <div class="timeline-list">
        <div v-for="(r, i) in recentList" :key="r.id" class="timeline-item" :style="{ animationDelay: (i * 0.06) + 's' }">
          <div class="timeline-time">{{ formatTime(r.borrow_date) }}</div>
          <div class="timeline-content">
            <span :class="['timeline-dot', timelineDot(r.status)]"></span>
            <strong>{{ r.reader }}</strong> 借阅了 <strong>{{ r.book }}</strong>
            <span :class="['badge', statusBadge(r.status)]" style="margin-left: 8px;">{{ r.status }}</span>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<style scoped>
/* No additional scoped styles needed — all handled by global CSS */
</style>
