<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { authStore } from '../store/auth.js'
import Avatar from './Avatar.vue'

const props = defineProps({
  current: { type: String, required: true }
})

const adminItems = [
  { path: '/admin/dashboard', label: 'Dashboard', num: '01', section: '主控台' },
  { path: '/admin/books', label: 'Books', num: '02', section: '主控台' },
  { path: '/admin/categories', label: 'Categories', num: '03', section: '主控台' },
  { path: '/admin/readers', label: 'Readers', num: '04', section: '运营' },
  { path: '/admin/borrows', label: 'Borrows', num: '05', section: '运营' },
  { path: '/admin/requests', label: 'Requests', num: '06', section: '运营' },
  { path: '/admin/notices', label: 'Notices', num: '07', section: '运营' },
  { path: '/admin/users', label: 'Users', num: '08', section: '运营' },
  { path: '/admin/profile', label: 'Profile', num: '09', section: '账户' }
]

const readerItems = [
  { path: '/reader/dashboard', label: 'My Dashboard', num: '01', section: '我的' },
  { path: '/reader/notices', label: 'Notice Board', num: '02', section: '我的' },
  { path: '/reader/books', label: 'Browse', num: '03', section: '我的' },
  { path: '/reader/requests', label: 'My Requests', num: '04', section: '我的' },
  { path: '/reader/borrows', label: 'My Borrows', num: '05', section: '我的' },
  { path: '/reader/reviews', label: 'My Reviews', num: '06', section: '我的' },
  { path: '/reader/profile', label: 'Profile', num: '07', section: '账户' }
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
      <div style="display: flex; align-items: center; gap: 10px;">
        <Avatar :name="authStore.state.user.username || ''" :size="36" />
        <div>
          <div class="user-name">{{ authStore.state.user.username }}</div>
          <div class="user-role">{{ authStore.state.user.role }}</div>
        </div>
      </div>
    </div>

    <nav v-for="section in sections" :key="section" class="nav-section">
      <div class="nav-section-title">// {{ section }}</div>
      <RouterLink
        v-for="item in navItems.filter(i => i.section === section)"
        :key="item.path"
        :to="item.path"
        :class="['nav-item', { active: current === item.path }]"
      >
        <span class="nav-num">{{ item.num }}</span>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar-user {
  padding: 14px;
  margin: 8px 12px;
  border-radius: var(--radius-lg);
  background: var(--card);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-2xs);
}

.user-name {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  color: var(--foreground);
}

.user-role {
  font-family: var(--font-sans);
  font-size: 11px;
  color: var(--muted);
}

a.nav-item {
  text-decoration: none;
  color: inherit;
}
</style>
