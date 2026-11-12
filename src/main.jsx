import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ClassApp from './ClassApp';
import HooksApp from './HooksApp';
import { ThemeProvider, ThemeButton } from './context/ThemeContext';
import './styles.css';

const envEndpoint = import.meta.env.VITE_MOCKAPI_URL?.trim() || '/api/expenses';

function App() {
  const [version, setVersion] = useState('hooks');
  const [endpoint, setEndpoint] = useState(envEndpoint);
  const [draft, setDraft] = useState(envEndpoint);
  const [settings, setSettings] = useState(false);
  const [urlError, setUrlError] = useState('');
  function configure(event) {
    event.preventDefault();
    const value = draft.trim().replace(/\/$/, '') || '/api/expenses';
    if (value !== '/api/expenses') {
      try { if (new URL(value).protocol !== 'https:') throw new Error(); }
      catch { setUrlError('Nhập URL HTTPS đầy đủ của resource expenses.'); return; }
    }
    setEndpoint(value); setSettings(false); setUrlError('');
  }
  return (
    <ThemeProvider>
      <div className="app-shell">
        <header className="topbar">
          <a className="brand" href="./" aria-label="Sổ chi tiêu">
            <span className="brand-mark">₫</span><span>chi tiêu<span className="brand-dot">.</span></span>
          </a>
          <nav className="version-switch" aria-label="Phiên bản bài tập">
            <button className={version === 'class' ? 'selected' : ''} onClick={() => setVersion('class')} aria-pressed={version === 'class'}>A <span>Class Component</span></button>
            <button className={version === 'hooks' ? 'selected' : ''} onClick={() => setVersion('hooks')} aria-pressed={version === 'hooks'}>B <span>Function + Hooks</span></button>
          </nav>
          <div className="header-actions">
            <button className="settings-button" aria-expanded={settings} onClick={() => setSettings((current) => !current)}>⚙ <span>MockAPI</span></button>
            <ThemeButton />
          </div>
        </header>
        <main>
          {settings && (
            <section className="panel api-settings">
              <h2>Kết nối MockAPI</h2>
              <p>Mock API cục bộ đã chạy sẵn. Để trống hoặc nhập /api/expenses để dùng API trên máy; có thể nhập URL HTTPS của MockAPI.io để đổi nguồn.</p>
              <form onSubmit={configure}>
                <label htmlFor="endpoint" className="sr-only">URL MockAPI</label>
                <input id="endpoint" type="text" placeholder="/api/expenses" value={draft} onChange={(event) => setDraft(event.target.value)} />
                <button className="primary-button">Áp dụng</button>
              </form>
              {urlError && <p className="field-error" role="alert">{urlError}</p>}
            </section>
          )}
          {version === 'class' ? <ClassApp /> : <HooksApp key={endpoint} endpoint={endpoint} />}
        </main>
        <footer>
          <span><span className="footer-dot" /> Chi tiêu có ý thức, sống theo cách của bạn.</span>
          <span>React · {version === 'class' ? 'Class Component' : 'Function Component + Hooks'}</span>
        </footer>
      </div>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
