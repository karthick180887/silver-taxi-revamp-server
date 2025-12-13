/**
 * Utility functions for authentication and token management
 */

/**
 * Decode JWT token to extract claims (client-side only, no verification)
 * Note: This is for extracting data only, not for security verification
 */
export function decodeJWT(token: string): { adminId?: string; userId?: string; role?: string } | null {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        
        const claims = JSON.parse(jsonPayload);
        return {
            adminId: claims.adminId || claims.adminID,
            userId: claims.userData?.id,
            role: claims.userData?.role,
        };
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
    }
}

/**
 * Get admin ID from stored token
 */
export function getAdminId(): string | null {
    const token = localStorage.getItem('admin_token');
    if (!token) return null;
    
    const claims = decodeJWT(token);
    return claims?.adminId || null;
}

/**
 * Get user ID from stored token
 */
export function getUserId(): string | null {
    const token = localStorage.getItem('admin_token');
    if (!token) return null;
    
    const claims = decodeJWT(token);
    return claims?.userId || null;
}
