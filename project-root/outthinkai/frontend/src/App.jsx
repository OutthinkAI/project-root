import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Debate from './pages/Debate';
import Report from './pages/Report'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* 삼각 토론: ID가 있을 때와 없을 때 모두 대응 */}
        <Route path="/debate" element={<Debate />} />
        <Route path="/debate/:sessionId" element={<Debate />} />
        
        {/* 사고 증명(리포트): 핵심 수정 부분! */}
        {/* 1. /report?sessionId=123 방식으로 올 때 대응 */}
        <Route path="/report" element={<Report />} /> 
        
        {/* 2. /report/123 방식으로 올 때 대응 */}
        <Route path="/report/:sessionId" element={<Report />} /> 
        
        {/* (선택) 잘못된 주소로 들어오면 홈으로 튕겨내기 */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;