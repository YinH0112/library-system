/**
 * 借阅管理
 * - useQuery 获取借阅列表(按状态筛选)
 * - useMutation 借书 / 还书
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '@/store/uiStore'
import { BorrowAPI } from '@/api'
import type { Borrow, BorrowStatus } from '@/types'

const fmtDate = (d?: string) => (d ? String(d).replace('T', ' ').slice(0, 16) : '-')

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: '全部' },
  { value: 'BORROWED', label: '借阅中' },
  { value: 'RETURNED', label: '已归还' },
  { value: 'OVERDUE', label: '已逾期' },
]

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

interface BorrowForm {
  bookId: string
  readerId: string
  days: number
}

const emptyForm: BorrowForm = { bookId: '', readerId: '', days: 30 }

export default function BorrowsView() {
  const queryClient = useQueryClient()
  const { showToast, confirmFn } = useUIStore()
  const [status, setStatus] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<BorrowForm>(emptyForm)

  const { data: list = [], isLoading, refetch } = useQuery<Borrow[]>({
    queryKey: ['borrows', 'admin', status],
    queryFn: async () => {
      const res = await BorrowAPI.list(status || undefined, undefined)
      if (res.ok) return res.data ?? []
      showToast(res.message || '加载失败', 'error')
      return []
    },
  })

  const borrowMutation = useMutation({
    mutationFn: (data: Partial<Borrow> & { dueDays?: number }) => BorrowAPI.borrow(data),
    onSuccess: (res) => {
      if (res.ok) {
        showToast('借书成功', 'success')
        queryClient.invalidateQueries({ queryKey: ['borrows', 'admin'] })
        setDialogOpen(false)
      } else {
        showToast(res.message || '借书失败', 'error')
      }
    },
  })

  const returnMutation = useMutation({
    mutationFn: (id: number) => BorrowAPI.returnBook(id),
    onSuccess: (res) => {
      if (res.ok) {
        showToast('还书成功', 'success')
        queryClient.invalidateQueries({ queryKey: ['borrows', 'admin'] })
      } else {
        showToast(res.message || '还书失败', 'error')
      }
    },
  })

  const set = <K extends keyof BorrowForm>(k: K, v: BorrowForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  const openAdd = () => {
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const doBorrow = () => {
    if (!form.bookId || !form.readerId) {
      showToast('请填写图书 ID 和读者 ID', 'error')
      return
    }
    borrowMutation.mutate({
      bookId: Number(form.bookId),
      readerId: Number(form.readerId),
      dueDays: Number(form.days) || 30,
    })
  }

  const doReturn = async (row: Borrow) => {
    const ok = await confirmFn('还书确认', `确认归还《${row.bookName || ''}》吗？`)
    if (!ok) return
    returnMutation.mutate(row.id)
  }

  return (
    <div>
      <div className="view-header">
        <div>
          <h1 className="view-title">借阅管理<span style={{ color: 'var(--terracotta)' }}>.</span></h1>
          <div className="view-subtitle">Borrows · 流通记录与归还</div>
        </div>
        <button className="lib-btn primary" onClick={openAdd}>新增借书</button>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label className="lib-label">状态</label>
          <select
            className="filter-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <button className="lib-btn" onClick={() => refetch()}>刷新</button>
      </div>

      <div className="stat-pills">
        <button className={`stat-pill ${status === '' ? 'active' : ''}`} onClick={() => setStatus('')}>
          全部 <span className="stat-pill-num">{list.length}</span>
        </button>
        <button className={`stat-pill ${status === 'BORROWED' ? 'active' : ''}`} onClick={() => setStatus('BORROWED')}>
          借阅中 <span className="stat-pill-num">{list.filter((b) => b.status === 'BORROWED').length}</span>
        </button>
        <button className={`stat-pill ${status === 'RETURNED' ? 'active' : ''}`} onClick={() => setStatus('RETURNED')}>
          已归还 <span className="stat-pill-num">{list.filter((b) => b.status === 'RETURNED').length}</span>
        </button>
        <button className={`stat-pill ${status === 'OVERDUE' ? 'active' : ''}`} onClick={() => setStatus('OVERDUE')}>
          已逾期 <span className="stat-pill-num">{list.filter((b) => b.status === 'OVERDUE').length}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="loading-block">加载中...</div>
      ) : list.length === 0 ? (
        <div className="empty-block">暂无数据</div>
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
                  <span className="meta-label">读者</span>
                  <span className="meta-value">{b.readerName || '-'}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">借出日期</span>
                  <span className="meta-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                    {fmtDate(b.borrowDate)}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">应还日期</span>
                  <span className="meta-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                    {fmtDate(b.dueDate)}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">归还日期</span>
                  <span className="meta-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                    {fmtDate(b.returnDate)}
                  </span>
                </div>
                {b.fine ? (
                  <div className="meta-row">
                    <span className="meta-label">罚款</span>
                    <span className="meta-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                      ¥{b.fine}
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="record-card-foot">
                <span className="record-card-id">#{b.id}</span>
                <div className="table-actions">
                  {b.status === 'BORROWED' || b.status === 'OVERDUE' ? (
                    <button
                      className="mini-btn green"
                      disabled={returnMutation.isPending}
                      onClick={() => doReturn(b)}
                    >
                      还书
                    </button>
                  ) : (
                    <span style={{ opacity: 0.5, fontSize: '12px' }}>已归还</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {dialogOpen && (
        <div className="dialog-mask" onClick={() => setDialogOpen(false)}>
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-title">新增借书</div>
              <button className="dialog-close" onClick={() => setDialogOpen(false)}>×</button>
            </div>
            <div className="dialog-body">
              <div>
                <label className="lib-label">图书 ID *</label>
                <input className="lib-input" type="number" value={form.bookId}
                  onChange={(e) => set('bookId', e.target.value)} placeholder="输入图书 ID" />
              </div>
              <div>
                <label className="lib-label">读者 ID *</label>
                <input className="lib-input" type="number" value={form.readerId}
                  onChange={(e) => set('readerId', e.target.value)} placeholder="输入读者 ID" />
              </div>
              <div>
                <label className="lib-label">借期(天)</label>
                <input className="lib-input" type="number" value={form.days}
                  onChange={(e) => set('days', Number(e.target.value))} />
              </div>
            </div>
            <div className="dialog-foot">
              <button className="lib-btn" onClick={() => setDialogOpen(false)}>取消</button>
              <button className="lib-btn primary" disabled={borrowMutation.isPending} onClick={doBorrow}>
                {borrowMutation.isPending ? '处理中...' : '确认借出'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
