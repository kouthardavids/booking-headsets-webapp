import express from 'express';
import { userSignup, handleUserLogin, handleGoogleSignup, handleGoogleLogin, generateAccessToken, resetPassword, sendForgotPasswordEmail } from '../controllers/authController.js';

const router = express.Router();

// Manual sign up and login
router.post('/sign-up', userSignup);
router.post('/user-login', handleUserLogin);

// Continue with Google sign up and login
router.post('/google-signup', handleGoogleSignup);
router.post('/google-login', handleGoogleLogin);

router.post('/refresh-token', generateAccessToken);

router.post('/forgot-password', sendForgotPasswordEmail);
router.post('/reset-password/:token', resetPassword);
export default router;