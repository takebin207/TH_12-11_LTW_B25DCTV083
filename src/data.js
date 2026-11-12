export const CATEGORIES = ['Ăn uống', 'Đi lại', 'Học tập', 'Giải trí'];
export const CATEGORY_META = {
  'Ăn uống': { icon: '◒', color: 'orange' },
  'Đi lại': { icon: '↗', color: 'blue' },
  'Học tập': { icon: '▤', color: 'purple' },
  'Giải trí': { icon: '♫', color: 'pink' },
};

export function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const SAMPLE_EXPENSES = [
  { id: 'sample-1', content: 'Cà phê buổi sáng', amount: 35000, category: 'Ăn uống', date: today() },
  { id: 'sample-2', content: 'Ăn trưa cùng bạn', amount: 65000, category: 'Ăn uống', date: today() },
  { id: 'sample-3', content: 'Đổ xăng', amount: 50000, category: 'Đi lại', date: today() },
  { id: 'sample-4', content: 'Sách lập trình React', amount: 180000, category: 'Học tập', date: today() },
  { id: 'sample-5', content: 'Vé xem phim', amount: 90000, category: 'Giải trí', date: today() },
];

export const money = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
export const totalOf = (expenses) => expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

export function validateExpense({ content, amount, category, date }) {
  const errors = {};
  if (!content.trim()) errors.content = 'Vui lòng nhập nội dung khoản chi.';
  else if (content.trim().length > 120) errors.content = 'Nội dung tối đa 120 ký tự.';
  if (!Number.isSafeInteger(Number(amount)) || Number(amount) <= 0) errors.amount = 'Nhập số tiền nguyên dương hợp lệ.';
  if (!CATEGORIES.includes(category)) errors.category = 'Vui lòng chọn loại chi tiêu.';
  const parsedDate = new Date(`${date}T00:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}` !== date) errors.date = 'Vui lòng chọn ngày hợp lệ.';
  return errors;
}

export function filterExpenses(expenses, category, search) {
  const query = search.trim().toLocaleLowerCase('vi');
  return expenses.filter((expense) => (category === 'Tất cả' || expense.category === category) && expense.content.toLocaleLowerCase('vi').includes(query));
}

export function normalizeExpenses(data) {
  if (!Array.isArray(data)) throw new Error('API phải trả về một mảng khoản chi.');
  return data.map((item) => {
    if (item.id == null || typeof item.content !== 'string' || typeof item.date !== 'string' || Object.keys(validateExpense(item)).length) throw new Error('Dữ liệu API không hợp lệ. Kiểm tra các trường id, content, amount, category, date.');
    return { ...item, id: String(item.id), amount: Number(item.amount) };
  });
}
