/**
 * 公告板
 * - useQuery 并行获取置顶公告 + 全部已发布公告
 * - 类型筛选,点击卡片查看详情
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useUIStore } from '@/store/uiStore'
import { NoticeAPI } from '@/api'
import type { Notice, NoticeType } from '@/types'

const fmtDate = (d?: string) => (d ? String(d).replace('T', ' ').slice(0, 16) : '-')

const typeBadge = (t: NoticeType) => {
  const map: Record<NoticeType, string> = {
    NOTICE: 'badge-pending',
    ANNOUNCEMENT: 'badge-approved',
    MAINTENANCE: 'badge-overdue',
  }
  return map[t] || 'badge-pending'
}
const typeText = (t: NoticeType) => {
  const map: Record<NoticeType, string> = {
    NOTICE: '通知',
    ANNOUNCEMENT: '公告',
    MAINTENANCE: '维护',
  }
  return map[t] || t || '-'
}

interface BoardData {
  pinned: Notice[]
  list: Notice[]
}

export default function NoticeBoardView() {
  const { showToast } = useUIStore()
  const [type, setType] = useState<string>('')
  const [selected, setSelected] = useState<Notice | null>(null)

  const { data, isLoading, refetch } = useQuery<BoardData>({
    queryKey: ['notice-board', type],
    queryFn: async () => {
      const [p, l] = await Promise.all([
        NoticeAPI.pinned(),
        NoticeAPI.published(type || undefined),
      ])
      if (!p.ok || !l.ok) showToast('部分数据加载失败', 'error')
      return {
        pinned: p.ok ? (p.data ?? []) : [],
        list: l.ok ? (l.data ?? []) : [],
      }
    },
  })

  const pinned = data?.pinned ?? []
  const list = data?.list ?? []

  return (
    <div>
      <div className="view-header">
        <div>
          <h1 className="view-title">
            公告板<span style={{ color: 'var(--terracotta)' }}>.</span>
          </h1>
          <div className="view-subtitle">Notice Board · 馆内通知与公告</div>
        </div>
        <button className="lib-btn primary" onClick={() => refetch()}>刷新</button>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label className="lib-label">类型筛选</label>
          <select className="filter-select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">全部</option>
            <option value="NOTICE">通知</option>
            <option value="ANNOUNCEMENT">公告</option>
            <option value="MAINTENANCE">维护</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-block">加载中...</div>
      ) : (
        <>
          {/* 置顶公告 */}
          {pinned.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '10px', color: 'var(--yellow)' }}>
                置顶公告
              </h2>
              <div className="record-grid">
                {pinned.map((n) => (
                  <div
                    key={n.id}
                    className="record-card"
                    onClick={() => setSelected(n)}
                    style={{
                      borderLeft: '4px solid var(--yellow)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow-lg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                  >
                    <div className="record-card-head">
                      <span className={`badge ${typeBadge(n.type)}`}>{typeText(n.type)}</span>
                      <span className="record-card-id">{fmtDate(n.publishDate)}</span>
                    </div>
                    <div className="record-card-title">{n.title}</div>
                    <div className="record-card-desc">{n.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 全部公告 */}
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '10px' }}>
            全部公告
          </h2>
          {list.length === 0 ? (
            <div className="empty-block">暂无公告</div>
          ) : (
            <div className="card-grid">
              {list.map((n) => (
                <div
                  key={n.id}
                  className="browse-card"
                  onClick={() => setSelected(n)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`badge ${typeBadge(n.type)}`}>{typeText(n.type)}</span>
                    <span style={{ fontSize: '11px', opacity: 0.6, fontFamily: 'var(--font-mono)' }}>
                      {fmtDate(n.publishDate)}
                    </span>
                  </div>
                  <div className="card-title">{n.title}</div>
                  <div className="card-desc">{n.content}</div>
                  <div className="card-foot">
                    <span style={{ fontSize: '12px', opacity: 0.6 }}>
                      发布人: {n.publisherName || '管理员'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--yellow)' }}>点击查看 →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 公告详情对话框 */}
      {selected && (
        <div className="dialog-mask" onClick={() => setSelected(null)}>
          <div className="dialog-box" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-title">{selected.title}</div>
              <button className="dialog-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="dialog-body">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: 'var(--border)' }}>
                <span className={`badge ${typeBadge(selected.type)}`}>{typeText(selected.type)}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', opacity: 0.6 }}>
                  {fmtDate(selected.publishDate)}
                </span>
                <span style={{ fontSize: '12px', opacity: 0.6 }}>
                  · 发布人: {selected.publisherName || '管理员'}
                </span>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-cn)', fontSize: '14px', lineHeight: 1.7 }}>
                {selected.content}
              </div>
            </div>
            <div className="dialog-foot">
              <button className="lib-btn primary" onClick={() => setSelected(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
