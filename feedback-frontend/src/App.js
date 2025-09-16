// src/App.js
import React, { useEffect, useState } from 'react';
import FeedbackForm from './components/FeedbackForm';

// ThemeToggle component (same animated switch used earlier)
function ThemeToggle({ theme, setTheme }) {
  const onToggle = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  return (
    <div
      role="switch"
      tabIndex={0}
      aria-checked={theme === 'dark'}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      onClick={onToggle}
      className={`theme-toggle ${theme === 'dark' ? 'on' : 'off'}`}
      aria-label="Toggle dark mode"
      title={theme === 'light' ? 'Enable dark mode' : 'Enable light mode'}
      style={{display:'inline-flex', alignItems:'center', gap:8}}
    >
      <div className="toggle-track">
        <div className="toggle-thumb" />
      </div>
      <div className="toggle-icons" aria-hidden="true">
        <span className="sun">☀️</span>
        <span className="moon">🌙</span>
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('fh_theme') || 'light');
  const [toast, setToast] = useState({ text: '', show: false });

  // on theme change: update data-theme and show a toast tip
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fh_theme', theme);

    // show toast for ~2.5s
    const text = theme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled';
    setToast({ text, show: true });
    const t = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2500);
    return () => clearTimeout(t);
  }, [theme]);

  return (
    <>
      {/* Background layer (two layers crossfading via CSS) */}
      <div className="bg-layer" aria-hidden="true">
        <div className="layer light" />
        <div className="layer dark" />
      </div>

      {/* Toast tip */}
      <div className={`toast-tip ${toast.show ? 'show' : ''}`} role="status" aria-live="polite">
        <div className="dot" aria-hidden="true" />
        <div>{toast.text}</div>
      </div>

      <div className="container page-padding" style={{ position: 'relative' }}>
        <div className="blob purple" aria-hidden="true"></div>
        <div className="blob blue" aria-hidden="true"></div>

        <div className="site-content">
          <header className="mb-4" style={{ zIndex: 2 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 420px' }}>
                <span className="brand-badge">Feedback Hub</span>
                <h1 className="mt-3" style={{ fontWeight: 800, marginBottom: 6 }}>We'd love to hear from you</h1>
                <p className="form-sub">Short, friendly and secure feedback collection — designed for humans.</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                <ThemeToggle theme={theme} setTheme={setTheme} />
              </div>
            </div>
          </header>

          <div className="row justify-content-center" style={{ zIndex: 2 }}>
            <div className="col-lg-8 col-md-10 col-12">
              <FeedbackForm />
            </div>
          </div>
        </div>

        <footer className="site-footer text-center mt-5" style={{ zIndex: 2 }}>
          <small>© {new Date().getFullYear()} Feedback Hub • Built with React & Django</small>
        </footer>
      </div>
    </>
  );
}

export default App;
