import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AuthPages.css';

export default function ResetPasswordPage() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [successMessage, setSuccessMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage(null);
        setError(null);

        // Validate token exists
        if (!token) {
            setError('Invalid reset link. Missing token.');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            setLoading(false);
            return;
        }

        try {
            console.log('Sending reset request with token:', token);
            
            const res = await axios.post(`http://localhost:5006/api/auth/reset-password/${token}`, {
                password
            });
            
            setSuccessMessage(res.data.message + ' Redirecting to login...');
            setTimeout(() => navigate('/login'), 2500);
            
        } catch (err) {
            console.error('Reset error:', err);
            
            if (err.response?.status === 404) {
                setError('Reset endpoint not found. Please check your server configuration.');
            }
            else if (err.response?.status === 400) {
                setError(err.response.data.message || 'Invalid or expired reset link. Please request a new password reset.');
            }
            else {
                setError(err.response?.data?.message || 'Reset failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="modern-card auth-card">
                <h2 className="auth-title">
                    Reset Your Password
                </h2>

                <p className="auth-description">
                    Enter a new password for your account.
                </p>

                {!token && (
                    <div className="error-message">
                        Invalid reset link. Please check the link or request a new one.
                    </div>
                )}

                <form className="auth-form" onSubmit={handleReset}>
                    <input
                        type="password"
                        placeholder="New Password (min 6 characters)"
                        required
                        className="modern-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength="6"
                        disabled={!token || loading}
                    />
                    <input
                        type="password"
                        placeholder="Confirm New Password"
                        required
                        className="modern-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength="6"
                        disabled={!token || loading}
                    />
                    <button
                        type="submit"
                        className="modern-btn auth-btn"
                        disabled={loading || !token}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-modern"></span>
                                Resetting...
                            </>
                        ) : 'Reset Password'}
                    </button>
                </form>

                {error && <p className="error-message">{error}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}

                <p className="auth-footer">
                    <Link to="/login" className="auth-link">
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
}