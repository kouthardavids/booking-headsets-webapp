import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../api/authContext.jsx';
import './SignupPage.css'; // New CSS file for consistent styling

export default function RegisterPageDesign() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signup, googleSignup } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await signup(username.trim(), email.trim(), password);

      if (result.success) {
        // Redirect is handled by the ProtectedRoute in App.jsx
        // The auth state change will automatically redirect
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Email signup error:', error);
      setError(error.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async (credentialResponse) => {
    try {
      setLoading(true);
      const { credential } = credentialResponse;
      const result = await googleSignup(credential);

      if (result.success) {
        // Redirect is handled by the ProtectedRoute in App.jsx
        // The auth state change will automatically redirect
      } else {
        if (result.error.includes('already registered manually')) {
          setError('This email is already registered. Please log in with your password instead.');
        } else if (result.error.includes('already exists')) {
          setError('Account already exists. Please log in instead.');
        } else {
          setError(result.error);
        }
      }
    } catch (error) {
      console.error('Google signup error:', error);
      setError(error.response?.data?.message || 'Google signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="modern-card signup-card">
        <h2 className="signup-title">
          Create Your Account
        </h2>

        <div className="google-signup-container">
          <GoogleLogin
            onSuccess={handleGoogleSignup}
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
            or sign up with email
          </span>
          <div className="divider-line"></div>
        </div>

        {/* Email signup form */}
        <form className="signup-form" onSubmit={handleSignup}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="modern-input"
            required
          />
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
            placeholder="Password (min. 6 characters)"
            className="modern-input"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="modern-btn signup-btn"
          >
            {loading ? (
              <>
                <span className="spinner-modern"></span>
                Signing Up...
              </>
            ) : 'Sign Up'}
          </button>
        </form>

        {error && (
          <p className="error-message">{error}</p>
        )}

        {/* Footer */}
        <p className="signup-footer">
          Already have an account?
          <Link
            to="/login"
            className="signup-footer-link"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}