import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { SAMPLE_EXPENSES, normalizeExpenses, validateExpense } from '../src/data.js';

export function createMockApi({ file = resolve('server/data/expenses.json'), seed = SAMPLE_EXPENSES } = {}) {
  // Tuần tự hóa thao tác đọc/ghi để các request đồng thời không ghi đè nhau.
  let queue = Promise.resolve();
  function serialize(action) {
    const result = queue.then(action);
    queue = result.catch(() => {});
    return result;
  }
  async function save(items) {
    await mkdir(dirname(file), { recursive: true });
    const temporary = `${file}.tmp`;
    await writeFile(temporary, JSON.stringify(items, null, 2), 'utf8');
    await rename(temporary, file);
  }
  async function load() {
    try { return normalizeExpenses(JSON.parse(await readFile(file, 'utf8'))); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const items = seed.map((item) => ({ ...item }));
      await save(items);
      return items;
    }
  }
  function reply(response, status, body) {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(body));
  }
  async function readBody(request) {
    let body = '';
    let bytes = 0;
    for await (const chunk of request) {
      bytes += chunk.length;
      if (bytes > 16384) throw Object.assign(new Error('Nội dung request quá lớn.'), { status: 413 });
      body += chunk;
    }
    try { return JSON.parse(body); }
    catch { throw Object.assign(new Error('JSON không hợp lệ.'), { status: 400 }); }
  }
  return function middleware(request, response, next = () => reply(response, 404, { message: 'Không tìm thấy API.' })) {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (!/^\/api\/expenses(?:\/[^/]+)?\/?$/.test(path)) return next();
    const id = path.replace(/\/$/, '').split('/')[3];
    const method = request.method;
    const allowed = id ? ['DELETE'] : ['GET', 'POST'];
    if (!allowed.includes(method)) {
      response.setHeader('Allow', allowed.join(', '));
      return reply(response, 405, { message: 'Phương thức không được hỗ trợ.' });
    }
    (async () => {
      let expense;
      if (method === 'POST') {
        if (!request.headers['content-type']?.includes('application/json')) return reply(response, 415, { message: 'Sử dụng Content-Type: application/json.' });
        const body = await readBody(request);
        if (!body || typeof body.content !== 'string' || typeof body.date !== 'string') return reply(response, 400, { message: 'Nội dung và ngày chi không hợp lệ.' });
        const errors = validateExpense(body);
        if (Object.keys(errors).length) return reply(response, 400, { message: Object.values(errors).join(' '), errors });
        expense = { id: randomUUID(), content: body.content.trim(), amount: Number(body.amount), category: body.category, date: body.date };
      }
      await serialize(async () => {
        const items = await load();
        if (method === 'GET') return reply(response, 200, items);
        if (method === 'POST') {
          await save([expense, ...items]);
          return reply(response, 201, expense);
        }
        const found = items.find((item) => item.id === decodeURIComponent(id));
        if (!found) return reply(response, 404, { message: 'Khoản chi không tồn tại.' });
        await save(items.filter((item) => item.id !== found.id));
        return reply(response, 200, found);
      });
    })().catch((error) => {
      console.error('[Mock API]', error.message);
      if (!response.headersSent) reply(response, error.status || 500, { message: error.status ? error.message : 'Không đọc/ghi được dữ liệu. Kiểm tra file dữ liệu trên máy chủ.' });
    });
  };
}

export function mockApiPlugin() {
  const middleware = createMockApi();
  return {
    name: 'expense-mock-api',
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
}
