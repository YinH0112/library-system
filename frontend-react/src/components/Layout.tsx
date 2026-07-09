/**
 * 主应用布局 · Atelier 风格
 * - 顶部 TopNav(品牌 + 菜单 + 用户 + 登出)
 * - 主区域 Outlet 渲染子路由
 * - 监听 401 全局事件
 */
import { useEffect } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import TopNav from './TopNav'

export default function Layout() {
  const navigate = useNavigate()
  const clearUser = useAuthStore((s) => s.clearUser)
  const showToast = useUIStore((s) => s.showToast)

  // 监听 401 全局事件
  useEffect(() => {
    const handler = () => {
      clearUser()
      showToast('会话已过期,请重新登录', 'error')
      navigate('/login', { replace: true })
    }
    window.addEventListener('auth-expired', handler)
    return () => window.removeEventListener('auth-expired', handler)
  }, [clearUser, navigate, showToast])

  return (
    <div className="app-layout">
      <TopNav />
      <main className="app-main">
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
