<script setup>
import { ref, computed, inject } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { authStore } from '../store/auth.js'
import SidebarNav from '../components/SidebarNav.vue'
import Avatar from '../components/Avatar.vue'

const route = useRoute()
const router = useRouter()
const confirmFn = inject('confirmFn')

const currentPath = computed(() => route.path)

const now = new Date()
const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`

async function handleLogout() {
  const ok = await confirmFn('登出确认', '确定要退出登录吗?')
  if (!ok) return
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="app-root">
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

    <div class="app-layout">
      <SidebarNav :current="currentPath" />
      <main class="app-main">
        <RouterView />
      </main>
    </div>

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

<style scoped>
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
