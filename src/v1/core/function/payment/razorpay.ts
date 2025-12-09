import { Booking, Driver, DriverWallet, WalletTransaction, CustomerWallet, Customer, Tariff, Vehicle, CompanyProfile } from "../../models/index";
import { infoLogger as log, debugLogger as debug } from "../../../../utils/logger";
import { CustomerTransaction } from "../../../core/models/customerTransactions";
import { createCustomerNotification, createNotification } from "../notificationCreate";
import { sendToSingleToken } from "../../../../common/services/firebase/appNotify";
import { sumSingleObject } from "../objectArrays";
import { commissionCalculation } from "../commissionCalculation";
import { emailTripCompleted } from "../../../../common/services/mail/mail";
import { createInvoice } from "../createFn/invoiceCreate";
import { applyPromoCode, applyOffer, sendBookingEmail, sendBookingNotifications, deductWallet } from "../postBookingCreation";
import { sendNotification } from "../../../../common/services/socket/websocket";
import SMSService from "../../../../common/services/sms/sms";

const sms = SMSService()


export const paymentMethodsObj = {
    "cash": "Cash",
    "card": "Card",
    "upi": "UPI",
    "bank": "Bank",
    "wallet": "Wallet",
    "netbanking": "Bank",
}


export const handleWalletPayment = async (payment: any, orderId: string) => {

    try {
        console.log("handleWalletPayment orderId >>", orderId);
        const transaction = await WalletTransaction.findOne({
            where: {
                tnxOrderId: orderId
            }
        });

        if (!transaction) {
            console.log("Transaction not found for orderId:", orderId);
            return;
        }

        if (transaction?.tnxPaymentStatus && ["Success"].includes(transaction.tnxPaymentStatus)) {
            console.log("Already processed transaction:", transaction.tnxOrderId);
            return;
        }

        const wallet = await DriverWallet.findOne({ where: { walletId: transaction.walletId } });

        if (!wallet) {
            console.log("Wallet not found for orderId:", orderId);
            return;
        }

        const fareBreakup = {
            previousWalletBalance: wallet.balance,
            amount: transaction.amount,
            prefix: "+",
            postWalletBalance: wallet.balance + transaction.amount,
        }

        // Update wallet balance
        wallet.balance += Number(transaction.amount);
        wallet.plusAmount += Number(transaction.amount);
        wallet.totalAmount += Number(transaction.amount);
        await wallet.save();

        // Update transaction
        transaction.tnxPaymentStatus = "Success";
        transaction.tnxPaymentId = payment.id;
        transaction.tnxPaymentAmount = payment.amount;
        transaction.isShow = true;
        transaction.initiatedBy = "self";
        transaction.tnxPaymentMethod = payment.method;
        transaction.tnxPaymentTime = new Date(payment.created_at * 1000);
        transaction.fareBreakdown = fareBreakup
        await transaction.save();

        console.log("✅ Wallet updated successfully for orderId:", orderId);
    }
    catch (error) {
        console.error("❌ Error updating wallet for orderId:", orderId);
        console.error("wallet payment error >> ", error);
    }
};

export const handleWalletPaymentFailure = async (payment: any, orderId: string) => {

    try {
        const transaction = await WalletTransaction.findOne({
            where: {
                tnxOrderId: orderId
            }
        });

        if (!transaction) {
            console.log("Transaction not found for orderId:", orderId);
            return;
        }

        // Increment retry count for failed payments
        // Each payment.failed event represents a retry attempt
        const retryCount = (transaction.retryCount || 0) + 1;

        if (transaction?.tnxPaymentStatus && ["Success"].includes(transaction.tnxPaymentStatus)) {
            console.log("Already processed transaction:", transaction.tnxOrderId);
            return;
        }

        const fareBreakup = {
            previousWalletBalance: transaction.fareBreakdown?.previousWalletBalance || 0,
            amount: transaction.amount,
            prefix: "-",
            postWalletBalance: (transaction.fareBreakdown?.previousWalletBalance || 0) - transaction.amount,
        }

        // Update transaction
        transaction.tnxPaymentStatus = "Failed";
        transaction.tnxPaymentId = payment.id;
        transaction.tnxPaymentAmount = payment.amount;
        transaction.isShow = true;
        transaction.initiatedBy = "self";
        transaction.tnxPaymentMethod = payment.method;
        transaction.tnxPaymentTime = new Date(payment.created_at * 1000);
        transaction.fareBreakdown = fareBreakup;
        transaction.retryCount = retryCount;
        await transaction.save()

        console.log(`✅ Wallet payment failed for orderId: ${orderId}, retry count: ${retryCount}`);
    }
    catch (error) {
        console.error("❌ Error updating wallet for orderId:", orderId);
        console.error("wallet payment error >> ", error);
    }
};


