/**
 * 路由配置 · React Router v7
 * - /login         登录页
 * - /admin/*       管理员路由(RequireAdmin 守卫)
 * - /reader/*      借阅者路由(RequireReader 守卫)
 * - /              根据角色重定向
 */
import { createBrowserRouter, Navigate, Outlet, type RouteObject } from 'react-router-dom'
import Layout from './components/Layout'
import LoginView from './views/LoginView'
import ProfileView from './views/ProfileView'
import { useAuthStore } from './store/authStore'

// 管理员视图
import DashboardView from './views/admin/DashboardView'
import BooksView from './views/admin/BooksView'
import CategoriesView from './views/admin/CategoriesView'
import ReadersView from './views/admin/ReadersView'
import BorrowsView from './views/admin/BorrowsView'
import UsersView from './views/admin/UsersView'
import RequestApprovalView from './views/admin/RequestApprovalView'
import NoticesView from './views/admin/NoticesView'

// 借阅者视图
import ReaderDashboardView from './views/reader/ReaderDashboardView'
import ReaderBooksView from './views/reader/ReaderBooksView'
import MyBorrowsView from './views/reader/MyBorrowsView'
import MyRequestsView from './views/reader/MyRequestsView'
import MyReviewsView from './views/reader/MyReviewsView'
import NoticeBoardView from './views/reader/NoticeBoardView'

/** 管理员守卫:未登录去 /login,角色不符去对应首页 */
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/reader/dashboard" replace />
  return <>{children}</>
}

/** 借阅者守卫:未登录去 /login,角色不符去对应首页 */
function RequireReader({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'READER') return <Navigate to="/admin/dashboard" replace />
  return <>{children}</>
}

/** 根路径:按角色重定向 */
function RootRedirect() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return user.role === 'ADMIN'
    ? <Navigate to="/admin/dashboard" replace />
    : <Navigate to="/reader/dashboard" replace />
}

const routes: RouteObject[] = [
  { path: '/login', element: <LoginView /> },
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <RootRedirect /> },
      // 管理员路由
      {
        path: 'admin',
        element: <RequireAdmin><Outlet /></RequireAdmin>,
        children: [
          { path: 'dashboard', element: <DashboardView /> },
          { path: 'books', element: <BooksView /> },
          { path: 'categories', element: <CategoriesView /> },
          { path: 'readers', element: <ReadersView /> },
          { path: 'borrows', element: <BorrowsView /> },
          { path: 'users', element: <UsersView /> },
          { path: 'requests', element: <RequestApprovalView /> },
          { path: 'notices', element: <NoticesView /> },
          { path: 'profile', element: <ProfileView /> },
        ],
      },
      // 借阅者路由
      {
        path: 'reader',
        element: <RequireReader><Outlet /></RequireReader>,
        children: [
          { path: 'dashboard', element: <ReaderDashboardView /> },
          { path: 'books', element: <ReaderBooksView /> },
          { path: 'borrows', element: <MyBorrowsView /> },
          { path: 'requests', element: <MyRequestsView /> },
          { path: 'reviews', element: <MyReviewsView /> },
          { path: 'notices', element: <NoticeBoardView /> },
          { path: 'profile', element: <ProfileView /> },
        ],
      },
      // 未知路径 → 回首页
      { path: '*', element: <RootRedirect /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
