/**
 * Bibliotheca · API 层
 * axios 实例 + 10 个领域模块,全部类型化
 */
import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type {
  ApiResult,
  Book,
  BookQuery,
  Borrow,
  BorrowRequest,
  CallResult,
  Category,
  CategoryStat,
  ChangePasswordDTO,
  LoginDTO,
  Notice,
  Page,
  Reader,
  RegisterDTO,
  Review,
  ReviewSummary,
  Role,
  StatsOverview,
  ReaderOverview,
  TopBook,
  User,
} from '@/types'

/* ============================================================
 * axios 实例
 * ============================================================ */

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true,
})

// 请求拦截器
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (error) => Promise.reject(error),
)

// 响应拦截器:抽出 data;401 触发全局事件
http.interceptors.response.use(
  (response: AxiosResponse<ApiResult>) => response.data as unknown as AxiosResponse,
  (error: AxiosError<ApiResult>) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth-expired'))
    }
    return Promise.reject(error)
  },
)

/* ============================================================
 * 统一封装:返回 { ok, data, message }
 * ============================================================ */

async function call<T>(fn: () => Promise<ApiResult<T>>): Promise<CallResult<T>> {
  try {
    const res = await fn()
    return { ok: res.code === 200, data: res.data, message: res.message }
  } catch (e) {
    const err = e as AxiosError<ApiResult>
    const msg = err.response?.data?.message || err.message || '网络错误'
    return { ok: false, data: null, message: msg }
  }
}

/* ============================================================
 * 认证模块
 * ============================================================ */
export const AuthAPI = {
  login: (data: LoginDTO) => call<User>(() => http.post('/auth/login', data)),
  register: (data: RegisterDTO) => call<void>(() => http.post('/auth/register', data)),
  logout: () => call<void>(() => http.post('/auth/logout')),
  current: () => call<User>(() => http.get('/auth/current')),
  changePassword: (data: ChangePasswordDTO) => call<void>(() => http.post('/auth/change-password', data)),
}

/* ============================================================
 * 用户模块(管理员)
 * ============================================================ */
export const UserAPI = {
  list: (role?: Role) => call<User[]>(() => http.get('/users', { params: { role } })),
  getById: (id: number) => call<User>(() => http.get(`/users/${id}`)),
  add: (data: Partial<User>) => call<void>(() => http.post('/users', data)),
  toggleStatus: (id: number) => call<void>(() => http.put(`/users/${id}/status`)),
  remove: (id: number) => call<void>(() => http.delete(`/users/${id}`)),
}

/* ============================================================
 * 图书模块
 * ============================================================ */
export const BookAPI = {
  list: (name?: string) => call<Book[]>(() => http.get('/books', { params: { name } })),
  page: (params: BookQuery) => call<Page<Book>>(() => http.get('/books/page', { params })),
  getById: (id: number) => call<Book>(() => http.get(`/books/${id}`)),
  add: (data: Partial<Book>) => call<void>(() => http.post('/books', data)),
  update: (data: Partial<Book>) => call<void>(() => http.put('/books', data)),
  remove: (id: number) => call<void>(() => http.delete(`/books/${id}`)),
}

/* ============================================================
 * 分类模块
 * ============================================================ */
export const CategoryAPI = {
  list: () => call<Category[]>(() => http.get('/categories')),
  getById: (id: number) => call<Category>(() => http.get(`/categories/${id}`)),
  add: (data: Partial<Category>) => call<void>(() => http.post('/categories', data)),
  update: (data: Partial<Category>) => call<void>(() => http.put('/categories', data)),
  remove: (id: number) => call<void>(() => http.delete(`/categories/${id}`)),
}

/* ============================================================
 * 读者模块
 * ============================================================ */
export const ReaderAPI = {
  list: (keyword?: string) => call<Reader[]>(() => http.get('/readers', { params: { keyword } })),
  getById: (id: number) => call<Reader>(() => http.get(`/readers/${id}`)),
  add: (data: Partial<Reader>) => call<void>(() => http.post('/readers', data)),
  update: (data: Partial<Reader>) => call<void>(() => http.put('/readers', data)),
  remove: (id: number) => call<void>(() => http.delete(`/readers/${id}`)),
}

