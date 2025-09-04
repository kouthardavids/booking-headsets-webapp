import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from "google-auth-library";
import { checkUserExists, signup, googleSignup } from "../models/userModel.js";
import db from '../config/db.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

dotenv.config();

export const userSignup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Check if user exists
        const existingUser = await checkUserExists(email);
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists. Please login.' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert user
        const userId = await signup(username, email, hashedPassword);

        // Fetch full user
        const newUser = await checkUserExists(email);

        // Create JWT tokens
        const accessToken = jwt.sign(
            { userId: newUser.user_id, email, role: 'student' },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { userId: newUser.user_id, email, role: 'student' },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(201).json({
            message: 'User registered successfully.',
            accessToken,
            user: {
                user_id: newUser.user_id,
                email: newUser.email,
                full_name: newUser.full_name,
                is_google_user: newUser.is_google_user
            }
        });

    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// Handle user login
export const handleUserLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await checkUserExists(email);
        if (!user) {
            return res.status(404).json({ message: 'User does not exist. Please sign up.' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Password is incorrect.' });
        }

        // Generate JWT tokens
        const accessToken = jwt.sign(
            { userId: user.user_id, email: user.email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { userId: user.user_id, email: user.email },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );

        // Set refresh token cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Return user data without password
        const { password_hash, ...userData } = user;

        return res.status(200).json({
            message: 'Login successful.',
            accessToken,
            user: userData
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// Google signup
export const handleGoogleSignup = async (req, res) => {
    try {
        const { idToken } = req.body;

        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: google_id, email, name: username } = payload;

        if (!email) {
            return res.status(400).json({ message: 'Google account has no email.' })
        };

        // Now we fetch the user using the email
        let user = await checkUserExists(email);

        if (user) {
            if (user.is_google_user) {
                return res.status(400).json({ message: 'User already exists. Please login instead.' });
            }

            if (!user.is_google_user) {
                return res.status(400).json({ message: 'Email already registered manually. Please login with password.' })
            }
        } else {
            const userId = await googleSignup(google_id, username, email);

            user = await checkUserExists(email);
        };

        const accessToken = jwt.sign(
            { userId: user.user_id, email: user.email, role: 'student' },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { userId: user.user_id, email: user.email, role: 'student' },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            accessToken,
            user: {
                user_id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                is_google_user: user.is_google_user
            }
        });
    } catch (error) {
        console.error('Google signup error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const handleGoogleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ message: "Missing Google ID token" });
        }

        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        if (!ticket) {
            return res.status(401).json({ message: "Invalid Google token" });
        }

        const payload = ticket.getPayload();
        const { sub: google_id, email, name: username } = payload;

        if (!email) {
            return res.status(400).json({ message: "Google account has no email." });
        }

        // Check if user exists
        let user = await checkUserExists(email);

        if (!user) {
            // User doesn't exist, they need to sign up first
            return res.status(404).json({
                message: "No account found with this email. Please sign up first.",
            });
        }

        // Check if user is a Google user
        if (!user.is_google_user) {
            return res.status(400).json({
                message: "This email was registered manually. Please log in with your password instead.",
            });
        }

        // Verify the Google ID matches
        if (user.google_id !== google_id) {
            return res.status(401).json({
                message: "Google account mismatch. Please use the correct Google account.",
            });
        }

        // Generate tokens
        const accessToken = jwt.sign(
            { userId: user.user_id, email: user.email, role: "student" },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            { userId: user.user_id, email: user.email, role: "student" },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        );

        // Save refresh token in cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            message: "Login successful",
            accessToken,
            user: {
                user_id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                is_google_user: user.is_google_user,
            }
        });
    } catch (error) {
        console.error("Google login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const generateAccessToken = async (req, res) => {
    // Check if cookies exist first
    if (!req.cookies) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        // Verify the refresh token
        const payload = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        // Check if the user still exists
        const user = await checkUserExists(payload.email);
        if (!user) {
            return res.status(403).json({ message: 'User no longer exists' });
        }

        // Generate a new access token
        const accessToken = jwt.sign(
            { userId: payload.userId, email: payload.email, role: payload.role || 'user' },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ accessToken });
    } catch (error) {
        console.error('Refresh token error:', error);

        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ message: 'Refresh token expired' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        res.status(500).json({ message: 'Internal server error' });
    }
};

export const sendForgotPasswordEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('Missing email credentials in environment variables');
            return res.status(500).json({ message: 'Email service not configured properly' });
        }

        const user = await checkUserExists(email);

        if (!user) {
            return res.status(404).json({
                message: `No user found with that email address.`
            });
        };

        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000); // 1 hour from now

        await db.query(
            `UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?`, [token, expiry, email]
        )

        const resetLink = `http://localhost:5173/reset-password/${token}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hello,</p>
      <p>You requested a password reset for your account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #818cf8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetLink}</p>
      <p><strong>This link will expire in 1 hour.</strong></p>
      <p>If you didn't request this password reset, please ignore this email.</p>
      <p>Best regards,<br>Headset Booking</p>
    </div>
  `
        };

        await transporter.sendMail(mailOptions);
        res.json({
            message: `Password reset email sent to your gmail account. Please check your inbox.`
        });

    } catch (error) {
        console.error('Error sending password reset email:', error);
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        console.log('Reset password attempt with token:', token);
        console.log('Password received:', password);

        // Check if the token exists at all
        const [tokenCheck] = await db.query(
            `SELECT * FROM users WHERE resetToken = ?`,
            [token]
        );

        console.log('Token check results:', tokenCheck);

        if (!tokenCheck || tokenCheck.length === 0) {
            console.log('Token not found in database');
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Check if token is expired
        const [rows] = await db.query(
            `SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > NOW()`,
            [token]
        );

        console.log('Valid token check results:', rows);

        if (!rows) {
            console.log('No valid user found for token.');
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const user = rows[0];
        console.log('User found:', user.email);

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            `UPDATE users SET password_hash = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE resetToken = ?`,
            [hashedPassword, token]
        );

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Failed to reset password. Please try again.' });
    }
};