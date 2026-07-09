/**
 * 浏览馆藏
 * - 图书分页列表(useQuery,queryKey 含筛选+分页)
 * - 分类列表(独立 useQuery)
 * - 申请借阅对话框(useMutation)
 * - 评价对话框(查看用 useQuery 合并 bookReviews+summary+myByBook,提交用 useMutation)
 */
import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '@/store/uiStore'
import { BookAPI, CategoryAPI, BorrowRequestAPI, ReviewAPI } from '@/api'
import type { Book, BorrowRequest, Category, Review, ReviewSummary } from '@/types'

interface ApplyForm {
  bookId: number | null
  bookName: string
  dueDays: string
  readerRemark: string
}
interface ReviewForm {
  bookId: number | null
  bookName: string
  rating: string
  content: string
}
interface BookPageData {
  records: Book[]
  total: number
}
interface ReviewData {
  list: Review[]
  summary: ReviewSummary
  myReview: Review | null
}

const emptyApply: ApplyForm = { bookId: null, bookName: '', dueDays: '14', readerRemark: '' }
const emptyReview: ReviewForm = { bookId: null, bookName: '', rating: '5', content: '' }

const stars = (n?: number) =>
  '★★★★★'.slice(0, n || 0) + '☆☆☆☆☆'.slice(0, 5 - (n || 0))

