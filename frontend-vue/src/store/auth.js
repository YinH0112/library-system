import { reactive } from 'vue'
import { AuthAPI } from '../api.js'

const state = reactive({
  user: null,        // 当前登录用户
  initialized: false // 是否已从后端恢复会话
})

async function initialize() {
  try {
    const res = await AuthAPI.current()
    if (res.data.code === 200) {
      state.user = res.data.data
    }
  } catch (e) {
    state.user = null
  } finally {
    state.initialized = true
  }
}

function setUser(user) {
  state.user = user
}

function clearUser() {
  state.user = null
}

function isLoggedIn() {
  return state.user != null
}

function isAdmin() {
  return state.user != null && state.user.role === 'ADMIN'
}

function isReader() {
  return state.user != null && state.user.role === 'READER'
}

async function logout() {
  try {
    await AuthAPI.logout()
  } catch (e) {
    // 忽略
  }
  clearUser()
}

export const authStore = {
  state,
  initialize,
  setUser,
  clearUser,
  isLoggedIn,
  isAdmin,
  isReader,
  logout
}
