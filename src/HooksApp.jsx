import { useEffect, useRef, useState } from 'react';
import { today, totalOf, money, filterExpenses, validateExpense } from './data';
import { useFetch } from './hooks/useFetch';
import { useClock } from './hooks/useClock';
import { useDebounce } from './hooks/useDebounce';
import { ClockFace, PageHeading, Statistics, FormFields, FormCard, ExpenseList, Notice } from './components/UI';

function HookClock() { const now = useClock(); return <ClockFace now={now} />; }

function HookExpenseForm({ onAdd, pending }) {
  const [values, setValues] = useState({ content: '', amount: '', category: 'Ăn uống', date: today() });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);
  const shouldFocus = useRef(false);
  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateExpense(values);
    setErrors(nextErrors);
    setMessage('');
    if (Object.keys(nextErrors).length) return;
    const success = await onAdd({ ...values, content: values.content.trim(), amount: Number(values.amount) });
    if (success) {
      setValues((current) => ({ ...current, content: '', amount: '' }));
      setMessage('Đã thêm khoản chi.');
      // Focus sau commit, khi input đã được mở lại.
      shouldFocus.current = true;
    }
  }
  useEffect(() => {
    if (message && !pending && shouldFocus.current) { inputRef.current?.focus(); shouldFocus.current = false; }
  }, [message, pending]);
  return <FormCard><form noValidate onSubmit={handleSubmit}><FormFields values={values} errors={errors} inputRef={inputRef} pending={pending} onChange={(event) => { const { name, value } = event.target; setValues((current) => ({ ...current, [name]: value })); setErrors((current) => ({ ...current, [name]: '' })); setMessage(''); }} /></form><span className="form-success" role="status">{message}</span></FormCard>;
}

export default function HooksApp({ endpoint }) {
  const { data: expenses, loading, pending, error, add, remove, retry } = useFetch(endpoint);
  const [category, setCategory] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [showClock, setShowClock] = useState(true);
  const debouncedSearch = useDebounce(search);
  const total = totalOf(expenses);
  useEffect(() => { document.title = `${money(total)} · Sổ chi tiêu`; return () => { document.title = 'Sổ chi tiêu'; }; }, [total]);
  async function deleteExpense(expense) {
    if (window.confirm(`Xóa khoản chi “${expense.content}” (${money(expense.amount)})?`)) await remove(expense);
  }
  return <><PageHeading showClock={showClock} onToggleClock={() => setShowClock((value) => !value)} clock={showClock && <HookClock />} /><Statistics expenses={expenses} />{error ? <Notice error onRetry={retry}>{error} Thử lại sẽ tải lại danh sách từ API.</Notice> : <Notice>{endpoint === '/api/expenses' ? 'Mock API cục bộ · Khoản chi được lưu trên máy, giữ nguyên khi tải lại trang hoặc khởi động lại.' : 'MockAPI trực tuyến · Dữ liệu được tải, thêm và xóa qua API.'}</Notice>}<div className="workspace"><HookExpenseForm onAdd={add} pending={pending || loading || Boolean(error && !expenses.length)} /><ExpenseList expenses={expenses} filtered={filterExpenses(expenses, category, debouncedSearch)} category={category} onCategory={setCategory} search={search} onSearch={setSearch} onDelete={deleteExpense} pending={pending || loading} loading={loading} /></div></>;
}
