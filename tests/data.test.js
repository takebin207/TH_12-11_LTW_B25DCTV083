import test from 'node:test';
import assert from 'node:assert/strict';
import { validateExpense, filterExpenses, normalizeExpenses, totalOf } from '../src/data.js';

const valid = { id: '1', content: 'Cà phê', amount: 35000, category: 'Ăn uống', date: '2026-11-12' };
test('validate rejects empty, nonpositive, fractional amounts, bad categories and impossible dates', () => {
  assert.deepEqual(validateExpense(valid), {});
  for (const amount of [0, -1, 0.5, 'abc', Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.ok(validateExpense({ ...valid, amount }).amount);
  assert.ok(validateExpense({ ...valid, content: '  ' }).content);
  assert.ok(validateExpense({ ...valid, category: 'Khác' }).category);
  assert.ok(validateExpense({ ...valid, date: '2026-02-30' }).date);
  assert.deepEqual(validateExpense({ ...valid, date: '2024-02-29' }), {});
});
test('category and trimmed case-insensitive content filters combine and totals use visible records', () => {
  const expenses = [valid, { ...valid, id: '2', content: 'Vé xe', amount: 10000, category: 'Đi lại' }];
  assert.equal(totalOf(expenses), 45000);
  assert.deepEqual(filterExpenses(expenses, 'Tất cả', ' CÀ PHÊ '), [valid]);
  assert.deepEqual(filterExpenses(expenses, 'Đi lại', 'cà phê'), []);
  assert.equal(totalOf(filterExpenses(expenses, 'Đi lại', '')), 10000);
  assert.equal(totalOf([]), 0);
});
test('normalizes API numeric strings and rejects malformed responses', () => {
  assert.equal(normalizeExpenses([{ ...valid, amount: '35000', id: 1 }])[0].amount, 35000);
  assert.equal(normalizeExpenses([{ ...valid, id: 1 }])[0].id, '1');
  assert.throws(() => normalizeExpenses({}));
  assert.throws(() => normalizeExpenses([{ ...valid, category: 'Other' }]));
});
