import moment from 'moment-timezone';
import config from '../config/config.js';

/**
 * Timestamp synchronization utilities
 * Ensures consistent date/time formatting between backend and frontend
 */

/**
 * Get current timestamp in UTC (for database storage)
 * Database stores all timestamps in UTC
 */
export const getCurrentUTC = () => {
  return moment().utc().format('YYYY-MM-DD HH:mm:ss');
};

/**
 * Get current date in UTC
 */
export const getCurrentDateUTC = () => {
  return moment().utc().format('YYYY-MM-DD');
};

/**
 * Convert UTC timestamp to frontend timezone (for API responses)
 * Frontend uses local timezone for display
 */
export const utcToLocal = (utcTimestamp, timezone = config.timezone.default) => {
  if (!utcTimestamp) return null;
  return moment.utc(utcTimestamp).tz(timezone).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * Convert local timestamp to UTC (for database storage)
 * Frontend sends timestamps in local timezone
 */
export const localToUTC = (localTimestamp, timezone = config.timezone.default) => {
  if (!localTimestamp) return null;
  return moment.tz(localTimestamp, timezone).utc().format('YYYY-MM-DD HH:mm:ss');
};

/**
 * Format date for frontend display (matches frontend helpers.js formatDate)
 */
export const formatDate = (dateString) => {
  if (!dateString) return null;
  return moment(dateString).format('YYYY-MM-DD');
};

/**
 * Format datetime for frontend display (matches frontend helpers.js formatDateTime)
 */
export const formatDateTime = (dateTimeString, timezone = config.timezone.default) => {
  if (!dateTimeString) return null;
  return moment.utc(dateTimeString).tz(timezone).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * Parse frontend date/time and convert to UTC for database
 */
export const parseFrontendDateTime = (date, time, timezone = config.timezone.default) => {
  const dateTimeString = `${date} ${time}`;
  return moment.tz(dateTimeString, timezone).utc().format('YYYY-MM-DD HH:mm:ss');
};

/**
 * Format ISO 8601 timestamp (matches frontend Date.toISOString())
 */
export const toISOString = (timestamp) => {
  if (!timestamp) return null;
  return moment(timestamp).toISOString();
};

/**
 * Check if date is valid
 */
export const isValidDate = (dateString) => {
  return moment(dateString, 'YYYY-MM-DD', true).isValid();
};

/**
 * Calculate age from date of birth (matches frontend helpers.js)
 */
export const calculateAge = (dob) => {
  const birthDate = moment(dob);
  return moment().diff(birthDate, 'years');
};

/**
 * Transform database row timestamps for API response
 * Converts UTC timestamps to local timezone
 */
export const transformTimestamps = (row, timezone = config.timezone.default) => {
  if (!row) return row;

  const transformed = { ...row };

  // Convert created_at and updated_at if they exist
  if (transformed.created_at) {
    transformed.createdAt = toISOString(transformed.created_at);
    delete transformed.created_at;
  }

  if (transformed.updated_at) {
    transformed.updatedAt = toISOString(transformed.updated_at);
    delete transformed.updated_at;
  }

  if (transformed.uploaded_at) {
    transformed.uploadedAt = toISOString(transformed.uploaded_at);
    delete transformed.uploaded_at;
  }

  if (transformed.paid_at) {
    transformed.paidAt = toISOString(transformed.paid_at);
    delete transformed.paid_at;
  }

  if (transformed.completed_at) {
    transformed.completedAt = toISOString(transformed.completed_at);
    delete transformed.completed_at;
  }

  return transformed;
};

/**
 * Transform database row field names to camelCase (matching frontend)
 */
export const toCamelCase = (row) => {
  if (!row) return row;
  if (Array.isArray(row)) {
    return row.map(toCamelCase);
  }

  const transformed = {};

  for (const [key, value] of Object.entries(row)) {
    // Convert snake_case to camelCase
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    transformed[camelKey] = value;
  }

  return transformTimestamps(transformed);
};

export default {
  getCurrentUTC,
  getCurrentDateUTC,
  utcToLocal,
  localToUTC,
  formatDate,
  formatDateTime,
  parseFrontendDateTime,
  toISOString,
  isValidDate,
  calculateAge,
  transformTimestamps,
  toCamelCase,
};
