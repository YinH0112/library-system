<script setup>
import { computed } from 'vue'
import { authStore } from '../store/auth.js'

defineProps({
  current: { type: String, required: true }
})
const emit = defineEmits(['navigate'])

const adminItems = [
  { key: 'dashboard', label: 'Dashboard', num: '01', section: '主控台' },
  { key: 'books', label: 'Books', num: '02', section: '主控台' },
  { key: 'categories', label: 'Categories', num: '03', section: '主控台' },
  { key: 'readers', label: 'Readers', num: '04', section: '运营' },
  { key: 'borrows', label: 'Borrows', num: '05', section: '运营' },
  { key: 'requests', label: 'Requests', num: '06', section: '运营' },
  { key: 'notices', label: 'Notices', num: '07', section: '运营' },
  { key: 'users', label: 'Users', num: '08', section: '运营' },
  { key: 'profile', label: 'Profile', num: '09', section: '账户' }
]

const readerItems = [
  { key: 'reader-dashboard', label: 'My Dashboard', num: '01', section: '我的' },
  { key: 'notice-board', label: 'Notice Board', num: '02', section: '我的' },
  { key: 'reader-books', label: 'Browse', num: '03', section: '我的' },
  { key: 'my-requests', label: 'My Requests', num: '04', section: '我的' },
  { key: 'my-borrows', label: 'My Borrows', num: '05', section: '我的' },
  { key: 'my-reviews', label: 'My Reviews', num: '06', section: '我的' },
  { key: 'profile', label: 'Profile', num: '07', section: '账户' }
]

const navItems = computed(() => authStore.isAdmin() ? adminItems : readerItems)
const sections = computed(() => {
  const set = new Set(navItems.value.map(i => i.section))
  return Array.from(set)
})
</script>

<template>
  <aside class="app-sidebar">
    <div class="sidebar-brand">
      <div class="brand-mark">LIB//OS</div>
      <div class="brand-sub">VOL.003 · {{ authStore.isAdmin() ? '管理员' : '借阅者' }}</div>
    </div>

    <div class="sidebar-user" v-if="authStore.state.user">
      <div class="user-label">// CURRENT USER</div>
      <div class="user-name">{{ authStore.state.user.username }}</div>
      <div class="user-role">{{ authStore.state.user.role }}</div>
    </div>

    <nav v-for="section in sections" :key="section" class="nav-section">
      <div class="nav-section-title">// {{ section }}</div>
      <div
        v-for="item in navItems.filter(i => i.section === section)"
        :key="item.key"
        :class="['nav-item', { active: current === item.key }]"
        @click="emit('navigate', item.key)">
        <span class="nav-num">{{ item.num }}</span>
        <span>{{ item.label }}</span>
      </div>
    </nav>
  </aside>
</template>

<style scoped>
/* 侧边栏用户信息块 — 深色块 + 古金文字 + 细分隔边框
   侧边栏主体(.app-sidebar / .sidebar-brand / .nav-item 等)已在全局 style.css 定义,此处只补 sidebar 独有样式 */
.sidebar-user {
  padding: 16px 22px;
  border-bottom: 1px solid rgba(245, 239, 226, 0.1);
  background: rgba(0, 0, 0, 0.15);
}
.user-label {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.22em;
  color: var(--yellow);
  opacity: 0.55;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.user-name {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  color: var(--bg);
  letter-spacing: 0.01em;
}
.user-role {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--yellow);
  opacity: 0.7;
  margin-top: 3px;
  text-transform: uppercase;
}
</style>
