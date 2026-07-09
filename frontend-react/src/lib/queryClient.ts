/**
 * TanStack Query 客户端配置
 * - staleTime 30s:避免短时间重复请求
 * - retry 1:网络抖动重试一次
 * - refetchOnWindowFocus:false 关闭聚焦自动刷新(后台管理系统常用配置)
 */
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
