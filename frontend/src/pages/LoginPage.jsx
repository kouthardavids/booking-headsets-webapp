import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../api/authContext.jsx';
import './LoginPage.css'; // New CSS file for consistent styling

export default function LoginPageDesign() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  // LoginPage.jsx - Update the handleLogin and handleGoogleLogin functions
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await login(email.trim(), password);

      if (result.success) {
        // Redirect is handled by the ProtectedRoute in App.jsx
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setLoading(true);
      setError(null);
      const { credential } = credentialResponse;
      const result = await googleLogin(credential);

      if (result.success) {
        // Redirect is handled by the ProtectedRoute in App.jsx
        // The auth state change will automatically redirect
      } else {
        // Show specific error messages
        if (result.error.includes('registered manually')) {
          setError('This email was registered with a password. Please use the email login form.');
        } else if (result.error.includes('No account found')) {
          setError('No account found with this email. Please sign up first.');
        } else {
          setError(result.error);
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
      setError('Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="modern-card login-card">
        <h2 className="login-title">
          Welcome Back!
        </h2>

        <div className="google-login-container">
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => setError('Google login failed')}
            shape="pill"
            theme="outline"
            size="large"
            text="continue_with"
          />
        </div>

        {/* Divider */}
        <div className="divider-container">
          <div className="divider-line"></div>
          <span className="divider-text">
            or log in with email
          </span>
          <div className="divider-line"></div>
        </div>

        {/* Email login form */}
        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="modern-input"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="modern-input"
            required
          />
          <div className="forgot-password-link">
            <Link to="/forgot-password">
              Forgot Password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="modern-btn login-btn"
          >
            {loading ? (
              <>
                <span className="spinner-modern"></span>
                Logging In...
              </>
            ) : 'Log In'}
          </button>
        </form>

        {error && (
          <p className="error-message">{error}</p>
        )}

        {/* Footer */}
        <p className="login-footer">
          Don't have an account?
          <Link
            to="/signup"
            className="login-footer-link"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}