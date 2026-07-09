/**
 * 顶部导航栏 · 替代左侧 SidebarNav
 * - 品牌 + 菜单链接(横向)+ 用户区 + 登出按钮
 * - 按角色显示不同菜单
 */
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { AuthAPI } from '@/api'
import { useState } from 'react'
import type { Role } from '@/types'

interface MenuItem {
  path: string
  num: string
  label: string
}

const adminMenus: MenuItem[] = [
  { path: '/admin/dashboard', num: '01', label: '仪表盘' },
  { path: '/admin/books', num: '02', label: '图书' },
  { path: '/admin/categories', num: '03', label: '分类' },
  { path: '/admin/readers', num: '04', label: '读者' },
  { path: '/admin/borrows', num: '05', label: '借阅' },
  { path: '/admin/users', num: '06', label: '用户' },
  { path: '/admin/requests', num: '07', label: '审批' },
  { path: '/admin/notices', num: '08', label: '公告' },
  { path: '/admin/profile', num: '09', label: '我的' },
]

const readerMenus: MenuItem[] = [
  { path: '/reader/dashboard', num: '01', label: '概览' },
  { path: '/reader/books', num: '02', label: '浏览' },
  { path: '/reader/borrows', num: '03', label: '借阅' },
  { path: '/reader/requests', num: '04', label: '申请' },
  { path: '/reader/reviews', num: '05', label: '评价' },
  { path: '/reader/notices', num: '06', label: '公告' },
  { path: '/reader/profile', num: '07', label: '我的' },
]

const getMenus = (role: Role | undefined): MenuItem[] =>
  role === 'ADMIN' ? adminMenus : readerMenus

export default function TopNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const clearUser = useAuthStore((s) => s.clearUser)
  const { confirmFn, showToast } = useUIStore()
  const [loggingOut, setLoggingOut] = useState(false)

  const menus = getMenus(user?.role)
  const initial = (user?.username || '?').charAt(0).toUpperCase()

  const handleLogout = async () => {
    const ok = await confirmFn('登出', '确定要退出登录吗?')
    if (!ok) return
    setLoggingOut(true)
    try {
      await AuthAPI.logout()
    } finally {
      setLoggingOut(false)
      clearUser()
      showToast('已退出登录', 'success')
      navigate('/login', { replace: true })
    }
  }

  return (
    <nav className="top-nav">
      <div className="top-nav-inner">
        {/* 品牌 */}
        <div className="nav-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span className="nav-brand-mark">Bibliotheca</span>
          <span className="nav-brand-sub">Atelier</span>
        </div>

        {/* 导航链接 */}
        <div className="nav-links">
          {menus.map((m) => (
            <button
              key={m.path}
              className={`nav-link ${location.pathname === m.path ? 'active' : ''}`}
              onClick={() => navigate(m.path)}
            >
              <span className="nav-link-num">{m.num}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* 用户区 + 登出 */}
        <div className="nav-right">
          <div className="nav-user">
            <div className="nav-avatar">{initial}</div>
            <span className="nav-user-name">{user?.username}</span>
            <span className={`role-tag ${user?.role === 'ADMIN' ? 'admin' : 'reader'}`}>
              {user?.role === 'ADMIN' ? '管理员' : '借阅者'}
            </span>
          </div>
          <button className="logout-btn" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? '退出中...' : '登出'}
          </button>
        </div>
      </div>
    </nav>
  )
}
