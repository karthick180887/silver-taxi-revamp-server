export interface JwtType {
    userData: {
        id: string,
        role: string,
        username: string,
        domain: string
    }
    adminId?: string
}