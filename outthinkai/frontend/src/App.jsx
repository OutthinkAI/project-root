import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Debate from './pages/Debate';
import Report from './pages/Report'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/debate/:sessionId" element={<Debate />} />
        <Route path="/report/:sessionId" element={<Report />} /> 
      </Routes>
    </Router>
  );
}

export default App;