export const handleBookingPayment = async (payment: any, orderId: string, notes: any) => {
    try {
        console.log("handlePayment orderId >>", orderId);
        console.log("handlePayment notes >>", notes);
        console.log("Payment >>", payment);

        const transaction = await CustomerTransaction.findOne({
            where: { tnxOrderId: orderId }
        });

        if (!transaction) {
            console.log("Transaction not found for orderId:", orderId);
            return;
        }

        if (transaction?.tnxPaymentStatus && ["Success"].includes(transaction.tnxPaymentStatus)) {
            console.log("Already processed transaction:", transaction.tnxOrderId);
            return;
        }

        // Update UPI transaction status
        transaction.tnxPaymentStatus = "Success";
        transaction.tnxPaymentId = payment.id;
        transaction.tnxPaymentAmount = payment.amount;
        transaction.isShow = true;
        transaction.initiatedBy = "self";
        transaction.tnxPaymentMethod = payment.method;
        transaction.tnxPaymentTime = new Date(payment.created_at * 1000);
        await transaction.save();

        console.log("✅ UPI transaction updated successfully");

        if (notes.bookingId) {
            const booking = await Booking.findOne({
                where: { bookingId: notes?.bookingId }
            });

            if (!booking) {
                console.log(`No booking found for ${notes.bookingId}`);
                return;
            }

            console.log("Processing booking >>", booking.bookingId);

            const customer = await Customer.findOne({ where: { customerId: notes.customerId } });
            if (!customer) {
                console.log(`No customer found for ${notes.customerId}`);
                return;
            }

            const tariff = await Tariff.findOne({
                where: { tariffId: booking.tariffId },
                include: [{ model: Vehicle, as: 'vehicles' }],
            });
            if (!tariff) {
                console.log(`No tariff found for ${booking.tariffId}`);
                return;
            }

            // Apply promo code
            if (notes.promoCodeId && notes.promoCode && notes.discountAmount) {
                booking.discountAmount = Number(notes.discountAmount);
                booking.finalAmount = Number(notes.finalAmount) - Number(notes.discountAmount);
                // booking.pendingPromoCode = null;

                const usageId = `pu-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

                await applyPromoCode({
                    adminId: notes.adminId,
                    codeId: notes.promoCodeId,
                    usageId: usageId,
                    promoCode: notes.promoCode,
                    codeType: notes.codeType,
                    value: Number(notes.promoValue),
                    discountAmount: Number(notes.discountAmount),
                    customerId: notes.customerId,
                    bookingId: notes.bookingId,
                    finalAmount: Number(notes.finalAmount),
                });
            }

            // Apply offer
            if (notes.offerId && notes.discountAmount) {
                booking.offerId = notes.offerId;
                // booking.pendingOfferId = null;

                await applyOffer({
                    adminId: notes.adminId,
                    offerId: notes.offerId,
                    offerName: notes.offerName,
                    customerId: notes.customerId,
                    bookingId: notes.bookingId,
                    finalAmount: Number(notes.finalAmount),
                    discountAmount: Number(notes.discountAmount),
                });
            }

            // Handle wallet deduction
            let walletDeducted = 0;
            if (notes.plannedWalletAmount && notes.plannedWalletAmount > 0) {
                console.log("Processing wallet deduction >>", notes.plannedWalletAmount);

                const wallet = await CustomerWallet.findOne({
                    where: { customerId: notes.customerId }
                });

                if (wallet) {
                    walletDeducted = await deductWallet({
                        wallet,
                        amount: Number(notes.plannedWalletAmount),
                        adminId: notes.adminId,
                        customerId: notes.customerId,
                        bookingId: notes.bookingId,
                        transactionId: notes.walletTransactionId,
                    });
                    console.log(`✅ Wallet deducted: ${walletDeducted} for booking ${booking.bookingId}`);
                } else {
                    console.log("⚠️ Wallet not found for customer:", notes.customerId);
                }
            }

            // Update booking status and payment details
            const finalBookingAmount = Number(notes.finalAmount) - Number(notes.discountAmount || 0);
            const totalPaid = Number(notes.actualUpiAmount) + walletDeducted;

            if (totalPaid >= finalBookingAmount) {
                booking.paymentStatus = 'Paid';
                booking.upPaidAmount = 0;
            } else {
                booking.paymentStatus = 'Partial Paid';
                booking.upPaidAmount = finalBookingAmount - totalPaid;
            }

            booking.bookingPaymentId = payment.id;
            booking.paymentMethod = 'UPI';
            booking.advanceAmount = walletDeducted;

            await booking.save();

            // Send notifications
            await sendBookingNotifications({
                adminId: notes.adminId,
                customerId: booking.createdBy === 'User' ? notes.customerId : null,
                createdBy: booking.createdBy,
                bookingId: notes.bookingId,
                customerName: customer.name,
                customerPhone: customer.phone,
                customerFcmToken: customer.fcmToken,
                customerAdminId: customer.adminId,
                from: booking.pickup,
                to: booking.drop,
            });

            // Send email
            await sendBookingEmail({
                booking,
                customer,
                pickupDateTime: booking.pickupDateTime.toISOString(),
                dropDateObj: booking.dropDate,
                estimatedAmount: booking.estimatedAmount,
                discountAmount: booking.discountAmount,
                taxAmount: booking.taxAmount,
                toll: 0,
                hill: 0,
                permitCharge: 0,
                finalAmount: booking.finalAmount,
                paymentMethod: booking.paymentMethod,
                vehicleType: notes.vehicleType ?? null,
            });

            console.log("✅ Booking updated successfully:");
            console.log("- Booking ID:", booking.bookingId);
            console.log("- Payment Status:", booking.paymentStatus);
            console.log("- Payment Method:", booking.paymentMethod);
            console.log("- UPI Amount:", notes.actualUpiAmount);
            console.log("- Wallet Deducted:", walletDeducted);
            console.log("- Total Amount:", notes.finalAmount);
        }

        console.log("✅ Booking payment processed successfully for orderId:", orderId);
    } catch (error) {
        console.error("❌ Error processing booking payment for orderId:", orderId);
        console.error("Booking payment error >>", error);

        // Update transaction status to failed
        try {
            const transaction = await CustomerTransaction.findOne({
                where: { tnxOrderId: orderId }
            });
            if (transaction && transaction.tnxPaymentStatus === "Pending") {
                transaction.tnxPaymentStatus = "Failed";
                transaction.isShow = true;
                await transaction.save();
            }
        } catch (updateError) {
            console.error("Error updating failed transaction:", updateError);
        }
    }
};


export const handleBookingPaymentFailure = async (payment: any, orderId: string, notes: any) => {

    try {
        console.log("Notes", notes);
        log.info(`Notes >>>>>>>>>>>>>>   ${notes}`);
        const transaction = await CustomerTransaction.findOne({
            where: {
                tnxOrderId: orderId
            }
        });

        if (!transaction) {
            console.log("Transaction not found for orderId:", orderId);
            return;
        }

        // Increment retry count for failed payments
        const retryCount = (transaction.retryCount || 0) + 1;

        if (transaction?.tnxPaymentStatus && ["Success"].includes(transaction.tnxPaymentStatus)) {
            console.log("Already processed transaction:", transaction.tnxOrderId);
            return;
        }

        // Update transaction
        transaction.tnxPaymentStatus = "Failed";
        transaction.tnxPaymentId = payment.id;
        transaction.tnxOrderId = payment.order_id;
        transaction.tnxPaymentAmount = payment.amount;
        transaction.isShow = true;
        transaction.initiatedBy = "self";
        transaction.tnxPaymentMethod = payment.method;
        transaction.tnxPaymentTime = new Date(payment.created_at * 1000);
        transaction.retryCount = retryCount;
        await transaction.save()

        console.log(`✅ Booking payment failed for orderId: ${orderId}, retry count: ${retryCount}`);
    }
    catch (error) {
        console.error("❌ Error updating booking for orderId:", orderId);
        console.error("Booking payment error >> ", error);
    }
};

export const tripCompletedPayment = async (payment: any, orderId: string, notes: any) => {

    try {
        console.log("handlePayment orderId >>", orderId, "payment.order_id >>", payment.order_id);
        const transaction = await CustomerTransaction.findOne({
            where: {
                tnxOrderId: orderId
            }
        });

        if (!transaction) {
            debug.info(`Transaction not found for orderId: ${orderId}`);
            return;
        }

        if (transaction?.tnxPaymentStatus && ["Success"].includes(transaction.tnxPaymentStatus)) {
            console.log("Already processed transaction:", transaction.tnxOrderId);
            return;
        }
        // Update transaction
        transaction.tnxPaymentStatus = "Success";
        transaction.tnxPaymentId = payment.id;
        transaction.tnxPaymentAmount = payment.amount;
        transaction.tnxOrderId = payment.order_id;
        transaction.isShow = true;
        transaction.initiatedBy = "self";
        transaction.tnxPaymentMethod = payment.method;
        transaction.tnxPaymentTime = new Date(payment.created_at * 1000);
        await transaction.save();

        if (notes.bookingId) {
            const booking = await Booking.findOne({
                where: {
                    bookingId: notes?.bookingId
                }
            })

            if (!booking) {
                log.info(`No booking found for ${notes.bookingId}`)
                return;
            }

            let driver: any;
            if (notes.driverId) {
                driver = await Driver.findOne({
                    where: {
                        driverId: notes?.driverId
                    }
                })

                if (!driver) {
                    log.info(`No driver found for ${notes.driverId}`)
                    return;
                }
            }

            const methodKey = payment.method.toLowerCase() as keyof typeof paymentMethodsObj;
            const paymentType: "Wallet" | "UPI" | "Bank" | "Cash" | "Card" =
                (paymentMethodsObj[methodKey] as "Wallet" | "UPI" | "Bank" | "Cash" | "Card") || "UPI";
            console.log("razorpay paymentType >> ", paymentType);

            booking.paymentStatus = "Paid"
            booking.status = "Completed"
            booking.bookingPaymentId = payment.Id
            booking.bookingOrderId = payment.order_id;
            booking.paymentMethod = paymentType
            booking.upPaidAmount = 0;

            driver.assigned = false;
            driver.bookingCount += 1;
            driver.totalEarnings = String(Number(driver.totalEarnings) + (Number(booking.tripCompletedFinalAmount) - Number(booking.driverDeductionAmount)));
            await driver.save();
            await booking.save();

            const extraChargesValue = sumSingleObject(booking.extraCharges);

            const driverCommission = await commissionCalculation({
                debitedId: driver.driverId,
                amount: booking.driverDeductionAmount + extraChargesValue,
                serviceId: booking.serviceId,
                debitedBy: "Driver",
                bookingId: booking.bookingId,
                creditAmount: booking.tripCompletedFinalAmount - extraChargesValue

            });

            console.log("driverCommission >> ", driverCommission)

            console.log("From and to", booking.pickup, booking.drop);

            if (booking.createdBy === "Vendor") {
                const vendorCommission = await commissionCalculation({
                    debitedId: booking.vendorId,
                    amount: booking.vendorDeductionAmount,
                    serviceId: booking.serviceId,
                    debitedBy: "Vendor",
                    bookingId: booking.bookingId,
                    creditAmount: booking.vendorCommission + extraChargesValue,
                    pickup: booking.pickup,
                    drop: booking.drop
                });

                console.log("vendorCommission >> ", vendorCommission);
            }

            let isCustomerAvailable = false;


            const customer = await Customer.findOne({
                where: {
                    customerId: booking.customerId,
                },
            })


            // Send notification to customer
            if (customer) {
                let customerName = customer ? customer.name : "Customer";

                const customerNotification = await createCustomerNotification({
                    title: "Your trip has been completed!",
                    message: `Thank you, ${customerName}, for riding with us. Your trip with Driver ${driver.name} has been successfully completed. We hope you had a great experience!`,

                    ids: {
                        adminId: booking.adminId,
                        bookingId: booking.bookingId,
                        customerId: booking.customerId
                    },

                    type: "booking"
                });


                try {
                    if (customerNotification) {
                        const tokenResponse = await sendToSingleToken(customer.fcmToken, {
                            // title: 'New Booking Arrived',
                            // message: `Mr ${driver.name} You have received a new booking`,
                            ids: {
                                adminId: booking.adminId,
                                bookingId: booking.bookingId,
                                customerId: booking.customerId
                            },
                            data: {
                                title: 'Your trip has been completed!',
                                message: `Thank you, ${customerName}, for riding with us. Your trip with Driver ${driver.name} has been successfully completed. We hope you had a great experience!`,
                                type: "customer-trip-completed",
                                channelKey: "customer_info",
                            }
                        });
                        debug.info(`FCM Notification Response: ${tokenResponse}`);
                    } else {
                        debug.info("trip  completed notification to customer is false");
                    }
                } catch (err: any) {
                    debug.info(`FCM Notification Error - trip completeed notification to customer: ${err}`);
                }

                isCustomerAvailable = true
            }


            const time = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kolkata' }).format(new Date());
            const notification = {
                adminId: booking.adminId,
                vendorId: booking.createdBy === "Vendor" ? booking.vendorId : null,
                title: `Trip Completed – Trip #${booking.bookingId}`,
                description: `Driver has successfully completed Trip #${booking.bookingId}.`,
                type: "booking",
                read: false,
                date: new Date(),
                time: time,
            };

            const adminNotification = {
                adminId: booking.adminId,
                vendorId: null,
                title: `Trip Completed – Trip #${booking.bookingId}`,
                description: `Driver has successfully completed Trip #${booking.bookingId}.`,
                type: "booking",
                read: false,
                date: new Date(),
                time: time,
            }

            const adminNotificationResponse = await createNotification(adminNotification as any);

            if (booking.createdBy === "Vendor") {
                const notificationResponse = await createNotification(notification as any);
                if (notificationResponse.success) {
                    sendNotification(booking.vendorId, {
                        notificationId: notificationResponse.notificationId ?? undefined,
                        title: `Trip Completed – Trip #${booking.bookingId}`,
                        description: `Driver has successfully completed Trip #${booking.bookingId}.`,
                        type: "booking",
                        read: false,
                        date: new Date(),
                        time: time,
                    });
                }
            }

            if (adminNotificationResponse.success) {
                sendNotification(booking.adminId, {
                    notificationId: adminNotificationResponse.notificationId ?? undefined,
                    title: `Trip Completed – Trip #${booking.bookingId}`,
                    description: `Driver has successfully completed Trip #${booking.bookingId}.`,
                    type: "booking",
                    read: false,
                    date: new Date(),
                    time: time,
                });
            }

            // Send email to customer
            try {
                const emailData = {
                    bookingId: booking.bookingId,
                    bookingDate: new Date(booking.createdAt).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    name: booking.name,
                    phone: booking.phone,
                    email: booking.email,
                    pickup: booking.pickup,
                    drop: booking.drop ?? null,
                    pickupDate: new Date(booking.pickupDateTime).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    pickupTime: new Date(booking.pickupDateTime).toLocaleString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    dropDate: booking.dropDate ? new Date(booking.dropDate).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }) : null,
                    driverName: driver.name,
                    carType: booking.vehicleType,
                    serviceType: booking.serviceType,
                    finalAmount: booking.finalAmount,
                    advanceAmount: booking.advanceAmount,
                    upPaidAmount: booking.upPaidAmount,
                };

                // console.log("emailData ---> ", emailData);
                const emailResponse = await emailTripCompleted(emailData);
                // console.log("emailResponse ---> ", emailResponse);
                if (emailResponse.status === 200) {
                    console.log(`Email sent successfully to ${emailResponse.sentTo}`);
                } else {
                    console.log("Email not sent");
                }

            } catch (error) {
                console.error("Error sending email:", error);
            }

            // SMS Send
            try {
                const cleanedPhone = booking.phone.replace(/^\+?91|\D/g, '');
                const companyProfile = await CompanyProfile.findOne({ where: { adminId: booking.adminId } });
                const smsResponse = await sms.sendTemplateMessage({
                    mobile: Number(cleanedPhone),
                    template: "trip_completed",
                    data: {
                        contactNumber: companyProfile?.phone[0] ?? "9876543210",
                        website: companyProfile?.website ?? "https://silvercalltaxi.in/",
                    }
                })
                if (smsResponse) {
                    debug.info("Trip completed SMS sent successfully");
                } else {
                    debug.info("Trip completed SMS not sent");
                }
            } catch (error) {
                debug.info(`Error sending Trip completed SMS: ${error}`);
            }

            const invoice = await createInvoice({
                adminId: booking.adminId,
                vendorId: booking.vendorId,
                bookingId: booking.bookingId,
                name: booking.name,
                phone: booking.phone,
                email: booking.email,
                serviceType: booking.serviceType,
                vehicleType: booking.vehicleType,
                totalKm: booking.tripCompletedDistance,
                pickup: booking.pickup,
                drop: booking.drop,
                pricePerKm: booking.pricePerKm,
                estimatedAmount: booking.tripCompletedEstimatedAmount,
                advanceAmount: booking.advanceAmount,
                travelTime: booking.tripCompletedDuration,
                otherCharges: {
                    "CGST & SGST": booking.taxAmount,
                    "Driver beta": booking.tripCompletedDriverBeta || booking.driverBeta || 0,
                    ...booking.driverCharges,
                    ...booking.extraCharges
                },
                totalAmount: booking.tripCompletedFinalAmount,
                createdBy: booking.createdBy,
                status: booking.paymentStatus,
                paymentMethod: booking.paymentMethod,
                paymentDetails: booking.paymentMethod
            }, null);

            console.log("invoice response >> ", invoice);
        }


        console.log("✅ Booking payment done successfully for orderId:", orderId);
    }
    catch (error) {
        console.error("❌ Error updating booking payment for orderId:", orderId);
        console.error("Booking payment error >> ", error);
    }
};


