import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ? process.env.NEXT_PUBLIC_API_URL : 'http://localhost:30060';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: `${API_BASE_URL}`,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ============================================
// AUTH API
// ============================================
export const authApi = {
    login: (input: string, password: string) =>
        api.post('/auth/admin/login', { email: input, phone: input, password }),

    register: (data: { name: string; email: string; password: string }) =>
        api.post('/auth/register', data),

    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            document.cookie = 'token=; Max-Age=0; path=/;';
            document.cookie = 'admin_token=; Max-Age=0; path=/;';
        }
    },
};

// ============================================
// DRIVERS API
// ============================================
export const driversApi = {
    getAll: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
        api.get('/v1/drivers', { params }),

    getById: (id: string) => api.get(`/v1/drivers/${id}`),

    create: (data: FormData) =>
        api.post('/v1/drivers', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    update: (id: string, data: Record<string, unknown>) =>
        api.put(`/v1/drivers/${id}`, data),

    delete: (id: string) => api.delete(`/v1/drivers/${id}`),

    getActive: () => api.get('/v1/drivers/active'),

    getLocations: () => api.get('/v1/drivers/location'),

    getWallet: (id: string) => api.get(`/v1/drivers/wallet/${id}`),

    addWallet: (id: string, amount: number, description: string) =>
        api.post(`/v1/drivers/wallet/add/${id}`, { amount, description }),

    getWalletRequests: () => api.get('/v1/drivers/wallet/requests'),

    updateVerification: (id: string, status: string) =>
        api.put(`/v1/drivers/verification/${id}`, { status }),

    getStats: () => api.get('/v1/drivers/stats'),
};

// ============================================
// CUSTOMERS API
// ============================================
export const customersApi = {
    getAll: (params?: { page?: number; limit?: number; search?: string }) =>
        api.get('/v1/customers', { params }),

    getById: (id: string) => api.get(`/v1/customers/${id}`),

    create: (data: Record<string, unknown>) => api.post('/v1/customers', data),

    update: (id: string, data: Record<string, unknown>) =>
        api.put(`/v1/customers/${id}`, data),

    delete: (id: string) => api.delete(`/v1/customers/${id}`),

    getBookings: (id: string) => api.get(`/v1/customers/bookings/${id}`),
};

// ============================================
// VENDORS API
// ============================================
export const vendorsApi = {
    getAll: (params?: { page?: number; limit?: number; search?: string }) =>
        api.get('/v1/vendors', { params }),

    getById: (id: string) => api.get(`/v1/vendors/${id}`),

    create: (data: Record<string, unknown>) => api.post('/v1/vendors', data),

    update: (id: string, data: Record<string, unknown>) =>
        api.put(`/v1/vendors/${id}`, data),

    delete: (id: string) => api.delete(`/v1/vendors/${id}`),

    getWallet: (id: string) => api.get(`/v1/vendors/wallet/${id}`),

    addWallet: (id: string, amount: number) =>
        api.post(`/v1/vendors/wallet/add/${id}`, { amount }),

    getBookings: (id: string) => api.get(`/v1/vendors/bookings/${id}`),
};

// ============================================
// BOOKINGS API
// ============================================
export const bookingsApi = {
    getAll: (params?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
        sortBy?: string;
        sortOrder?: string;
        driverId?: string;
        customerId?: string;
        vendorId?: string;
    }) => api.get('/v1/bookings', { params }),

    getById: (id: string) => api.get(`/v1/bookings/${id}`),

    create: (data: Record<string, unknown>) => api.post('/v1/bookings', data),

    update: (id: string, data: Record<string, unknown>) =>
        api.put(`/v1/bookings/${id}`, data),

    delete: (id: string) => api.delete(`/v1/bookings/${id}`),

    getDashboard: (params?: { areaChart?: boolean; barChart?: string; sortBy?: string }) =>
        api.get('/v1/bookings/dashboard', { params }),

    getRecent: (params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }) =>
        api.get('/v1/bookings/recent', { params }),

    assignDriver: (bookingId: string, driverId: string) =>
        api.post('/v1/bookings/assign-driver', { bookingId, driverId }),

    assignAll: (bookingId: string) =>
        api.post(`/v1/bookings/${bookingId}/assign-driver`),

    calculateFare: (data: Record<string, unknown>) =>
        api.post('/v1/bookings/fair-calculation', data),

    updateStatus: (id: string, status: string) =>
        api.put(`/v1/bookings/${id}/status`, { status }),

    getByStatus: (status: string, params?: { page?: number; limit?: number }) =>
        api.get(`/v1/bookings/status/${status}`, { params }),
};

