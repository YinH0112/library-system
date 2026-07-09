<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { BorrowRequestAPI } from '../api.js'

const emit = defineEmits(['toast', 'confirm'])

const list = ref([])
const statusFilter = ref('PENDING')
const loading = ref(false)
const pendingCount = ref(0)

// 审批对话框
const actionDialog = ref(false)
const actionMode = ref('')  // approve / reject
const actionTarget = ref(null)
const adminRemark = ref('')

async function load() {
  loading.value = true
  try {
    const res = await BorrowRequestAPI.list(statusFilter.value || null)
    if (res.data.code === 200) list.value = res.data.data || []
    else emit('toast', 'error', '加载失败')
  } catch (e) { emit('toast', 'error', '加载失败') }
  finally { loading.value = false }
  await loadPendingCount()
}

async function loadPendingCount() {
  try {
    const r = await BorrowRequestAPI.pendingCount()
    if (r.data.code === 200) pendingCount.value = r.data.data || 0
  } catch (e) {}
}

function openAction(req, mode) {
  actionTarget.value = req
  actionMode.value = mode
  adminRemark.value = ''
  actionDialog.value = true
}

async function submitAction() {
  if (!actionTarget.value) return
  const id = actionTarget.value.id
  const remark = adminRemark.value || null
  const api = actionMode.value === 'approve' ? BorrowRequestAPI.approve : BorrowRequestAPI.reject
  const res = await api(id, remark)
  if (res.data.code === 200) {
    emit('toast', 'success', actionMode.value === 'approve' ? '已批准,图书已借出' : '已拒绝')
    actionDialog.value = false
    await load()
  } else emit('toast', 'error', res.data.message)
}

function statusBadge(s) {
  return {
    PENDING: 'badge-pending',
    APPROVED: 'badge-approved',
    REJECTED: 'badge-rejected',
    CANCELLED: 'badge-cancelled'
  }[s] || 'badge-pending'
}
function statusText(s) {
  return { PENDING: '待审批', APPROVED: '已批准', REJECTED: '已拒绝', CANCELLED: '已取消' }[s] || s
}

onMounted(load)
defineExpose({ reload: load })
</script>

