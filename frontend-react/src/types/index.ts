/**
 * Bibliotheca · 类型定义
 * 对齐后端实体与 API 响应结构
 */

/* ============ 通用 ============ */

export type Role = 'ADMIN' | 'READER'
export type UserStatus = 'ACTIVE' | 'DISABLED'

/** 后端统一响应体 Result<T> */
export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
}

/** call() 统一封装后的返回值 */
export interface CallResult<T = unknown> {
  ok: boolean
  data: T | null
  message: string
}

/* ============ 实体 ============ */

export interface User {
  id: number
  username: string
  password?: string
  role: Role
  readerId?: number | null
  status: UserStatus
  createTime?: string
  readerName?: string | null
}

export interface Reader {
  id: number
  name: string
  gender?: string
  phone?: string
  email?: string
  address?: string
  createTime?: string
}

export interface Category {
  id: number
  name: string
  description?: string
  bookCount?: number
  createTime?: string
}

export interface Book {
  id: number
  name: string
  author?: string
  publisher?: string
  isbn?: string
  categoryId?: number
  categoryName?: string
  stock?: number
  totalStock?: number
  description?: string
  location?: string
  publishYear?: number
  createTime?: string
}

export type BorrowStatus = 'BORROWED' | 'RETURNED' | 'OVERDUE'

export interface Borrow {
  id: number
  bookId: number
  bookName?: string
  readerId: number
  readerName?: string
  borrowDate?: string
  dueDate?: string
  returnDate?: string
  status: BorrowStatus
  fine?: number
  remark?: string
}

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface BorrowRequest {
  id: number
  bookId: number
  bookName?: string
  readerId: number
  readerName?: string
  requestDate?: string
  dueDays?: number
  status: RequestStatus
  approveDate?: string
  approverId?: number
  approverName?: string
  adminRemark?: string
  readerRemark?: string
}

export type NoticeType = 'NOTICE' | 'ANNOUNCEMENT' | 'MAINTENANCE'

export interface Notice {
  id: number
  title: string
  content: string
  type: NoticeType
  publishDate?: string
  publisherId?: number
  publisherName?: string
  pinned?: number
  status?: string
  createTime?: string
}

export interface Review {
  id: number
  bookId: number
  bookName?: string
  readerId: number
  readerName?: string
  rating: number
  content: string
  createTime?: string
}

export interface ReviewSummary {
  bookId: number
  avgRating: number
  total: number
  distribution: Array<{ rating: number; count: number }>
}

/* ============ 统计 ============ */

export interface StatsOverview {
  totalBooks?: number
  totalReaders?: number
  totalBorrows?: number
  activeBorrows?: number
  overdueCount?: number
  totalCategories?: number
  totalStock?: number
}

export interface ReaderOverview {
  totalBorrows?: number
  activeBorrows?: number
  returnedCount?: number
  overdueCount?: number
  totalFine?: number
}

export interface CategoryStat {
  categoryId: number
  categoryName: string
  bookCount: number
}

export interface TopBook {
  bookId: number
  bookName: string
  author?: string
  borrowCount: number
}

/* ============ 分页 ============ */

export interface Page<T> {
  records: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface BookQuery {
  page?: number
  size?: number
  name?: string
  author?: string
  categoryId?: number | string
}

/* ============ 登录/请求 DTO ============ */

export interface LoginDTO {
  username: string
  password: string
}

export interface RegisterDTO {
  username: string
  password: string
  role?: Role
  readerName?: string
}

export interface ChangePasswordDTO {
  oldPassword: string
  newPassword: string
}
