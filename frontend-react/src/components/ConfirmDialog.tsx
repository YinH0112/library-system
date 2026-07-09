/** 确认对话框 · 从 uiStore 读取 confirmState 渲染 */
import { useUIStore } from '@/store/uiStore'

export default function ConfirmDialog() {
  const state = useUIStore((s) => s.confirmState)
  const resolve = useUIStore((s) => s.resolveConfirm)

  if (!state.open) return null

  return (
    <div className="confirm-overlay" onClick={() => resolve(false)}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-title">{state.title}</div>
        <div className="confirm-msg">{state.message}</div>
        <div className="confirm-actions">
          <button className="lib-btn" onClick={() => resolve(false)}>取消</button>
          <button className="lib-btn danger" onClick={() => resolve(true)}>确定</button>
        </div>
      </div>
    </div>
  )
}
