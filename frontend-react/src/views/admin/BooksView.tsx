/**
 * 图书管理
 * - useQuery 分页获取图书(queryKey 含页码与已应用筛选)
 * - useQuery 获取分类列表(下拉选项)
 * - useMutation 新增/更新,useMutation 删除
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '@/store/uiStore'
import { BookAPI, CategoryAPI } from '@/api'
import type { Book, BookQuery, Category, Page } from '@/types'

/** 分页查询参数(BookQuery 缺 publisher,本地扩展) */
type BookListQuery = BookQuery & { publisher?: string }

/** 图书行(Book 实体含 price/publishDate,但 TS Book 类型缺失,本地扩展) */
type BookRow = Book & { price?: number | string; publishDate?: string }

interface BookFilters {
  name: string
  author: string
  publisher: string
  categoryId: string
}

interface BookForm {
  name: string
  author: string
  publisher: string
  isbn: string
  categoryId: string
  price: string
  stock: string
  publishDate: string
  description: string
}

const emptyFilters: BookFilters = { name: '', author: '', publisher: '', categoryId: '' }

const emptyForm: BookForm = {
  name: '',
  author: '',
  publisher: '',
  isbn: '',
  categoryId: '',
  price: '',
  stock: '',
  publishDate: '',
  description: '',
}

