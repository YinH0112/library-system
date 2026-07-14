import { createRouter, createWebHistory } from 'vue-router'
import { authStore } from './store/auth.js'

import LoginView from './views/LoginView.vue'
import MainLayout from './layouts/MainLayout.vue'

import DashboardView from './views/DashboardView.vue'
import BooksView from './views/BooksView.vue'
import CategoriesView from './views/CategoriesView.vue'
import ReadersView from './views/ReadersView.vue'
import BorrowsView from './views/BorrowsView.vue'
import UsersView from './views/UsersView.vue'
import ProfileView from './views/ProfileView.vue'
import RequestApprovalView from './views/RequestApprovalView.vue'
import NoticesView from './views/NoticesView.vue'

import ReaderDashboardView from './views/ReaderDashboardView.vue'
import ReaderBooksView from './views/ReaderBooksView.vue'
import MyBorrowsView from './views/MyBorrowsView.vue'
import MyRequestsView from './views/MyRequestsView.vue'
import MyReviewsView from './views/MyReviewsView.vue'
import NoticeBoardView from './views/NoticeBoardView.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginView, meta: { guest: true } },
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', redirect: () => authStore.isAdmin() ? '/admin/dashboard' : '/reader/dashboard' },
      { path: 'admin/dashboard', component: DashboardView, meta: { role: 'ADMIN' } },
      { path: 'admin/books', component: BooksView, meta: { role: 'ADMIN' } },
      { path: 'admin/categories', component: CategoriesView, meta: { role: 'ADMIN' } },
      { path: 'admin/readers', component: ReadersView, meta: { role: 'ADMIN' } },
      { path: 'admin/borrows', component: BorrowsView, meta: { role: 'ADMIN' } },
      { path: 'admin/requests', component: RequestApprovalView, meta: { role: 'ADMIN' } },
      { path: 'admin/notices', component: NoticesView, meta: { role: 'ADMIN' } },
      { path: 'admin/users', component: UsersView, meta: { role: 'ADMIN' } },
      { path: 'admin/profile', component: ProfileView, meta: { role: 'ADMIN' } },
      { path: 'reader/dashboard', component: ReaderDashboardView, meta: { role: 'READER' } },
      { path: 'reader/books', component: ReaderBooksView, meta: { role: 'READER' } },
      { path: 'reader/borrows', component: MyBorrowsView, meta: { role: 'READER' } },
      { path: 'reader/requests', component: MyRequestsView, meta: { role: 'READER' } },
      { path: 'reader/reviews', component: MyReviewsView, meta: { role: 'READER' } },
      { path: 'reader/notices', component: NoticeBoardView, meta: { role: 'READER' } },
      { path: 'reader/profile', component: ProfileView, meta: { role: 'READER' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  // 页面刷新时等待 auth 初始化完成，避免误跳登录页
  if (!authStore.state.initialized) {
    await authStore.initialize()
  }
  if (to.meta.guest) return true
  if (!authStore.isLoggedIn()) return { name: 'login' }
  if (to.meta.role && authStore.state.user.role !== to.meta.role) {
    return authStore.isAdmin() ? '/admin/dashboard' : '/reader/dashboard'
  }
  return true
})
