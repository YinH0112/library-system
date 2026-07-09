/**
 * 分类管理
 * - useQuery 获取分类列表
 * - useMutation 新增/更新,useMutation 删除
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '@/store/uiStore'
import { CategoryAPI } from '@/api'
import type { Category } from '@/types'

const emptyForm: CategoryForm = { name: '', description: '' }

interface CategoryForm {
  name: string
  description: string
}

export default function CategoriesView() {
  const queryClient = useQueryClient()
  const { showToast, confirmFn } = useUIStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm)

  const { data: list = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await CategoryAPI.list()
      if (res.ok) return res.data ?? []
      showToast(res.message || '加载失败', 'error')
      return []
    },
  })

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Category>) =>
      editing ? CategoryAPI.update(data) : CategoryAPI.add(data),
    onSuccess: (res) => {
      if (res.ok) {
        showToast(editing ? '更新成功' : '新增成功', 'success')
        queryClient.invalidateQueries({ queryKey: ['categories'] })
        setDialogOpen(false)
      } else {
        showToast(res.message || '保存失败', 'error')
      }
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => CategoryAPI.remove(id),
    onSuccess: (res) => {
      if (res.ok) {
        showToast('删除成功', 'success')
        queryClient.invalidateQueries({ queryKey: ['categories'] })
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

  const openEdit = (row: Category) => {
    setEditing(row)
    setForm({ name: row.name || '', description: row.description || '' })
    setDialogOpen(true)
  }

  const set = <K extends keyof CategoryForm>(k: K, v: CategoryForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  const save = () => {
    if (!form.name) {
      showToast('分类名称必填', 'error')
      return
    }
    const payload: Partial<Category> = { ...form, id: editing?.id }
    saveMutation.mutate(payload)
  }

  const remove = async (row: Category) => {
    const ok = await confirmFn('删除确认', `确定删除分类「${row.name}」吗？关联图书将失去分类归属。`)
    if (!ok) return
    removeMutation.mutate(row.id)
  }

  return (
    <div>
      <div className="view-header">
        <div>
          <h1 className="view-title">分类管理<span style={{ color: 'var(--terracotta)' }}>.</span></h1>
          <div className="view-subtitle">Categories · 图书分类体系</div>
        </div>
        <button className="lib-btn primary" onClick={openAdd}>新增分类</button>
      </div>

      {isLoading ? (
        <div className="loading-block">加载中...</div>
      ) : list.length === 0 ? (
        <div className="empty-block">暂无数据</div>
      ) : (
        <div className="record-grid">
          {list.map((c) => (
            <div className="category-card" key={c.id}>
              <div className="record-card-head">
                <div className="record-card-title">{c.name}</div>
                <span className={`badge ${(c.bookCount ?? 0) > 0 ? 'badge-available' : 'badge-out'}`}>
                  {c.bookCount ?? 0} 本
                </span>
              </div>
              <div className="record-card-meta">
                <div className="meta-row">
                  <span className="meta-label">描述</span>
                  <span className="meta-value record-card-desc">{c.description || '暂无描述'}</span>
                </div>
              </div>
              <div className="record-card-foot">
                <span className="record-card-id">#{c.id}</span>
                <div className="table-actions">
                  <button className="mini-btn primary" onClick={() => openEdit(c)}>编辑</button>
                  <button className="mini-btn danger" onClick={() => remove(c)}>删除</button>
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
              <div className="dialog-title">{editing ? '编辑分类' : '新增分类'}</div>
              <button className="dialog-close" onClick={() => setDialogOpen(false)}>×</button>
            </div>
            <div className="dialog-body">
              <div>
                <label className="lib-label">名称 *</label>
                <input className="lib-input" value={form.name}
                  onChange={(e) => set('name', e.target.value)} />
              </div>
              <div>
                <label className="lib-label">描述</label>
                <textarea className="lib-input" rows={3} value={form.description}
                  onChange={(e) => set('description', e.target.value)} />
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
