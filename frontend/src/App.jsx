import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HeadsetBookingSystem from './pages/StudentDashboard';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HeadsetBookingSystem />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    </Router>
  );
}

export default App;
