<script setup>
import { ref, shallowRef, onMounted, onUnmounted, provide } from 'vue'
import { authStore } from './store/auth.js'
import SidebarNav from './components/SidebarNav.vue'
import Toast from './components/Toast.vue'
import Avatar from './components/Avatar.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import LoginView from './views/LoginView.vue'
// 管理员视图
import DashboardView from './views/DashboardView.vue'
import BooksView from './views/BooksView.vue'
import CategoriesView from './views/CategoriesView.vue'
import ReadersView from './views/ReadersView.vue'
import BorrowsView from './views/BorrowsView.vue'
import UsersView from './views/UsersView.vue'
import ProfileView from './views/ProfileView.vue'
import RequestApprovalView from './views/RequestApprovalView.vue'
import NoticesView from './views/NoticesView.vue'
// 借阅者视图
import ReaderDashboardView from './views/ReaderDashboardView.vue'
import ReaderBooksView from './views/ReaderBooksView.vue'
import MyBorrowsView from './views/MyBorrowsView.vue'
import MyRequestsView from './views/MyRequestsView.vue'
import MyReviewsView from './views/MyReviewsView.vue'
import NoticeBoardView from './views/NoticeBoardView.vue'

const currentView = ref('dashboard')
const toastRef = ref(null)
const confirmRef = ref(null)
const currentViewComponent = shallowRef(DashboardView)

const adminViewMap = {
  dashboard: DashboardView,
  books: BooksView,
  categories: CategoriesView,
  readers: ReadersView,
  borrows: BorrowsView,
  requests: RequestApprovalView,
  notices: NoticesView,
  users: UsersView,
  profile: ProfileView
}

const readerViewMap = {
  'reader-dashboard': ReaderDashboardView,
  'notice-board': NoticeBoardView,
  'reader-books': ReaderBooksView,
  'my-requests': MyRequestsView,
  'my-borrows': MyBorrowsView,
  'my-reviews': MyReviewsView,
  profile: ProfileView
}

function navigate(key) {
  currentView.value = key
  const map = authStore.isAdmin() ? adminViewMap : readerViewMap
  currentViewComponent.value = map[key] || (authStore.isAdmin() ? DashboardView : ReaderDashboardView)
}

function showToast(type, message) {
  toastRef.value && toastRef.value.show(type, message)
}

async function handleConfirm(title, message) {
  if (!confirmRef.value) return false
  return await confirmRef.value.open(title, message)
}

// 全局 confirm 函数,通过 provide 暴露给子组件直接调用(不依赖 emit 返回值)
provide('confirmFn', handleConfirm)

async function handleLogout() {
  const ok = await handleConfirm('登出确认', '确定要退出登录吗?')
  if (!ok) return
  await authStore.logout()
  showToast('success', '已登出')
}

function onAuthExpired() {
  authStore.clearUser()
  showToast('warning', '登录已过期,请重新登录')
}

// 默认视图:管理员 dashboard,借阅者 reader-dashboard
function defaultViewKey() {
  return authStore.isAdmin() ? 'dashboard' : 'reader-dashboard'
}

function onLoggedIn() {
  // 登录成功后跳转到对应默认视图
  const key = defaultViewKey()
  navigate(key)
}

