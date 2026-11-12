import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ClassApp from './ClassApp';
import HooksApp from './HooksApp';
import { ThemeProvider, ThemeButton } from './context/ThemeContext';
import './styles.css';
import { DEFAULT_ENDPOINT, validEndpoint, readSetting, writeSetting } from './settings';

const envEndpoint = import.meta.env.VITE_MOCKAPI_URL?.trim() || DEFAULT_ENDPOINT;
const savedEndpoint = readSetting('expense.endpoint', envEndpoint);
const initialEndpoint = validEndpoint(savedEndpoint) ? savedEndpoint : DEFAULT_ENDPOINT;

function App() {
  const [version, setVersion] = useState('hooks');
  const [endpoint, setEndpoint] = useState(initialEndpoint);
  const [draft, setDraft] = useState(initialEndpoint);
  const [settings, setSettings] = useState(false);
  const [urlError, setUrlError] = useState('');
  function configure(event) {
    event.preventDefault();
    const value = draft.trim().replace(/\/$/, '') || DEFAULT_ENDPOINT;
    if (!validEndpoint(value)) { setUrlError('Nhập /api/expenses hoặc URL HTTPS hợp lệ.'); return; }
    writeSetting('expense.endpoint', value);
    setEndpoint(value); setDraft(value); setSettings(false); setUrlError('');
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
              <p>Đã kết nối MockAPI.io. Để trống để dùng endpoint mặc định, hoặc nhập /api/expenses để thử API cục bộ. Lựa chọn được lưu trên trình duyệt.</p>
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
