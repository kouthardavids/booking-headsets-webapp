import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from "google-auth-library";
import { checkUserExists, signup, googleSignup } from "../models/userModel.js";

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

        const accesstoken = jwt.sign(
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
            secure: false,
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            accesstoken,
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

        const accesstoken = jwt.sign(
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
            secure: false,
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            accesstoken,
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