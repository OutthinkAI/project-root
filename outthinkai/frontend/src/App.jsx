import { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Debate from './pages/Debate';
import Report from './pages/Report';

export const DarkModeContext = createContext({ dark: false, toggle: () => {} });
export function useDarkMode() { return useContext(DarkModeContext); }

function App() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('outthink-theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('outthink-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const toggle = () => setDark(d => !d);

  return (
    <DarkModeContext.Provider value={{ dark, toggle }}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/debate" element={<Debate />} />
          <Route path="/debate/:sessionId" element={<Debate />} />
          <Route path="/report" element={<Report />} />
          <Route path="/report/:sessionId" element={<Report />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Router>
    </DarkModeContext.Provider>
  );
}

export default App;
