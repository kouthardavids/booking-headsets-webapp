import express from 'express';
import { userSignup, handleUserLogin, handleGoogleSignup, handleGoogleLogin } from '../controllers/authController.js';

const router = express.Router();

// Manual sign up and login
router.post('/sign-up', userSignup);
router.post('/user-login', handleUserLogin);

// Continue with Google sign up and login
router.post('/google-signup', handleGoogleSignup);
router.post('/google-login', handleGoogleLogin);

export default router;