/* ============================================================
 * 借阅模块
 * ============================================================ */
export const BorrowAPI = {
  list: (status?: string, readerId?: number) =>
    call<Borrow[]>(() => http.get('/borrows', { params: { status, readerId } })),
  getById: (id: number) => call<Borrow>(() => http.get(`/borrows/${id}`)),
  myBorrows: (readerId: number) => call<Borrow[]>(() => http.get(`/borrows/my/${readerId}`)),
  borrow: (data: Partial<Borrow>) => call<void>(() => http.post('/borrows/borrow', data)),
  returnBook: (id: number) => call<void>(() => http.post(`/borrows/return/${id}`)),
}

/* ============================================================
 * 借阅申请模块
 * ============================================================ */
export const BorrowRequestAPI = {
  apply: (data: Partial<BorrowRequest>) => call<void>(() => http.post('/borrow-requests/apply', data)),
  my: (status?: string) => call<BorrowRequest[]>(() => http.get('/borrow-requests/my', { params: { status } })),
  cancel: (id: number) => call<void>(() => http.post(`/borrow-requests/${id}/cancel`)),
  list: (status?: string) => call<BorrowRequest[]>(() => http.get('/borrow-requests', { params: { status } })),
  approve: (id: number, adminRemark?: string) =>
    call<void>(() => http.post(`/borrow-requests/${id}/approve`, null, { params: { adminRemark } })),
  reject: (id: number, adminRemark?: string) =>
    call<void>(() => http.post(`/borrow-requests/${id}/reject`, null, { params: { adminRemark } })),
  pendingCount: () => call<number>(() => http.get('/borrow-requests/pending-count')),
  getById: (id: number) => call<BorrowRequest>(() => http.get(`/borrow-requests/${id}`)),
}

/* ============================================================
 * 公告模块
 * ============================================================ */
export const NoticeAPI = {
  published: (type?: string) => call<Notice[]>(() => http.get('/notices/published', { params: { type } })),
  pinned: () => call<Notice[]>(() => http.get('/notices/pinned')),
  list: (type?: string) => call<Notice[]>(() => http.get('/notices', { params: { type } })),
  getById: (id: number) => call<Notice>(() => http.get(`/notices/${id}`)),
  add: (data: Partial<Notice>) => call<void>(() => http.post('/notices', data)),
  update: (data: Partial<Notice>) => call<void>(() => http.put('/notices', data)),
  togglePinned: (id: number, pinned: boolean) =>
    call<void>(() => http.put(`/notices/${id}/pinned`, null, { params: { pinned } })),
  remove: (id: number) => call<void>(() => http.delete(`/notices/${id}`)),
}

/* ============================================================
 * 评价模块
 * ============================================================ */
export const ReviewAPI = {
  bookReviews: (bookId: number) => call<Review[]>(() => http.get(`/reviews/book/${bookId}`)),
  summary: (bookId: number) => call<ReviewSummary>(() => http.get(`/reviews/book/${bookId}/summary`)),
  my: () => call<Review[]>(() => http.get('/reviews/my')),
  myByBook: (bookId: number) => call<Review | null>(() => http.get(`/reviews/my/${bookId}`)),
  submit: (data: Partial<Review>) => call<void>(() => http.post('/reviews', data)),
  remove: (id: number) => call<void>(() => http.delete(`/reviews/${id}`)),
}

/* ============================================================
 * 统计模块
 * ============================================================ */
export const StatsAPI = {
  overview: () => call<StatsOverview>(() => http.get('/stats/overview')),
  booksPerCategory: () => call<CategoryStat[]>(() => http.get('/stats/books-per-category')),
  topBorrowed: (limit = 5) => call<TopBook[]>(() => http.get('/stats/top-borrowed', { params: { limit } })),
  recentBorrows: (limit = 10) => call<Borrow[]>(() => http.get('/stats/recent-borrows', { params: { limit } })),
  myOverview: (readerId: number) => call<ReaderOverview>(() => http.get(`/stats/my-overview/${readerId}`)),
}

export default http
