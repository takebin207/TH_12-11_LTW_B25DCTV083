import { createContext, useContext, useEffect, useState } from 'react';
import { readSetting, writeSetting } from '../settings';

export const ThemeContext = createContext(null);
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => readSetting('expense.theme', 'light') === 'dark' ? 'dark' : 'light');
  useEffect(() => { document.documentElement.dataset.theme = theme; writeSetting('expense.theme', theme); }, [theme]);
  return <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme((current) => current === 'light' ? 'dark' : 'light') }}>{children}</ThemeContext.Provider>;
}
export function ThemeButton() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  return <button className="icon-button theme-button" onClick={toggleTheme} aria-label={`Chuyển sang chế độ ${theme === 'light' ? 'tối' : 'sáng'}`} title="Đổi giao diện">{theme === 'light' ? '☾' : '☀'}</button>;
}