// ============================================
// ENQUIRIES API
// ============================================
export const enquiriesApi = {
    getAll: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
        api.get('/v1/enquiries', { params }),

    getById: (id: string) => api.get(`/v1/enquiries/${id}`),

    create: (data: Record<string, unknown>) => api.post('/v1/enquiries', data),

    update: (id: string, data: Record<string, unknown>) =>
        api.put(`/v1/enquiries/${id}`, data),

    delete: (id: string) => api.delete(`/v1/enquiries/${id}`),

    convertToBooking: (id: string, data?: Record<string, unknown>) =>
        api.post(`/v1/enquiries/${id}/convert`, data),
};

// ============================================
// INVOICES API
// ============================================
export const invoicesApi = {
    getAll: (params?: { page?: number; limit?: number; status?: string; sortBy?: string; sortOrder?: string }) =>
        api.get('/v1/invoices', { params }),

    getById: (id: string) => api.get(`/v1/invoices/${id}`),

    create: (data: Record<string, unknown>) => api.post('/v1/invoices', data),

    update: (id: string, data: Record<string, unknown>) =>
        api.put(`/v1/invoices/${id}`, data),

    delete: (id: string) => api.delete(`/v1/invoices/${id}`),

    markAsPaid: (id: string) => api.put(`/v1/invoices/${id}/paid`),

    sendToCustomer: (id: string) => api.post(`/v1/invoices/${id}/send`),

    download: (id: string) => api.get(`/v1/invoices/${id}/download`, { responseType: 'blob' }),
};

// ============================================
// VEHICLES API
// ============================================
export const vehiclesApi = {
    getAll: (params?: { page?: number; limit?: number; search?: string; unassigned?: boolean }) =>
        api.get('/v1/vehicles', { params }),

    getById: (id: string) => api.get(`/v1/vehicles/${id}`),

    create: (data: FormData | Record<string, unknown>) => {
        const isFormData = data instanceof FormData;
        return api.post('/v1/vehicles', data, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined
        });
    },

    update: (id: string, data: FormData | Record<string, unknown>) => {
        const isFormData = data instanceof FormData;
        return api.put(`/v1/vehicles/${id}`, data, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined
        });
    },

    delete: (id: string) => api.delete(`/v1/vehicles/${id}`),

    getTypes: () => api.get('/v1/vehicles/types'),
};

// ============================================
// TARIFFS API
// ============================================
export const tariffsApi = {
    getAll: (params?: { page?: number; limit?: number }) =>
        api.get('/v1/tariffs', { params }),

    getById: (id: string) => api.get(`/v1/tariffs/${id}`),

    create: (data: Record<string, unknown>) => api.post('/v1/tariffs', data),

    update: (id: string, data: Record<string, unknown>) =>
        api.put(`/v1/tariffs/${id}`, data),

    delete: (id: string) => api.delete(`/v1/tariffs/${id}`),
};

// ============================================
// SERVICES API
// ============================================
export const servicesApi = {
    getAll: (params?: { page?: number; limit?: number }) =>
        api.get('/v1/services', { params }),

    getById: (id: string) => api.get(`/v1/services/${id}`),

    create: (data: Record<string, unknown>) => api.post('/v1/services', data),

    update: (id: string, data: Record<string, unknown>) =>
        api.put(`/v1/services/${id}`, data),

    delete: (id: string) => api.delete(`/v1/services/${id}`),
};

// ============================================
// OFFERS API
// ============================================
export const offersApi = {
    getAll: (params?: { page?: number; limit?: number; active?: boolean }) =>
        api.get('/v1/offers', { params }),

    getById: (id: string) => api.get(`/v1/offers/${id}`),

    create: (data: Record<string, unknown>) => api.post('/v1/offers', data),

    update: (id: string, data: Record<string, unknown>) =>
        api.put(`/v1/offers/${id}`, data),

    delete: (id: string) => api.delete(`/v1/offers/${id}`),

    toggleStatus: (id: string) => api.put(`/v1/offers/${id}/toggle`),
};

