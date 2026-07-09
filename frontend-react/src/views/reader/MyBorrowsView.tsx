/**
 * 我的借阅
 * - 获取当前读者的全部借阅,前端按状态筛选
 * - 状态徽标 + 统计计数
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { BorrowAPI } from '@/api'
import type { Borrow, BorrowStatus } from '@/types'

const fmtDate = (d?: string) => (d ? String(d).replace('T', ' ').slice(0, 16) : '-')

export default function MyBorrowsView() {
  const user = useAuthStore((s) => s.user)
  const { showToast } = useUIStore()
  const [status, setStatus] = useState<string>('')

  const readerId = user?.readerId
  const { data: all = [], isLoading, refetch } = useQuery<Borrow[]>({
    queryKey: ['my-borrows', readerId],
    queryFn: async () => {
      if (!readerId) {
        showToast('当前账号未关联读者档案', 'error')
        return []
      }
      const res = await BorrowAPI.myBorrows(readerId)
      if (res.ok) return res.data ?? []
      showToast(res.message || '加载失败', 'error')
      return []
    },
  })

  const list = status ? all.filter((b) => b.status === status) : all

  const statusBadge = (s: BorrowStatus) => {
    const map: Record<BorrowStatus, string> = {
      BORROWED: 'badge-borrowed',
      RETURNED: 'badge-returned',
      OVERDUE: 'badge-overdue',
    }
    return map[s] || 'badge-pending'
  }
  const statusText = (s: BorrowStatus) => {
    const map: Record<BorrowStatus, string> = {
      BORROWED: '借阅中',
      RETURNED: '已归还',
      OVERDUE: '已逾期',
    }
    return map[s] || s || '-'
  }

  const counts = all.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1
    return acc
  }, {})

  return (
    <div>
      <div className="view-header">
        <div>
          <h1 className="view-title">
            我的借阅<span style={{ color: 'var(--terracotta)' }}>.</span>
          </h1>
          <div className="view-subtitle">My Borrows · 借阅记录与归还状态</div>
        </div>
        <button className="lib-btn primary" onClick={() => refetch()}>刷新</button>
      </div>

      <div className="stat-pills">
        <button
          className={`stat-pill ${status === '' ? 'active' : ''}`}
          onClick={() => setStatus('')}
        >
          全部 <span className="stat-pill-num">{all.length}</span>
        </button>
        <button
          className={`stat-pill ${status === 'BORROWED' ? 'active' : ''}`}
          onClick={() => setStatus('BORROWED')}
        >
          借阅中 <span className="stat-pill-num">{counts.BORROWED || 0}</span>
        </button>
        <button
          className={`stat-pill ${status === 'RETURNED' ? 'active' : ''}`}
          onClick={() => setStatus('RETURNED')}
        >
          已归还 <span className="stat-pill-num">{counts.RETURNED || 0}</span>
        </button>
        <button
          className={`stat-pill ${status === 'OVERDUE' ? 'active' : ''}`}
          onClick={() => setStatus('OVERDUE')}
        >
          已逾期 <span className="stat-pill-num">{counts.OVERDUE || 0}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="loading-block">加载中...</div>
      ) : list.length === 0 ? (
        <div className="empty-block">暂无借阅记录</div>
      ) : (
        <div className="record-grid">
          {list.map((b) => (
            <div className="record-card" key={b.id}>
              <div className="record-card-head">
                <div className="record-card-title">{b.bookName || '-'}</div>
                <span className={`badge ${statusBadge(b.status)}`}>
                  {statusText(b.status)}
                </span>
              </div>
              <div className="record-card-meta">
                <div className="meta-row">
                  <span className="meta-label">借出日期</span>
                  <span className="meta-value mono">{fmtDate(b.borrowDate)}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">应还日期</span>
                  <span className="meta-value mono">{fmtDate(b.dueDate)}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">归还日期</span>
                  <span className="meta-value mono">{fmtDate(b.returnDate)}</span>
                </div>
                {b.remark && (
                  <div className="meta-row">
                    <span className="meta-label">备注</span>
                    <span className="meta-value">{b.remark}</span>
                  </div>
                )}
              </div>
              <div className="record-card-foot">
                <span className="record-card-id">#{b.id}</span>
                {Number(b.fine || 0) > 0 && (
                  <span className="badge badge-overdue">罚金 ¥{Number(b.fine).toFixed(2)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
