<script setup>
import { ref, reactive, onMounted } from 'vue'
import { AuthAPI, ReaderAPI } from '../api.js'
import { authStore } from '../store/auth.js'
import Avatar from '../components/Avatar.vue'
import { showToast } from '../composables/useToast.js'

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
    showToast('error', '请填写完整')
    return
  }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
    showToast('error', '两次新密码不一致')
    return
  }
  changingPwd.value = true
  try {
    const res = await AuthAPI.changePassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    })
    if (res.data.code === 200) {
      showToast('success', '密码修改成功')
      pwdForm.oldPassword = ''
      pwdForm.newPassword = ''
      pwdForm.confirmPassword = ''
    } else showToast('error', res.data.message || '修改失败')
  } catch (e) { showToast('error', '网络错误') }
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

  <div class="user-info-row">
    <Avatar :name="authStore.state.user?.username || ''" :size="48" />
    <div>
      <div class="user-info-name">{{ authStore.state.user?.username || '—' }}</div>
      <div class="user-info-role">{{ authStore.state.user?.role === 'ADMIN' ? '系统管理员' : '借阅者' }}</div>
    </div>
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
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-2xs);
  background: var(--card);
  overflow: hidden;
}
.tab-btn {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  padding: 13px 32px;
  background: var(--card);
  border: none;
  cursor: pointer;
  border-right: 1px solid var(--border);
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  color: var(--muted);
  letter-spacing: 0.02em;
  position: relative;
}
.tab-btn:last-child { border-right: none; }
.tab-btn:hover { background: var(--bg-subtle); color: var(--foreground); }
.tab-btn.active {
  background: var(--foreground);
  color: var(--bg);
  font-weight: 700;
}
.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0; left: 20%; right: 20%;
  height: 2px;
  background: var(--primary);
  border-radius: 2px 2px 0 0;
}

.profile-panel {
  background: var(--card);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  padding: 32px;
  border-radius: var(--radius);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-faint);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}
.info-item:hover {
  border-color: var(--border);
  box-shadow: var(--shadow-xs);
}
.info-key {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 600;
}
.info-val {
  font-family: var(--font-sans);
  font-size: 17px;
  font-weight: 700;
  color: var(--foreground);
  letter-spacing: -0.01em;
}

.panel-title {
  font-family: var(--font-editorial);
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 24px;
  color: var(--foreground);
  letter-spacing: -0.01em;
}
.pwd-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 480px;
}
.form-group { display: flex; flex-direction: column; gap: 7px; }
.form-label { display: flex; align-items: center; gap: 10px; }
.label-num {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 800;
  background: var(--foreground);
  color: var(--bg);
  padding: 3px 10px;
  border-radius: 6px;
  letter-spacing: 0.02em;
}
.label-text {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--muted);
}
</style>
