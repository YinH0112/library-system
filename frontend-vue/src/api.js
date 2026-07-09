import axios from 'axios'

const http = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  withCredentials: true  // 关键:session 认证需要携带 cookie
})

// 响应拦截器:401 跳转登录
http.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // 触发全局登录失效事件
      window.dispatchEvent(new CustomEvent('auth-expired'))
    }
    return Promise.reject(error)
  }
)

export const AuthAPI = {
  login: (data) => http.post('/auth/login', data),
  register: (data) => http.post('/auth/register', data),
  logout: () => http.post('/auth/logout'),
  current: () => http.get('/auth/current'),
  changePassword: (data) => http.post('/auth/change-password', data)
}

export const UserAPI = {
  list: (role) => http.get('/users', { params: role ? { role } : {} }),
  getById: (id) => http.get('/users/' + id),
  add: (data) => http.post('/users', data),
  toggleStatus: (id) => http.put('/users/' + id + '/status'),
  remove: (id) => http.delete('/users/' + id)
}

export const BookAPI = {
  list: (name) => http.get('/books', { params: name ? { name } : {} }),
  page: (params) => http.get('/books/page', { params }),
  getById: (id) => http.get('/books/' + id),
  add: (book) => http.post('/books', book),
  update: (book) => http.put('/books', book),
  remove: (id) => http.delete('/books/' + id)
}

export const CategoryAPI = {
  list: () => http.get('/categories'),
  getById: (id) => http.get('/categories/' + id),
  add: (c) => http.post('/categories', c),
  update: (c) => http.put('/categories', c),
  remove: (id) => http.delete('/categories/' + id)
}

export const ReaderAPI = {
  list: (keyword) => http.get('/readers', { params: keyword ? { keyword } : {} }),
  getById: (id) => http.get('/readers/' + id),
  add: (r) => http.post('/readers', r),
  update: (r) => http.put('/readers', r),
  remove: (id) => http.delete('/readers/' + id)
}

export const BorrowAPI = {
  list: (status, readerId) => http.get('/borrows', { params: { status, readerId } }),
  myBorrows: (readerId) => http.get('/borrows/my/' + readerId),
  getById: (id) => http.get('/borrows/' + id),
  borrow: (action) => http.post('/borrows/borrow', action),
  returnBook: (id) => http.post('/borrows/return/' + id)
}

export const StatsAPI = {
  overview: () => http.get('/stats/overview'),
  booksPerCategory: () => http.get('/stats/books-per-category'),
  topBorrowed: (limit = 5) => http.get('/stats/top-borrowed', { params: { limit } }),
  recentBorrows: (limit = 10) => http.get('/stats/recent-borrows', { params: { limit } }),
  myOverview: (readerId) => http.get('/stats/my-overview/' + readerId)
}

// 借阅申请 API
export const BorrowRequestAPI = {
  apply: (data) => http.post('/borrow-requests/apply', data),
  my: (status) => http.get('/borrow-requests/my', { params: status ? { status } : {} }),
  cancel: (id) => http.post('/borrow-requests/' + id + '/cancel'),
  list: (status) => http.get('/borrow-requests', { params: status ? { status } : {} }),
  approve: (id, adminRemark) => http.post('/borrow-requests/' + id + '/approve', null, { params: adminRemark ? { adminRemark } : {} }),
  reject: (id, adminRemark) => http.post('/borrow-requests/' + id + '/reject', null, { params: adminRemark ? { adminRemark } : {} }),
  pendingCount: () => http.get('/borrow-requests/pending-count'),
  getById: (id) => http.get('/borrow-requests/' + id)
}

// 公告通知 API
export const NoticeAPI = {
  published: (type) => http.get('/notices/published', { params: type ? { type } : {} }),
  pinned: () => http.get('/notices/pinned'),
  list: (type) => http.get('/notices', { params: type ? { type } : {} }),
  getById: (id) => http.get('/notices/' + id),
  add: (data) => http.post('/notices', data),
  update: (data) => http.put('/notices', data),
  togglePinned: (id, pinned) => http.put('/notices/' + id + '/pinned', null, { params: { pinned } }),
  remove: (id) => http.delete('/notices/' + id)
}

// 图书评价 API
export const ReviewAPI = {
  listByBook: (bookId) => http.get('/reviews/book/' + bookId),
  summary: (bookId) => http.get('/reviews/book/' + bookId + '/summary'),
  my: () => http.get('/reviews/my'),
  myForBook: (bookId) => http.get('/reviews/my/' + bookId),
  submit: (data) => http.post('/reviews', data),
  remove: (id) => http.delete('/reviews/' + id)
}
