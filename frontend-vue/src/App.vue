<script setup>
import { ref, onMounted, onUnmounted, provide } from 'vue'
import { RouterView } from 'vue-router'
import { authStore } from './store/auth.js'
import { initToast } from './composables/useToast.js'
import Toast from './components/Toast.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'

const toastRef = ref(null)
const confirmRef = ref(null)

initToast((type, message) => {
  toastRef.value?.show(type, message)
})

async function handleConfirm(title, message) {
  if (!confirmRef.value) return false
  return await confirmRef.value.open(title, message)
}

provide('confirmFn', handleConfirm)

function onAuthExpired() {
  authStore.clearUser()
  toastRef.value?.show('warning', '登录已过期,请重新登录')
}

onMounted(async () => {
  window.addEventListener('auth-expired', onAuthExpired)
  await authStore.initialize()
})

onUnmounted(() => {
  window.removeEventListener('auth-expired', onAuthExpired)
})
</script>

<template>
  <RouterView />
  <Toast ref="toastRef" />
  <ConfirmDialog ref="confirmRef" />
</template>

<style scoped>
</style>
