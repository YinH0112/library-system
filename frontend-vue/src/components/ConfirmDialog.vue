<script setup>
import { ref } from 'vue'

const visible = ref(false)
const title = ref('')
const message = ref('')
let resolveFn = null

function open(t, m) {
  title.value = t
  message.value = m
  visible.value = true
  return new Promise(resolve => { resolveFn = resolve })
}

function confirm() {
  visible.value = false
  resolveFn && resolveFn(true)
}

function cancel() {
  visible.value = false
  resolveFn && resolveFn(false)
}

defineExpose({ open })
</script>

<template>
  <transition name="dialog">
    <div v-if="visible" class="confirm-overlay" @click.self="cancel">
      <div class="confirm-box">
        <h3 class="confirm-title">{{ title }}</h3>
        <p class="confirm-msg">{{ message }}</p>
        <div class="confirm-actions">
          <button class="brutalist-btn" @click="cancel">取消</button>
          <button class="brutalist-btn danger" @click="confirm">确认</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.dialog-enter-active, .dialog-leave-active { transition: opacity 0.2s; }
.dialog-enter-active .confirm-box, .dialog-leave-active .confirm-box {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-from .confirm-box, .dialog-leave-to .confirm-box {
  transform: scale(0.95);
}
</style>