const now = new Date()
const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`

onMounted(async () => {
  window.addEventListener('auth-expired', onAuthExpired)
  await authStore.initialize()
  if (authStore.isLoggedIn()) {
    navigate(defaultViewKey())
  }
})

onUnmounted(() => {
  window.removeEventListener('auth-expired', onAuthExpired)
})
</script>

<template>
  <!-- 未登录:显示登录页 -->
  <template v-if="!authStore.state.initialized">
    <div class="boot-screen">
      <div class="boot-text">INITIALIZING SYSTEM...</div>
    </div>
  </template>

  <template v-else-if="!authStore.isLoggedIn()">
    <LoginView @logged-in="onLoggedIn" @toast="showToast" />
  </template>

  <!-- 已登录:主应用 -->
  <template v-else>
    <div class="app-root">
      <!-- 顶部条 -->
      <div class="topbar">
        <div class="topbar-left">
          <span class="status-dot"></span>
          <span class="topbar-text">SYSTEM ONLINE</span>
          <span class="topbar-divider">·</span>
          <Avatar :name="authStore.state.user?.username || ''" :size="28" style="margin-right: 4px;" />
          <span class="topbar-text">{{ authStore.state.user?.username }}</span>
          <span :class="['role-tag', authStore.isAdmin() ? 'role-admin' : 'role-reader']">
            {{ authStore.state.user?.role }}
          </span>
        </div>
        <div class="topbar-center">
          <span class="marquee">
            <span>★ LIBRARY OS ★ 图书馆操作系统 ★ LIBRARY OS ★ 图书管理系统 ★ LIBRARY OS ★ 图书馆操作系统 ★</span>
            <span>★ LIBRARY OS ★ 图书馆操作系统 ★ LIBRARY OS ★ 图书管理系统 ★ LIBRARY OS ★ 图书馆操作系统 ★</span>
          </span>
        </div>
        <div class="topbar-right">
          <span class="topbar-text">{{ dateStr }}</span>
          <button class="logout-btn" @click="handleLogout">登出</button>
        </div>
      </div>

      <!-- 主布局:侧边栏 + 内容 -->
      <div class="app-layout">
        <SidebarNav :current="currentView" @navigate="navigate" />
        <main class="app-main">
          <component :is="currentViewComponent" @toast="showToast" @confirm="handleConfirm" />
        </main>
      </div>

      <!-- 页脚 -->
      <footer class="page-footer">
        <div class="footer-line"></div>
        <div class="footer-content">
          <span>LIBRARY//OS v0.4</span>
          <span class="footer-dot">·</span>
          <span>双角色权限体系 · 申请审批 · 公告通知 · 图书评价</span>
          <span class="footer-dot">·</span>
          <span>{{ dateStr }}</span>
        </div>
      </footer>

    </div>
  </template>

  <!-- 全局 Toast 与确认对话框(无论登录与否都需可用,登录页输错密码也要提示) -->
  <Toast ref="toastRef" />
  <ConfirmDialog ref="confirmRef" />
</template>

<style scoped>
.boot-screen {
  min-height: 100vh;
  background: var(--bg);
  color: var(--foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
}
.boot-text {
  font-family: var(--font-editorial);
  font-size: 28px;
  font-style: italic;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--foreground);
}
.boot-text::after {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-left: 12px;
  background: var(--primary);
  border-radius: 50%;
  vertical-align: middle;
  animation: dotPulse 1.4s infinite ease-in-out;
}
@keyframes dotPulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

.app-root { padding-bottom: 60px; }

.topbar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
  background: var(--card);
  color: var(--foreground);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  padding: 10px 22px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  border-radius: var(--radius);
  margin-bottom: 2px;
}

.topbar-left, .topbar-right { display: flex; align-items: center; gap: 10px; }
.topbar-divider { opacity: 0.2; }

.status-dot {
  width: 7px; height: 7px;
  background: var(--success);
  border-radius: 50%;
  display: inline-block;
  animation: blink 2s infinite;
  box-shadow: 0 0 6px rgba(140,160,111,0.4);
}

.role-tag {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
}
.role-admin { background: var(--warning-bg); color: var(--warning); }
.role-reader { background: var(--success-bg); color: var(--success); }

.topbar-center { overflow: hidden; white-space: nowrap; opacity: 0.25; }
.marquee {
  display: inline-block;
  animation: marquee 30s linear infinite;
  white-space: nowrap;
}
.marquee span {
  display: inline-block;
  padding-right: 40px;
  letter-spacing: 0.12em;
  font-style: italic;
  font-size: 11px;
}

.logout-btn {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  background: transparent;
  color: var(--foreground);
  border: 1px solid var(--border);
  padding: 7px 16px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  letter-spacing: 0.02em;
}
.logout-btn:hover {
  background: var(--foreground);
  color: var(--bg);
  border-color: var(--foreground);
}

.page-footer { margin-top: 52px; }
.footer-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border), transparent);
  margin-bottom: 16px;
}
.footer-content {
  display: flex;
  justify-content: center;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--muted);
  flex-wrap: wrap;
  letter-spacing: 0.06em;
  opacity: 0.7;
}
.footer-dot { opacity: 0.4; }

@media (max-width: 768px) {
  .topbar-center { display: none; }
  .topbar { grid-template-columns: 1fr auto; }
}
</style>
