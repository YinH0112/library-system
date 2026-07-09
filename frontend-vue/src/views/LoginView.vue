<script setup>
import { ref, reactive } from 'vue'
import { AuthAPI } from '../api.js'
import { authStore } from '../store/auth.js'

const emit = defineEmits(['logged-in', 'toast'])

const mode = ref('login') // login / register
const loading = ref(false)
const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  readerId: null
})

async function submit() {
  if (!form.username || !form.password) {
    emit('toast', 'error', '用户名和密码不能为空')
    return
  }
  if (mode.value === 'register') {
    if (form.password !== form.confirmPassword) {
      emit('toast', 'error', '两次密码不一致')
      return
    }
  }
  loading.value = true
  try {
    if (mode.value === 'login') {
      const res = await AuthAPI.login({ username: form.username, password: form.password })
      if (res.data.code === 200) {
        authStore.setUser(res.data.data)
        emit('toast', 'success', '欢迎回来,' + res.data.data.username)
        emit('logged-in')
      } else {
        emit('toast', 'error', res.data.message || '登录失败')
      }
    } else {
      // 注册为借阅者(需先有读者档案,readerId 可选)
      const payload = {
        username: form.username,
        password: form.password,
        role: 'READER',
        readerId: form.readerId || null
      }
      const res = await AuthAPI.register(payload)
      if (res.data.code === 200) {
        emit('toast', 'success', '注册成功,请登录')
        mode.value = 'login'
        form.password = ''
        form.confirmPassword = ''
      } else {
        emit('toast', 'error', res.data.message || '注册失败')
      }
    }
  } catch (e) {
    emit('toast', 'error', '网络错误')
  } finally {
    loading.value = false
  }
}

function switchMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  form.password = ''
  form.confirmPassword = ''
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <!-- 左侧装饰板 -->
      <div class="login-left">
        <div class="brand-block">
          <div class="brand-mark">Bibliotheca</div>
          <div class="brand-sub">图书馆管理系统</div>
        </div>
        <div class="brand-tagline">
          <div class="tag-line">— EST. MMXXVI —</div>
          <div class="tag-title">知識<br/>之庫</div>
          <div class="tag-meta">管理员 · 借阅者<br/>双角色权限体系</div>
        </div>
        <div class="brand-footer">
          <span class="status-dot"></span>
          <span>系統運行中</span>
        </div>
      </div>

      <!-- 右侧表单 -->
      <div class="login-right">
        <div class="form-header">
          <span class="header-label">{{ mode === 'login' ? '登入' : '注册' }}</span>
        </div>
        <h2 class="form-title">{{ mode === 'login' ? '歡迎歸來' : '新建借閱者' }}</h2>
        <p class="form-subtitle">{{ mode === 'login' ? '请凭据登入以继续' : '创建新的借阅者账号' }}</p>

        <form class="login-form" @submit.prevent="submit">
          <div class="form-group">
            <label class="form-label">
              <span class="label-text">用户名</span>
            </label>
            <input v-model="form.username" class="brutalist-input" placeholder="必填" maxlength="50" />
          </div>

          <div class="form-group">
            <label class="form-label">
              <span class="label-text">密码</span>
            </label>
            <input v-model="form.password" type="password" class="brutalist-input" placeholder="必填" />
          </div>

          <div v-if="mode === 'register'" class="form-group">
            <label class="form-label">
              <span class="label-text">确认密码</span>
            </label>
            <input v-model="form.confirmPassword" type="password" class="brutalist-input" placeholder="再次输入" />
          </div>

          <div v-if="mode === 'register'" class="form-group">
            <label class="form-label">
              <span class="label-text">读者档案 ID（选填）</span>
            </label>
            <input v-model.number="form.readerId" type="number" class="brutalist-input" placeholder="如有读者档案请填写" />
          </div>

          <button type="submit" class="brutalist-btn primary submit-btn" :disabled="loading">
            {{ loading ? '处理中...' : (mode === 'login' ? '登 入' : '注 册') }}
          </button>
        </form>

        <div class="form-footer">
          <span class="footer-text">
            {{ mode === 'login' ? '还没有账号？' : '已有账号？' }}
          </span>
          <button class="switch-btn" @click="switchMode">
            {{ mode === 'login' ? '前往注册' : '前往登录' }}
          </button>
        </div>

        <div v-if="mode === 'login'" class="demo-hint">
          <div class="hint-title">演示账号</div>
          <div class="hint-row"><span class="hint-key">管理员</span><span class="hint-val">admin / admin123</span></div>
          <div class="hint-row"><span class="hint-key">借阅者</span><span class="hint-val">zhangsan / reader123</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
}