export default function ReaderBooksView() {
  const queryClient = useQueryClient()
  const { showToast } = useUIStore()

  // 筛选:filters 为输入态,applied 为已生效的筛选(点击查询后才更新)
  const [filters, setFilters] = useState({ name: '', author: '', categoryId: '' })
  const [applied, setApplied] = useState({ name: '', author: '', categoryId: '' })
  const [page, setPage] = useState(1)
  const [size] = useState(12)

  const [applyDialog, setApplyDialog] = useState<Book | null>(null)
  const [applyForm, setApplyForm] = useState<ApplyForm>(emptyApply)
  const [reviewDialog, setReviewDialog] = useState<Book | null>(null)
  const [reviewForm, setReviewForm] = useState<ReviewForm>(emptyReview)

  /* ----- 图书分页列表 ----- */
  const { data: pageData, isLoading, refetch } = useQuery<BookPageData>({
    queryKey: ['books-page', applied, page, size],
    queryFn: async () => {
      const res = await BookAPI.page({
        page,
        size,
        name: applied.name || undefined,
        author: applied.author || undefined,
        categoryId: applied.categoryId || undefined,
      })
      if (res.ok && res.data) {
        return { records: res.data.records ?? [], total: res.data.total ?? 0 }
      }
      showToast(res.message || '加载失败', 'error')
      return { records: [], total: 0 }
    },
  })

  /* ----- 分类列表 ----- */
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await CategoryAPI.list()
      return res.ok ? (res.data ?? []) : []
    },
  })

  /* ----- 评价查看(对话框打开时启用) ----- */
  const { data: reviewData, isLoading: reviewLoading } = useQuery<ReviewData>({
    queryKey: ['book-reviews', reviewDialog?.id],
    enabled: !!reviewDialog,
    queryFn: async () => {
      if (!reviewDialog) return { list: [], summary: {} as ReviewSummary, myReview: null }
      const [list, sum, mine] = await Promise.all([
        ReviewAPI.bookReviews(reviewDialog.id),
        ReviewAPI.summary(reviewDialog.id),
        ReviewAPI.myByBook(reviewDialog.id),
      ])
      return {
        list: list.ok ? (list.data ?? []) : [],
        summary: sum.ok ? (sum.data ?? ({} as ReviewSummary)) : ({} as ReviewSummary),
        myReview: mine.ok ? mine.data : null,
      }
    },
  })

  // 评价数据到达后,同步表单(myReview 存在则预填)
  useEffect(() => {
    if (!reviewData) return
    const bookId = reviewDialog?.id ?? null
    const bookName = reviewDialog?.name ?? ''
    if (reviewData.myReview) {
      setReviewForm({
        bookId,
        bookName,
        rating: String(reviewData.myReview.rating || 5),
        content: reviewData.myReview.content || '',
      })
    } else {
      setReviewForm({ ...emptyReview, bookId, bookName })
    }
  }, [reviewData, reviewDialog])

  /* ----- 申请借阅 ----- */
  const applyMutation = useMutation({
    mutationFn: (data: Partial<BorrowRequest>) => BorrowRequestAPI.apply(data),
    onSuccess: async (res) => {
      if (res.ok) {
        showToast('申请已提交,等待管理员审批', 'success')
        setApplyDialog(null)
        await queryClient.invalidateQueries({ queryKey: ['my-requests'] })
      } else {
        showToast(res.message || '申请失败', 'error')
      }
    },
  })

  /* ----- 评价提交 ----- */
  const reviewMutation = useMutation({
    mutationFn: (data: Partial<Review>) => ReviewAPI.submit(data),
    onSuccess: async (res) => {
      if (res.ok) {
        showToast(myReview ? '评价已更新' : '评价已发表', 'success')
        await queryClient.invalidateQueries({ queryKey: ['book-reviews', reviewDialog?.id] })
        await queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
      } else {
        showToast(res.message || '提交失败', 'error')
      }
    },
  })

  const list = pageData?.records ?? []
  const total = pageData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / size))
  const myReview = reviewData?.myReview ?? null

  const onFilter = () => {
    setApplied(filters)
    setPage(1)
  }

  const resetFilter = () => {
    setFilters({ name: '', author: '', categoryId: '' })
    setApplied({ name: '', author: '', categoryId: '' })
    setPage(1)
  }

  const catName = (id?: number) => {
    if (!id) return '-'
    const c = categories.find((x) => x.id === id)
    return c ? c.name : '-'
  }

  const openApply = (book: Book) => {
    setApplyForm({ ...emptyApply, bookId: book.id, bookName: book.name })
    setApplyDialog(book)
  }

  const openReview = (book: Book) => {
    // 乐观重置表单;reviewData 到达后由 useEffect 覆盖(若已有评价则预填)
    setReviewForm({ ...emptyReview, bookId: book.id, bookName: book.name })
    setReviewDialog(book)
  }

  const submitApply = () => {
    const days = Number(applyForm.dueDays)
    if (!days || days < 1) {
      showToast('借阅天数需大于 0', 'error')
      return
    }
    applyMutation.mutate({
      bookId: applyForm.bookId ?? undefined,
      dueDays: days,
      readerRemark: applyForm.readerRemark || undefined,
    })
  }

  const submitReview = () => {
    if (!reviewForm.content || reviewForm.content.trim().length < 5) {
      showToast('评价内容至少 5 个字符', 'error')
      return
    }
    reviewMutation.mutate({
      bookId: reviewForm.bookId ?? undefined,
      rating: Number(reviewForm.rating),
      content: reviewForm.content,
    })
  }

  const stockBadge = (stock: number) => {
    if (stock <= 0) return <span className="badge badge-out">无库存</span>
    if (stock <= 3) return <span className="badge badge-low">仅剩 {stock}</span>
    return <span className="badge badge-available">在馆 {stock}</span>
  }

  return (
    <div>
      <div className="view-header">
        <div>
          <h1 className="view-title">
            浏览馆藏<span style={{ color: 'var(--terracotta)' }}>.</span>
          </h1>
          <div className="view-subtitle">Browse · 申请借阅与发表评价</div>
        </div>
        <button className="lib-btn primary" onClick={() => refetch()}>刷新</button>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label className="lib-label">书名</label>
          <input className="filter-input" value={filters.name}
            onChange={(e) => setFilters((p) => ({ ...p, name: e.target.value }))}
            placeholder="按书名搜索" />
        </div>
        <div className="filter-group">
          <label className="lib-label">作者</label>
          <input className="filter-input" value={filters.author}
            onChange={(e) => setFilters((p) => ({ ...p, author: e.target.value }))}
            placeholder="按作者搜索" />
        </div>
        <div className="filter-group">
          <label className="lib-label">分类</label>
          <select className="filter-select" value={filters.categoryId}
            onChange={(e) => setFilters((p) => ({ ...p, categoryId: e.target.value }))}>
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
        <div className="empty-block">暂无符合条件的图书</div>
      ) : (
        <>
          <div className="card-grid">
            {list.map((b) => (
              <div className="browse-card" key={b.id}>
                <div className="card-title">{b.name}</div>
                <div className="card-meta">
                  <span>{b.author || '佚名'}</span>
                  <span>·</span>
                  <span>{catName(b.categoryId)}</span>
                </div>
                {b.publisher && (
                  <div className="card-meta">
                    <span>{b.publisher}</span>
                    {b.isbn && <span>· {b.isbn}</span>}
                  </div>
                )}
                {b.description && <div className="card-desc">{b.description}</div>}
                <div className="card-foot">
                  {stockBadge(b.stock ?? 0)}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="mini-btn" onClick={() => openReview(b)}>评价</button>
                    <button
                      className="mini-btn primary"
                      disabled={(b.stock ?? 0) <= 0}
                      onClick={() => openApply(b)}
                    >
                      申请借阅
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button className="page-btn" disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}>
              上一页
            </button>
            <span className="page-info">
              第 {page} / {totalPages} 页 · 共 {total} 条
            </span>
            <button className="page-btn" disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              下一页
            </button>
          </div>
        </>
      )}

      {/* 申请借阅对话框 */}
      {applyDialog && (
        <div className="dialog-mask" onClick={() => setApplyDialog(null)}>
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-title">申请借阅</div>
              <button className="dialog-close" onClick={() => setApplyDialog(null)}>×</button>
            </div>
            <div className="dialog-body">
              <div>
                <label className="lib-label">图书</label>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px' }}>
                  《{applyForm.bookName}》
                </div>
              </div>
              <div>
                <label className="lib-label">借阅天数 *</label>
                <input className="lib-input" type="number" min={1} max={90}
                  value={applyForm.dueDays}
                  onChange={(e) => setApplyForm((p) => ({ ...p, dueDays: e.target.value }))} />
              </div>
              <div>
                <label className="lib-label">备注(选填)</label>
                <textarea className="lib-input" rows={3}
                  value={applyForm.readerRemark}
                  onChange={(e) => setApplyForm((p) => ({ ...p, readerRemark: e.target.value }))}
                  placeholder="给管理员的备注" />
              </div>
            </div>
            <div className="dialog-foot">
              <button className="lib-btn" onClick={() => setApplyDialog(null)}>取消</button>
              <button
                className="lib-btn primary"
                disabled={applyMutation.isPending}
                onClick={submitApply}
              >
                {applyMutation.isPending ? '提交中...' : '提交申请'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 评价对话框 */}
      {reviewDialog && (
        <div className="dialog-mask" onClick={() => setReviewDialog(null)}>
          <div className="dialog-box" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-title">《{reviewDialog.name}》· 评价</div>
              <button className="dialog-close" onClick={() => setReviewDialog(null)}>×</button>
            </div>
            <div className="dialog-body">
              {reviewLoading ? (
                <div className="loading-block">加载中...</div>
              ) : (
                <>
                  {/* 评分汇总 */}
                  <div style={{
                    background: 'rgba(184, 146, 74, 0.06)',
                    border: 'var(--border)',
                    padding: '12px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--yellow)' }}>
                        {reviewData?.summary.avgRating || 0}
                      </div>
                      <div style={{ color: 'var(--yellow)', fontSize: '16px', letterSpacing: '2px' }}>
                        {stars(Math.round(reviewData?.summary.avgRating || 0))}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
                        {reviewData?.summary.total || 0} 条评价
                      </div>
                    </div>
                    <div style={{ flex: 1, fontSize: '13px' }}>
                      {(reviewData?.summary.distribution || []).map((d) => (
                        <div key={d.rating} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', minWidth: '30px' }}>{d.rating}星</span>
                          <div style={{ flex: 1, height: '6px', background: 'rgba(43,37,32,0.08)' }}>
                            <div style={{
                              height: '100%',
                              width: `${(reviewData?.summary.total ? (d.count / reviewData.summary.total) * 100 : 0)}%`,
                              background: 'var(--yellow)',
                            }}></div>
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', minWidth: '24px', textAlign: 'right' }}>{d.count}</span>
                        </div>
                      ))}
                      {!(reviewData?.summary.distribution || []).length && (
                        <div style={{ opacity: 0.6 }}>暂无评分分布</div>
                      )}
                    </div>
                  </div>

                  {/* 评价列表 */}
                  <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '12px', borderTop: '1px solid rgba(43,37,32,0.08)', paddingTop: '8px' }}>
                    {(reviewData?.list ?? []).length === 0 ? (
                      <div className="empty-block">暂无评价,快来发表第一条吧</div>
                    ) : (
                      (reviewData?.list ?? []).map((r) => (
                        <div key={r.id} style={{ padding: '6px 0', borderBottom: '1px dashed rgba(43,37,32,0.08)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '13px' }}>{r.readerName || '匿名读者'}</span>
                            <span style={{ color: 'var(--yellow)', fontSize: '13px' }}>{stars(r.rating)}</span>
                          </div>
                          <div style={{ fontSize: '13px', opacity: 0.75, marginTop: '2px' }}>{r.content}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* 我的评价表单 */}
                  <div style={{ borderTop: 'var(--border)', paddingTop: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                      {myReview ? '更新我的评价' : '发表我的评价'}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <label className="lib-label">评分</label>
                      <select className="filter-select" value={reviewForm.rating}
                        onChange={(e) => setReviewForm((p) => ({ ...p, rating: e.target.value }))}>
                        <option value={5}>★★★★★ 5星</option>
                        <option value={4}>★★★★☆ 4星</option>
                        <option value={3}>★★★☆☆ 3星</option>
                        <option value={2}>★★☆☆☆ 2星</option>
                        <option value={1}>★☆☆☆☆ 1星</option>
                      </select>
                    </div>
                    <div>
                      <label className="lib-label">评价内容(至少 5 字)</label>
                      <textarea className="lib-input" rows={3}
                        value={reviewForm.content}
                        onChange={(e) => setReviewForm((p) => ({ ...p, content: e.target.value }))}
                        placeholder="分享你对这本书的看法..." />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="dialog-foot">
              <button className="lib-btn" onClick={() => setReviewDialog(null)}>关闭</button>
              <button
                className="lib-btn primary"
                disabled={reviewMutation.isPending || reviewLoading}
                onClick={submitReview}
              >
                {reviewMutation.isPending ? '提交中...' : myReview ? '更新评价' : '发表评价'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
