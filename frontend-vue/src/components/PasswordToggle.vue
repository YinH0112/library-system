<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

const visible = ref(false)

function toggle() { visible.value = !visible.value }
function onInput(e) { emit('update:modelValue', e.target.value) }
</script>

<template>
  <div class="pw-toggle">
    <input
      :type="visible ? 'text' : 'password'"
      :value="modelValue"
      :placeholder="placeholder"
      class="brutalist-input pw-input"
      @input="onInput"
    />
    <button type="button" class="pw-btn" @click="toggle" :title="visible ? '隐藏密码' : '显示密码'">
      <!-- Eye open -->
      <svg v-if="!visible" viewBox="0 0 20 20" fill="none" width="18" height="18" stroke="currentColor" stroke-width="1.5">
        <path d="M10 3C5 3 1.5 7 1 10c.5 3 4 7 9 7s8.5-4 9-7c-.5-3-4-7-9-7z" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="10" cy="10" r="3"/>
      </svg>
      <!-- Eye closed -->
      <svg v-else viewBox="0 0 20 20" fill="none" width="18" height="18" stroke="currentColor" stroke-width="1.5">
        <path d="M10 3C5 3 1.5 7 1 10c.5 3 4 7 9 7s8.5-4 9-7c-.5-3-4-7-9-7z" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="10" cy="10" r="3"/>
        <line x1="3" y1="3" x2="17" y2="17" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.pw-toggle {
  position: relative;
  display: flex;
  align-items: center;
}
.pw-input {
  padding-right: 44px !important;
}
.pw-btn {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.16s ease;
}
.pw-btn:hover { color: var(--foreground); }
</style>
