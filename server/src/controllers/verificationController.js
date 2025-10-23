import emailService from '../services/emailService.js';
import { query } from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Verification Controller
 * Handles email and phone verification operations
 */

/**
 * Send email verification code
 * POST /api/verification/email/send
 */
export const sendEmailVerification = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user details
    const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    const user = users[0];

    // Check if already verified
    if (user.email_verified) {
      return errorResponse(res, 'Email is already verified', 400);
    }

    // Check for recent verification attempts (rate limiting)
    const recentCodes = await query(
      `SELECT * FROM email_verification_codes
       WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (recentCodes.length > 0) {
      return errorResponse(res, 'Please wait before requesting another verification code', 429);
    }

    // Generate and store verification code
    const { code, expiresAt } = await emailService.storeVerificationCode(userId, user.email, 'registration');

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(user, code);

    if (!emailResult.success) {
      return errorResponse(res, 'Failed to send verification email. Please try again.', 500);
    }

    return successResponse(res, {
      message: 'Verification code sent successfully',
      expiresAt,
      email: user.email,
    });
  } catch (error) {
    console.error('Send verification error:', error);
    return errorResponse(res, 'Failed to send verification code', 500);
  }
};

/**
 * Verify email with code
 * POST /api/verification/email/verify
 */
export const verifyEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code || code.length !== 6) {
      return errorResponse(res, 'Valid 6-digit verification code is required', 400);
    }

    const result = await emailService.verifyCode(userId, code);

    if (!result.success) {
      return errorResponse(res, result.message, 400);
    }

    return successResponse(res, {
      message: result.message,
      verified: true,
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return errorResponse(res, 'Failed to verify email', 500);
  }
};

/**
 * Resend verification code
 * POST /api/verification/email/resend
 */
export const resendVerification = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user details
    const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    const user = users[0];

    // Check if already verified
    if (user.email_verified) {
      return errorResponse(res, 'Email is already verified', 400);
    }

    // Check cooldown (60 seconds)
    const recentCodes = await query(
      `SELECT * FROM email_verification_codes
       WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (recentCodes.length > 0) {
      const secondsLeft = 60 - Math.floor((Date.now() - new Date(recentCodes[0].created_at).getTime()) / 1000);
      return errorResponse(res, `Please wait ${secondsLeft} seconds before requesting another code`, 429);
    }

    // Generate and store new verification code
    const { code, expiresAt } = await emailService.storeVerificationCode(userId, user.email, 'registration');

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(user, code);

    if (!emailResult.success) {
      return errorResponse(res, 'Failed to send verification email. Please try again.', 500);
    }

    return successResponse(res, {
      message: 'New verification code sent successfully',
      expiresAt,
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return errorResponse(res, 'Failed to resend verification code', 500);
  }
};

/**
 * Check verification status
 * GET /api/verification/status
 */
export const getVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const users = await query(
      'SELECT email_verified, email_verified_at, phone_verified, phone_verified_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    const user = users[0];

    return successResponse(res, {
      emailVerified: user.email_verified,
      emailVerifiedAt: user.email_verified_at,
      phoneVerified: user.phone_verified,
      phoneVerifiedAt: user.phone_verified_at,
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    return errorResponse(res, 'Failed to get verification status', 500);
  }
};

export default {
  sendEmailVerification,
  verifyEmail,
  resendVerification,
  getVerificationStatus,
};
