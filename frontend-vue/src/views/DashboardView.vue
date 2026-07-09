<script setup>
import { ref, onMounted, computed } from 'vue'
import { StatsAPI } from '../api.js'

const emit = defineEmits(['toast'])

const overview = ref({})
const categoryData = ref([])
const topBooks = ref([])
const recentList = ref([])
const loading = ref(true)

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

async function loadAll() {
  loading.value = true
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

  <div v-if="loading" class="loading-state" style="padding: 60px; text-align: center;">
    <span class="loading-box" style="font-family: var(--font-display); font-size: 24px;">LOADING...</span>
  </div>

  <template v-else>
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
          <div v-for="c in categoryData" :key="c.category" class="bar-row">
            <span class="bar-label">{{ c.category }}</span>
            <div class="bar-track">
              <div class="bar-fill"
                   :style="{ width: ((Number(c.count || 0) / maxCategoryCount) * 100) + '%', background: 'rgba(139, 58, 58, 0.75)' }">
              </div>
            </div>
            <span class="bar-value">{{ c.count || 0 }}</span>
          </div>
        </div>
      </div>

      <div>
        <h2 class="view-title" style="font-size: 24px; margin-bottom: 12px;">借阅 TOP5</h2>
        <div class="bar-chart">
          <div v-for="b in topBooks" :key="b.book" class="bar-row">
            <span class="bar-label" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ b.book }}</span>
            <div class="bar-track">
              <div class="bar-fill"
                   :style="{ width: ((Number(b.borrow_count || 0) / maxBorrowCount) * 100) + '%', background: 'rgba(184, 146, 74, 0.75)' }">
              </div>
            </div>
            <span class="bar-value">{{ b.borrow_count || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近借阅 -->
    <div style="margin-top: 32px;">
      <h2 class="view-title" style="font-size: 24px; margin-bottom: 12px;">最近借阅</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>图书</th>
            <th>读者</th>
            <th>借出日</th>
            <th>应还日</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in recentList" :key="r.id">
            <td>#{{ String(r.id).padStart(3, '0') }}</td>
            <td style="font-family: var(--font-cn); font-weight: 700;">{{ r.book }}</td>
            <td>{{ r.reader }}</td>
            <td>{{ r.borrow_date }}</td>
            <td>{{ r.due_date }}</td>
            <td><span :class="['badge', statusBadge(r.status)]">{{ r.status }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
</template>
