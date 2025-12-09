interface BookingAttributes {
    bookingId: string
    adminId: string
    name: string
    email?: string
    phone: string
    amount: number
    pickupLocation: string
    dropLocation: string
    distance: number
    mainService: string
    subservice: string
    vehicleId: string
    vehicleName: string
    vehicleType: string
    tariffId?: string
    status: "in-progress" | "completed" | "cancelled"
    driverId?: string | null
    pickupDate: Date
    dropDate?: Date | null
}

export { BookingAttributes }