export const handleTripCompletedPaymentFailure = async (payment: any, orderId: string, notes: any) => {

    try {
        console.log("handleTripCompletedPaymentFailure orderId >>", orderId, "payment.order_id", payment.order_id);
        const transaction = await CustomerTransaction.findOne({
            where: {
                tnxOrderId: orderId
            }
        });

        if (!transaction) {
            debug.info(`Transaction not found for orderId: ${orderId}`);
            return;
        }

        // Increment retry count for failed payments
        const retryCount = (transaction.retryCount || 0) + 1;

        if (transaction?.tnxPaymentStatus && ["Success"].includes(transaction.tnxPaymentStatus)) {
            console.log("Already processed transaction:", transaction.tnxOrderId);
            return;
        }

        // Update transaction
        transaction.tnxPaymentStatus = "Failed";
        transaction.tnxPaymentId = payment.id;
        transaction.tnxPaymentAmount = payment.amount;
        transaction.tnxOrderId = payment.order_id;
        transaction.isShow = true;
        transaction.initiatedBy = "self";
        transaction.tnxPaymentMethod = payment.method;
        transaction.tnxPaymentTime = new Date(payment.created_at * 1000);
        transaction.retryCount = retryCount;
        await transaction.save();

        if (notes.bookingId) {
            const booking = await Booking.findOne({
                where: {
                    bookingId: notes?.bookingId
                }
            })

            if (!booking) {
                log.info(`No booking found for ${notes.bookingId}`)
                return;
            }


            // Handle driver if present
            if (notes.driverId) {
                const driver = await Driver.findOne({
                    where: {
                        driverId: notes.driverId
                    }
                })

                if (driver) {
                    // Reset driver assignment since payment failed
                    driver.assigned = false;
                    await driver.save();
                    console.log(`Driver ${driver.driverId} assignment reset due to payment failure`);
                } else {
                    log.info(`No driver found for ${notes.driverId}`)
                }
            }

        }

        console.log(`✅ Trip completed payment failed for orderId: ${orderId}, retry count: ${retryCount}`);
    }
    catch (error) {
        console.error("❌ Error updating trip completed payment failure for orderId:", orderId);
        console.error("Trip completed payment failure error >> ", error);
    }
};
