/**
 * 用户管理 · 分组紧凑行列表
 * - 按角色分组(管理员 / 借阅者),每组带计数
 * - 每个用户一行:头像 + 用户名 + 状态 + 关联读者 + 注册时间 + 操作
 * - useQuery 获取全部用户,前端按角色分组
 * - useMutation 新增 / 切换状态 / 删除
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '@/store/uiStore'
import { UserAPI } from '@/api'
import type { Role, User } from '@/types'

const fmtDate = (d?: string) => (d ? String(d).replace('T', ' ').slice(0, 16) : '-')

interface UserForm {
  username: string
  password: string
  role: Role
  readerId: string
}

const emptyForm: UserForm = { username: '', password: '', role: 'READER', readerId: '' }

export default function UsersView() {
  const queryClient = useQueryClient()
  const { showToast, confirmFn } = useUIStore()
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<UserForm>(emptyForm)

  const { data: list = [], isLoading } = useQuery<User[]>({
    queryKey: ['users', roleFilter],
    queryFn: async () => {
      const res = await UserAPI.list((roleFilter || undefined) as Role | undefined)
      if (res.ok) return res.data ?? []
      showToast(res.message || '加载失败', 'error')
      return []
    },
  })

  // 前端按角色分组
  const admins = list.filter((u) => u.role === 'ADMIN')
  const readers = list.filter((u) => u.role === 'READER')

  const addMutation = useMutation({
    mutationFn: (data: Partial<User>) => UserAPI.add(data),
    onSuccess: (res) => {
      if (res.ok) {
        showToast('新增成功', 'success')
        queryClient.invalidateQueries({ queryKey: ['users'] })
        setDialogOpen(false)
      } else {
        showToast(res.message || '新增失败', 'error')
      }
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (id: number) => UserAPI.toggleStatus(id),
    onSuccess: (res) => {
      if (res.ok) {
        showToast('操作成功', 'success')
        queryClient.invalidateQueries({ queryKey: ['users'] })
      } else {
        showToast(res.message || '操作失败', 'error')
      }
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => UserAPI.remove(id),
    onSuccess: (res) => {
      if (res.ok) {
        showToast('删除成功', 'success')
        queryClient.invalidateQueries({ queryKey: ['users'] })
      } else {
        showToast(res.message || '删除失败', 'error')
      }
    },
  })

  const set = <K extends keyof UserForm>(k: K, v: UserForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  const openAdd = () => {
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const doAdd = () => {
    if (!form.username || !form.password) {
      showToast('用户名和密码必填', 'error')
      return
    }
    const payload: Partial<User> = {
      username: form.username,
      password: form.password,
      role: form.role || 'READER',
      readerId: form.readerId ? Number(form.readerId) : null,
    }
    addMutation.mutate(payload)
  }

  const toggleStatus = async (row: User) => {
    const action = row.status === 'ACTIVE' ? '禁用' : '启用'
    const ok = await confirmFn(`${action}确认`, `确定${action}用户「${row.username}」吗？`)
    if (!ok) return
    toggleMutation.mutate(row.id)
  }

  const remove = async (row: User) => {
    const ok = await confirmFn('删除确认', `确定删除用户「${row.username}」吗？此操作不可恢复。`)
    if (!ok) return
    removeMutation.mutate(row.id)
  }

  const initial = (name: string) => (name || '?').charAt(0).toUpperCase()

  /** 渲染一组用户 */
  const renderGroup = (title: string, users: User[]) => {
    if (users.length === 0) return null
    return (
      <div className="group-section" key={title}>
        <div className="group-header">
          <span className="group-header-title">{title}</span>
          <span className="group-header-count">{users.length}</span>
          <span className="group-header-line" />
        </div>
        <div className="compact-list">
          {users.map((u) => (
            <div className="compact-row" key={u.id}>
              {/* 用户名 + 头像 */}
              <div className="compact-row-main">
                <div className={`compact-avatar ${u.role === 'ADMIN' ? 'admin' : 'reader'}`}>
                  {initial(u.username)}
                </div>
                <span className="compact-name">{u.username}</span>
              </div>
              {/* 状态 */}
              <div className="compact-cell">
                <span className={`badge ${u.status === 'ACTIVE' ? 'badge-active' : 'badge-disabled'}`}>
                  {u.status === 'ACTIVE' ? '正常' : '禁用'}
                </span>
              </div>
              {/* 角色 */}
              <div className="compact-cell">
                <span className={`role-tag ${u.role === 'ADMIN' ? 'admin' : 'reader'}`}>
                  {u.role === 'ADMIN' ? '管理员' : '借阅者'}
                </span>
              </div>
              {/* 关联读者 / 注册时间 */}
              <div className="compact-cell">
                {u.readerId ? (
                  <span>
                    {u.readerName || '-'}{' '}
                    <span className="compact-cell mute">#{u.readerId}</span>
                  </span>
                ) : (
                  <span className="compact-cell mute">— 未关联</span>
                )}
              </div>
              {/* 操作 */}
              <div className="compact-actions">
                <button
                  className={`mini-btn ${u.status === 'ACTIVE' ? 'danger' : 'green'}`}
                  disabled={toggleMutation.isPending}
                  onClick={() => toggleStatus(u)}
                >
                  {u.status === 'ACTIVE' ? '禁用' : '启用'}
                </button>
                <button className="mini-btn danger" onClick={() => remove(u)}>删除</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="view-header">
        <div>
          <h1 className="view-title">用户管理<span style={{ color: 'var(--terracotta)' }}>.</span></h1>
          <div className="view-subtitle">Users · 账号与权限</div>
        </div>
        <button className="lib-btn primary" onClick={openAdd}>新增用户</button>
      </div>

      {/* 角色筛选药丸 */}
      <div className="stat-pills">
        <button
          className={`stat-pill ${roleFilter === '' ? 'active' : ''}`}
          onClick={() => setRoleFilter('')}
        >
          全部 <span className="stat-pill-num">{admins.length + readers.length}</span>
        </button>
        <button
          className={`stat-pill ${roleFilter === 'ADMIN' ? 'active' : ''}`}
          onClick={() => setRoleFilter('ADMIN')}
        >
          管理员 <span className="stat-pill-num">{admins.length}</span>
        </button>
        <button
          className={`stat-pill ${roleFilter === 'READER' ? 'active' : ''}`}
          onClick={() => setRoleFilter('READER')}
        >
          借阅者 <span className="stat-pill-num">{readers.length}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="loading-block">加载中...</div>
      ) : list.length === 0 ? (
        <div className="empty-block">暂无数据</div>
      ) : (
        <>
          {roleFilter !== 'READER' && renderGroup('管理员', admins)}
          {roleFilter !== 'ADMIN' && renderGroup('借阅者', readers)}
        </>
      )}

      {dialogOpen && (
        <div className="dialog-mask" onClick={() => setDialogOpen(false)}>
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-title">新增用户</div>
              <button className="dialog-close" onClick={() => setDialogOpen(false)}>×</button>
            </div>
            <div className="dialog-body">
              <div>
                <label className="lib-label">用户名 *</label>
                <input className="lib-input" value={form.username}
                  onChange={(e) => set('username', e.target.value)} />
              </div>
              <div>
                <label className="lib-label">密码 *</label>
                <input className="lib-input" type="password" value={form.password}
                  onChange={(e) => set('password', e.target.value)} />
              </div>
              <div>
                <label className="lib-label">角色</label>
                <select className="filter-select" value={form.role}
                  onChange={(e) => set('role', e.target.value as Role)}>
                  <option value="READER">借阅者</option>
                  <option value="ADMIN">管理员</option>
                </select>
              </div>
              <div>
                <label className="lib-label">关联读者 ID(选填,借阅者角色可绑定)</label>
                <input className="lib-input" type="number" value={form.readerId}
                  onChange={(e) => set('readerId', e.target.value)} />
              </div>
            </div>
            <div className="dialog-foot">
              <button className="lib-btn" onClick={() => setDialogOpen(false)}>取消</button>
              <button className="lib-btn primary" disabled={addMutation.isPending} onClick={doAdd}>
                {addMutation.isPending ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
