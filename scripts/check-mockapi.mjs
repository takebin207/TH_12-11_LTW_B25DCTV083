import assert from 'node:assert/strict';
import { DEFAULT_ENDPOINT } from '../src/settings.js';
import { SAMPLE_EXPENSES, normalizeExpenses } from '../src/data.js';

async function request(path = '', options = {}) {
  const response = await fetch(DEFAULT_ENDPOINT + path, { ...options, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`MockAPI HTTP ${response.status}`);
  return response.json();
}
const post = (data) => request('', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
const before = normalizeExpenses(await request());
let testId;
try {
  const record = await post({ content: `Kiểm thử kết nối ${Date.now()}`, amount: 1000, category: 'Học tập', date: '2026-11-12' });
  testId = record.id;
  assert.ok(testId);
  assert.equal(Number(record.amount), 1000);
  assert.ok((await request()).some((item) => item.id === testId));
} finally {
  if (testId) await request(`/${encodeURIComponent(testId)}`, { method: 'DELETE' });
}
assert.ok(!(await request()).some((item) => item.id === testId));
console.log('MockAPI GET / POST / DELETE: PASS');
if (process.argv.includes('--seed') && before.length === 0) {
  for (const { id, ...expense } of SAMPLE_EXPENSES) await post(expense);
  console.log('Đã thêm 5 khoản chi mẫu vào resource trống.');
}
console.log(`Khoản chi hiện có: ${normalizeExpenses(await request()).length}`);
