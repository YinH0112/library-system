/**
 * 读者管理 · 主从分栏布局
 * - 左侧:读者列表(搜索 + 可点击选中)
 * - 右侧:选中读者的详情面板
 * - useQuery 获取列表,useMutation 新增/更新/删除
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '@/store/uiStore'
import { ReaderAPI } from '@/api'
import type { Reader } from '@/types'

const fmtDate = (d?: string) => (d ? String(d).replace('T', ' ').slice(0, 16) : '-')

type ReaderRow = Reader & {
  studentId?: string
  status?: string
  registerDate?: string
  activeBorrowCount?: number
}

interface ReaderForm {
  name: string
  studentId: string
  phone: string
  email: string
  status: string
}

const emptyForm: ReaderForm = {
  name: '',
  studentId: '',
  phone: '',
  email: '',
  status: 'ACTIVE',
}

export default function ReadersView() {
  const queryClient = useQueryClient()
  const { showToast, confirmFn } = useUIStore()
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ReaderRow | null>(null)
  const [form, setForm] = useState<ReaderForm>(emptyForm)

  const { data: list = [], isLoading } = useQuery<ReaderRow[]>({
    queryKey: ['readers', appliedKeyword],
    queryFn: async () => {
      const res = await ReaderAPI.list(appliedKeyword || undefined)
      if (res.ok) return (res.data as unknown as ReaderRow[]) ?? []
      showToast(res.message || '加载失败', 'error')
      return []
    },
  })

  const selected = list.find((r) => r.id === selectedId) || null

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Reader>) =>
      editing ? ReaderAPI.update(data) : ReaderAPI.add(data),
    onSuccess: (res) => {
      if (res.ok) {
        showToast(editing ? '更新成功' : '新增成功', 'success')
        queryClient.invalidateQueries({ queryKey: ['readers'] })
        setDialogOpen(false)
      } else {
        showToast(res.message || '保存失败', 'error')
      }
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => ReaderAPI.remove(id),
    onSuccess: (res) => {
      if (res.ok) {
        showToast('删除成功', 'success')
        if (selectedId !== null && editing?.id === selectedId) setSelectedId(null)
        queryClient.invalidateQueries({ queryKey: ['readers'] })
      } else {
        showToast(res.message || '删除失败', 'error')
      }
    },
  })

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (row: ReaderRow) => {
    setEditing(row)
    setForm({
      name: row.name || '',
      studentId: row.studentId || '',
      phone: row.phone || '',
      email: row.email || '',
      status: row.status || 'ACTIVE',
    })
    setDialogOpen(true)
  }

  const set = <K extends keyof ReaderForm>(k: K, v: ReaderForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  const save = () => {
    if (!form.name || !form.studentId) {
      showToast('姓名和学号必填', 'error')
      return
    }
    const payload: Partial<Reader> & { studentId?: string; status?: string } = {
      ...form,
      id: editing?.id,
    }
    saveMutation.mutate(payload)
  }

  const remove = async (row: ReaderRow) => {
    const ok = await confirmFn('删除确认', `确定删除读者「${row.name}」吗？`)
    if (!ok) return
    removeMutation.mutate(row.id)
  }

  const onSearch = () => {
    setAppliedKeyword(keyword)
    setSelectedId(null)
  }

  const initial = (name: string) => (name || '?').charAt(0).toUpperCase()

  return (
    <div>
      <div className="view-header">
        <div>
          <h1 className="view-title">读者管理<span style={{ color: 'var(--terracotta)' }}>.</span></h1>
          <div className="view-subtitle">Readers · 读者档案与状态</div>
        </div>
        <button className="lib-btn primary" onClick={openAdd}>新增读者</button>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label className="lib-label">关键词</label>
          <input
            className="filter-input"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="姓名 / 学号 / 电话 / 邮箱"
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch()
            }}
          />
        </div>
        <button className="lib-btn primary" onClick={onSearch}>查询</button>
        <button className="lib-btn" onClick={() => { setKeyword(''); setAppliedKeyword(''); setSelectedId(null) }}>重置</button>
      </div>

      {isLoading ? (
        <div className="loading-block">加载中...</div>
      ) : list.length === 0 ? (
        <div className="empty-block">暂无数据</div>
      ) : (
        <div className="master-detail">
          {/* 左侧:读者列表 */}
          <div className="master-list">
            <div className="master-list-head">
              <span className="master-list-title">读者列表</span>
              <span className="master-list-count">{list.length} 人</span>
            </div>
            <div className="master-list-body">
              {list.map((r) => (
                <div
                  key={r.id}
                  className={`master-item ${selectedId === r.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(r.id)}
                >
                  <div className="master-item-avatar">{initial(r.name)}</div>
                  <div className="master-item-info">
                    <div className="master-item-name">{r.name}</div>
                    <div className="master-item-sub">
                      {r.studentId || '无学号'} · {r.phone || '无电话'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧:详情面板 */}
          <div className="detail-panel">
            {selected ? (
              <>
                <div className="detail-header">
                  <div className="detail-avatar">{initial(selected.name)}</div>
                  <div>
                    <div className="detail-name">{selected.name}</div>
                    <div className="detail-sub">
                      <span className={`badge ${selected.status === 'ACTIVE' ? 'badge-active' : 'badge-suspended'}`}>
                        {selected.status === 'ACTIVE' ? '正常' : '停用'}
                      </span>
                      <span className={`badge ${(selected.activeBorrowCount ?? 0) > 0 ? 'badge-borrowed' : 'badge-out'}`}>
                        在借 {selected.activeBorrowCount ?? 0}
                      </span>
                      <span className="record-card-id">#{selected.id}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-rows">
                  <div className="detail-row">
                    <span className="detail-row-label">学号</span>
                    <span className="detail-row-value mono">{selected.studentId || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row-label">电话</span>
                    <span className="detail-row-value mono">{selected.phone || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row-label">邮箱</span>
                    <span className="detail-row-value">{selected.email || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row-label">地址</span>
                    <span className="detail-row-value">{selected.address || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row-label">性别</span>
                    <span className="detail-row-value">{selected.gender || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row-label">注册日期</span>
                    <span className="detail-row-value mono">{fmtDate(selected.registerDate || selected.createTime)}</span>
                  </div>
                </div>

                <div className="detail-actions">
                  <button className="lib-btn primary" onClick={() => openEdit(selected)}>编辑</button>
                  <button className="lib-btn danger" onClick={() => remove(selected)}>删除</button>
                </div>
              </>
            ) : (
              <div className="detail-empty">
                <div className="detail-empty-icon">○</div>
                <div>从左侧选择一位读者查看详情</div>
              </div>
            )}
          </div>
        </div>
      )}

      {dialogOpen && (
        <div className="dialog-mask" onClick={() => setDialogOpen(false)}>
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-title">{editing ? '编辑读者' : '新增读者'}</div>
              <button className="dialog-close" onClick={() => setDialogOpen(false)}>×</button>
            </div>
            <div className="dialog-body">
              <div>
                <label className="lib-label">姓名 *</label>
                <input className="lib-input" value={form.name}
                  onChange={(e) => set('name', e.target.value)} />
              </div>
              <div>
                <label className="lib-label">学号 *</label>
                <input className="lib-input" value={form.studentId}
                  onChange={(e) => set('studentId', e.target.value)} />
              </div>
              <div>
                <label className="lib-label">电话</label>
                <input className="lib-input" value={form.phone}
                  onChange={(e) => set('phone', e.target.value)} />
              </div>
              <div>
                <label className="lib-label">邮箱</label>
                <input className="lib-input" type="email" value={form.email}
                  onChange={(e) => set('email', e.target.value)} />
              </div>
              <div>
                <label className="lib-label">状态</label>
                <select className="filter-select" value={form.status}
                  onChange={(e) => set('status', e.target.value)}>
                  <option value="ACTIVE">正常</option>
                  <option value="SUSPENDED">停用</option>
                </select>
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
