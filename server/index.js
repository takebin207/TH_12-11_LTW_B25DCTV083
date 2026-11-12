import { createServer } from 'node:http';
import { createMockApi } from './mockApi.js';

const port = Number(process.env.PORT || 3001);
createServer(createMockApi()).listen(port, '127.0.0.1', () => {
  console.log(`Mock API: http://127.0.0.1:${port}/api/expenses`);
});
