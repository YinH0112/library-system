/**
 * 管理员仪表盘
 * - 并行获取 overview + 分类统计 + 热门借阅 + 最近借阅
 * - 指标卡 + 双栏条形图 + 最近借阅表
 * 注意:后端 StatsService 用 jdbcTemplate 返回 Map,key 是 SQL 别名
 */
import { useQuery } from '@tanstack/react-query'
import { useUIStore } from '@/store/uiStore'
import { StatsAPI } from '@/api'

const fmtDate = (d?: string) => (d ? String(d).replace('T', ' ').slice(0, 16) : '-')

/** 后端返回的 Map 原始字段名 */
interface OverviewMap {
  bookCount?: number
  totalStock?: number
  availableStock?: number
  readerCount?: number
  activeBorrows?: number
  overdueCount?: number
  categoryCount?: number
  [k: string]: unknown
}

interface CategoryMap {
  category: string
  count: number
}

interface TopBookMap {
  book: string
  borrow_count: number
}

interface RecentBorrowMap {
  id: number
  book: string
  reader: string
  borrow_date: string
  due_date: string
  status: string
}

interface DashboardData {
  overview: OverviewMap
  categories: CategoryMap[]
  topBorrowed: TopBookMap[]
  recent: RecentBorrowMap[]
}

type BorrowStatus = 'BORROWED' | 'RETURNED' | 'OVERDUE'

export default function DashboardView() {
  const { showToast } = useUIStore()

  const { data, isLoading, refetch } = useQuery<DashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const [o, c, t, r] = await Promise.all([
        StatsAPI.overview(),
        StatsAPI.booksPerCategory(),
        StatsAPI.topBorrowed(5),
        StatsAPI.recentBorrows(10),
      ])
      if (!o.ok || !c.ok || !t.ok || !r.ok) showToast('部分数据加载失败', 'error')
      return {
        overview: (o.data ?? {}) as unknown as OverviewMap,
        categories: (c.data ?? []) as unknown as CategoryMap[],
        topBorrowed: (t.data ?? []) as unknown as TopBookMap[],
        recent: (r.data ?? []) as unknown as RecentBorrowMap[],
      }
    },
  })

  const overview = data?.overview ?? {}
  const categories = data?.categories ?? []
  const topBorrowed = data?.topBorrowed ?? []
  const recent = data?.recent ?? []

  const totalBooks = overview.bookCount || 0
  const totalReaders = overview.readerCount || 0
  const totalStock = overview.totalStock || 0
  const activeBorrows = overview.activeBorrows || 0
  const overdueCount = overview.overdueCount || 0

  const maxCat = Math.max(1, ...categories.map((c) => c.count || 0))
  const maxTop = Math.max(1, ...topBorrowed.map((t) => t.borrow_count || 0))

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      BORROWED: 'badge-borrowed',
      RETURNED: 'badge-returned',
      OVERDUE: 'badge-overdue',
    }
    return map[status] || 'badge-pending'
  }
  const statusText = (status: string) => {
    const map: Record<string, string> = {
      BORROWED: '借阅中',
      RETURNED: '已归还',
      OVERDUE: '已逾期',
    }
    return map[status] || status || '-'
  }

  return (
    <div>
      <div className="view-header">
        <div>
          <h1 className="view-title">仪表盘<span style={{ color: 'var(--terracotta)' }}>.</span></h1>
          <div className="view-subtitle">Dashboard · 馆藏与借阅概览</div>
        </div>
        <button className="lib-btn primary" onClick={() => refetch()}>刷新</button>
      </div>

      {isLoading ? (
        <div className="loading-block">加载中...</div>
      ) : (
        <>
          {/* 指标卡 */}
          <div className="dashboard-grid">
            <div className="metric-card yellow">
              <div className="metric-num">{totalBooks}</div>
              <div className="metric-label">馆藏种类</div>
            </div>
            <div className="metric-card blue">
              <div className="metric-num">{totalStock}</div>
              <div className="metric-label">馆藏总量</div>
            </div>
            <div className="metric-card green">
              <div className="metric-num">{totalReaders}</div>
              <div className="metric-label">读者总数</div>
            </div>
            <div className="metric-card orange">
              <div className="metric-num">{activeBorrows}</div>
              <div className="metric-label">在借数量</div>
            </div>
            <div className="metric-card pink">
              <div className="metric-num">{overdueCount}</div>
              <div className="metric-label">逾期数量</div>
            </div>
          </div>

          {/* 双栏:分类图书条形图 + 热门借阅 Top5 */}
          <div className="split-panel" style={{ marginTop: '20px' }}>
            <div className="bar-chart">
              <div className="bar-row" style={{ gridTemplateColumns: '1fr', marginBottom: '8px' }}>
                <span className="bar-label" style={{ fontSize: '14px', fontWeight: 700 }}>
                  分类图书分布
                </span>
              </div>
              {categories.length === 0 ? (
                <div className="empty-block">暂无数据</div>
              ) : (
                categories.map((c, i) => (
                  <div className="bar-row" key={i}>
                    <span className="bar-label">{c.category}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${((c.count || 0) / maxCat) * 100}%` }}
                      ></div>
                    </div>
                    <span className="bar-value">{c.count || 0}</span>
                  </div>
                ))
              )}
            </div>

            <div className="bar-chart">
              <div className="bar-row" style={{ gridTemplateColumns: '1fr', marginBottom: '8px' }}>
                <span className="bar-label" style={{ fontSize: '14px', fontWeight: 700 }}>
                  热门借阅 Top 5
                </span>
              </div>
              {topBorrowed.length === 0 ? (
                <div className="empty-block">暂无数据</div>
              ) : (
                topBorrowed.map((t, i) => (
                  <div className="bar-row" key={i}>
                    <span className="bar-label">{t.book}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${((t.borrow_count || 0) / maxTop) * 100}%` }}
                      ></div>
                    </div>
                    <span className="bar-value">{t.borrow_count || 0}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 最近借阅 */}
          <div style={{ marginTop: '24px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '12px' }}>
              最近借阅记录
            </h2>
            {recent.length === 0 ? (
              <div className="empty-block">暂无数据</div>
            ) : (
              <div className="record-grid">
                {recent.map((r, i) => (
                  <div className="record-card" key={i}>
                    <div className="record-card-head">
                      <div className="record-card-title">{r.book || '-'}</div>
                      <span className={`badge ${statusBadge(r.status)}`}>
                        {statusText(r.status)}
                      </span>
                    </div>
                    <div className="record-card-meta">
                      <div className="meta-row">
                        <span className="meta-label">读者</span>
                        <span className="meta-value">{r.reader || '-'}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">借出日期</span>
                        <span className="meta-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                          {fmtDate(r.borrow_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