// ============================================
// PROMO CODES API
// ============================================
export const promoCodesApi = {
    getAll: (params?: { page?: number; limit?: number; active?: boolean }) =>
        api.get('/v1/promo-codes', { params }),

    getById: (id: string) => api.get(`/v1/promo-codes/${id}`),

    create: (data: Record<string, unknown>) => api.post('/v1/promo-codes', data),

    update: (id: string, data: Record<string, unknown>) =>
        api.put(`/v1/promo-codes/${id}`, data),

    delete: (id: string) => api.delete(`/v1/promo-codes/${id}`),

    validate: (code: string, bookingData?: Record<string, unknown>) =>
        api.post('/v1/promo-codes/validate', { code, ...bookingData }),
};

// ============================================
// NOTIFICATIONS API
// ============================================
export const notificationsApi = {
    getAll: (params?: { page?: number; limit?: number; type?: string; adminId?: string }) =>
        api.get('/v1/notifications', { params }),

    getCustomAll: (params?: { page?: number; limit?: number; adminId?: string; target?: string }) =>
        api.get('/v1/notifications/custom', { params }),

    getById: (id: string) => api.get(`/v1/notifications/${id}`),

    create: (data: FormData | Record<string, unknown>) => {
        const isFormData = data instanceof FormData;
        return api.post('/v1/notifications/custom', data, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined
        });
    },

    update: (id: string, data: Record<string, unknown>) =>
        api.put(`/v1/notifications/${id}`, data),

    delete: (id: string) => api.delete(`/v1/notifications/${id}`),

    deleteCustom: (templateId: string, adminId: string) =>
        api.delete(`/v1/notifications/custom/${templateId}`, { data: { adminId } }),

    sendCustomNotification: (templateId: string, data: { adminId: string }) =>
        api.post(`/v1/notifications/custom/${templateId}/send`, data),

    sendToAll: (data: { title: string; message: string; type: string }) =>
        api.post('/v1/notifications/send-all', data),

    sendToDrivers: (data: { title: string; message: string; driverIds?: string[] }) =>
        api.post('/v1/notifications/send-drivers', data),

    sendToCustomers: (data: { title: string; message: string; customerIds?: string[] }) =>
        api.post('/v1/notifications/send-customers', data),

    getUnreadCount: () => api.get('/v1/notifications/unread-count'),

    markAsRead: (id: string) => api.put(`/v1/notifications/${id}/read`),

    markAllAsRead: () => api.put('/v1/notifications/read-all'),
};

