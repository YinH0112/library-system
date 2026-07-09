/**
 * 登录/注册页 · Atelier 风格
 * - 左:森林绿装饰板(品牌 + 引语 + 装饰圆环)
 * - 右:暖米白表单(pill 风格 tab 切换)
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthAPI } from '@/api'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import type { Role } from '@/types'

type Mode = 'login' | 'register'

export default function LoginView() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const showToast = useUIStore((s) => s.showToast)

  const [mode, setMode] = useState<Mode>('login')
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    readerName: '',
  })
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!form.username || !form.password) {
      showToast('请输入用户名和密码', 'error')
      return
    }
    if (mode === 'register' && form.password !== form.confirmPassword) {
      showToast('两次密码输入不一致', 'error')
      return
    }
    setLoading(true)

    if (mode === 'login') {
      const res = await AuthAPI.login({ username: form.username, password: form.password })
      if (res.ok && res.data) {
        setUser(res.data)
        showToast('登录成功', 'success')
        navigate(res.data.role === 'ADMIN' ? '/admin/dashboard' : '/reader/dashboard', { replace: true })
      } else {
        showToast(res.message || '登录失败', 'error')
      }
    } else {
      const role: Role = 'READER'
      const res = await AuthAPI.register({
        username: form.username,
        password: form.password,
        role,
        readerName: form.readerName || form.username,
      })
      if (res.ok) {
        showToast('注册成功,请登录', 'success')
        setMode('login')
        setForm((p) => ({ ...p, confirmPassword: '', readerName: '' }))
      } else {
        showToast(res.message || '注册失败', 'error')
      }
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      {/* 左:森林绿装饰板 */}
      <div className="login-deco">
        <div>
          <div className="deco-mark">Bibliotheca</div>
          <div className="deco-sub">ATELIER · 学院图书馆</div>
        </div>

        <div className="deco-quote">
          A library is not a luxury<br />
          but one of the necessities of life.
        </div>

        <div className="deco-foot">
          © {new Date().getFullYear()} BIBLIOTHECA · CRAFTED WITH CARE
        </div>
      </div>

      {/* 右:表单区 */}
      <div className="login-form-panel">
        <div className="login-form">
          {/* pill 风格 tab */}
          <div className="login-tabs">
            <button
              className={`login-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              登 录
            </button>
            <button
              className={`login-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
            >
              注 册
            </button>
          </div>

          <div className="form-title">
            {mode === 'login' ? '欢迎回来' : '创建借阅者账号'}
          </div>

          <div className="form-group">
            <label className="lib-label">用户名</label>
            <input
              className="lib-input"
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              placeholder="请输入用户名"
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </div>

          <div className="form-group">
            <label className="lib-label">密码</label>
            <input
              className="lib-input"
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="请输入密码"
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </div>

          {mode === 'register' && (
            <>
              <div className="form-group">
                <label className="lib-label">确认密码</label>
                <input
                  className="lib-input"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="再次输入密码"
                />
              </div>
              <div className="form-group">
                <label className="lib-label">读者姓名(选填)</label>
                <input
                  className="lib-input"
                  value={form.readerName}
                  onChange={(e) => setForm((p) => ({ ...p, readerName: e.target.value }))}
                  placeholder="默认使用用户名"
                />
              </div>
            </>
          )}

          <button
            className="lib-btn primary block"
            disabled={loading}
            onClick={submit}
          >
            {loading ? '处理中...' : mode === 'login' ? '登 录' : '注 册'}
          </button>

          <div className="form-hint">
            {mode === 'login' ? (
              <>
                没有账号?
                <button className="link-btn" onClick={() => setMode('register')}>立即注册</button>
              </>
            ) : (
              <>
                已有账号?
                <button className="link-btn" onClick={() => setMode('login')}>返回登录</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
