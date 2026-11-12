export async function requestJSON(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  let timedOut = false;
  if (options.signal?.aborted) cancel();
  options.signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      const details = await response.json().catch(() => ({}));
      throw new Error(details?.message || `Yêu cầu thất bại (HTTP ${response.status}).`);
    }
    return response.status === 204 ? null : await response.json();
  } catch (error) {
    if (timedOut && !options.signal?.aborted) throw new Error('Kết nối quá thời gian 10 giây. Vui lòng thử lại.');
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', cancel);
  }
}
