/**
 * 借阅者仪表盘
 * - 并行获取 overview + 最近借阅 + 置顶公告
 * - 快捷入口改用 React Router 跳转
 */
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { StatsAPI, BorrowAPI, NoticeAPI } from '@/api'
import type { Borrow, BorrowStatus, Notice, ReaderOverview } from '@/types'

const fmtDate = (d?: string) => (d ? String(d).replace('T', ' ').slice(0, 16) : '-')

interface DashboardData {
  overview: ReaderOverview
  recent: Borrow[]
  pinned: Notice[]
}

export default function ReaderDashboardView() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { showToast } = useUIStore()

  const readerId = user?.readerId
  const { data, isLoading, refetch } = useQuery<DashboardData>({
    queryKey: ['reader-dashboard', readerId],
    queryFn: async () => {
      if (!readerId) {
        showToast('当前账号未关联读者档案', 'error')
        return { overview: {} as ReaderOverview, recent: [], pinned: [] }
      }
      const [o, b, p] = await Promise.all([
        StatsAPI.myOverview(readerId),
        BorrowAPI.myBorrows(readerId),
        NoticeAPI.pinned(),
      ])
      if (!o.ok || !b.ok) showToast('部分数据加载失败', 'error')
      const all = b.ok ? (b.data ?? []) : []
      const recent = [...all]
        .sort((a, b2) => (b2.borrowDate || '').localeCompare(a.borrowDate || ''))
        .slice(0, 5)
      return {
        overview: o.ok ? (o.data ?? ({} as ReaderOverview)) : ({} as ReaderOverview),
        recent,
        pinned: p.ok ? (p.data ?? []) : [],
      }
    },
  })

  const overview = data?.overview ?? ({} as ReaderOverview)
  const recent = data?.recent ?? []
  const pinned = data?.pinned ?? []

  const totalBorrows = overview.totalBorrows || 0
  const activeBorrows = overview.activeBorrows || 0
  const overdueCount = overview.overdueCount || 0
  const returnedCount = overview.returnedCount || 0
  const totalFine = overview.totalFine || 0

  const statusBadge = (status: BorrowStatus) => {
    const map: Record<BorrowStatus, string> = {
      BORROWED: 'badge-borrowed',
      RETURNED: 'badge-returned',
      OVERDUE: 'badge-overdue',
    }
    return map[status] || 'badge-pending'
  }
  const statusText = (status: BorrowStatus) => {
    const map: Record<BorrowStatus, string> = {
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
          <h1 className="view-title">
            欢迎回来,{user?.readerName || user?.username}<span style={{ color: 'var(--terracotta)' }}>.</span>
          </h1>
          <div className="view-subtitle">Reader Dashboard · 我的借阅概览</div>
        </div>
        <button className="lib-btn primary" onClick={() => refetch()}>刷新</button>
      </div>

      {isLoading ? (
        <div className="loading-block">加载中...</div>
      ) : (
        <>
          {/* 指标卡 */}
          <div className="dashboard-grid">
            <div className="metric-card blue">
              <div className="metric-num">{totalBorrows}</div>
              <div className="metric-label">借阅总数</div>
            </div>
            <div className="metric-card orange">
              <div className="metric-num">{activeBorrows}</div>
              <div className="metric-label">在借数量</div>
            </div>
            <div className="metric-card green">
              <div className="metric-num">{returnedCount}</div>
              <div className="metric-label">已归还</div>
            </div>
            <div className="metric-card pink">
              <div className="metric-num">{overdueCount}</div>
              <div className="metric-label">逾期数量</div>
            </div>
            <div className="metric-card yellow">
              <div className="metric-num">¥{Number(totalFine).toFixed(2)}</div>
              <div className="metric-label">累计罚金</div>
            </div>
          </div>

          {/* 快捷入口 */}
          <div className="split-panel" style={{ marginTop: '20px' }}>
            <div className="bar-chart">
              <div className="bar-row" style={{ gridTemplateColumns: '1fr', marginBottom: '8px' }}>
                <span className="bar-label" style={{ fontSize: '14px', fontWeight: 700 }}>
                  快捷入口
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button className="lib-btn primary" onClick={() => navigate('/reader/books')}>
                  浏览馆藏 / 申请借阅
                </button>
                <button className="lib-btn" onClick={() => navigate('/reader/borrows')}>
                  查看我的借阅
                </button>
                <button className="lib-btn" onClick={() => navigate('/reader/requests')}>
                  我的借阅申请
                </button>
                <button className="lib-btn" onClick={() => navigate('/reader/notices')}>
                  查看公告板
                </button>
              </div>
            </div>

            {/* 置顶公告 */}
            <div className="bar-chart">
              <div className="bar-row" style={{ gridTemplateColumns: '1fr', marginBottom: '8px' }}>
                <span className="bar-label" style={{ fontSize: '14px', fontWeight: 700 }}>
                  置顶公告
                </span>
              </div>
              {pinned.length === 0 ? (
                <div className="empty-block">暂无置顶公告</div>
              ) : (
                pinned.slice(0, 3).map((n) => (
                  <div key={n.id} style={{
                    padding: '10px 12px',
                    border: 'var(--border)',
                    background: 'rgba(184, 146, 74, 0.05)',
                    marginBottom: '8px',
                  }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                      {fmtDate(n.publishDate)}
                    </div>
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
              <div className="empty-block">暂无借阅记录,去浏览馆藏吧</div>
            ) : (
              <div className="record-grid">
                {recent.map((r) => (
                  <div className="record-card" key={r.id}>
                    <div className="record-card-head">
                      <div className="record-card-title">{r.bookName || '-'}</div>
                      <span className={`badge ${statusBadge(r.status)}`}>
                        {statusText(r.status)}
                      </span>
                    </div>
                    <div className="record-card-meta">
                      <div className="meta-row">
                        <span className="meta-label">借出日期</span>
                        <span className="meta-value mono">{fmtDate(r.borrowDate)}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">应还日期</span>
                        <span className="meta-value mono">{fmtDate(r.dueDate)}</span>
                      </div>
                    </div>
                    <div className="record-card-foot">
                      <span className="record-card-id">#{r.id}</span>
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
