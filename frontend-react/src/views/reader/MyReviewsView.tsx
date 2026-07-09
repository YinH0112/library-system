/**
 * 我的评价
 * - useQuery 获取我发表的评价列表
 * - useMutation 删除评价,成功后失效列表查询
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '@/store/uiStore'
import { ReviewAPI } from '@/api'
import type { Review } from '@/types'

const fmtDate = (d?: string) => (d ? String(d).replace('T', ' ').slice(0, 16) : '-')
const renderStars = (rating: number) => (
  <span className="stars">
    {[1, 2, 3, 4, 5].map((i) => (
      <span key={i} className={`star ${i > rating ? 'empty' : ''}`.trim()}>
        ★
      </span>
    ))}
  </span>
)

export default function MyReviewsView() {
  const queryClient = useQueryClient()
  const { showToast, confirmFn } = useUIStore()

  const { data: list = [], isLoading, refetch } = useQuery<Review[]>({
    queryKey: ['my-reviews'],
    queryFn: async () => {
      const res = await ReviewAPI.my()
      if (res.ok) return res.data ?? []
      showToast(res.message || '加载失败', 'error')
      return []
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => ReviewAPI.remove(id),
    onSuccess: async (res) => {
      if (res.ok) {
        showToast('已删除评价', 'success')
        await queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
      } else {
        showToast(res.message || '删除失败', 'error')
      }
    },
  })

  const remove = async (row: Review) => {
    const ok = await confirmFn('删除评价', `确定删除对《${row.bookName}》的评价吗?`)
    if (!ok) return
    removeMutation.mutate(row.id)
  }

  return (
    <div>
      <div className="view-header">
        <div>
          <h1 className="view-title">
            我的评价<span style={{ color: 'var(--terracotta)' }}>.</span>
          </h1>
          <div className="view-subtitle">My Reviews · 我发表过的图书评价</div>
        </div>
        <button className="lib-btn primary" onClick={() => refetch()}>刷新</button>
      </div>

      {isLoading ? (
        <div className="loading-block">加载中...</div>
      ) : list.length === 0 ? (
        <div className="empty-block">暂未发表评价,前往浏览馆藏分享你的看法</div>
      ) : (
        <div>
          {list.map((r) => (
            <div className="list-card" key={r.id}>
              <div className="list-card-head">
                <div className="list-card-title">{r.bookName || '-'}</div>
                {renderStars(r.rating || 0)}
              </div>
              <div className="list-card-body">{r.content || '-'}</div>
              <div className="list-card-foot">
                <span className="meta-row">
                  <span className="meta-label">发表时间</span>
                  <span className="meta-value mono">{fmtDate(r.createTime)}</span>
                </span>
                <button
                  className="mini-btn danger"
                  disabled={removeMutation.isPending}
                  onClick={() => remove(r)}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
