/**
 * 认证状态 store
 * - user: 当前登录用户(null 表示未登录)
 * - initialized: 是否已尝试恢复会话(避免首屏闪烁)
 */
import { create } from 'zustand'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  initialized: boolean
  setUser: (u: User | null) => void
  clearUser: () => void
  setInitialized: (v: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  setUser: (u) => set({ user: u }),
  clearUser: () => set({ user: null }),
  setInitialized: (v) => set({ initialized: v }),
}))

/** 派生:是否已登录 */
export const useIsLoggedIn = () => useAuthStore((s) => s.user !== null)

/** 派生:是否管理员 */
export const useIsAdmin = () => useAuthStore((s) => s.user?.role === 'ADMIN')
