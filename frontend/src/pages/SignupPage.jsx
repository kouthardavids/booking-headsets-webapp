import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function RegisterPageDesign() {
  const gold = '#C5A357';
  const goldHover = '#b8954e';
  const [hover, setHover] = useState(false);

  const inputStyle = {
    fontSize: '1.125rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid #ced4da',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8f9fa',
        padding: '1rem',
      }}
    >

      <div
        style={{
          padding: '2rem',
          borderRadius: '1rem',
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'white',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h2
          style={{
            fontWeight: '700',
            color: '#212529',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          Create Your Account
        </h2>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ flexGrow: 1, borderTop: '1px solid #adb5bd' }}></div>
          <span style={{ margin: '0 1rem', color: '#6c757d', fontSize: '0.8rem' }}>
            or sign up with email
          </span>
          <div style={{ flexGrow: 1, borderTop: '1px solid #adb5bd' }}></div>
        </div>

        {/* Email signup form */}
        <form style={{ display: 'grid', gap: '1rem' }}>
          <input type="email" placeholder="Email" style={inputStyle} />
          <input type="password" placeholder="Password (min. 6 characters)" style={inputStyle} />
          <input type="password" placeholder="Confirm Password" style={inputStyle} />
          <button
            type="submit"
            style={{
              backgroundColor: hover ? goldHover : gold,
              color: 'white',
              border: 'none',
              padding: '0.75rem',
              fontWeight: '700',
              borderRadius: '0.75rem',
              width: '100%',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            Sign Up
          </button>
        </form>

        {/* Footer */}
        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: '#6c757d', fontSize: '0.875rem' }}>
          Already have an account?
          <Link
            to="/login"
            style={{ color: gold, textDecoration: 'none', marginLeft: '0.25rem' }}
            onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
