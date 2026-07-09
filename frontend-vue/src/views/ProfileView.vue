<script setup>
import { ref, reactive, onMounted } from 'vue'
import { AuthAPI, ReaderAPI } from '../api.js'
import { authStore } from '../store/auth.js'

const emit = defineEmits(['toast'])

const tab = ref('info')
const readerInfo = ref(null)
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const changingPwd = ref(false)

async function loadReader() {
  if (authStore.state.user && authStore.state.user.readerId) {
    try {
      const res = await ReaderAPI.getById(authStore.state.user.readerId)
      if (res.data.code === 200) readerInfo.value = res.data.data
    } catch (e) {}
  }
}

async function changePassword() {
  if (!pwdForm.oldPassword || !pwdForm.newPassword) {
    emit('toast', 'error', '请填写完整')
    return
  }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
    emit('toast', 'error', '两次新密码不一致')
    return
  }
  changingPwd.value = true
  try {
    const res = await AuthAPI.changePassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    })
    if (res.data.code === 200) {
      emit('toast', 'success', '密码修改成功')
      pwdForm.oldPassword = ''
      pwdForm.newPassword = ''
      pwdForm.confirmPassword = ''
    } else emit('toast', 'error', res.data.message || '修改失败')
  } catch (e) { emit('toast', 'error', '网络错误') }
  finally { changingPwd.value = false }
}

onMounted(loadReader)
</script>

<template>
  <div class="view-header">
    <div>
      <h1 class="view-title">PROFILE<span style="color: var(--yellow)">.</span></h1>
      <p class="view-subtitle">// 个人中心</p>
    </div>
  </div>

  <div class="profile-tabs">
    <button :class="['tab-btn', { active: tab === 'info' }]" @click="tab = 'info'">个人信息</button>
    <button :class="['tab-btn', { active: tab === 'security' }]" @click="tab = 'security'">安全设置</button>
  </div>

  <!-- 个人信息 -->
  <div v-if="tab === 'info'" class="profile-panel">
    <div class="info-grid">
      <div class="info-item">
        <div class="info-key">用户名</div>
        <div class="info-val">{{ authStore.state.user?.username || '—' }}</div>
      </div>
      <div class="info-item">
        <div class="info-key">角色</div>
        <div class="info-val">
          <span :class="['badge', authStore.isAdmin() ? 'badge-overdue' : 'badge-active']">
            {{ authStore.state.user?.role }}
          </span>
        </div>
      </div>
      <div class="info-item">
        <div class="info-key">账号状态</div>
        <div class="info-val">
          <span :class="['badge', authStore.state.user?.status === 'ACTIVE' ? 'badge-active' : 'badge-suspended']">
            {{ authStore.state.user?.status }}
          </span>
        </div>
      </div>
      <div class="info-item">
        <div class="info-key">关联读者</div>
        <div class="info-val">{{ authStore.state.user?.readerName || '无(管理员)' }}</div>
      </div>
      <div v-if="readerInfo" class="info-item">
        <div class="info-key">学号/工号</div>
        <div class="info-val">{{ readerInfo.studentId || '—' }}</div>
      </div>
      <div v-if="readerInfo" class="info-item">
        <div class="info-key">电话</div>
        <div class="info-val">{{ readerInfo.phone || '—' }}</div>
      </div>
      <div v-if="readerInfo" class="info-item">
        <div class="info-key">邮箱</div>
        <div class="info-val">{{ readerInfo.email || '—' }}</div>
      </div>
      <div v-if="readerInfo" class="info-item">
        <div class="info-key">注册日期</div>
        <div class="info-val">{{ readerInfo.registerDate || '—' }}</div>
      </div>
    </div>
  </div>

  <!-- 安全设置 -->
  <div v-if="tab === 'security'" class="profile-panel">
    <h3 class="panel-title">修改密码</h3>
    <div class="pwd-form">
      <div class="form-group">
        <label class="form-label">
          <span class="label-num">01</span>
          <span class="label-text">原密码 / OLD</span>
        </label>
        <input v-model="pwdForm.oldPassword" type="password" class="brutalist-input" />
      </div>
      <div class="form-group">
        <label class="form-label">
          <span class="label-num">02</span>
          <span class="label-text">新密码 / NEW</span>
        </label>
        <input v-model="pwdForm.newPassword" type="password" class="brutalist-input" />
      </div>
      <div class="form-group">
        <label class="form-label">
          <span class="label-num">03</span>
          <span class="label-text">确认新密码 / CONFIRM</span>
        </label>
        <input v-model="pwdForm.confirmPassword" type="password" class="brutalist-input" />
      </div>
      <button class="brutalist-btn primary" :disabled="changingPwd" @click="changePassword">
        {{ changingPwd ? '处理中...' : '确认修改' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.profile-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 24px;
  border: var(--border);
  box-shadow: var(--shadow-sm);
  background: var(--white);
}
.tab-btn {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  padding: 14px 28px;
  background: var(--white);
  border: none;
  cursor: pointer;
  border-right: 1px solid rgba(43, 37, 32, 0.16);
  transition: all 0.2s ease;
}
.tab-btn:last-child { border-right: none; }
.tab-btn:hover { background: rgba(184, 146, 74, 0.12); color: var(--yellow); }
.tab-btn.active { background: var(--ink); color: var(--bg); }

.profile-panel {
  background: var(--white);
  border: var(--border);
  box-shadow: var(--shadow);
  padding: 28px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px;
  background: var(--bg);
  border: 1px solid rgba(43, 37, 32, 0.16);
  border-radius: 2px;
}
.info-key {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.6;
}
.info-val {
  font-family: var(--font-cn);
  font-size: 18px;
  font-weight: 700;
}

.panel-title {
  font-family: var(--font-cn);
  font-size: 24px;
  margin-bottom: 20px;
}
.pwd-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 460px;
}
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { display: flex; align-items: center; gap: 10px; }
.label-num {
  font-family: var(--font-display);
  font-size: 12px;
  background: var(--ink);
  color: var(--bg);
  padding: 2px 6px;
}
.label-text {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.15em;
  font-weight: 700;
  text-transform: uppercase;
}
</style>
