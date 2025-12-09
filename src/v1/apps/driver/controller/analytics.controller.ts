
import { Booking } from "../../../core/models";
import { Request, Response } from "express";
import { Op } from "sequelize";
import dayjs from "../../../../utils/dayjs";
import { DriverBookingLog } from "../../../core/models/driverBookingLog";

export const getDriverAnalytics = async (req: Request, res: Response) => {
    try {
        const adminId = req.query.adminId ?? req.body.adminId;
        const driverId = req.query.driverId ?? req.body.driverId;
        const { startDate, endDate } = req.query;

        if (!driverId) {
            res.status(404).json({ success: false, message: "Driver ID is required" });
            return;
        }

        const isValidFormat = (value: any) =>
            typeof value === "string" && dayjs(value, "DD-MM-YYYY", true).isValid();

        let tripLogs = [];
        let onlineLogs = [];
        let dateList: string[] = [];

        if (startDate && endDate) {
            if (!isValidFormat(startDate) || !isValidFormat(endDate)) {
                res.status(400).json({ success: false, message: "Invalid date format. Use DD-MM-YYYY." });
                return;
            }

            const start = dayjs(startDate as string, "DD-MM-YYYY");
            const end = dayjs(endDate as string, "DD-MM-YYYY");
            const differenceInDays = end.diff(start, "day") + 1;

            for (let i = 0; i < differenceInDays; i++) {
                dateList.push(start.add(i, "day").format("DD-MM-YYYY"));
            }

            tripLogs = await DriverBookingLog.findAll({
                where: {
                    driverId,
                    adminId,
                    bookingId: { [Op.not]: null } as any,
                    tripCompletedTime: { [Op.between]: [start.startOf("day").toDate(), end.endOf("day").toDate()] }
                }
            });

            onlineLogs = await DriverBookingLog.findAll({
                where: {
                    driverId,
                    adminId,
                    minuteId: { [Op.in]: dateList }
                }
            });
        } else if (startDate && !endDate) {
            if (!isValidFormat(startDate)) {
                res.status(400).json({ success: false, message: "Invalid date format. Use DD-MM-YYYY." });
                return;
            }

            const givenDate = dayjs(startDate as string, "DD-MM-YYYY");
            dateList = [givenDate.format("DD-MM-YYYY")];

            tripLogs = await DriverBookingLog.findAll({
                where: {
                    driverId,
                    adminId,
                    bookingId: { [Op.not]: null } as any,
                    tripCompletedTime: {
                        [Op.between]: [givenDate.startOf("day").toDate(), givenDate.endOf("day").toDate()]
                    }
                }
            });

            onlineLogs = await DriverBookingLog.findAll({
                where: {
                    driverId,
                    adminId,
                    minuteId: givenDate.format("DD-MM-YYYY")
                }
            });

            
        } else {
            res.status(400).json({ success: false, message: "Please provide 'startDate' or both 'startDate' and 'endDate'." });
            return;
        }

        // const aggregate = aggregateAnalytics(tripLogs, onlineLogs);

        const aggregate = (tripLogs.length === 0 && onlineLogs.length === 0)
            ? {
                activeDrivingMinutes: 0,
                emptyTrips: 0,
                traveledDistance: 0,
                netEarnings: 0,
                deductionAmount: 0,
                endTripValue: 0,
                avgAcceptTime: 0,
                driverBetta: 0,
                totalActiveDrivingMinutes: 0,
                totalTripAmount: 0,
                totalAdditionalCharges: 0,
                onlineMinutes: 0,
                totalRequests: 0,
                totalTrips: 0,
                acceptanceRate: 0,
                completionRate: 0,
                cancellationRate: 0,
                idealMinutes: 0,
                avgPerTrip: 0,
                avgTripDuration: 0,
                finalPayOut: 0
            }
            : aggregateAnalytics(tripLogs, onlineLogs);


        res.json({
            success: true,
            dateRange: dateList,
            driverId,
            data: aggregate
        });
    } catch (error) {
        console.error("Error in getDriverAnalytics:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

function aggregateAnalytics(tripLogs: any[], onlineLogs: any[]) {
    let totalRequests = tripLogs.length;
    let totalTrips = tripLogs.filter(log => log.tripStatus === "Completed").length;

    const accumulator = tripLogs.reduce((acc, log) => {
        acc.activeDrivingMinutes += log.activeDrivingMinutes ?? 0;
        acc.emptyTrips += log.emptyTrips ?? 0;
        acc.traveledDistance += log.traveledDistance ?? 0;
        acc.netEarnings += log.netEarnings ?? 0;
        acc.deductionAmount += log.deductionAmount ?? 0;
        acc.endTripValue += log.endTripValue ?? 0;
        acc.avgAcceptTime += log.avgAcceptTime ?? 0;
        acc.driverBetta += log.driverBetta ?? 0;
        acc.totalActiveDrivingMinutes += log.activeDrivingMinutes ?? 0;
        acc.totalTripAmount += log.netEarnings ?? 0;

        if (log.additionalCharges && typeof log.additionalCharges === "object") {
            Object.values(log.additionalCharges).forEach((value: any) => {
                acc.totalAdditionalCharges += Number(value) || 0;
            });
        }
        return acc;
    }, {
        activeDrivingMinutes: 0,
        emptyTrips: 0,
        traveledDistance: 0,
        netEarnings: 0,
        deductionAmount: 0,
        endTripValue: 0,
        avgAcceptTime: 0,
        driverBetta: 0,
        totalActiveDrivingMinutes: 0,
        totalTripAmount: 0,
        totalAdditionalCharges: 0
    });

    const onlineMinutes = onlineLogs.reduce((sum, log) => sum + (log.onlineMinutes ?? 0), 0);
    const acceptedCount = tripLogs.filter(log => ["Not-Started", "Started", "Completed"].includes(log.tripStatus)).length;
    const completedCount = totalTrips;
    const cancelledCount = tripLogs.filter(log => log.tripStatus === "Cancelled").length;

    return {
        ...accumulator,
        onlineMinutes: onlineMinutes,
        totalRequests,
        totalTrips,
        avgAcceptTime: Math.round(accumulator.avgAcceptTime),
        acceptanceRate: totalRequests > 0 ? Math.round((acceptedCount / totalRequests) * 100) : 0,
        completionRate: totalRequests > 0 ? Math.round((completedCount / totalRequests) * 100) : 0,
        cancellationRate: totalRequests > 0 ? Math.round((cancelledCount / totalRequests) * 100) : 0,
        idealMinutes: Math.round(onlineMinutes - accumulator.activeDrivingMinutes),
        avgPerTrip: totalTrips > 0 ? Math.round(accumulator.totalTripAmount / totalTrips) : 0,
        avgTripDuration: totalTrips > 0 ? Math.round(accumulator.totalActiveDrivingMinutes / totalTrips) : 0,
        finalPayOut: accumulator.totalTripAmount
    };
}



export const getGraphEarnings = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const driverId = req.body.driverId ?? req.query.driverId;
        const { weekDayStart, state }: { weekDayStart?: string; state?: string } = req.query;

        if (!driverId) {
            res.status(401).json({
                success: false,
                message: 'Driver id is required',
            });
            return;
        }

        const today = dayjs();

        // Step 1: Decide reference date
        let referenceDate = weekDayStart
            ? dayjs(weekDayStart, 'DD/MM/YYYY')
            : today.subtract(7, 'day'); // Default to previous week

        // Step 2: Validate
        if (!referenceDate.isValid()) {
            referenceDate = today.subtract(7, 'day');
            console.warn('❗ currentDate was invalid, falling back to:', referenceDate.format('DD/MM/YYYY'));
        }

        // Step 3: Apply week shift
        const weekShift = parseInt(state ?? '0', 10);
        referenceDate = referenceDate.add(weekShift, 'week');

        // Step 4: Get start of week (Sunday) and end (Saturday)
        const weekStart = referenceDate.subtract(referenceDate.day(), 'day'); // Sunday
        const weekEnd = weekStart.add(6, 'day'); // Saturday

        console.log('📅 Calculated Week Range:');
        console.log('➡️ From (Sunday):', weekStart.format('DD/MM/YYYY'));
        console.log('➡️ To (Saturday):', weekEnd.format('DD/MM/YYYY'));

        const bookings = await Booking.findAll({
            where: {
                adminId,
                driverId,
                status: 'Completed',
                tripStartedTime: {
                    [Op.gte]: weekStart.toDate(),
                    [Op.lte]: weekEnd.toDate(),
                },
            },
            attributes: [
                'bookingId',
                'tripStartedTime',
                'tripCompletedFinalAmount',
                'driverDeductionAmount',
                'driverCharges',
                'permitCharge',
                'toll',
                'hill',
            ],
            paranoid: false
        });

        console.log(`📊 Bookings found: ${bookings.length}`);

        const findEarnings = (records: any[]): number => {
            let totalEarnings = 0;
            let totalDriverDeductions = 0;
            let totalDriverCharges = 0;

            for (const booking of records) {
                // console.log("booking id >> ", booking.bookingId);
                totalEarnings += Number(booking.tripCompletedFinalAmount ?? 0);
                totalDriverDeductions += Number(booking.driverDeductionAmount ?? 0);

                // console.log("totalEarnings, totalDriverDeductions >> ", totalDriverDeductions,totalEarnings);

                let charges: Record<string, any> = {};

                if (typeof booking.driverCharges === 'object' && booking.driverCharges !== null) {
                    charges = booking.driverCharges;
                }

                // console.log("charges >> ", charges);

                const extraDriverCharges = Object.values(charges).reduce((sum: number, val) => {
                    const amount = Number(val);
                    return isNaN(amount) ? sum : sum + amount;
                }, 0);

                const permitCharge = Number(booking.permitCharge ?? 0);
                const toll = Number(booking.toll ?? 0);
                const hill = Number(booking.hill ?? 0);

                totalDriverCharges += extraDriverCharges + permitCharge + toll + hill;
                // console.log("totalDriverCharges >> ", totalDriverCharges);
            }

            // console.log("totalEarnings, totalDriverDeductions, totalDriverCharges >> ", totalEarnings, totalDriverDeductions, totalDriverCharges);
            // console.log("net >> ", totalEarnings - (totalDriverDeductions + totalDriverCharges));
            const net = totalEarnings - (totalDriverDeductions + totalDriverCharges);
            return net;
        };

        const earning = {
            sun: findEarnings(bookings.filter(b => dayjs(b.tripStartedTime).day() === 0)),
            mon: findEarnings(bookings.filter(b => dayjs(b.tripStartedTime).day() === 1)),
            tue: findEarnings(bookings.filter(b => dayjs(b.tripStartedTime).day() === 2)),
            wed: findEarnings(bookings.filter(b => dayjs(b.tripStartedTime).day() === 3)),
            thu: findEarnings(bookings.filter(b => dayjs(b.tripStartedTime).day() === 4)),
            fri: findEarnings(bookings.filter(b => dayjs(b.tripStartedTime).day() === 5)),
            sat: findEarnings(bookings.filter(b => dayjs(b.tripStartedTime).day() === 6)),
            weekDayStart: weekStart.format('DD/MM/YYYY'),
        };

        res.status(200).json({
            success: true,
            message: 'Weekly earnings fetched successfully',
            data: earning,
        });
        return;

    } catch (error) {
        console.error('❌ Error in getGraphEarnings:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Internal server error',
            error
        });
        return;
    }
};

