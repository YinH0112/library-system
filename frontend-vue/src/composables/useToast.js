let _showToast = null

export function initToast(fn) {
  _showToast = fn
}

export function showToast(type, message) {
  if (_showToast) _showToast(type, message)
}
