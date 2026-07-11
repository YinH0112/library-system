<script setup>
defineProps({
  title: { type: String, default: '暂无数据' },
  description: { type: String, default: '' },
  icon: { type: String, default: 'empty' } // empty | search | error | success
})

defineEmits(['action'])
</script>

<template>
  <div class="empty-state">
    <div class="empty-illustration">
      <!-- Empty box illustration -->
      <svg v-if="icon === 'empty'" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="empty-svg">
        <rect x="20" y="30" width="80" height="60" rx="8" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3" opacity="0.3"/>
        <path d="M60 50 L60 70 M50 60 L70 60" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.4"/>
        <circle cx="60" cy="22" r="4" fill="currentColor" opacity="0.2"/>
        <path d="M45 15 Q60 5 75 15" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.15"/>
      </svg>
      <!-- Search illustration -->
      <svg v-else-if="icon === 'search'" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="empty-svg">
        <circle cx="52" cy="48" r="22" stroke="currentColor" stroke-width="2.5" stroke-dasharray="4 3" opacity="0.3"/>
        <line x1="68" y1="64" x2="88" y2="84" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.3"/>
        <circle cx="52" cy="48" r="4" fill="currentColor" opacity="0.15"/>
      </svg>
      <!-- Error illustration -->
      <svg v-else-if="icon === 'error'" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="empty-svg">
        <circle cx="60" cy="50" r="30" stroke="currentColor" stroke-width="2" opacity="0.2"/>
        <path d="M48 40 L72 60 M72 40 L48 60" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.3"/>
      </svg>
      <!-- Success illustration -->
      <svg v-else viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="empty-svg">
        <circle cx="60" cy="50" r="30" stroke="currentColor" stroke-width="2" opacity="0.2"/>
        <path d="M46 50 L56 60 L76 40" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.3"/>
      </svg>
    </div>
    <h3 class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-desc">{{ description }}</p>
    <div v-if="$slots.action" class="empty-action">
      <slot name="action"></slot>
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 28px;
  text-align: center;
  background: var(--card);
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2xs);
}
.empty-illustration {
  margin-bottom: 24px;
  color: var(--muted);
  animation: floatIn 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  opacity: 0.6;
}
.empty-svg {
  width: 120px;
  height: 96px;
}
.empty-title {
  font-family: var(--font-sans);
  font-size: 17px;
  font-weight: 700;
  color: var(--foreground);
  margin-bottom: 8px;
  letter-spacing: -0.01em;
}
.empty-desc {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--muted);
  max-width: 340px;
  line-height: 1.7;
}
.empty-action { margin-top: 20px; }
@keyframes floatIn {
  from { opacity: 0; transform: translateY(16px) scale(0.92); }
  to { opacity: 0.6; transform: translateY(0) scale(1); }
}
</style>
