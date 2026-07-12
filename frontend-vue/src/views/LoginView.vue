<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { AuthAPI } from '../api.js'
import { authStore } from '../store/auth.js'
import { showToast } from '../composables/useToast.js'
import PasswordToggle from '../components/PasswordToggle.vue'

const router = useRouter()

const mode = ref('login')
const loading = ref(false)
const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  readerId: null
})

async function submit() {
  if (!form.username || !form.password) {
    showToast('error', '用户名和密码不能为空')
    return
  }
  if (mode.value === 'register') {
    if (form.password !== form.confirmPassword) {
      showToast('error', '两次密码不一致')
      return
    }
  }
  loading.value = true
  try {
    if (mode.value === 'login') {
      const res = await AuthAPI.login({ username: form.username, password: form.password })
      if (res.data.code === 200) {
        authStore.setUser(res.data.data)
        showToast('success', '欢迎回来,' + res.data.data.username)
        router.push(res.data.data.role === 'ADMIN' ? '/admin/dashboard' : '/reader/dashboard')
      } else {
        showToast('error', res.data.message || '登录失败')
      }
    } else {
      const payload = {
        username: form.username,
        password: form.password,
        role: 'READER',
        readerId: form.readerId || null
      }
      const res = await AuthAPI.register(payload)
      if (res.data.code === 200) {
        showToast('success', '注册成功,请登录')
        mode.value = 'login'
        form.password = ''
        form.confirmPassword = ''
      } else {
        showToast('error', res.data.message || '注册失败')
      }
    }
  } catch (e) {
    showToast('error', '网络错误')
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
            <PasswordToggle v-model="form.password" placeholder="必填" />
          </div>

          <div v-if="mode === 'register'" class="form-group">
            <label class="form-label">
              <span class="label-text">确认密码</span>
            </label>
            <PasswordToggle v-model="form.confirmPassword" placeholder="再次输入" />
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
  background: var(--bg-subtle);
  position: relative;
  overflow: hidden;
}

.login-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 20% 50%, rgba(217,119,87,0.06) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 80%, rgba(107,91,122,0.04) 0%, transparent 50%);
  pointer-events: none;
}

.login-card {
  background: var(--card);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-2xl);
  width: 100%;
  max-width: 900px;
  display: grid;
  grid-template-columns: 360px 1fr;
  border-radius: var(--radius-xl);
  overflow: hidden;
  position: relative;
  animation: fadeSlideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.login-left {
  background: linear-gradient(160deg, #1a1917 0%, #2c2a26 50%, #1f1d1a 100%);
  color: var(--bg);
  padding: 40px 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.login-left::before {
  content: '';
  position: absolute;
  top: -30%;
  right: -30%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 70% 30%, rgba(217,119,87,0.12) 0%, transparent 50%);
  pointer-events: none;
}

.login-left::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(to top, rgba(217,119,87,0.06), transparent);
  pointer-events: none;
}

.brand-mark {
  font-family: var(--font-editorial);
  font-size: 32px;
  font-weight: 900;
  font-style: italic;
  line-height: 1;
  color: var(--primary);
  letter-spacing: -0.02em;
  position: relative;
  text-shadow: 0 2px 8px rgba(217,119,87,0.2);
}
.brand-sub {
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.16em;
  margin-top: 10px;
  opacity: 0.45;
  font-weight: 600;
  text-transform: uppercase;
}

.brand-tagline {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
  position: relative;
}
.tag-line {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.24em;
  color: var(--primary);
  opacity: 0.6;
  text-transform: uppercase;
}
.tag-title {
  font-family: var(--font-editorial);
  font-size: 52px;
  font-weight: 900;
  line-height: 1.05;
  color: var(--bg);
  letter-spacing: -0.02em;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}
.tag-meta {
  font-family: var(--font-sans);
  font-size: 13px;
  letter-spacing: 0.02em;
  opacity: 0.4;
  line-height: 1.8;
  font-weight: 400;
}

.brand-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.12em;
  opacity: 0.4;
  position: relative;
}
.brand-footer .status-dot {
  width: 6px; height: 6px;
  background: var(--success);
  border-radius: 50%;
  display: inline-block;
  animation: blink 2s infinite;
  box-shadow: 0 0 6px rgba(140,160,111,0.5);
}

.login-right {
  padding: 48px 44px;
  display: flex;
  flex-direction: column;
}

.form-header { margin-bottom: 8px; }
.header-label {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.2em;
  font-weight: 600;
  color: var(--primary);
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-label::before {
  content: '';
  width: 16px;
  height: 2px;
  background: var(--primary);
  border-radius: 1px;
}

.form-title {
  font-family: var(--font-editorial);
  font-size: 34px;
  font-weight: 900;
  line-height: 1.1;
  margin-bottom: 8px;
  color: var(--foreground);
  letter-spacing: -0.02em;
}
.form-subtitle {
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--muted);
  margin-bottom: 36px;
  line-height: 1.6;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-label { display: flex; align-items: center; }
.label-text {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--muted);
  text-transform: uppercase;
}

.submit-btn {
  margin-top: 12px;
  padding: 13px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  border-radius: var(--radius);
}

.form-footer {
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-sans);
  font-size: 13px;
}
.footer-text { color: var(--muted); }
.switch-btn {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
  padding: 7px 18px;
  cursor: pointer;
  border-radius: var(--radius-full);
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}
.switch-btn:hover {
  background: var(--primary);
  color: white;
  box-shadow: var(--shadow-glow);
}

.demo-hint {
  margin-top: 28px;
  padding: 16px 18px;
  background: var(--bg-subtle);
  border-left: 3px solid var(--primary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
.hint-title {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.16em;
  color: var(--muted);
  margin-bottom: 12px;
  text-transform: uppercase;
  font-weight: 600;
}
.hint-row {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 4px 0;
}
.hint-key { color: var(--muted); }
.hint-val { font-weight: 600; color: var(--foreground); }

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .login-card { grid-template-columns: 1fr; max-width: 480px; }
  .login-left { display: none; }
  .login-right { padding: 36px 28px; }
  .form-title { font-size: 28px; }
}
</style>
