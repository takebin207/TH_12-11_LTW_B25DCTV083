import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createMockApi } from '../server/mockApi.js';

async function fixture(t, file, seed = []) {
  const server = createServer(createMockApi({ file, seed }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}/api/expenses`;
}
async function storage(t) {
  const directory = await mkdtemp(join(tmpdir(), 'expenses-api-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return join(directory, 'expenses.json');
}
const expense = { content: '  Bữa trưa  ', amount: 45000, category: 'Ăn uống', date: '2026-11-12' };
const post = (url, data = expense) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

test('HTTP CRUD persists across API instances and returns appropriate status codes', async (t) => {
  const file = await storage(t);
  const url = await fixture(t, file);
  assert.deepEqual(await (await fetch(url)).json(), []);
  const created = await post(url);
  assert.equal(created.status, 201);
  const saved = await created.json();
  assert.ok(saved.id);
  assert.equal(saved.content, 'Bữa trưa');
  assert.equal(saved.amount, 45000);
  assert.deepEqual(await (await fetch(url)).json(), [saved]);
  const restartedUrl = await fixture(t, file);
  assert.deepEqual(await (await fetch(restartedUrl)).json(), [saved]);
  const removed = await fetch(`${restartedUrl}/${saved.id}`, { method: 'DELETE' });
  assert.equal(removed.status, 200);
  assert.deepEqual(await removed.json(), saved);
  assert.deepEqual(JSON.parse(await readFile(file, 'utf8')), []);
  assert.equal((await fetch(`${restartedUrl}/${saved.id}`, { method: 'DELETE' })).status, 404);
});

test('invalid requests never modify stored expenses', async (t) => {
  const file = await storage(t);
  const url = await fixture(t, file);
  for (const body of [null, {}, { ...expense, amount: -1 }, { ...expense, date: '2026-02-30' }, { ...expense, category: 'Khác' }]) {
    assert.equal((await post(url, body)).status, 400);
  }
  assert.equal((await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
  assert.equal((await fetch(url, { method: 'POST', body: 'text' })).status, 415);
  assert.equal((await fetch(url, { method: 'PUT' })).status, 405);
  assert.equal((await fetch(`${url}/missing`)).status, 405);
  assert.equal((await post(url, { ...expense, content: 'x'.repeat(17000) })).status, 413);
  assert.deepEqual(await (await fetch(url)).json(), []);
});

test('concurrent POST requests do not lose data or reuse IDs', async (t) => {
  const file = await storage(t);
  const url = await fixture(t, file);
  const responses = await Promise.all(Array.from({ length: 12 }, (_, index) => post(url, { ...expense, content: `Khoản chi ${index}` })));
  assert.ok(responses.every((response) => response.status === 201));
  const items = await (await fetch(url)).json();
  assert.equal(items.length, 12);
  assert.equal(new Set(items.map((item) => item.id)).size, 12);
});

test('seeds a new store once; never silently replaces corrupt data', async (t) => {
  const file = await storage(t);
  const seed = [{ ...expense, id: 'seed' }];
  const url = await fixture(t, file, seed);
  assert.equal((await (await fetch(url)).json()).length, 1);
  assert.equal((await fetch(`${url}/seed`, { method: 'DELETE' })).status, 200);
  assert.deepEqual(await (await fetch(url)).json(), []);
  await writeFile(file, '{broken', 'utf8');
  assert.equal((await fetch(url)).status, 500);
  assert.equal(await readFile(file, 'utf8'), '{broken');
});
