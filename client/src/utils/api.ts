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

  // Reports
  REPORTS: {
    STATS: '/reports/stats',
    LOGS: '/reports/logs',
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
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry a request with exponential backoff
   */
  private async retryRequest<T>(
    fn: () => Promise<Response>,
    attempt: number = 0
  ): Promise<Response> {
    try {
      const response = await fn();

      // If rate limited (429), retry with exponential backoff
      if (response.status === 429 && attempt < this.retryAttempts) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '0');
        const delay = retryAfter > 0 ? retryAfter * 1000 : this.retryDelay * Math.pow(2, attempt);

        console.warn(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${this.retryAttempts})`);
        await this.sleep(delay);

        return this.retryRequest(fn, attempt + 1);
      }

      return response;
    } catch (error) {
      // Network errors - retry with backoff
      if (attempt < this.retryAttempts) {
        const delay = this.retryDelay * Math.pow(2, attempt);
        console.warn(`Network error. Retrying in ${delay}ms (attempt ${attempt + 1}/${this.retryAttempts})`);
        await this.sleep(delay);

        return this.retryRequest(fn, attempt + 1);
      }

      throw error;
    }
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
      let errorMessage: string = response.statusText;
      let errorDetails: any = null;

      try {
        // Try to parse JSON body first
        const parsed = await response.json();
        errorDetails = parsed;
        
        // Handle validation errors (status 400 with errors array)
        if (parsed?.errors && Array.isArray(parsed.errors)) {
          const validationMessages = parsed.errors.map((err: any) => 
            `${err.field}: ${err.message}`
          ).join(', ');
          errorMessage = `Validation failed: ${validationMessages}`;
        } else {
          errorMessage = parsed?.message || parsed?.error || response.statusText;
        }
      } catch {
        // If not JSON, try to read as text
        try {
          const text = await response.text();
          if (text) {
            errorDetails = text;
            errorMessage = text;
          }
        } catch {
          // Body already consumed or not readable, use statusText
          errorMessage = response.statusText;
        }
      }

      // Log detailed error information for debugging
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        message: errorMessage,
        details: errorDetails
      });

      // Attach details to the Error object for callers to inspect
      const err: any = new Error(errorMessage || response.statusText);
      err.details = errorDetails;
      err.status = response.status;
      throw err;
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
    const response = await this.retryRequest(
      () => fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.buildHeaders(options),
        ...options,
      })
    );

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

  // Reports
  reports: {
    getStats: () =>
      apiClient.get(API_ENDPOINTS.REPORTS.STATS),
    getLogs: () =>
      apiClient.get(API_ENDPOINTS.REPORTS.LOGS),
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
