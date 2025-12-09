import { BookingActivityLog } from "../models";


export const bookingActivity = async (data: any) => {

    await BookingActivityLog.create(data)
}