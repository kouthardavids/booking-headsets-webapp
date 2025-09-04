import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HeadsetBookingSystem from './pages/StudentDashboard';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './api/authContext.jsx';
import ForgotPasswordPage from './pages/ForgotPassword.jsx';
import ResetPasswordPage from './pages/ResetPassword.jsx';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          padding: '2rem',
          borderRadius: '1rem',
          backgroundColor: 'white',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div className="spinner-modern" style={{ margin: '0 auto 1rem', width: '40px', height: '40px' }}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/" /> : <SignupPage />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HeadsetBookingSystem />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;