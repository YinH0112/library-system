<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, default: '' },
  size: { type: Number, default: 40 },
  src: { type: String, default: '' }
})

const initials = computed(() => {
  if (!props.name) return '?'
  const parts = props.name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return props.name.slice(0, 2).toUpperCase()
})

const colors = ['#d97757', '#6b5b7a', '#8ca06f', '#4a6b7c', '#b0683f']
const colorIndex = computed(() => {
  let hash = 0
  for (let i = 0; i < props.name.length; i++) hash = props.name.charCodeAt(i) + ((hash << 5) - hash)
  return Math.abs(hash) % colors.length
})
const bgColor = computed(() => colors[colorIndex.value])
</script>

<template>
  <div class="avatar" :style="{ width: size + 'px', height: size + 'px', fontSize: (size * 0.36) + 'px', background: bgColor }">
    <img v-if="src" :src="src" :alt="name" class="avatar-img" />
    <span v-else class="avatar-initials">{{ initials }}</span>
  </div>
</template>

<style scoped>
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: white;
  font-family: var(--font-sans);
  font-weight: 700;
  letter-spacing: 0.06em;
  flex-shrink: 0;
  overflow: hidden;
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s;
  box-shadow: var(--shadow-sm);
  position: relative;
}
.avatar:hover {
  transform: scale(1.08);
  box-shadow: var(--shadow-md);
}
.avatar::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.25);
  pointer-events: none;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-initials {
  user-select: none;
  text-shadow: 0 1px 2px rgba(0,0,0,0.15);
}
</style>
