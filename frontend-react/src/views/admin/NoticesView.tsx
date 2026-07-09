/**
 * 公告管理
 * - useQuery 获取公告列表(按类型筛选)
 * - useMutation 新增/更新 / 置顶切换 / 删除
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '@/store/uiStore'
import { NoticeAPI } from '@/api'
import type { Notice, NoticeType } from '@/types'

const fmtDate = (d?: string) => (d ? String(d).replace('T', ' ').slice(0, 16) : '-')

const TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: '全部' },
  { value: 'NOTICE', label: '通知' },
  { value: 'ANNOUNCEMENT', label: '公告' },
  { value: 'MAINTENANCE', label: '维护' },
]

const typeText = (t: NoticeType | string) => {
  const map: Record<string, string> = { NOTICE: '通知', ANNOUNCEMENT: '公告', MAINTENANCE: '维护' }
  return map[t] || t || '-'
}
const typeBadge = (t: NoticeType | string) => {
  const map: Record<string, string> = {
    NOTICE: 'badge-notice',
    ANNOUNCEMENT: 'badge-announcement',
    MAINTENANCE: 'badge-maintenance',
  }
  return map[t] || 'badge-pending'
}
const statusText = (s?: string) => {
  const map: Record<string, string> = { DRAFT: '草稿', PUBLISHED: '已发布', ARCHIVED: '已归档' }
  return map[s || ''] || s || '-'
}
const statusBadge = (s?: string) => {
  const map: Record<string, string> = { DRAFT: 'badge-pending', PUBLISHED: 'badge-active', ARCHIVED: 'badge-disabled' }
  return map[s || ''] || 'badge-pending'
}

interface NoticeForm {
  title: string
  content: string
  type: NoticeType
  status: string
  pinned: boolean
}

const emptyForm: NoticeForm = {
  title: '',
  content: '',
  type: 'NOTICE',
  status: 'DRAFT',
  pinned: false,
}

export default function NoticesView() {
  const queryClient = useQueryClient()
  const { showToast, confirmFn } = useUIStore()
  const [type, setType] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Notice | null>(null)
  const [form, setForm] = useState<NoticeForm>(emptyForm)

  const { data: list = [], isLoading, refetch } = useQuery<Notice[]>({
    queryKey: ['notices', 'admin', type],
    queryFn: async () => {
      const res = await NoticeAPI.list(type || undefined)
      if (res.ok) return res.data ?? []
      showToast(res.message || '加载失败', 'error')
      return []
    },
  })

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Notice>) =>
      editing ? NoticeAPI.update(data) : NoticeAPI.add(data),
    onSuccess: (res) => {
      if (res.ok) {
        showToast(editing ? '更新成功' : '新增成功', 'success')
        queryClient.invalidateQueries({ queryKey: ['notices', 'admin'] })
        setDialogOpen(false)
      } else {
        showToast(res.message || '保存失败', 'error')
      }
    },
  })

  const togglePinnedMutation = useMutation({
    mutationFn: (vars: { id: number; pinned: boolean }) =>
      NoticeAPI.togglePinned(vars.id, vars.pinned),
    onSuccess: (res, vars) => {
      if (res.ok) {
        showToast(vars.pinned ? '已置顶' : '已取消置顶', 'success')
        queryClient.invalidateQueries({ queryKey: ['notices', 'admin'] })
      } else {
        showToast(res.message || '操作失败', 'error')
      }
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => NoticeAPI.remove(id),
    onSuccess: (res) => {
      if (res.ok) {
        showToast('删除成功', 'success')
        queryClient.invalidateQueries({ queryKey: ['notices', 'admin'] })
      } else {
        showToast(res.message || '删除失败', 'error')
      }
    },
  })

  const set = <K extends keyof NoticeForm>(k: K, v: NoticeForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (row: Notice) => {
    setEditing(row)
    setForm({
      title: row.title || '',
      content: row.content || '',
      type: (row.type || 'NOTICE') as NoticeType,
      status: row.status || 'DRAFT',
      pinned: !!row.pinned,
    })
    setDialogOpen(true)
  }

  const save = () => {
    if (!form.title || !form.content) {
      showToast('标题和内容必填', 'error')
      return
    }
    const payload: Partial<Notice> = { ...form, id: editing?.id }
    saveMutation.mutate(payload)
  }

  const togglePinned = async (row: Notice) => {
    const next = !row.pinned
    const ok = await confirmFn(
      next ? '置顶确认' : '取消置顶',
      next ? `确定置顶「${row.title}」？` : `确定取消置顶「${row.title}」？`
    )
    if (!ok) return
    togglePinnedMutation.mutate({ id: row.id, pinned: next })
  }

  const remove = async (row: Notice) => {
    const ok = await confirmFn('删除确认', `确定删除公告「${row.title}」吗？`)
    if (!ok) return
    removeMutation.mutate(row.id)
  }

  return (
    <div>
      <div className="view-header">
        <div>
          <h1 className="view-title">公告管理<span style={{ color: 'var(--terracotta)' }}>.</span></h1>
          <div className="view-subtitle">Notices · 通知与公告发布</div>
        </div>
        <button className="lib-btn primary" onClick={openAdd}>新增公告</button>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label className="lib-label">类型</label>
          <select className="filter-select" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <button className="lib-btn" onClick={() => refetch()}>刷新</button>
      </div>

      {isLoading ? (
        <div className="loading-block">加载中...</div>
      ) : list.length === 0 ? (
        <div className="empty-block">暂无数据</div>
      ) : (
        <div className="record-grid">
          {list.map((n) => (
            <div className="record-card" key={n.id}>
              <div className="record-card-head">
                <div className="record-card-title">
                  {n.pinned && (
                    <span style={{ color: 'var(--pink)', marginRight: '4px' }}>★</span>
                  )}
                  {n.title}
                </div>
                <span className={`badge ${typeBadge(n.type)}`}>{typeText(n.type)}</span>
              </div>
              <div className="record-card-meta">
                <div className="meta-row">
                  <span className="meta-label">发布日期</span>
                  <span className="meta-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                    {fmtDate(n.publishDate)}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">发布人</span>
                  <span className="meta-value">{n.publisherName || '-'}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">状态</span>
                  <span className="meta-value">
                    <span className={`badge ${statusBadge(n.status)}`}>{statusText(n.status)}</span>
                  </span>
                </div>
              </div>
              <div className="record-card-desc">{n.content || '暂无内容'}</div>
              <div className="record-card-foot">
                {n.pinned ? (
                  <span className="badge badge-active">★ 已置顶</span>
                ) : (
                  <span className="record-card-id">#{n.id}</span>
                )}
                <div className="table-actions">
                  <button
                    className={`mini-btn ${n.pinned ? 'danger' : 'green'}`}
                    disabled={togglePinnedMutation.isPending}
                    onClick={() => togglePinned(n)}
                  >
                    {n.pinned ? '取消置顶' : '置顶'}
                  </button>
                  <button className="mini-btn primary" onClick={() => openEdit(n)}>编辑</button>
                  <button className="mini-btn danger" onClick={() => remove(n)}>删除</button>
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
              <div className="dialog-title">{editing ? '编辑公告' : '新增公告'}</div>
              <button className="dialog-close" onClick={() => setDialogOpen(false)}>×</button>
            </div>
            <div className="dialog-body">
              <div>
                <label className="lib-label">标题 *</label>
                <input className="lib-input" value={form.title}
                  onChange={(e) => set('title', e.target.value)} />
              </div>
              <div>
                <label className="lib-label">内容 *</label>
                <textarea className="lib-input" rows={5} value={form.content}
                  onChange={(e) => set('content', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="lib-label">类型</label>
                  <select className="filter-select" value={form.type}
                    onChange={(e) => set('type', e.target.value as NoticeType)}>
                    <option value="NOTICE">通知</option>
                    <option value="ANNOUNCEMENT">公告</option>
                    <option value="MAINTENANCE">维护</option>
                  </select>
                </div>
                <div>
                  <label className="lib-label">状态</label>
                  <select className="filter-select" value={form.status}
                    onChange={(e) => set('status', e.target.value)}>
                    <option value="DRAFT">草稿</option>
                    <option value="PUBLISHED">已发布</option>
                    <option value="ARCHIVED">已归档</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="lib-label">
                  <input
                    type="checkbox"
                    checked={form.pinned}
                    onChange={(e) => set('pinned', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  设为置顶
                </label>
              </div>
            </div>
            <div className="dialog-foot">
              <button className="lib-btn" onClick={() => setDialogOpen(false)}>取消</button>
              <button className="lib-btn primary" disabled={saveMutation.isPending} onClick={save}>
                {saveMutation.isPending ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
