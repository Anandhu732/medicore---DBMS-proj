/**
 * Permission Utility Functions
 * Provides helper functions for checking user permissions throughout the application
 */

import { ROLE_PERMISSIONS, PERMISSIONS, ROLES } from './constants';

/**
 * Get current user from localStorage
 */
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;

  const userData = localStorage.getItem('user');
  if (!userData) return null;

  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (userRole: string, permission: string): boolean => {
  if (!userRole || !permission) return false;

  const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
  if (!rolePermissions) return false;

  return (rolePermissions as readonly string[]).includes(permission);
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (userRole: string, permissions: string[]): boolean => {
  if (!userRole || !permissions || permissions.length === 0) return false;

  return permissions.some(permission => hasPermission(userRole, permission));
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (userRole: string, permissions: string[]): boolean => {
  if (!userRole || !permissions || permissions.length === 0) return false;

  return permissions.every(permission => hasPermission(userRole, permission));
};

/**
 * Check if user is admin
 */
export const isAdmin = (userRole: string): boolean => {
  return userRole === ROLES.ADMIN;
};

/**
 * Check if user is doctor
 */
export const isDoctor = (userRole: string): boolean => {
  return userRole === ROLES.DOCTOR;
};

/**
 * Check if user is receptionist
 */
export const isReceptionist = (userRole: string): boolean => {
  return userRole === ROLES.RECEPTIONIST;
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (userRole: string): string[] => {
  const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
  return rolePermissions || [];
};

/**
 * Permission check for specific actions
 */
export const can = {
  // Patient permissions
  viewPatients: (userRole: string) => hasPermission(userRole, PERMISSIONS.VIEW_PATIENTS),
  editPatients: (userRole: string) => hasPermission(userRole, PERMISSIONS.EDIT_PATIENTS),
  deletePatients: (userRole: string) => hasPermission(userRole, PERMISSIONS.DELETE_PATIENTS),

  // Appointment permissions
  viewAppointments: (userRole: string) => hasPermission(userRole, PERMISSIONS.VIEW_APPOINTMENTS),
  manageAppointments: (userRole: string) => hasPermission(userRole, PERMISSIONS.MANAGE_APPOINTMENTS),

  // Medical record permissions
  viewMedicalRecords: (userRole: string) => hasPermission(userRole, PERMISSIONS.VIEW_MEDICAL_RECORDS),
  editMedicalRecords: (userRole: string) => hasPermission(userRole, PERMISSIONS.EDIT_MEDICAL_RECORDS),

  // Billing permissions
  viewBilling: (userRole: string) => hasPermission(userRole, PERMISSIONS.VIEW_BILLING),
  manageBilling: (userRole: string) => hasPermission(userRole, PERMISSIONS.MANAGE_BILLING),

  // Report permissions
  viewReports: (userRole: string) => hasPermission(userRole, PERMISSIONS.VIEW_REPORTS),

  // Admin permissions
  manageUsers: (userRole: string) => hasPermission(userRole, PERMISSIONS.MANAGE_USERS),
  manageSettings: (userRole: string) => hasPermission(userRole, PERMISSIONS.MANAGE_SETTINGS),
};

/**
 * Route access control
 */
export const canAccessRoute = (userRole: string, route: string): boolean => {
  const routePermissions: { [key: string]: string[] } = {
    '/dashboard': [PERMISSIONS.VIEW_PATIENTS], // All authenticated users can access
    '/patients': [PERMISSIONS.VIEW_PATIENTS],
    '/add-patient': [PERMISSIONS.EDIT_PATIENTS],
    '/appointments': [PERMISSIONS.VIEW_APPOINTMENTS],
    '/schedule-appointment': [PERMISSIONS.MANAGE_APPOINTMENTS],
    '/medical-records': [PERMISSIONS.VIEW_MEDICAL_RECORDS],
    '/add-medical-record': [PERMISSIONS.EDIT_MEDICAL_RECORDS],
    '/billing': [PERMISSIONS.VIEW_BILLING],
    '/create-invoice': [PERMISSIONS.MANAGE_BILLING],
    '/reports': [PERMISSIONS.VIEW_REPORTS],
    '/profile': [PERMISSIONS.VIEW_PATIENTS], // All authenticated users can access
    '/settings': [PERMISSIONS.MANAGE_SETTINGS],
  };

  const requiredPermissions = routePermissions[route];
  if (!requiredPermissions) return true; // Allow access if route not specified

  return hasAnyPermission(userRole, requiredPermissions);
};
