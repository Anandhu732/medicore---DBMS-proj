/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * API Configuration and Helper Functions
 * Centralizes all API calls for the frontend
 */

// API Base URL - Change this to match your backend server
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },

  // Patients
  PATIENTS: {
    BASE: '/patients',
    BY_ID: (id: string) => `/patients/${id}`,
    ARCHIVE: (id: string) => `/patients/${id}/archive`,
    RESTORE: (id: string) => `/patients/${id}/restore`,
  },

  // Appointments
  APPOINTMENTS: {
    BASE: '/appointments',
    BY_ID: (id: string) => `/appointments/${id}`,
    CANCEL: (id: string) => `/appointments/${id}/cancel`,
    COMPLETE: (id: string) => `/appointments/${id}/complete`,
  },

  // Medical Records
  MEDICAL_RECORDS: {
    BASE: '/medical-records',
    BY_ID: (id: string) => `/medical-records/${id}`,
    BY_PATIENT: (patientId: string) => `/medical-records/patient/${patientId}`,
  },

  // Billing
  INVOICES: {
    BASE: '/invoices',
    BY_ID: (id: string) => `/invoices/${id}`,
    PAY: (id: string) => `/invoices/${id}/pay`,
  },

  // Dashboard
  DASHBOARD: {
    STATS: '/dashboard/stats',
    RECENT_ACTIVITIES: '/dashboard/activities',
  },
};

/**
 * HTTP Request Helper
 */
interface RequestOptions extends RequestInit {
  token?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authorization token from localStorage
   */
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          return userData.token || null;
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  /**
   * Build headers with authentication
   */
  private buildHeaders(options?: RequestOptions): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = options?.token || this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = response.statusText;
      let errorDetails = null;

      try {
        const error = await response.json();
        errorMessage = error.message || error.error || response.statusText;
        errorDetails = error;
      } catch {
        // If JSON parsing fails, use status text
        errorMessage = response.statusText;
      }

      // Log detailed error information for debugging
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        message: errorMessage,
        details: errorDetails
      });

      throw new Error(errorMessage);
    }

    const result = await response.json();

    // Handle backend response format: { success: true, data: [...], pagination: {...} }
    if (result.success && result.data !== undefined) {
      return result.data;
    }

    return result;
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.buildHeaders(options),
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.buildHeaders(options),
      body: JSON.stringify(data),
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.buildHeaders(options),
      body: JSON.stringify(data),
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.buildHeaders(options),
      body: JSON.stringify(data),
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.buildHeaders(options),
      ...options,
    });

    return this.handleResponse<T>(response);
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

/**
 * API Response Types
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Convenience methods for specific API calls
 */
export const api = {
  // Authentication
  auth: {
    login: (email: string, password: string) =>
      apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { email, password }),
    register: (data: any) =>
      apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data),
    logout: () =>
      apiClient.post(API_ENDPOINTS.AUTH.LOGOUT),
  },

  // Patients
  patients: {
    getAll: (params?: any) =>
      apiClient.get(API_ENDPOINTS.PATIENTS.BASE + (params ? `?${new URLSearchParams(params)}` : '')),
    getById: (id: string) =>
      apiClient.get(API_ENDPOINTS.PATIENTS.BY_ID(id)),
    create: (data: any) =>
      apiClient.post(API_ENDPOINTS.PATIENTS.BASE, data),
    update: (id: string, data: any) =>
      apiClient.put(API_ENDPOINTS.PATIENTS.BY_ID(id), data),
    archive: (id: string) =>
      apiClient.patch(API_ENDPOINTS.PATIENTS.ARCHIVE(id)),
  },

  // Appointments
  appointments: {
    getAll: (params?: any) =>
      apiClient.get(API_ENDPOINTS.APPOINTMENTS.BASE + (params ? `?${new URLSearchParams(params)}` : '')),
    getById: (id: string) =>
      apiClient.get(API_ENDPOINTS.APPOINTMENTS.BY_ID(id)),
    create: (data: any) =>
      apiClient.post(API_ENDPOINTS.APPOINTMENTS.BASE, data),
    update: (id: string, data: any) =>
      apiClient.put(API_ENDPOINTS.APPOINTMENTS.BY_ID(id), data),
    cancel: (id: string) =>
      apiClient.patch(API_ENDPOINTS.APPOINTMENTS.CANCEL(id)),
    complete: (id: string) =>
      apiClient.patch(API_ENDPOINTS.APPOINTMENTS.COMPLETE(id)),
  },

  // Medical Records
  medicalRecords: {
    getAll: (params?: any) =>
      apiClient.get(API_ENDPOINTS.MEDICAL_RECORDS.BASE + (params ? `?${new URLSearchParams(params)}` : '')),
    getById: (id: string) =>
      apiClient.get(API_ENDPOINTS.MEDICAL_RECORDS.BY_ID(id)),
    getByPatient: (patientId: string) =>
      apiClient.get(API_ENDPOINTS.MEDICAL_RECORDS.BY_PATIENT(patientId)),
    create: (data: any) =>
      apiClient.post(API_ENDPOINTS.MEDICAL_RECORDS.BASE, data),
    update: (id: string, data: any) =>
      apiClient.put(API_ENDPOINTS.MEDICAL_RECORDS.BY_ID(id), data),
  },

  // Invoices
  invoices: {
    getAll: (params?: any) =>
      apiClient.get(API_ENDPOINTS.INVOICES.BASE + (params ? `?${new URLSearchParams(params)}` : '')),
    getById: (id: string) =>
      apiClient.get(API_ENDPOINTS.INVOICES.BY_ID(id)),
    create: (data: any) =>
      apiClient.post(API_ENDPOINTS.INVOICES.BASE, data),
    update: (id: string, data: any) =>
      apiClient.put(API_ENDPOINTS.INVOICES.BY_ID(id), data),
    pay: (id: string, data: any) =>
      apiClient.patch(API_ENDPOINTS.INVOICES.PAY(id), data),
  },

  // Dashboard
  dashboard: {
    getStats: () =>
      apiClient.get(API_ENDPOINTS.DASHBOARD.STATS),
    getActivities: () =>
      apiClient.get(API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITIES),
  },

  // Admin/Users
  users: {
    getAll: (params?: any) =>
      apiClient.get('/admin/users' + (params ? `?${new URLSearchParams(params)}` : '')),
    getById: (id: string) =>
      apiClient.get(`/admin/users/${id}`),
  },
};

export default api;