/* 主卡片 */
.login-card {
  background: var(--white);
  border: var(--border);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 880px;
  display: grid;
  grid-template-columns: 320px 1fr;
  border-radius: 3px;
  overflow: hidden;
}

/* 左侧装饰板 */
.login-left {
  background: #241f1a;
  color: var(--bg);
  padding: 36px 30px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
}
.login-left::after {
  content: '';
  position: absolute;
  top: 24px; bottom: 24px; left: 0;
  width: 2px;
  background: var(--yellow);
  opacity: 0.4;
}

.brand-mark {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 700;
  font-style: italic;
  line-height: 1;
  color: var(--yellow);
  letter-spacing: 0.01em;
}
.brand-sub {
  font-family: var(--font-cn);
  font-size: 11px;
  letter-spacing: 0.18em;
  margin-top: 8px;
  opacity: 0.55;
}

.brand-tagline {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
}
.tag-line {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.28em;
  color: var(--yellow);
  opacity: 0.7;
}
.tag-title {
  font-family: var(--font-display);
  font-size: 52px;
  font-weight: 700;
  line-height: 1.05;
  color: var(--bg);
  letter-spacing: 0.02em;
}
.tag-meta {
  font-family: var(--font-cn);
  font-size: 13px;
  letter-spacing: 0.04em;
  opacity: 0.6;
  line-height: 1.7;
}

.brand-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  opacity: 0.55;
}
.status-dot {
  width: 6px; height: 6px;
  background: var(--green);
  border-radius: 50%;
  display: inline-block;
  animation: blink 2s infinite;
}

/* 右侧表单 */
.login-right {
  padding: 44px 40px;
  display: flex;
  flex-direction: column;
}

.form-header {
  margin-bottom: 6px;
}
.header-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.22em;
  font-weight: 500;
  opacity: 0.5;
  text-transform: uppercase;
}

.form-title {
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 6px;
  color: var(--ink);
}
.form-subtitle {
  font-family: var(--font-cn);
  font-size: 13px;
  opacity: 0.55;
  margin-bottom: 32px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  display: flex;
  align-items: center;
}
.label-text {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  font-weight: 500;
  text-transform: uppercase;
  opacity: 0.7;
}

.submit-btn {
  margin-top: 10px;
  padding: 13px;
  font-size: 14px;
  letter-spacing: 0.18em;
  border-radius: 2px;
}

.form-footer {
  margin-top: 22px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-cn);
  font-size: 13px;
}
.footer-text { opacity: 0.6; }
.switch-btn {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  background: transparent;
  color: var(--yellow);
  border: 1px solid var(--yellow);
  padding: 5px 14px;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s ease;
}
.switch-btn:hover {
  background: var(--yellow);
  color: var(--white);
}

/* 演示账号提示 */
.demo-hint {
  margin-top: 26px;
  padding: 16px 18px;
  background: rgba(184, 146, 74, 0.06);
  border-left: 2px solid var(--yellow);
  border-radius: 0 2px 2px 0;
}
.hint-title {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.2em;
  opacity: 0.55;
  margin-bottom: 10px;
  text-transform: uppercase;
}
.hint-row {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 3px 0;
}
.hint-key {
  opacity: 0.55;
}
.hint-val {
  font-weight: 500;
  color: var(--ink);
}

@media (max-width: 768px) {
  .login-card { grid-template-columns: 1fr; max-width: 460px; }
  .login-left { display: none; }
  .login-right { padding: 32px 26px; }
  .form-title { font-size: 28px; }
}
</style>
