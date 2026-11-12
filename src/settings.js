export const DEFAULT_ENDPOINT = 'https://6af522cdf6270fa08d67c265.mockapi.io/expenses';
export function validEndpoint(value) {
  if (value === '/api/expenses') return true;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && !url.hash; }
  catch { return false; }
}
export function readSetting(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
export function writeSetting(key, value) {
  try { localStorage.setItem(key, value); } catch { /* Trình duyệt có thể chặn lưu trữ. */ }
}