<template>
  <div class="view-header">
    <div>
      <h1 class="view-title">REQUESTS<span style="color: var(--yellow)">.</span></h1>
      <p class="view-subtitle">// 借阅申请审批 · 待处理 <span class="pending-num">{{ pendingCount }}</span> 条</p>
    </div>
    <button class="brutalist-btn" @click="load">刷新</button>
  </div>

  <div class="filter-bar">
    <div class="filter-group">
      <span class="filter-label">状态</span>
      <select v-model="statusFilter" class="filter-input" @change="load">
        <option value="">全部</option>
        <option value="PENDING">待审批</option>
        <option value="APPROVED">已批准</option>
        <option value="REJECTED">已拒绝</option>
        <option value="CANCELLED">已取消</option>
      </select>
    </div>
    <div v-if="pendingCount > 0 && statusFilter !== 'PENDING'" class="pending-tip">
      // 有 {{ pendingCount }} 条待审批申请
    </div>
  </div>

  <div v-if="loading" class="loading-block"><span>LOADING...</span></div>

  <div v-else-if="list.length === 0" class="empty-block">
    <span>// 暂无{{ statusFilter ? '该状态' : '' }}申请</span>
  </div>

  <div v-else class="requests-grid">
    <article v-for="r in list" :key="r.id" :class="['req-card', `req-${r.status.toLowerCase()}`]">
      <div class="req-head">
        <span class="req-id">#{{ String(r.id).padStart(3, '0') }}</span>
        <span :class="['badge', statusBadge(r.status)]">{{ statusText(r.status) }}</span>
      </div>
      <h3 class="req-book">{{ r.bookName }}</h3>
      <div class="req-meta">
        <div class="meta-row"><span class="k">申请人</span><span class="v">{{ r.readerName }}</span></div>
        <div class="meta-row"><span class="k">申请日</span><span class="v mono">{{ r.requestDate }}</span></div>
        <div class="meta-row"><span class="k">借期</span><span class="v mono">{{ r.dueDays }} 天</span></div>
        <div class="meta-row" v-if="r.readerRemark"><span class="k">备注</span><span class="v small">{{ r.readerRemark }}</span></div>
        <div class="meta-row" v-if="r.approveDate"><span class="k">审批日</span><span class="v mono">{{ r.approveDate }}</span></div>
        <div class="meta-row" v-if="r.adminName"><span class="k">审批人</span><span class="v">{{ r.adminName }}</span></div>
        <div class="meta-row" v-if="r.adminRemark"><span class="k">审批备注</span><span class="v small">{{ r.adminRemark }}</span></div>
        <div class="meta-row" v-if="r.borrowId"><span class="k">借阅ID</span><span class="v mono">#{{ r.borrowId }}</span></div>
      </div>
      <div v-if="r.status === 'PENDING'" class="req-actions">
        <button class="brutalist-btn primary" @click="openAction(r, 'approve')">批准</button>
        <button class="brutalist-btn danger" @click="openAction(r, 'reject')">拒绝</button>
      </div>
    </article>
  </div>

  <!-- 审批对话框 -->
  <div v-if="actionDialog" class="dialog-mask" @click.self="actionDialog = false">
    <div class="dialog-box">
      <div class="dialog-head">
        <span class="dialog-tag">// {{ actionMode === 'approve' ? 'APPROVE' : 'REJECT' }}</span>
        <button class="dialog-close" @click="actionDialog = false">×</button>
      </div>
      <div class="dialog-body">
        <h3 class="dialog-title" v-if="actionTarget">{{ actionTarget.bookName }}</h3>
        <p class="dialog-sub" v-if="actionTarget">申请人:{{ actionTarget.readerName }} · 借期 {{ actionTarget.dueDays }} 天</p>
        <div class="form-row">
          <label class="form-label">{{ actionMode === 'approve' ? '批准备注(选填)' : '拒绝理由(选填)' }}</label>
          <textarea v-model="adminRemark" class="form-input" rows="3"
                    :placeholder="actionMode === 'approve' ? '可填写批准说明' : '请说明拒绝原因'"></textarea>
        </div>
        <div v-if="actionMode === 'approve'" class="dialog-tip">
          // 批准后将自动扣减库存并生成借阅记录,请确认图书当前可借。
        </div>
      </div>
      <div class="dialog-foot">
        <button class="brutalist-btn" @click="actionDialog = false">取消</button>
        <button :class="['brutalist-btn', actionMode === 'approve' ? 'primary' : 'danger']" @click="submitAction">
          确认{{ actionMode === 'approve' ? '批准' : '拒绝' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pending-num {
  display: inline-block;
  background: rgba(139, 58, 58, 0.15); color: var(--pink);
  font-family: var(--font-display);
  padding: 0 8px; border: 1px solid rgba(139, 58, 58, 0.4);
  border-radius: 2px;
  margin: 0 4px;
}
.pending-tip {
  font-family: var(--font-mono); font-size: 11px;
  color: var(--pink); letter-spacing: 0.1em;
}
.loading-block, .empty-block {
  padding: 60px; text-align: center;
  background: var(--white);
  border: var(--border);
  box-shadow: var(--shadow);
  font-family: var(--font-mono);
  letter-spacing: 0.1em;
}
.requests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
.req-card {
  background: var(--white);
  border: var(--border);
  border-radius: 2px;
  box-shadow: var(--shadow-sm);
  display: flex; flex-direction: column;
  transition: box-shadow 0.2s ease;
}
.req-card:hover { box-shadow: var(--shadow); }
.req-pending { border-left: 4px solid var(--yellow); }
.req-approved { border-left: 4px solid var(--green); }
.req-rejected { border-left: 4px solid var(--pink); }
.req-cancelled { border-left: 4px solid var(--ink); opacity: 0.65; }
.req-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 14px;
  border-bottom: var(--border);
  font-family: var(--font-mono); font-size: 12px;
}
.req-id { font-family: var(--font-display); font-size: 16px; }
.req-book {
  font-family: var(--font-cn); font-size: 22px; font-weight: 700;
  padding: 12px 14px 8px; line-height: 1.2;
}
.req-meta { padding: 8px 14px; flex: 1; }
.meta-row { display: flex; justify-content: space-between; align-items: baseline; padding: 4px 0; }
.k { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; opacity: 0.7; text-transform: uppercase; }
.v { font-family: var(--font-mono); font-size: 12px; font-weight: 700; }
.v.mono { font-family: var(--font-mono); }
.v.small { font-size: 11px; font-weight: 400; max-width: 60%; text-align: right; font-family: var(--font-cn); }
.badge-pending { background: rgba(184, 146, 74, 0.18); color: var(--yellow); border: 1px solid rgba(184, 146, 74, 0.4); }
.badge-approved { background: rgba(92, 122, 92, 0.18); color: var(--green); border: 1px solid rgba(92, 122, 92, 0.4); }
.badge-rejected { background: rgba(139, 58, 58, 0.18); color: var(--pink); border: 1px solid rgba(139, 58, 58, 0.4); }
.badge-cancelled { background: rgba(43, 37, 32, 0.12); color: var(--ink); opacity: 0.7; border: 1px solid rgba(43, 37, 32, 0.2); }
.req-actions {
  display: flex; gap: 8px;
  padding: 10px 14px;
  border-top: 1px dashed rgba(43, 37, 32, 0.2);
}
.req-actions .brutalist-btn { flex: 1; }

.dialog-mask {
  position: fixed; inset: 0;
  background: rgba(43, 37, 32, 0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: 20px;
}
.dialog-box {
  background: var(--bg);
  border: var(--border);
  border-radius: 3px;
  box-shadow: var(--shadow-lg);
  width: 100%; max-width: 480px;
}
.dialog-head {
  display: flex; justify-content: space-between; align-items: center;
  background: var(--ink); color: var(--bg);
  padding: 10px 16px;
  font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.15em;
}
.dialog-close {
  background: rgba(255, 255, 255, 0.12); color: var(--bg);
  border: 1px solid rgba(253, 251, 246, 0.25);
  border-radius: 2px;
  width: 28px; height: 28px;
  font-size: 18px; font-weight: 700;
  cursor: pointer; line-height: 1;
  transition: all 0.2s ease;
}
.dialog-close:hover { background: rgba(139, 58, 58, 0.6); }
.dialog-body { padding: 20px; }
.dialog-title { font-family: var(--font-cn); font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.dialog-sub { font-family: var(--font-mono); font-size: 11px; opacity: 0.7; margin-bottom: 16px; letter-spacing: 0.1em; }
.form-row { margin-bottom: 14px; }
.form-label {
  display: block; font-family: var(--font-mono); font-size: 11px;
  letter-spacing: 0.1em; text-transform: uppercase;
  margin-bottom: 6px; opacity: 0.8;
}
.form-input {
  width: 100%; font-family: var(--font-mono); font-size: 13px;
  padding: 8px 10px; background: var(--white);
  border: 1px solid rgba(43, 37, 32, 0.28); border-radius: 2px;
  box-sizing: border-box;
  resize: vertical;
  transition: border-color 0.2s ease;
}
.form-input:focus { outline: none; border-color: var(--yellow); }
.dialog-tip {
  font-family: var(--font-cn); font-size: 12px;
  opacity: 0.75; margin-top: 12px;
  padding: 10px; background: rgba(184, 146, 74, 0.12);
  color: var(--ink);
  border: 1px solid rgba(184, 146, 74, 0.3);
  border-radius: 2px;
  line-height: 1.6;
}
.dialog-foot {
  display: flex; gap: 10px; justify-content: flex-end;
  padding: 14px 20px;
  border-top: 1px solid rgba(43, 37, 32, 0.16);
  background: var(--white);
}
</style>
