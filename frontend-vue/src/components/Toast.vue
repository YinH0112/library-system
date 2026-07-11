<script setup>
import { reactive, watch } from 'vue'

const toast = reactive({
  visible: false,
  type: 'success',
  message: '',
  timer: null
})

function show(type, message, duration = 2500) {
  if (toast.timer) clearTimeout(toast.timer)
  toast.type = type
  toast.message = message
  toast.visible = true
  toast.timer = setTimeout(() => { toast.visible = false }, duration)
}

defineExpose({ show })
</script>

<template>
  <transition name="toast">
    <div v-if="toast.visible" :class="['toast', `toast-${toast.type}`]">
      <span class="toast-icon">
        <!-- Success checkmark -->
        <svg v-if="toast.type === 'success'" viewBox="0 0 20 20" fill="none" width="14" height="14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="10" cy="10" r="8"/>
          <path d="M6.5 10 L9 12.5 L13.5 7.5"/>
        </svg>
        <!-- Error X -->
        <svg v-else-if="toast.type === 'error'" viewBox="0 0 20 20" fill="none" width="14" height="14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <circle cx="10" cy="10" r="8"/>
          <path d="M7 7 L13 13 M13 7 L7 13"/>
        </svg>
        <!-- Warning -->
        <svg v-else viewBox="0 0 20 20" fill="none" width="14" height="14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 2 L18 17 H2 Z"/>
          <line x1="10" y1="8" x2="10" y2="12"/>
          <circle cx="10" cy="14.5" r="0.5" fill="currentColor"/>
        </svg>
      </span>
      <span class="toast-msg">{{ toast.message }}</span>
    </div>
  </transition>
</template>

<style scoped>
.toast {
  position: fixed;
  bottom: 36px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--card);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-xl);
  padding: 14px 22px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 13px;
  z-index: 200;
  border-radius: var(--radius);
  letter-spacing: 0.02em;
  backdrop-filter: blur(12px);
}
.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: var(--shadow-2xs);
}
.toast-success .toast-icon { background: var(--success-bg); color: var(--success); }
.toast-error .toast-icon { background: #fde8e8; color: var(--destructive); }
.toast-warning .toast-icon { background: var(--warning-bg); color: var(--warning); }
.toast-msg { color: var(--foreground); }
.toast-enter-active, .toast-leave-active { transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(24px) scale(0.95); }
</style>
