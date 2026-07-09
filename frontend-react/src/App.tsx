/**
 * App 根组件
 * - 初始化:调 AuthAPI.current() 恢复会话
 * - 未初始化显示启动屏,已初始化渲染路由
 * - 全局挂载 Toast + ConfirmDialog
 */
import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AuthAPI } from '@/api'
import { useAuthStore } from '@/store/authStore'
import { router } from './router'
import Toast from './components/Toast'
import ConfirmDialog from './components/ConfirmDialog'

export default function App() {
  const { initialized, setUser, setInitialized } = useAuthStore()

  useEffect(() => {
    const init = async () => {
      const res = await AuthAPI.current()
      if (res.ok && res.data) {
        setUser(res.data)
      }
      setInitialized(true)
    }
    init()
  }, [setUser, setInitialized])

  if (!initialized) {
    return (
      <div className="startup-screen">
        <div className="startup-mark">Bibliotheca</div>
        <div className="startup-sub">加载中...</div>
      </div>
    )
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toast />
      <ConfirmDialog />
    </>
  )
}
