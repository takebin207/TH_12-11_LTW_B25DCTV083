import { Component, createRef } from 'react';
import { SAMPLE_EXPENSES, today, totalOf, money, filterExpenses, validateExpense } from './data';
import { ClockFace, PageHeading, Statistics, FormFields, FormCard, ExpenseList, Notice } from './components/UI';

export class ClassClock extends Component {
  state = { now: new Date() };
  componentDidMount() { this.timer = setInterval(() => this.setState({ now: new Date() }), 1000); }
  componentWillUnmount() { clearInterval(this.timer); }
  render() { return <ClockFace now={this.state.now} />; }
}

export class ClassExpenseForm extends Component {
  state = { values: { content: '', amount: '', category: 'Ăn uống', date: today() }, errors: {}, message: '' };
  inputRef = createRef();
  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState(({ values, errors }) => ({ values: { ...values, [name]: value }, errors: { ...errors, [name]: '' }, message: '' }));
  };
  handleSubmit = (event) => {
    event.preventDefault();
    const errors = validateExpense(this.state.values);
    this.setState({ errors });
    if (Object.keys(errors).length) return;
    this.props.onAdd({ ...this.state.values, content: this.state.values.content.trim(), amount: Number(this.state.values.amount), id: crypto.randomUUID() });
    this.setState(({ values }) => ({ values: { ...values, content: '', amount: '' }, message: 'Đã thêm khoản chi.' }), () => this.inputRef.current?.focus());
  };
  render() { return <FormCard><form noValidate onSubmit={this.handleSubmit}><FormFields values={this.state.values} errors={this.state.errors} onChange={this.handleChange} inputRef={this.inputRef} /></form><span className="form-success" role="status">{this.state.message}</span></FormCard>; }
}

export default class ClassApp extends Component {
  state = { expenses: SAMPLE_EXPENSES.map((item) => ({ ...item })), category: 'Tất cả', search: '', debouncedSearch: '', showClock: true };
  componentDidMount() { this.updateTitle(); }
  componentDidUpdate(_previousProps, previousState) {
    if (previousState.expenses !== this.state.expenses) this.updateTitle();
    if (previousState.search !== this.state.search) {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => this.setState({ debouncedSearch: this.state.search }), 350);
    }
  }
  componentWillUnmount() { clearTimeout(this.searchTimer); document.title = 'Sổ chi tiêu'; }
  updateTitle() { document.title = `${money(totalOf(this.state.expenses))} · Sổ chi tiêu`; }
  addExpense = (expense) => this.setState(({ expenses }) => ({ expenses: [expense, ...expenses] }));
  deleteExpense = (expense) => {
    if (window.confirm(`Xóa khoản chi “${expense.content}” (${money(expense.amount)})?`)) this.setState(({ expenses }) => ({ expenses: expenses.filter((item) => item.id !== expense.id) }));
  };
  render() {
    const { expenses, category, search, debouncedSearch, showClock } = this.state;
    return <><PageHeading showClock={showClock} onToggleClock={() => this.setState({ showClock: !showClock })} clock={showClock && <ClassClock />} /><Statistics expenses={expenses} /><Notice>Phần A · Class Component — dữ liệu mẫu trong bộ nhớ. Thêm, xóa và lọc để quan sát state và lifecycle.</Notice><div className="workspace"><ClassExpenseForm onAdd={this.addExpense} /><ExpenseList expenses={expenses} filtered={filterExpenses(expenses, category, debouncedSearch)} category={category} onCategory={(value) => this.setState({ category: value })} search={search} onSearch={(value) => this.setState({ search: value })} onDelete={this.deleteExpense} /></div></>;
  }
}
