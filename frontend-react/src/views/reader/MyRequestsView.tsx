/**
 * 我的借阅申请
 * - useQuery 获取申请列表(按状态)
 * - useMutation 取消申请,成功后失效列表查询
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '@/store/uiStore'
import { BorrowRequestAPI } from '@/api'
import type { BorrowRequest, RequestStatus } from '@/types'

const fmtDate = (d?: string) => (d ? String(d).replace('T', ' ').slice(0, 16) : '-')

export default function MyRequestsView() {
  const queryClient = useQueryClient()
  const { showToast, confirmFn } = useUIStore()
  const [status, setStatus] = useState<string>('')

  const { data: all = [], isLoading, refetch } = useQuery<BorrowRequest[]>({
    queryKey: ['my-requests'],
    queryFn: async () => {
      const res = await BorrowRequestAPI.my()
      if (res.ok) return res.data ?? []
      showToast(res.message || '加载失败', 'error')
      return []
    },
  })

  const list = status ? all.filter((r) => r.status === status) : all

  const counts = all.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})

  const cancelMutation = useMutation({
    mutationFn: (id: number) => BorrowRequestAPI.cancel(id),
    onSuccess: async (res) => {
      if (res.ok) {
        showToast('已取消申请', 'success')
        await queryClient.invalidateQueries({ queryKey: ['my-requests'] })
      } else {
        showToast(res.message || '取消失败', 'error')
      }
    },
  })

  const cancel = async (row: BorrowRequest) => {
    const ok = await confirmFn('取消申请', `确定取消《${row.bookName}》的借阅申请吗?`)
    if (!ok) return
    cancelMutation.mutate(row.id)
  }

  const statusBadge = (s: RequestStatus) => {
    const map: Record<RequestStatus, string> = {
      PENDING: 'badge-pending',
      APPROVED: 'badge-approved',
      REJECTED: 'badge-rejected',
      CANCELLED: 'badge-cancelled',
    }
    return map[s] || 'badge-pending'
  }
  const statusText = (s: RequestStatus) => {
    const map: Record<RequestStatus, string> = {
      PENDING: '待审批',
      APPROVED: '已批准',
      REJECTED: '已拒绝',
      CANCELLED: '已取消',
    }
    return map[s] || s || '-'
  }
  const cardClass = (s: RequestStatus) => {
    const map: Record<RequestStatus, string> = {
      PENDING: '',
      APPROVED: 'approved',
      REJECTED: 'rejected',
      CANCELLED: 'cancelled',
    }
    return map[s] || ''
  }

  return (
    <div>
      <div className="view-header">
        <div>
          <h1 className="view-title">
            我的借阅申请<span style={{ color: 'var(--terracotta)' }}>.</span>
          </h1>
          <div className="view-subtitle">My Requests · 申请记录与审批状态</div>
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
          className={`stat-pill ${status === 'PENDING' ? 'active' : ''}`}
          onClick={() => setStatus('PENDING')}
        >
          待审批 <span className="stat-pill-num">{counts.PENDING || 0}</span>
        </button>
        <button
          className={`stat-pill ${status === 'APPROVED' ? 'active' : ''}`}
          onClick={() => setStatus('APPROVED')}
        >
          已批准 <span className="stat-pill-num">{counts.APPROVED || 0}</span>
        </button>
        <button
          className={`stat-pill ${status === 'REJECTED' ? 'active' : ''}`}
          onClick={() => setStatus('REJECTED')}
        >
          已拒绝 <span className="stat-pill-num">{counts.REJECTED || 0}</span>
        </button>
        <button
          className={`stat-pill ${status === 'CANCELLED' ? 'active' : ''}`}
          onClick={() => setStatus('CANCELLED')}
        >
          已取消 <span className="stat-pill-num">{counts.CANCELLED || 0}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="loading-block">加载中...</div>
      ) : list.length === 0 ? (
        <div className="empty-block">暂无申请记录,前往浏览馆藏申请借阅</div>
      ) : (
        <div className="approval-list">
          {list.map((r) => (
            <div className={`approval-card ${cardClass(r.status)}`.trim()} key={r.id}>
              <div className="record-card-head">
                <div className="record-card-title">{r.bookName || '-'}</div>
                <span className={`badge ${statusBadge(r.status)}`}>
                  {statusText(r.status)}
                </span>
              </div>
              <div className="record-card-meta">
                <div className="meta-row">
                  <span className="meta-label">申请日期</span>
                  <span className="meta-value mono">{fmtDate(r.requestDate)}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">借阅天数</span>
                  <span className="meta-value">{r.dueDays || '-'} 天</span>
                </div>
                {r.approveDate && (
                  <div className="meta-row">
                    <span className="meta-label">审批日期</span>
                    <span className="meta-value mono">{fmtDate(r.approveDate)}</span>
                  </div>
                )}
                <div className="meta-row">
                  <span className="meta-label">管理员备注</span>
                  <span className="meta-value">{r.adminRemark || '-'}</span>
                </div>
                {r.readerRemark && (
                  <div className="meta-row">
                    <span className="meta-label">我的备注</span>
                    <span className="meta-value">{r.readerRemark}</span>
                  </div>
                )}
              </div>
              <div className="record-card-foot">
                <span className="record-card-id">#{r.id}</span>
                {r.status === 'PENDING' ? (
                  <button
                    className="mini-btn danger"
                    disabled={cancelMutation.isPending}
                    onClick={() => cancel(r)}
                  >
                    取消申请
                  </button>
                ) : (
                  <span style={{ fontSize: '12px', opacity: 0.4 }}>无可用操作</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
