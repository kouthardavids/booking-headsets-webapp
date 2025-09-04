import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AuthPages.css';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const res = await axios.post('http://localhost:5006/api/auth/forgot-password', {
                email
            });
            setSuccessMessage(res.data.message);
        } catch (err) {
            console.error('Full error:', err);
            if (err.response) {
                console.error('Response data:', err.response.data);
                console.error('Response status:', err.response.status);
                setError(err.response.data?.message || `Server error: ${err.response.status}`);
            } else if (err.request) {
                console.error('No response received:', err.request);
                setError('No response from server. Is the backend running?');
            } else {
                console.error('Request setup error:', err.message);
                setError('Failed to send request');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* Main form container */}
            <div className="modern-card auth-card">
                <h2 className="auth-title">
                    Forgot Your Password?
                </h2>

                <p className="auth-description">
                    Enter your email to receive a password reset link.
                </p>

                {/* Email submission form */}
                <form className="auth-form" onSubmit={handleEmailSubmit}>
                    <input
                        type="email"
                        placeholder="Email"
                        required
                        className="modern-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="modern-btn auth-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-modern"></span>
                                Sending...
                            </>
                        ) : 'Send Reset Link'}
                    </button>
                </form>

                {/* Display error or success message */}
                {error && <p className="error-message">{error}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}

                {/* Link to return to the login page */}
                <p className="auth-footer">
                    <Link to="/login" className="auth-link">
                        Return to Log In
                    </Link>
                </p>
            </div>
        </div>
    );
}