/**
 * UI store · Toast + ConfirmDialog
 * - showToast: 3 秒自动消失
 * - confirmFn: 返回 Promise<boolean>,组件内通过 confirmState 渲染
 */
import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  message: string
  type: ToastType
}

export interface ConfirmState {
  open: boolean
  title: string
  message: string
  onResolve: ((v: boolean) => void) | null
}

interface UIState {
  toasts: ToastItem[]
  confirmState: ConfirmState
  showToast: (message: string, type?: ToastType) => void
  dismissToast: (id: number) => void
  confirmFn: (title: string, message: string) => Promise<boolean>
  resolveConfirm: (v: boolean) => void
}

let toastId = 0

export const useUIStore = create<UIState>((set, get) => ({
  toasts: [],
  confirmState: { open: false, title: '', message: '', onResolve: null },

  showToast: (message, type = 'info') => {
    const id = ++toastId
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => get().dismissToast(id), 3000)
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  confirmFn: (title, message) =>
    new Promise<boolean>((resolve) => {
      set({
        confirmState: { open: true, title, message, onResolve: resolve },
      })
    }),

  resolveConfirm: (v) => {
    const { confirmState } = get()
    confirmState.onResolve?.(v)
    set({ confirmState: { open: false, title: '', message: '', onResolve: null } })
  },
}))