// ============================================
// COMPANY PROFILE API
// ============================================
export const companyProfileApi = {
    get: () => api.get('/v1/company-profile'),

    update: (data: Record<string, unknown>) =>
        api.put('/v1/company-profile', data),

    uploadLogo: (file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        return api.post('/v1/image-upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

// ============================================
// POPULAR ROUTES API
// ============================================
export const popularRoutesApi = {
    getAll: (params?: { page?: number; limit?: number }) =>
        api.get('/v1/popular-routes', { params }),

    getById: (id: string) => api.get(`/v1/popular-routes/${id}`),

    create: (data: Record<string, unknown>) => api.post('/v1/popular-routes', data),

    update: (id: string, data: Record<string, unknown>) =>
        api.put(`/v1/popular-routes/${id}`, data),

    delete: (id: string) => api.delete(`/v1/popular-routes/${id}`),
};

// ============================================
// DYNAMIC ROUTES API
// ============================================
export const dynamicRoutesApi = {
    getAll: (params?: { page?: number; limit?: number }) =>
        api.get('/v1/dynamic-routes', { params }),

    getById: (id: string) => api.get(`/v1/dynamic-routes/${id}`),

    create: (data: Record<string, unknown>) => api.post('/v1/dynamic-routes', data),

    update: (id: string, data: Record<string, unknown>) =>
        api.put(`/v1/dynamic-routes/${id}`, data),

    delete: (id: string) => api.delete(`/v1/dynamic-routes/${id}`),
};

// ============================================
// BLOGS API
// ============================================
export const blogsApi = {
    getAll: (params?: { page?: number; limit?: number; published?: boolean }) =>
        api.get('/v1/blogs', { params }),

    getById: (id: string) => api.get(`/v1/blogs/${id}`),

    create: (data: Record<string, unknown>) => api.post('/v1/blogs', data),

    update: (id: string, data: Record<string, unknown>) =>
        api.put(`/v1/blogs/${id}`, data),

    delete: (id: string) => api.delete(`/v1/blogs/${id}`),

    publish: (id: string) => api.put(`/v1/blogs/${id}/publish`),

    unpublish: (id: string) => api.put(`/v1/blogs/${id}/unpublish`),
};

// ============================================
// PERMIT CHARGES API
// ============================================
export const permitChargesApi = {
    getAll: (params?: { page?: number; limit?: number }) =>
        api.get('/v1/permit-charges', { params }),

    getById: (id: string) => api.get(`/v1/permit-charges/${id}`),

    create: (data: Record<string, unknown>) => api.post('/v1/permit-charges', data),

    update: (id: string, data: Record<string, unknown>) =>
        api.put(`/v1/permit-charges/${id}`, data),

    delete: (id: string) => api.delete(`/v1/permit-charges/${id}`),
};

// ============================================
// ALL INCLUDES API
// ============================================
export const allIncludesApi = {
    getAll: (params?: { page?: number; limit?: number }) =>
        api.get('/v1/all-includes', { params }),

    getById: (id: string) => api.get(`/v1/all-includes/${id}`),

    create: (data: Record<string, unknown>) => api.post('/v1/all-includes', data),

    update: (id: string, data: Record<string, unknown>) =>
        api.put(`/v1/all-includes/${id}`, data),

    delete: (id: string) => api.delete(`/v1/all-includes/${id}`),
};

// ============================================
// WALLET TRANSACTIONS API
// ============================================
export const walletTransactionsApi = {
    getAll: (params?: { page?: number; limit?: number; type?: string; userId?: string }) =>
        api.get('/v1/wallet-transactions', { params }),

    getById: (id: string) => api.get(`/v1/wallet-transactions/${id}`),

    getByDriver: (driverId: string, params?: { page?: number; limit?: number }) =>
        api.get(`/v1/wallet-transactions/driver/${driverId}`, { params }),

    getByVendor: (vendorId: string, params?: { page?: number; limit?: number }) =>
        api.get(`/v1/wallet-transactions/vendor/${vendorId}`, { params }),
};

// ============================================
// PAYMENT TRANSACTIONS API
// ============================================
export const paymentTransactionsApi = {
    getAll: (params?: { page?: number; limit?: number; status?: string }) =>
        api.get('/v1/payment-transactions', { params }),

    getById: (id: string) => api.get(`/v1/payment-transactions/${id}`),

    refund: (id: string, amount?: number) =>
        api.post(`/v1/payment-transactions/${id}/refund`, { amount }),
};

// ============================================
// COLUMN VISIBILITY API
// ============================================
export const columnVisibilityApi = {
    get: (table: string) => api.get(`/v1/column-visibility/${table}`),

    update: (table: string, columns: Record<string, boolean>) =>
        api.post(`/v1/column-visibility/${table}`, { columns }),
};

// ============================================
// CONFIG KEYS API
// ============================================
export const configKeysApi = {
    getAll: () => api.get('/v1/config-keys'),

    update: (data: Record<string, unknown>) =>
        api.post('/v1/config-keys', data),
};

// ============================================
// TOGGLES API
// ============================================
export const togglesApi = {
    getAll: () => api.get('/v1/toggles-change'),

    update: (data: Record<string, boolean>) =>
        api.post('/v1/toggles-change', data),
};

// ============================================
// IP TRACKING API
// ============================================
export const ipTrackingApi = {
    getAll: (params?: { page?: number; limit?: number }) =>
        api.get('/v1/ip-tracking', { params }),

    getById: (id: string) => api.get(`/v1/ip-tracking/${id}`),

    block: (ip: string) => api.post('/v1/ip-tracking/block', { ip }),

    unblock: (ip: string) => api.post('/v1/ip-tracking/unblock', { ip }),
};

// ============================================
// ALL PRICE CHANGES API
// ============================================
export const allPriceChangesApi = {
    getAll: (params?: { page?: number; limit?: number }) =>
        api.get('/v1/all-price-changes', { params }),

    getById: (id: string) => api.get(`/v1/all-price-changes/${id}`),

    create: (data: Record<string, unknown>) => api.post('/v1/all-price-changes', data),

    update: (id: string, data: Record<string, unknown>) =>
        api.put(`/v1/all-price-changes/${id}`, data),

    delete: (id: string) => api.delete(`/v1/all-price-changes/${id}`),
};

export default api;
