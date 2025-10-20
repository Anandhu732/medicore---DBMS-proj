import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import config from '../config/config.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { toCamelCase } from '../utils/datetime.js';

/**
 * Authentication Controller
 * Handles user login, registration, and token generation
 *
 * TODO: Frontend Integration Points:
 * - POST /api/auth/login - Called from client/src/app/login/page.tsx
 * - POST /api/auth/register - Called from client/src/app/register/page.tsx
 * - GET /api/auth/me - Called from client/src/components/Layout.tsx on mount
 */

/**
 * User Login
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const users = await query(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (users.length === 0) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Remove password from response
    delete user.password;

    // Transform to camelCase for frontend
    const userData = toCamelCase(user);

    return successResponse(res, {
      user: userData,
      token,
    }, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 'Login failed', 500);
  }
};

/**
 * User Registration
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'doctor', department } = req.body;

    // Check if user already exists
    const existingUsers = await query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return errorResponse(res, 'User with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate user ID
    const userId = `U${Date.now()}`;

    // Insert user
    await query(
      `INSERT INTO users (id, name, email, password, role, department)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name, email, hashedPassword, role, department || null]
    );

    // Fetch created user
    const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];
    delete user.password;

    // Generate token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    const userData = toCamelCase(user);

    return successResponse(res, {
      user: userData,
      token,
    }, 'Registration successful', 201);

  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse(res, 'Registration failed', 500);
  }
};

/**
 * Get Current User
 * @route GET /api/auth/me
 * @access Private
 */
export const getCurrentUser = async (req, res) => {
  try {
    const users = await query(
      'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
      [req.user.id]
    );

    if (users.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    const user = users[0];
    delete user.password;

    const userData = toCamelCase(user);

    return successResponse(res, userData, 'User retrieved successfully');

  } catch (error) {
    console.error('Get current user error:', error);
    return errorResponse(res, 'Failed to retrieve user', 500);
  }
};

/**
 * Logout (client-side token removal, server just confirms)
 * @route POST /api/auth/logout
 * @access Private
 */
export const logout = async (req, res) => {
  return successResponse(res, null, 'Logout successful');
};

export default {
  login,
  register,
  getCurrentUser,
  logout,
};
