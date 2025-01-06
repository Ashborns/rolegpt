import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatbotApp from './pages/tampilan';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ChatbotApp />} />
      </Routes>
    </Router>
  );
}

export default App;