import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import HooksApp from '../../src/HooksApp';
import ClassApp from '../../src/ClassApp';
import { useClock } from '../../src/hooks/useClock';
import { useDebounce } from '../../src/hooks/useDebounce';
import { useFetch } from '../../src/hooks/useFetch';
import { ThemeProvider, ThemeButton } from '../../src/context/ThemeContext';

const expense = { id: '1', content: 'Cà phê', amount: 35000, category: 'Ăn uống', date: '2026-11-12' };
const response = (data) => ({ ok: true, status: 200, json: async () => data });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); localStorage.clear(); });

describe('Timers', () => {
  it('clock ticks every second and cleans up when unmounted', () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(useClock);
    const start = result.current.getTime();
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.getTime() - start).toBe(1000);
    unmount(); expect(vi.getTimerCount()).toBe(0);
  });
  it('debounce waits 350ms and cancels the previous query', () => {
    vi.useFakeTimers();
    const { result, rerender, unmount } = renderHook(({ value }) => useDebounce(value), { initialProps: { value: '' } });
    rerender({ value: 'cà' }); act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'cà phê' }); act(() => vi.advanceTimersByTime(349));
    expect(result.current).toBe(''); act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('cà phê'); unmount(); expect(vi.getTimerCount()).toBe(0);
  });
});

it('adds via API, updates total/title, resets form and focuses content', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(response([])).mockResolvedValueOnce(response(expense));
  vi.stubGlobal('fetch', fetchMock);
  render(<HooksApp endpoint="https://example.test/expenses" />);
  const submit = await screen.findByRole('button', { name: /Thêm khoản chi/ });
  await waitFor(() => expect(submit.disabled).toBe(false));
  fireEvent.change(screen.getByLabelText(/Nội dung khoản chi/), { target: { value: 'Cà phê' } });
  fireEvent.change(screen.getByLabelText(/^Số tiền/), { target: { value: '35000' } });
  fireEvent.click(submit);
  await screen.findByText('Đã thêm khoản chi.');
  expect(document.activeElement).toBe(screen.getByLabelText(/Nội dung khoản chi/));
  expect(screen.getByLabelText(/Nội dung khoản chi/).value).toBe('');
  expect(document.title).toContain('35.000');
  expect(fetchMock.mock.calls[1][1].method).toBe('POST');
});

it('keeps existing data after refresh fails', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(response([expense])).mockRejectedValueOnce(new Error('Mất mạng'));
  vi.stubGlobal('fetch', fetchMock);
  const { result, unmount } = renderHook(() => useFetch('https://example.test/expenses'));
  await waitFor(() => expect(result.current.data).toHaveLength(1));
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.error).toBe('Mất mạng'));
  expect(result.current.data).toHaveLength(1);
  unmount();
});

it('aborts an in-flight GET on unmount', () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
  const { unmount } = renderHook(() => useFetch('https://example.test/expenses'));
  const signal = fetch.mock.calls[0][1].signal;
  expect(signal.aborted).toBe(false); unmount(); expect(signal.aborted).toBe(true);
});

it('shows timeout and releases loading after a stalled request', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn((_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  })));
  const { result, unmount } = renderHook(() => useFetch('https://example.test/expenses'));
  await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
  expect(result.current.loading).toBe(false);
  expect(result.current.error).toContain('10 giây'); unmount();
});

it('persists dark theme through provider remount', () => {
  const view = render(<ThemeProvider><ThemeButton /></ThemeProvider>);
  fireEvent.click(screen.getByRole('button', { name: /chế độ tối/ }));
  expect(localStorage.getItem('expense.theme')).toBe('dark'); view.unmount();
  render(<ThemeProvider><ThemeButton /></ThemeProvider>);
  expect(document.documentElement.dataset.theme).toBe('dark');
});

it('Class version handles deletion cancel/confirm and unmounts its clock', () => {
  vi.useFakeTimers();
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  const view = render(<ClassApp />);
  const remove = screen.getByRole('button', { name: 'Xóa Cà phê buổi sáng' });
  fireEvent.click(remove); expect(screen.queryByText('Cà phê buổi sáng')).not.toBeNull();
  confirm.mockReturnValue(true); fireEvent.click(remove);
  expect(screen.queryByText('Cà phê buổi sáng')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Ẩn đồng hồ' }));
  expect(vi.getTimerCount()).toBe(0); view.unmount();
});