export default function BooksView() {
  const queryClient = useQueryClient()
  const { showToast, confirmFn } = useUIStore()
  const [page, setPage] = useState(1)
  const [size] = useState(10)
  const [filters, setFilters] = useState<BookFilters>(emptyFilters)
  const [applied, setApplied] = useState<BookFilters>(emptyFilters)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<BookRow | null>(null)
  const [form, setForm] = useState<BookForm>(emptyForm)

  const { data: pageData, isLoading } = useQuery<Page<BookRow>>({
    queryKey: ['books', 'page', page, size, applied],
    queryFn: async () => {
      const params: BookListQuery = {
        page,
        size,
        name: applied.name || undefined,
        author: applied.author || undefined,
        publisher: applied.publisher || undefined,
        categoryId: applied.categoryId || undefined,
      }
      const res = await BookAPI.page(params)
      if (res.ok && res.data) return res.data as Page<BookRow>
      showToast(res.message || '加载失败', 'error')
      return { records: [], total: 0, page, size, pages: 0 }
    },
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await CategoryAPI.list()
      return res.ok ? (res.data ?? []) : []
    },
  })

  const list = pageData?.records ?? []
  const total = pageData?.total ?? 0

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Book>) =>
      editing ? BookAPI.update(data) : BookAPI.add(data),
    onSuccess: (res) => {
      if (res.ok) {
        showToast(editing ? '更新成功' : '新增成功', 'success')
        queryClient.invalidateQueries({ queryKey: ['books', 'page'] })
        setDialogOpen(false)
      } else {
        showToast(res.message || '保存失败', 'error')
      }
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => BookAPI.remove(id),
    onSuccess: (res) => {
      if (res.ok) {
        showToast('删除成功', 'success')
        queryClient.invalidateQueries({ queryKey: ['books', 'page'] })
      } else {
        showToast(res.message || '删除失败', 'error')
      }
    },
  })

  const onFilter = () => {
    setPage(1)
    setApplied(filters)
  }

  const resetFilter = () => {
    setFilters(emptyFilters)
    setApplied(emptyFilters)
    setPage(1)
  }

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (row: BookRow) => {
    setEditing(row)
    setForm({
      name: row.name || '',
      author: row.author || '',
      publisher: row.publisher || '',
      isbn: row.isbn || '',
      categoryId: row.categoryId ? String(row.categoryId) : '',
      price: row.price != null ? String(row.price) : '',
      stock: row.stock != null ? String(row.stock) : '',
      publishDate: row.publishDate ? String(row.publishDate).slice(0, 10) : '',
      description: row.description || '',
    })
    setDialogOpen(true)
  }

  const set = <K extends keyof BookForm>(k: K, v: BookForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  const save = () => {
    if (!form.name || !form.author) {
      showToast('书名和作者必填', 'error')
      return
    }
    const payload: Partial<Book> & {
      price?: number
      publishDate?: string
    } = {
      ...form,
      id: editing?.id,
      categoryId: form.categoryId ? Number(form.categoryId) : undefined,
      price: form.price === '' ? undefined : Number(form.price),
      stock: form.stock === '' ? undefined : Number(form.stock),
      publishDate: form.publishDate || undefined,
    }
    saveMutation.mutate(payload)
  }

  const remove = async (row: BookRow) => {
    const ok = await confirmFn('删除确认', `确定删除《${row.name}》吗？`)
    if (!ok) return
    removeMutation.mutate(row.id)
  }

  const totalPages = Math.max(1, Math.ceil(total / size))
  const catName = (id?: number) => {
    const c = categories.find((x) => x.id === id)
    return c ? c.name : '-'
  }

  return (
    <div>
      <div className="view-header">
        <div>
          <h1 className="view-title">图书管理<span style={{ color: 'var(--terracotta)' }}>.</span></h1>
          <div className="view-subtitle">Books · 馆藏编目与库存</div>
        </div>
        <button className="lib-btn primary" onClick={openAdd}>新增图书</button>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label className="lib-label">书名</label>
          <input
            className="filter-input"
            value={filters.name}
            onChange={(e) => setFilters((p) => ({ ...p, name: e.target.value }))}
            placeholder="按书名搜索"
          />
        </div>
        <div className="filter-group">
          <label className="lib-label">作者</label>
          <input
            className="filter-input"
            value={filters.author}
            onChange={(e) => setFilters((p) => ({ ...p, author: e.target.value }))}
            placeholder="按作者搜索"
          />
        </div>
        <div className="filter-group">
          <label className="lib-label">出版社</label>
          <input
            className="filter-input"
            value={filters.publisher}
            onChange={(e) => setFilters((p) => ({ ...p, publisher: e.target.value }))}
            placeholder="按出版社搜索"
          />
        </div>
        <div className="filter-group">
          <label className="lib-label">分类</label>
          <select
            className="filter-select"
            value={filters.categoryId}
            onChange={(e) => setFilters((p) => ({ ...p, categoryId: e.target.value }))}
          >
            <option value="">全部分类</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button className="lib-btn primary" onClick={onFilter}>查询</button>
        <button className="lib-btn" onClick={resetFilter}>重置</button>
      </div>

      {isLoading ? (
        <div className="loading-block">加载中...</div>
      ) : list.length === 0 ? (
        <div className="empty-block">暂无数据</div>
      ) : (
        <>
          <div className="record-grid">
            {list.map((b) => (
              <div className="record-card" key={b.id}>
                <div className="record-card-head">
                  <div className="record-card-title">{b.name}</div>
                  <span
                    className={`badge ${
                      (b.stock ?? 0) <= 0
                        ? 'badge-out'
                        : (b.stock ?? 0) <= 3
                        ? 'badge-low'
                        : 'badge-available'
                    }`}
                  >
                    库存 {b.stock ?? 0}
                  </span>
                </div>
                <div className="record-card-meta">
                  <div className="meta-row">
                    <span className="meta-label">作者</span>
                    <span className="meta-value">{b.author || '-'}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">出版社</span>
                    <span className="meta-value">{b.publisher || '-'}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">ISBN</span>
                    <span className="meta-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                      {b.isbn || '-'}
                    </span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">分类</span>
                    <span className="meta-value">{catName(b.categoryId)}</span>
                  </div>
                </div>
                <div className="record-card-foot">
                  <span className="record-card-id">#{b.id}</span>
                  <div className="table-actions">
                    <button className="mini-btn primary" onClick={() => openEdit(b)}>编辑</button>
                    <button className="mini-btn danger" onClick={() => remove(b)}>删除</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button
              className="page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              上一页
            </button>
            <span className="page-info">
              第 {page} / {totalPages} 页 · 共 {total} 条
            </span>
            <button
              className="page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              下一页
            </button>
          </div>
        </>
      )}

      {dialogOpen && (
        <div className="dialog-mask" onClick={() => setDialogOpen(false)}>
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-title">{editing ? '编辑图书' : '新增图书'}</div>
              <button className="dialog-close" onClick={() => setDialogOpen(false)}>×</button>
            </div>
            <div className="dialog-body">
              <div>
                <label className="lib-label">书名 *</label>
                <input className="lib-input" value={form.name}
                  onChange={(e) => set('name', e.target.value)} />
              </div>
              <div>
                <label className="lib-label">作者 *</label>
                <input className="lib-input" value={form.author}
                  onChange={(e) => set('author', e.target.value)} />
              </div>
              <div>
                <label className="lib-label">出版社</label>
                <input className="lib-input" value={form.publisher}
                  onChange={(e) => set('publisher', e.target.value)} />
              </div>
              <div>
                <label className="lib-label">ISBN</label>
                <input className="lib-input" value={form.isbn}
                  onChange={(e) => set('isbn', e.target.value)} />
              </div>
              <div>
                <label className="lib-label">分类</label>
                <select className="filter-select" value={form.categoryId}
                  onChange={(e) => set('categoryId', e.target.value)}>
                  <option value="">请选择分类</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="lib-label">总价(元)</label>
                  <input className="lib-input" type="number" value={form.price}
                    onChange={(e) => set('price', e.target.value)} />
                </div>
                <div>
                  <label className="lib-label">库存</label>
                  <input className="lib-input" type="number" value={form.stock}
                    onChange={(e) => set('stock', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="lib-label">出版日期</label>
                <input className="lib-input" type="date" value={form.publishDate}
                  onChange={(e) => set('publishDate', e.target.value)} />
              </div>
              <div>
                <label className="lib-label">简介</label>
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
