<script setup>
defineProps({
  type: { type: String, default: 'card' }, // card | table | text | dashboard
  count: { type: Number, default: 6 }
})
</script>

<template>
  <div :class="['skeleton-wrapper', `skeleton-${type}`]">
    <!-- Card skeletons -->
    <template v-if="type === 'card'">
      <div v-for="i in count" :key="i" class="skeleton-card">
        <div class="skeleton-bar skeleton-color-band" style="height: 40px; border-radius: var(--radius) var(--radius) 0 0;"></div>
        <div style="padding: 16px 14px;">
          <div class="skeleton-bar" style="width: 80%; height: 20px; margin-bottom: 8px;"></div>
          <div class="skeleton-bar" style="width: 50%; height: 14px; margin-bottom: 16px;"></div>
          <div class="skeleton-bar" style="width: 100%; height: 12px; margin-bottom: 6px;"></div>
          <div class="skeleton-bar" style="width: 70%; height: 12px; margin-bottom: 6px;"></div>
          <div class="skeleton-bar" style="width: 40%; height: 16px; margin-top: 12px;"></div>
        </div>
      </div>
    </template>

    <!-- Table skeletons -->
    <template v-else-if="type === 'table'">
      <div class="skeleton-table">
        <div class="skeleton-table-head">
          <div class="skeleton-bar" v-for="h in 6" :key="h" style="height: 12px;"></div>
        </div>
        <div v-for="r in count" :key="r" class="skeleton-table-row">
          <div class="skeleton-bar" v-for="c in 6" :key="c" style="height: 14px;"></div>
        </div>
      </div>
    </template>

    <!-- Dashboard skeletons -->
    <template v-else-if="type === 'dashboard'">
      <div class="skeleton-metrics">
        <div v-for="i in 4" :key="i" class="skeleton-metric">
          <div class="skeleton-bar" style="width: 40%; height: 10px; margin-bottom: 12px;"></div>
          <div class="skeleton-bar" style="width: 60%; height: 32px; margin-bottom: 8px;"></div>
          <div class="skeleton-bar" style="width: 30%; height: 10px;"></div>
        </div>
      </div>
    </template>

    <!-- Text skeletons -->
    <template v-else>
      <div class="skeleton-text">
        <div v-for="i in count" :key="i" class="skeleton-bar" :style="{ width: (100 - i * 8) + '%', height: '12px', marginBottom: '8px' }"></div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.skeleton-wrapper { width: 100%; }
.skeleton-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: fadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.skeleton-color-band { background: var(--bg-muted); }
.skeleton-bar {
  background: linear-gradient(90deg, var(--bg-muted) 25%, var(--border-faint) 50%, var(--bg-muted) 75%);
  background-size: 200% 100%;
  animation: shimmerMove 1.8s ease-in-out infinite;
  border-radius: 6px;
}
.skeleton-table {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
.skeleton-table-head {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  padding: 14px 18px;
  background: var(--foreground);
  border-radius: var(--radius) var(--radius) 0 0;
}
.skeleton-table-head .skeleton-bar { background: rgba(255,255,255,0.1); animation: none; }
.skeleton-table-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-faint);
}
.skeleton-table-row:nth-child(even) { background: var(--bg-subtle); }
.skeleton-table-row:last-child { border-bottom: none; }
.skeleton-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 16px;
}
.skeleton-metric {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 22px 20px 18px;
}
.skeleton-wrapper.skeleton-card {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
@keyframes shimmerMove {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
