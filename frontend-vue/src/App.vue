<script setup>
import { ref, shallowRef, onMounted, onUnmounted, provide } from 'vue'
import { authStore } from './store/auth.js'
import SidebarNav from './components/SidebarNav.vue'
import Toast from './components/Toast.vue'
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
/* 启动屏 — 羊皮纸底 + 居中衬线标题 + 加载点动画 */
.boot-screen {
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
}
.boot-text {
  font-family: var(--font-display);
  font-size: 26px;
  font-style: italic;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ink);
  position: relative;
}
/* 加载点动画(纯 CSS,不改动模板) */
.boot-text::after {
  content: '· · ·';
  display: inline-block;
  margin-left: 10px;
  font-style: normal;
  font-size: 28px;
  line-height: 0;
  color: var(--yellow);
  letter-spacing: 0.1em;
  animation: dotFade 1.4s infinite ease-in-out;
}
@keyframes dotFade {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1; }
}

.app-root { padding-bottom: 60px; }

/* 顶栏 — 纸白底 + 细底边框 + 柔阴影,克制书卷感 */
.topbar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
  background: var(--white);
  color: var(--ink);
  border-bottom: var(--border);
  box-shadow: var(--shadow-sm);
  padding: 10px 20px;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  border-radius: 2px;
}
.topbar-left, .topbar-right { display: flex; align-items: center; gap: 10px; }
.topbar-divider { opacity: 0.3; }
.status-dot {
  width: 7px; height: 7px;
  background: var(--green);
  border-radius: 50%;
  display: inline-block;
  animation: blink 1.5s infinite;
}
/* 角色徽章 — 细边框 + 透明背景 + 文字色,不用亮色块 */
.role-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  padding: 2px 8px;
  border: 1px solid rgba(43, 37, 32, 0.28);
  background: transparent;
  border-radius: 2px;
  text-transform: uppercase;
}
.role-admin { color: var(--yellow); border-color: rgba(184, 146, 74, 0.45); }
.role-reader { color: var(--green); border-color: rgba(92, 122, 92, 0.45); }

.topbar-center { overflow: hidden; white-space: nowrap; opacity: 0.45; }
.marquee {
  display: inline-block;
  animation: marquee 30s linear infinite;
  white-space: nowrap;
}
.marquee span {
  display: inline-block;
  padding-right: 40px;
  letter-spacing: 0.2em;
  font-style: italic;
}

/* 登出按钮 — 细边框 + hover 变墨色,不用硬阴影 */
.logout-btn {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  background: transparent;
  color: var(--ink);
  border: 1px solid rgba(43, 37, 32, 0.28);
  padding: 5px 14px;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s ease;
  text-transform: uppercase;
}
.logout-btn:hover {
  background: var(--ink);
  color: var(--bg);
  border-color: var(--ink);
}

/* 页脚 — 极简细线 + mono 字体,低透明度 */
.page-footer { margin-top: 60px; }
.footer-line {
  height: 1px;
  background: rgba(43, 37, 32, 0.16);
  margin-bottom: 14px;
}
.footer-content {
  display: flex;
  justify-content: center;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  opacity: 0.45;
  flex-wrap: wrap;
  text-transform: uppercase;
}
.footer-dot { opacity: 0.6; }

@media (max-width: 768px) {
  .topbar-center { display: none; }
  .topbar { grid-template-columns: 1fr auto; }
}
</style>
