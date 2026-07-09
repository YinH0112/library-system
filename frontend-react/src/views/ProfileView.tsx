/**
 * 个人信息页 · Atelier 风格
 * - pill 风格 tab(资料 / 安全)
 * - 卡片式资料网格
 * - 修改密码表单(独立卡片)
 */
import { useState } from 'react'
import { AuthAPI } from '@/api'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

type Tab = 'info' | 'password'

const fmtDate = (d?: string) => (d ? String(d).replace('T', ' ').slice(0, 16) : '-')

export default function ProfileView() {
  const user = useAuthStore((s) => s.user)
  const showToast = useUIStore((s) => s.showToast)
  const [tab, setTab] = useState<Tab>('info')

  const [pwd, setPwd] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)

  const changePassword = async () => {
    if (!pwd.oldPassword || !pwd.newPassword) {
      showToast('请填写完整', 'error')
      return
    }
    if (pwd.newPassword !== pwd.confirmPassword) {
      showToast('两次新密码不一致', 'error')
      return
    }
    if (pwd.newPassword.length < 6) {
      showToast('新密码至少 6 位', 'error')
      return
    }
    setSaving(true)
    const res = await AuthAPI.changePassword({
      oldPassword: pwd.oldPassword,
      newPassword: pwd.newPassword,
    })
    if (res.ok) {
      showToast('密码修改成功', 'success')
      setPwd({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } else {
      showToast(res.message || '修改失败', 'error')
    }
    setSaving(false)
  }

  if (!user) return null

  const initial = (user.username || '?').charAt(0).toUpperCase()

  return (
    <div>
      <div className="view-header">
        <div>
          <h1 className="view-title">
            个人信息<span style={{ color: 'var(--terracotta)' }}>.</span>
          </h1>
          <div className="view-subtitle">Profile · 账号资料与安全</div>
        </div>
      </div>

      <div className="tab-bar">
        <button
          className={`tab-item ${tab === 'info' ? 'active' : ''}`}
          onClick={() => setTab('info')}
        >
          资料信息
        </button>
        <button
          className={`tab-item ${tab === 'password' ? 'active' : ''}`}
          onClick={() => setTab('password')}
        >
          修改密码
        </button>
      </div>

      {tab === 'info' ? (
        <>
          {/* 用户头部卡片 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            padding: '24px',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '20px',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--forest)',
              color: 'var(--white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 600,
              flexShrink: 0,
            }}>
              {initial}
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--forest)',
              }}>
                {user.username}
              </div>
              <div style={{ marginTop: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={`role-tag ${user.role === 'ADMIN' ? 'admin' : 'reader'}`}>
                  {user.role === 'ADMIN' ? '管理员' : '借阅者'}
                </span>
                <span className={`badge ${user.status === 'ACTIVE' ? 'badge-available' : 'badge-out'}`}>
                  {user.status === 'ACTIVE' ? '正常' : '已禁用'}
                </span>
              </div>
            </div>
          </div>

          {/* 资料网格 */}
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">用户名</div>
              <div className="info-value">{user.username}</div>
            </div>
            <div className="info-item">
              <div className="info-label">角色</div>
              <div className="info-value">
                {user.role === 'ADMIN' ? '管理员' : '借阅者'}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">账号状态</div>
              <div className="info-value">
                <span className={`badge ${user.status === 'ACTIVE' ? 'badge-available' : 'badge-out'}`}>
                  {user.status === 'ACTIVE' ? '正常' : '已禁用'}
                </span>
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">读者档案</div>
              <div className="info-value">
                {user.readerName || (user.readerId ? `#${user.readerId}` : '未关联')}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">注册时间</div>
              <div className="info-value mono">{fmtDate(user.createTime)}</div>
            </div>
          </div>
        </>
      ) : (
        <div className="pwd-form">
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--forest)',
            marginBottom: '20px',
          }}>
            修改密码
          </div>
          <div className="form-group">
            <label className="lib-label">原密码</label>
            <input
              className="lib-input"
              type="password"
              value={pwd.oldPassword}
              onChange={(e) => setPwd((p) => ({ ...p, oldPassword: e.target.value }))}
              placeholder="请输入原密码"
            />
          </div>
          <div className="form-group">
            <label className="lib-label">新密码</label>
            <input
              className="lib-input"
              type="password"
              value={pwd.newPassword}
              onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
              placeholder="至少 6 位"
            />
          </div>
          <div className="form-group">
            <label className="lib-label">确认新密码</label>
            <input
              className="lib-input"
              type="password"
              value={pwd.confirmPassword}
              onChange={(e) => setPwd((p) => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="再次输入新密码"
            />
          </div>
          <button
            className="lib-btn primary"
            disabled={saving}
            onClick={changePassword}
          >
            {saving ? '提交中...' : '确认修改'}
          </button>
        </div>
      )}
    </div>
  )
}
