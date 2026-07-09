/** Toast 容器 · 从 uiStore 读取 toasts 渲染 */
import { useUIStore } from '@/store/uiStore'

export default function Toast() {
  const toasts = useUIStore((s) => s.toasts)
  const dismiss = useUIStore((s) => s.dismissToast)

  if (toasts.length === 0) return null

  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.type}`}
          onClick={() => dismiss(t.id)}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
