/**
 * 借阅申请审批 · 时间线式卡片
 * - 顶部摘要条:大号待处理计数
 * - stat-pills 状态筛选
 * - 审批卡片:左色带 + 头部(书名+读者)+ 字段网格 + 备注 + 操作区
 * - useQuery 并行获取申请列表 + 待处理数量
 * - useMutation 批准 / 拒绝
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '@/store/uiStore'
import { BorrowRequestAPI } from '@/api'
import type { BorrowRequest, RequestStatus } from '@/types'

const fmtDate = (d?: string) => (d ? String(d).replace('T', ' ').slice(0, 16) : '-')

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: '全部' },
  { value: 'PENDING', label: '待审批' },
  { value: 'APPROVED', label: '已批准' },
  { value: 'REJECTED', label: '已拒绝' },
  { value: 'CANCELLED', label: '已取消' },
]

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

type ActionType = 'approve' | 'reject'

interface ApprovalResult {
  list: BorrowRequest[]
  pendingCount: number
}

export default function RequestApprovalView() {
  const queryClient = useQueryClient()
  const { showToast } = useUIStore()
  const [status, setStatus] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<ActionType>('approve')
  const [current, setCurrent] = useState<BorrowRequest | null>(null)
  const [adminRemark, setAdminRemark] = useState('')

  const { data, isLoading, refetch } = useQuery<ApprovalResult>({
    queryKey: ['borrow-requests', 'admin', status],
    queryFn: async () => {
      const [r, p] = await Promise.all([
        BorrowRequestAPI.list(status || undefined),
        BorrowRequestAPI.pendingCount(),
      ])
      if (!r.ok) showToast(r.message || '加载失败', 'error')
      return {
        list: r.ok ? (r.data ?? []) : [],
        pendingCount: p.ok ? (p.data ?? 0) : 0,
      }
    },
  })

  const list = data?.list ?? []
  const pendingCount = data?.pendingCount ?? 0

  // 各状态计数(基于当前列表)
  const countByStatus = (s: string) =>
    s === '' ? list.length : list.filter((r) => r.status === s).length

  const actionMutation = useMutation({
    mutationFn: (vars: { id: number; action: ActionType; remark: string }) => {
      const remark = vars.remark || (vars.action === 'approve' ? '同意' : '拒绝')
      return vars.action === 'approve'
        ? BorrowRequestAPI.approve(vars.id, remark)
        : BorrowRequestAPI.reject(vars.id, remark)
    },
    onSuccess: (res, vars) => {
      if (res.ok) {
        showToast(vars.action === 'approve' ? '已批准' : '已拒绝', 'success')
        queryClient.invalidateQueries({ queryKey: ['borrow-requests', 'admin'] })
        setDialogOpen(false)
      } else {
        showToast(res.message || '操作失败', 'error')
      }
    },
  })

  const openAction = (row: BorrowRequest, type: ActionType) => {
    setCurrent(row)
    setActionType(type)
    setAdminRemark('')
    setDialogOpen(true)
  }

  const submit = () => {
    if (!current) return
    actionMutation.mutate({ id: current.id, action: actionType, remark: adminRemark })
  }

  /** 渲染单个审批卡片 */
  const renderCard = (r: BorrowRequest) => {
    const stateClass =
      r.status === 'APPROVED' ? 'approved' :
      r.status === 'REJECTED' ? 'rejected' :
      r.status === 'CANCELLED' ? 'cancelled' : ''

    return (
      <div className={`approval-card-v2 ${stateClass}`.trim()} key={r.id}>
        {/* 头部:书名 + 读者信息 + 状态 */}
        <div className="ac2-head">
          <div className="ac2-head-left">
            <div className="ac2-book-name">{r.bookName || '未知图书'}</div>
            <div className="ac2-meta-line">
              <span className="ac2-reader">{r.readerName || '未知读者'}</span>
              <span className="ac2-meta-dot" />
              <span>申请于 {fmtDate(r.requestDate)}</span>
            </div>
          </div>
          <div className="ac2-status-wrap">
            <span className="ac2-status-label">状态</span>
            <span className={`badge ${statusBadge(r.status)}`}>
              {statusText(r.status)}
            </span>
          </div>
        </div>

        {/* 字段网格 */}
        <div className="ac2-body">
          <div className="ac2-field">
            <span className="ac2-field-label">借阅天数</span>
            <span className="ac2-field-value accent">
              {r.dueDays ? `${r.dueDays} 天` : '-'}
            </span>
          </div>
          {r.approveDate && (
            <div className="ac2-field">
              <span className="ac2-field-label">审批日期</span>
              <span className="ac2-field-value mono">{fmtDate(r.approveDate)}</span>
            </div>
          )}
          {r.approverName && (
            <div className="ac2-field">
              <span className="ac2-field-label">审批人</span>
              <span className="ac2-field-value">{r.approverName}</span>
            </div>
          )}

          {/* 读者备注 */}
          {r.readerRemark && (
            <div className="ac2-remark reader">
              <strong style={{ color: 'var(--blue)', fontSize: '11px', letterSpacing: '0.5px' }}>
                读者备注
              </strong>
              <br />
              {r.readerRemark}
            </div>
          )}

          {/* 管理员备注 */}
          {r.adminRemark && (
            <div className="ac2-remark admin">
              <strong style={{ color: 'var(--terracotta)', fontSize: '11px', letterSpacing: '0.5px' }}>
                管理员备注
              </strong>
              <br />
              {r.adminRemark}
            </div>
          )}
        </div>

        {/* 底部操作区 */}
        <div className="ac2-foot">
          <span className="ac2-id">#{r.id}</span>
          <div className="ac2-actions">
            {r.status === 'PENDING' ? (
              <>
                <button
                  className="ac2-btn approve"
                  disabled={actionMutation.isPending}
                  onClick={() => openAction(r, 'approve')}
                >
                  ✓ 批准
                </button>
                <button
                  className="ac2-btn reject"
                  disabled={actionMutation.isPending}
                  onClick={() => openAction(r, 'reject')}
                >
                  ✕ 拒绝
                </button>
              </>
            ) : (
              <span className="ac2-processed">
                {r.status === 'APPROVED' && '已于 ' + fmtDate(r.approveDate) + ' 批准'}
                {r.status === 'REJECTED' && '已于 ' + fmtDate(r.approveDate) + ' 拒绝'}
                {r.status === 'CANCELLED' && '读者已取消'}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="view-header">
        <div>
          <h1 className="view-title">
            申请审批<span style={{ color: 'var(--terracotta)' }}>.</span>
          </h1>
          <div className="view-subtitle">Approval · 借阅申请审核</div>
        </div>
        <button className="lib-btn" onClick={() => refetch()}>刷新</button>
      </div>

      {/* 待处理摘要条 */}
      <div className="approval-summary">
        <div className="approval-summary-num">{pendingCount}</div>
        <div className="approval-summary-text">
          <div className="approval-summary-label">
            {pendingCount > 0 ? '条申请待您审批' : '暂无待处理申请'}
          </div>
          <div className="approval-summary-sub">
            PENDING REQUESTS · 请及时处理
          </div>
        </div>
        {pendingCount > 0 && (
          <button
            className="lib-btn primary"
            onClick={() => setStatus('PENDING')}
          >
            查看待处理
          </button>
        )}
      </div>

      {/* 状态筛选药丸 */}
      <div className="stat-pills">
        {STATUS_OPTIONS.map((o) => (
          <button
            key={o.value || 'ALL'}
            className={`stat-pill ${status === o.value ? 'active' : ''}`}
            onClick={() => setStatus(o.value)}
          >
            {o.label}{' '}
            <span className="stat-pill-num">{countByStatus(o.value)}</span>
          </button>
        ))}
      </div>

      {/* 列表 */}
      {isLoading ? (
        <div className="loading-block">加载中...</div>
      ) : list.length === 0 ? (
        <div className="empty-block">
          {status === 'PENDING' ? '暂无待审批申请' : '暂无数据'}
        </div>
      ) : (
        <div className="approval-list">
          {list.map(renderCard)}
        </div>
      )}

      {/* 批准/拒绝对话框 */}
      {dialogOpen && current && (
        <div className="dialog-mask" onClick={() => setDialogOpen(false)}>
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-title">
                {actionType === 'approve' ? '批准借阅申请' : '拒绝借阅申请'}
              </div>
              <button className="dialog-close" onClick={() => setDialogOpen(false)}>×</button>
            </div>
            <div className="dialog-body">
              {/* 申请摘要卡片 */}
              <div style={{
                padding: '16px 18px',
                background: 'var(--bg-alt)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--line)',
              }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '17px',
                  fontWeight: 600,
                  color: 'var(--forest)',
                  marginBottom: '10px',
                }}>
                  {current.bookName}
                </div>
                <div className="ac2-body" style={{ padding: 0, gap: '10px 20px' }}>
                  <div className="ac2-field">
                    <span className="ac2-field-label">读者</span>
                    <span className="ac2-field-value">{current.readerName}</span>
                  </div>
                  <div className="ac2-field">
                    <span className="ac2-field-label">借期</span>
                    <span className="ac2-field-value accent">
                      {current.dueDays} 天
                    </span>
                  </div>
                  <div className="ac2-field">
                    <span className="ac2-field-label">申请日期</span>
                    <span className="ac2-field-value mono">{fmtDate(current.requestDate)}</span>
                  </div>
                </div>
                {current.readerRemark && (
                  <div className="ac2-remark reader" style={{ marginTop: '12px' }}>
                    <strong style={{ color: 'var(--blue)', fontSize: '11px' }}>读者备注</strong>
                    <br />
                    {current.readerRemark}
                  </div>
                )}
              </div>

              <div>
                <label className="lib-label">
                  管理员备注 {actionType === 'reject' && '*'}
                </label>
                <textarea
                  className="lib-input"
                  rows={3}
                  value={adminRemark}
                  onChange={(e) => setAdminRemark(e.target.value)}
                  placeholder={actionType === 'approve' ? '可填写批准说明(选填)' : '请填写拒绝理由'}
                />
              </div>
            </div>
            <div className="dialog-foot">
              <button className="lib-btn" onClick={() => setDialogOpen(false)}>取消</button>
              <button
                className={`lib-btn ${actionType === 'approve' ? 'green' : 'danger'}`}
                disabled={actionMutation.isPending}
                onClick={submit}
              >
                {actionMutation.isPending ? '处理中...' : actionType === 'approve' ? '确认批准' : '确认拒绝'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
