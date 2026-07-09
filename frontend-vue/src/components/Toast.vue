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
        <template v-if="toast.type === 'success'">[OK]</template>
        <template v-else-if="toast.type === 'error'">[ERR]</template>
        <template v-else>[!]</template>
      </span>
      <span class="toast-msg">{{ toast.message }}</span>
    </div>
  </transition>
</template>

<style scoped>
.toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--white);
  border: var(--border);
  box-shadow: var(--shadow);
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-mono);
  font-weight: 700;
  z-index: 200;
}
.toast-icon {
  font-family: var(--font-display);
  font-size: 14px;
  padding: 4px 8px;
  border: 2px solid var(--ink);
}
.toast-success .toast-icon { background: var(--green); }
.toast-error .toast-icon { background: var(--pink); color: var(--white); }
.toast-warning .toast-icon { background: var(--yellow); }
.toast-msg { font-size: 14px; letter-spacing: 0.05em; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(20px); }
</style>
