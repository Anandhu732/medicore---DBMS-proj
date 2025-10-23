import express from 'express';
import {
  sendEmailVerification,
  verifyEmail,
  resendVerification,
  getVerificationStatus,
} from '../controllers/verificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * Verification Routes
 * All routes require authentication
 */

// Send email verification code
router.post('/email/send', authenticate, sendEmailVerification);

// Verify email with code
router.post('/email/verify', authenticate, verifyEmail);

// Resend verification code
router.post('/email/resend', authenticate, resendVerification);

// Get verification status
router.get('/status', authenticate, getVerificationStatus);

export default router;
