
// Generate enquiry email HTML
export const EnquiryHtml = (data: any): string => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Silver Taxi Booking Confirmation</title>
       
    </head>
    <body style="font-family: 'Arial', sans-serif;line-height: 1.6;color: #333;max-width: 600px;margin: 0 auto;padding: 0;background-color: #f5f5f5;">
        <div class="container" style="background-color: #fff;border-radius: 10px;overflow: hidden;margin: 20px;box-shadow: 0 0 20px rgba(0,0,0,0.1);">
        <div class="header" style="background-color: #222;color: #fff;padding: 20px;text-align: center;">
            <img src="https://silvertaxi.in/assets/img/logo/logof.png" alt="Silver Taxi Logo" class="logo" style="max-width: 120px;margin-bottom: 10px;">
            <h1 style="margin: 0;color: #FFC107;">Your Ride is Confirmed</h1>
        </div>
        
        <div class="content" style="padding: 20px;">
            <p>Hello ${data.fullName},</p>
            <p>Your taxi booking has been confirmed. Here are the details of your upcoming ride:</p>
            
            <div class="booking-id" style="background-color: #FFC107;color: #222;padding: 12px;border-radius: 5px;font-weight: bold;text-align: center;margin: 15px 0;">
                Booking ID: ${data.bookingId}
            </div>
            
            <div class="section" style="margin-bottom: 25px;border-bottom: 1px solid #eee;padding-bottom: 15px;">
                <div class="section-title" style="font-weight: bold;margin-bottom: 10px;color: #222;font-size: 18px;border-left: 4px solid #FFC107;padding-left: 10px;">Trip Details</div>
                <div class="detail-row" style="display: flex;justify-content: space-between;margin-bottom: 8px;">
                    <span class="detail-label" style="font-weight: 600;color: #555;">Date:</span>
                    <span class="detail-value" style="text-align: right;">${data.pickupDate}</span>
                </div>
                <div class="detail-row" style="display: flex;justify-content: space-between;margin-bottom: 8px;">
                    <span class="detail-label" style="font-weight: 600;color: #555;">Time:</span>
                    <span class="detail-value" style="text-align: right;">${data.pickupTime}</span>
                </div>
                <div class="detail-row" style="display: flex;justify-content: space-between;margin-bottom: 8px;">
                    <span class="detail-label" style="font-weight: 600;color: #555;">From:</span>
                    <span class="detail-value" style="text-align: right;">${data.pickup}</span>
                </div>
                ${data.drop !== null && `<div class="detail-row" style="display: flex;justify-content: space-between;margin-bottom: 8px;">
                    <span class="detail-label" style="font-weight: 600;color: #555;">To:</span>
                    <span class="detail-value" style="text-align: right;">${data.drop}</span>
                </div>`}
                ${data.dropDate ? `<div class="detail-row" style="display: flex;justify-content: space-between;margin-bottom: 8px;">
                    <span class="detail-label" style="font-weight: 600;color: #555;">Drop Date:</span>
                    <span class="detail-value" style="text-align: right;">${data.dropDate}</span>
                </div>` : ''}
            </div>
            
            <div class="section" style="margin-bottom: 25px;border-bottom: 1px solid #eee;padding-bottom: 15px;">
                <div class="section-title" style="font-weight: bold;margin-bottom: 10px;color: #222;font-size: 18px;border-left: 4px solid #FFC107;padding-left: 10px;">Vehicle Details</div>
                <div class="detail-row" style="display: flex;justify-content: space-between;margin-bottom: 8px;">
                    <span class="detail-label" style="font-weight: 600;color: #555;">Car Type:</span>
                    <span class="detail-value" style="text-align: right;">${data.vehicleType}</span>
                </div>
                <div class="detail-row" style="display: flex;justify-content: space-between;margin-bottom: 8px;">
                    <span class="detail-label" style="font-weight: 600;color: #555;">Model:</span>
                    <span class="detail-value" style="text-align: right;">${data.vehicleName}</span>
                </div>
            </div>
            
            <div class="section" style="margin-bottom: 25px;border-bottom: 1px solid #eee;padding-bottom: 15px;">
                <div class="section-title" style="font-weight: bold;margin-bottom: 10px;color: #222;font-size: 18px;border-left: 4px solid #FFC107;padding-left: 10px;">Fare Details</div>
                <div class="detail-row" style="display: flex;justify-content: space-between;margin-bottom: 8px;">
                    <span class="detail-label" style="font-weight: 600;color: #555;">Estimated Fare:</span>
                    <span class="detail-value" style="text-align: right;">₹ ${data.estimatedAmount}</span>
                </div>
                ${data.discountAmount > 0 ? `<div class="detail-row" style="display: flex;justify-content: space-between;margin-bottom: 8px;">
                    <span class="detail-label" style="font-weight: 600;color: #555;">Discount Amount:</span>
                    <span class="detail-value" style="text-align: right;"> - ₹ ${data.discountAmount}</span>
                </div>` : ''}
                ${data.toll > 0 ? `<div class="detail-row" style="display: flex;justify-content: space-between;margin-bottom: 8px;">
                    <span class="detail-label" style="font-weight: 600;color: #555;">Toll:</span>
                    <span class="detail-value" style="text-align: right;">₹ ${data.toll}</span>
                </div>` : ''}
                ${data.hill > 0 ? `<div class="detail-row" style="display: flex;justify-content: space-between;margin-bottom: 8px;">
                    <span class="detail-label" style="font-weight: 600;color: #555;">Hill</span>
                    <span class="detail-value" style="text-align: right;">₹ ${data.hill}</span>
                </div>` : ''}
                ${data.taxAmount > 0 ? `<div class="detail-row" style="display: flex;justify-content: space-between;margin-bottom: 8px;">
                    <span class="detail-label" style="font-weight: 600;color: #555;">Tax Amount</span>
                    <span class="detail-value" style="text-align: right;">₹ ${data.taxAmount}</span>
                </div>` : ''}
                ${data.permitCharge > 0 ? `<div class="detail-row" style="display: flex;justify-content: space-between;margin-bottom: 8px;">
                    <span class="detail-label" style="font-weight: 600;color: #555;">Driver Beta</span>
                    <span class="detail-value" style="text-align: right;">₹ ${data.permitCharge}</span>
                </div>` : ''}

                <hr>

                ${data.advanceAmount > 0 ? `<div class="detail-row" style="display: flex;justify-content: space-between;margin-bottom: 8px;">
                    <span class="detail-label" style="font-weight: 600;color: #555;">Sub Total Amount</span>
                    <span class="detail-value" style="text-align: right;"><strong>₹ ${data.finalAmount}</strong></span>
                </div>
                <div class="detail-row" style="display: flex;justify-content: space-between;margin-bottom: 8px;">
                    <span class="detail-label" style="font-weight: 600;color: #555;">Advance Amount</span>
                    <span class="detail-value" style="text-align: right;"> - ₹ ${data.advanceAmount}</span>
                </div>` : ''}

                ${data.advanceAmount > 0 ? `<hr>` : ''}

                <div class="detail-row" style="display: flex;justify-content: space-between;margin-bottom: 8px;">
                    <span class="detail-label" style="font-weight: 600;color: #555;">Total Amount</span>
                    <span class="detail-value" style="text-align: right;">₹ ${data.finalAmount}</span>
                </div>


                <div class="detail-row" style="display: flex;justify-content: space-between;margin-bottom: 8px;">
                    <span class="detail-label" style="font-weight: 600;color: #555;">Payment Method:</span>
                    <span class="detail-value" style="text-align: right;">${data.paymentMethod}</span>
                </div>
            </div>
            
      
            
           <!-- <div class="section">
                <div class="section-title">Cancellation Policy</div>
                <p>You can cancel your booking for free up to 30 minutes before the scheduled pickup time. After that, a cancellation fee of $8.00 will apply.</p>
            </div> -->
            
            <div class="contact" style="background-color: #f9f9f9;padding: 15px;border-radius: 5px;margin-top: 20px;">
                <div class="section-title" style="font-weight: bold;margin-bottom: 10px;color: #222;font-size: 18px;border-left: 4px solid #FFC107;padding-left: 10px;">Customer Support</div>
                <p>If you need to modify your booking or have any questions, please contact us:</p>
                <a href="mailto:silvertaxi.in@gmail.com">  Email: silvertaxi.in@gmail.com</a><br>
                <a href="tel:+918110944244">Phone: +91 8110944244</a>
            </div>
        </div> 
        
        <div class="footer" style="background-color: #222;color: #fff;text-align: center;padding: 15px;font-size: 12px;">
            <p>Thank you for riding with Silver Taxi!</p>
            <p>&copy; ${new Date().getFullYear()} Developed by <a href="https://thereciprocalsolutions.com" style="color: #FFC107;text-decoration: none;">The Reciprocal Solutions</a>.</p>
            <p><a href="https://silvertaxi.in/privacypolicy.html" style="color: #FFC107;text-decoration: none;">Privacy Policy</a> | <a href="https://silvertaxi.in/terms&condition.html" style="color: #FFC107;text-decoration: none;">Terms of Service</a></p>
        </div>
        </div>
    </body>
    </html>
`};

// Generate booking email HTML (for both admin and customer)
export const BookingConfirmationHtml = (data: any, isCustomer: boolean = true): string => {
    const recipientName = isCustomer ? data.fullName || 'Customer' : 'Owner';
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Silver Taxi Booking Confirmation</title>
  </head>
 <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
    <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
        <tr>
            <td align="center">
                <table width="100%" style="background-color: #fff;border: 1px solid #ddd; border-radius: 10px; overflow: hidden; margin: 20px auto; box-shadow: 0 0 20px rgba(0,0,0,0.1);" cellpadding="0" cellspacing="0">
                    <!-- Header -->
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="background-color: #fff; color: #fff; padding: 20px; text-align: center;">
                            <img src="https://silvertaxi.in/assets/img/logo/logof.png" alt="Silver Taxi Logo"/>
                            <h1 style="margin: 0; color: #FFC107;">Your Ride is Confirmed</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 20px;">
                            <p>Hello <strong>${data.fullName}</strong>,</p>
                            <p>Your taxi booking has been confirmed. Here are the details of your upcoming ride:</p>

                            <!-- Booking ID -->
                            <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #FFC107; color: #222; font-weight: bold; text-align: center; border-radius: 5px; margin: 15px 0;">
                                <tr>
                                    <td>Booking ID: ${data.bookingId}</td>
                                </tr>
                            </table>

                            <!-- Trip Details -->
                            <table width="100%" cellpadding="5" cellspacing="0" border="0">
                                <tr>
                                    <td colspan="2" style="font-weight: bold; font-size: 18px; color: #222; border-left: 4px solid #FFC107; padding-left: 10px;">Trip Details</td>
                                </tr>
                                <tr><td>Date:</td><td align="right">${data.pickupDate}</td></tr>
                                <tr><td>Time:</td><td align="right">${data.pickupTime}</td></tr>
                                <tr><td>From:</td><td align="right">${data.pickup}</td></tr>
                                ${data.drop ? `<tr><td>To:</td><td align="right">${data.drop}</td></tr>` : ''}
                                ${data.dropDate ? `<tr><td>Drop Date:</td><td align="right">${data.dropDate}</td></tr>` : ''}
                                <tr><td>From:</td><td align="right">${data.serviceType}</td></tr>
                                </table>

                            <hr>

                            <!-- Vehicle Details -->
                            <table width="100%" cellpadding="5" cellspacing="0" border="0">
                                <tr>
                                    <td colspan="2" style="font-weight: bold; font-size: 18px; color: #222; border-left: 4px solid #FFC107; padding-left: 10px;">Vehicle Details</td>
                                </tr>
                                <tr><td>Car Type:</td><td align="right">${data.vehicleType}</td></tr>
                                <tr><td>Model:</td><td align="right">${data.vehicleName}</td></tr>
                            </table>

                            <hr>

                            <!-- Fare Details -->
                            <table width="100%" cellpadding="5" cellspacing="0" border="0">
                                <tr>
                                    <td colspan="2" style="font-weight: bold; font-size: 18px; color: #222; border-left: 4px solid #FFC107; padding-left: 10px;">Fare Details</td>
                                </tr>
                                <tr><td>Estimated Fare:</td><td align="right">₹ ${data.estimatedAmount}</td></tr>
                                ${data.discountAmount > 0 ? `<tr><td>Discount:</td><td align="right"> - ₹ ${data.discountAmount}</td></tr>` : ''}
                                ${data.toll > 0 ? `<tr><td>Toll:</td><td align="right">₹ ${data.toll}</td></tr>` : ''}
                                ${data.hill > 0 ? `<tr><td>Hill Charges:</td><td align="right">₹ ${data.hill}</td></tr>` : ''}
                                ${data.taxAmount > 0 ? `<tr><td>Tax:</td><td align="right">₹ ${data.taxAmount}</td></tr>` : ''}
                                ${data.permitCharge > 0 ? `<tr><td>Permit Charges:</td><td align="right">₹ ${data.permitCharge}</td></tr>` : ''}

                                ${data.advanceAmount > 0 ? `
                                    <tr><td>Sub Total:</td><td align="right"><strong>₹ ${data.finalAmount}</strong></td></tr>
                                    <tr><td>Advance Paid:</td><td align="right"> - ₹ ${data.advanceAmount}</td></tr>
                                ` : ''}

                                <tr><td><strong>Total Amount:</strong></td><td align="right"><strong>₹ ${data.upPaidAmount}</strong></td></tr>
                                <tr><td>Payment Method: </td><td align="right">${data.paymentMethod}</td></tr>
                            </table>

                            <hr>

                            <!-- Track Ride Button -->
                          

                            <!-- Customer Support -->
                            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
                                <p style="font-weight: bold; font-size: 18px; color: #222; border-left: 4px solid #FFC107; padding-left: 10px;">Customer Support</p>
                                <p>If you have any questions, feel free to contact us:</p>
                                <p>Email: <a href="mailto:silvertaxi.in@gmail.com">silvertaxi.in@gmail.com</a></p>
                                <p>Phone: <a href="tel:+918110944244">+91 8110944244</a></p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #222; color: #fff; text-align: center; padding: 15px; font-size: 12px;">
                            <p style="color: #FFF;">Thank you for riding with Silver Taxi!</p>
                            <p style="color: #FFF;">&copy; ${new Date().getFullYear()} Silver Taxi</p>
                            <p><a href="https://silvertaxi.in/privacypolicy.html" style="color: #FFC107; text-decoration: none;">Privacy Policy</a> | <a href="https://silvertaxi.in/terms&condition.html" style="color: #FFC107; text-decoration: none;">Terms of Service</a></p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
};

export const TripCompleteHtml = (data: any): string => {
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trip Completed - Silver Taxi</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0;">
    <div style="max-width: 600px; margin: 20px auto; background-color: #fff; border: 1px solid #ddd; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background-color: #fff; padding: 20px; text-align: center; border-bottom: 1px solid #ddd;">
            <img src="https://silvertaxi.in/assets/img/logo/logof.png" alt="Silver Taxi Logo" height="60">
            <h1 style="color: #0056b3; margin: 10px 0;">Thank You! Your Trip Is Successfully Completed</h1>
        </div>

        <!-- Content -->
        <div style="padding: 20px;">
            <p>Hello ${data.name},</p>
            <p>We hope you had a smooth and comfortable journey with us. Here is a summary of your completed ride:</p>
            
            <p style="font-style: italic; color: #666; text-align: center; margin: 10px 0 20px;">We're glad you rode with us – comfort, safety, and satisfaction delivered.</p>

            <!-- Booking ID -->
            <div style="background-color: #0056b3; color: #fff; font-weight: bold; text-align: center; border-radius: 5px; padding: 10px; margin: 15px 0;">
                📘 Booking ID: ${data.bookingId}
            </div>

            <!-- Trip Summary -->
            <div style="font-weight: bold; font-size: 18px; color: #222; border-left: 4px solid #0056b3; padding-left: 10px; margin: 20px 0;">Trip Summary</div>
            <table style="width: 100%; margin-bottom: 20px;">
                <tr>
                    <td style="padding: 5px 0;">Pickup Date:</td>
                    <td style="padding: 5px 0; text-align: right;">${data.pickupDate}</td>
                </tr>
                <tr>
                    <td style="padding: 5px 0;">Pickup Time:</td>
                    <td style="padding: 5px 0; text-align: right;">${data.pickupTime}</td>
                </tr>
                <tr>
                    <td style="padding: 5px 0;">Pickup From:</td>
                    <td style="padding: 5px 0; text-align: right;">${data.pickup}</td>
                </tr>
                ${data.drop !== null && `<tr>
                    <td style="padding: 5px 0;">Drop To:</td>
                    <td style="padding: 5px 0; text-align: right;">${data.drop}</td>
                </tr>`}
                <tr>
                    <td style="padding: 5px 0;">Driver:</td>
                    <td style="padding: 5px 0; text-align: right;">${data.driverName}</td>
                </tr>
                <tr>
                    <td style="padding: 5px 0;">Car Type:</td>
                    <td style="padding: 5px 0; text-align: right;">${data.carType}</td>
                </tr>
            </table>

            <div style="border-top: 1px solid #eee; margin: 15px 0;"></div>

            <!-- Fare Details -->
            <div style="font-weight: bold; font-size: 18px; color: #222; border-left: 4px solid #0056b3; padding-left: 10px; margin: 20px 0;">Fare Details</div>
            <table style="width: 100%; margin-bottom: 20px;">
                <tr>
                    <td style="padding: 5px 0;">Estimation Amount:</td>
                    <td style="padding: 5px 0; text-align: right;">₹ ${data.finalAmount}</td>
                </tr>
                <tr>
                    <td style="padding: 5px 0;">Paid Amount:</td>
                    <td style="padding: 5px 0; text-align: right;">₹ ${data.advanceAmount}</td>
                </tr>
                <tr>
                    <td style="padding: 5px 0; font-weight: bold;">Balance Amount:</td>
                    <td style="padding: 5px 0; text-align: right; font-weight: bold;">₹ ${data.upPaidAmount}</td>
                </tr>
            </table>

            <!-- Review Button -->
            <a href="tel:+918197722789" style="display: block; background-color: #0056b3; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; text-transform: uppercase; text-align: center; margin: 25px auto; max-width: 200px;">Leave a Review</a>

            <!-- Customer Support -->
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
                <div style="font-weight: bold; font-size: 18px; color: #222; border-left: 4px solid #0056b3; padding-left: 10px;margin:10px 0">Customer Support</div>
                <p>If you have any questions, feel free to contact us:</p>
                <p>Email: <a href="mailto:silvertaxi.in@gmail.com" style="color: #0056b3; text-decoration: none;">silvertaxi.in@gmail.com</a></p>
                <p>Phone: <a href="tel:+918110944244" style="color: #0056b3; text-decoration: none;">+91 8110944244</a></p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #222; color: #fff; text-align: center; padding: 15px; font-size: 12px;">
            <p>Thank you for choosing Silver Taxi!</p>
            <p>© ${new Date().getFullYear()} Silver Taxi</p>
            <p><a href="https://silvertaxi.in/privacypolicy.html" style="color: #0056b3; text-decoration: none;">Privacy Policy</a> | <a href="https://silvertaxi.in/terms&condition.html" style="color: #0056b3; text-decoration: none;">Terms of Conditions</a></p>
        </div>
    </div>
</body>
</html>
`;
};

export const BookingCancelledHtml = (data: any): string => {
    return `

    <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Cancelled - Silver Taxi</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #fff; border: 1px solid #ddd; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <div style="background-color: #fff; padding: 20px; text-align: center; border-bottom: 1px solid #ddd;">
                    <img src="https://silvertaxi.in/assets/img/logo/logof.png" alt="Silver Taxi Logo" height="60">
                    <h1 style="color: #c82333; margin: 10px 0;">Your Ride Has Been Cancelled</h1>
                </div>

                <!-- Content -->
                <div style="padding: 20px;">
                    <p>Hello ${data.name},</p>
                    <p>Your booking from ${data.pickup} ${data.drop !== null ? `to ${data.drop}` : ''} scheduled for ${data.pickupDate} at ${data.pickupTime} has been Cancelled.</p>

                    <p style="font-style: italic; color: #666; text-align: center; margin: 10px 0 20px;">Plans change, and we understand — your next smooth ride is just a click away.</p>

                    <!-- Booking ID -->
                    <div style="background-color: #c82333; color: #fff; font-weight: bold; text-align: center; border-radius: 5px; padding: 10px; margin: 15px 0;">
                        📘 Booking ID: ${data.bookingId}
                    </div>

                    <!-- Cancellation Details -->
                    <div style="font-weight: bold; font-size: 18px; color: #222; border-left: 4px solid #c82333; padding-left: 10px; margin: 20px 0;">❌ Cancellation Details</div>
                    <table style="width: 100%; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 5px 0;">Name:</td>
                            <td style="padding: 5px 0; text-align: right;">${data.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;">Phone No:</td>
                            <td style="padding: 5px 0; text-align: right;">${data.phone}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;">Pickup Date:</td>
                            <td style="padding: 5px 0; text-align: right;">${data.pickupDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;">Pickup from:</td>
                            <td style="padding: 5px 0; text-align: right;">${data.pickup}</td>
                        </tr>
                        ${data.dropDate !== null && `<tr>
                            <td style="padding: 5px 0;">Drop Date:</td>
                            <td style="padding: 5px 0; text-align: right;">${data.dropDate}</td>
                        </tr>`}
                        ${data.drop !== null && `<tr>
                            <td style="padding: 5px 0;">Drop to:</td>
                            <td style="padding: 5px 0; text-align: right;">${data.drop}</td>
                        </tr>`}
                        <tr>
                            <td style="padding: 5px 0;">Car Type:</td>
                            <td style="padding: 5px 0; text-align: right;">${data.carType}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;">Service Type:</td>
                            <td style="padding: 5px 0; text-align: right;">${data.serviceType}</td>
                        </tr>
                    </table>

                    <div style="font-weight: bold; font-size: 18px; color: #222; border-left: 4px solid #c82333; padding-left: 10px; margin: 20px 0;">Fare Details</div>
                    <table style="width: 100%; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 5px 0;">Estimation Amount:</td>
                            <td style="padding: 5px 0; text-align: right;">₹ ${data.finalAmount}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;">Paid Amount:</td>
                            <td style="padding: 5px 0; text-align: right;">₹ ${data.advanceAmount}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">Balance Amount:</td>
                            <td style="padding: 5px 0; text-align: right; font-weight: bold;">₹ ${data.upPaidAmount}</td>
                        </tr>
                    </table>
                    <p style="font-weight: bold;">Your refund will be processed within 3 to 5 business days.</p>

                    <p>If this was a mistake or you wish to rebook, we're here to help.</p>

                    <!-- Rebook Button -->
                    <a href="https://diamondcab.in/booking" style="display: block; background-color: #c82333; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; text-transform: uppercase; text-align: center; margin: 25px auto; max-width: 200px;">Rebook Now</a>

                    <!-- Customer Support -->
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
                        <div style="font-weight: bold; font-size: 18px; color: #222; border-left: 4px solid #c82333; padding-left: 10px;margin: 10px 0;">Customer Support</div>
                        <p>If you have any questions, feel free to contact us:</p>
                        <p>Email: <a href="mailto:silvertaxi.in@gmail.com" style="color: #c82333; text-decoration: none;">silvertaxi.in@gmail.com</a></p>
                        <p>Phone: <a href="tel:+918110944244" style="color: #c82333; text-decoration: none;">+91 8110944244</a></p>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #222; color: #fff; text-align: center; padding: 15px; font-size: 12px;">
                    <p>Thank you for choosing Silver Taxi!</p>
                    <p>© ${new Date().getFullYear()} Silver Taxi</p>
                    <p><a href="https://silvertaxi.in/privacypolicy.html" style="color: #c82333; text-decoration: none;">Privacy Policy</a> | <a href="https://silvertaxi.in/terms&condition.html" style="color: #c82333; text-decoration: none;">Terms of Conditions</a></p>
                </div>
            </div>
        </body>
        </html>
    
    `;
}


export const DriverAssignedHtml = (data: any): string => {
    return `

            <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Driver Assigned - Silver Taxi</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #fff; border: 1px solid #ddd; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="background-color: #fff; padding: 20px; text-align: center; border-bottom: 1px solid #ddd;">
                    <img src="https://silvertaxi.in/assets/img/logo/logof.png" alt="Silver Taxi Logo" height="60">
                    <h1 style="color: #218838; margin: 10px 0;">Your Driver Has Been Assigned</h1>
                </div>

                <!-- Content -->
                <div style="padding: 20px;">
                    <p>Hello ${data.name},</p>
                    <p>Your ride from ${data.pickup} to ${data.drop} is getting closer! We've assigned a driver for your trip. Here are the updated ride details:</p>
                    
                    <p style="font-style: italic; color: #666; text-align: center; margin: 10px 0 20px;">Sit back, relax — your Safe Journey is now in safe hands!</p>

                    <!-- Booking ID -->
                    <div style="background-color: #218838; color: #fff; font-weight: bold; text-align: center; border-radius: 5px; padding: 10px; margin: 15px 0;">
                        📘 Booking ID: ${data.bookingId}
                    </div>

                    <!-- Trip Details -->
                    <div style="font-weight: bold; font-size: 18px; color: #222; border-left: 4px solid #218838; padding-left: 10px; margin: 20px 0;">🚖 Trip Details</div>
                    <table style="width: 100%; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 5px 0;">Pickup Date:</td>
                            <td style="padding: 5px 0; text-align: right;">${data.pickupDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;">Pickup Time:</td>
                            <td style="padding: 5px 0; text-align: right;">${data.pickupTime}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;">From:</td>
                            <td style="padding: 5px 0; text-align: right;">${data.pickup}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;">To:</td>
                            <td style="padding: 5px 0; text-align: right;">${data.drop}</td>
                        </tr>
                    </table>

                    <div style="border-top: 1px solid #eee; margin: 15px 0;"></div>

                    <!-- Driver Details -->
                    <div style="font-weight: bold; font-size: 18px; color: #222; border-left: 4px solid #218838; padding-left: 10px; margin: 20px 0;">👤 Driver Details</div>
                    <table style="width: 100%; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 5px 0;">Name:</td>
                            <td style="padding: 5px 0; text-align: right;">${data.driverName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;">Phone:</td>
                            <td style="padding: 5px 0; text-align: right;">${data.driverPhone}</td>
                        </tr>
                    </table>

                    <div style="border-top: 1px solid #eee; margin: 15px 0;"></div>

                    <!-- Track Ride Button -->

                    <!-- Customer Support -->
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
                        <div style="font-weight: bold; font-size: 18px; color: #222; border-left: 4px solid #218838; padding-left: 10px;margin: 10px 0;">Customer Support</div>
                        <p>If you have any questions, feel free to contact us:</p>
                        <p>Email: <a href="mailto:silvertaxi.in@gmail.com" style="color: #218838; text-decoration: none;">silvertaxi.in@gmail.com</a></p>
                        <p>Phone: <a href="tel:+918110944244" style="color: #218838; text-decoration: none;">+91 8110944244</a></p>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #222; color: #fff; text-align: center; padding: 15px; font-size: 12px;">
                    <p>Thank you for riding with Silver Taxi!</p>
                    <p>© ${new Date().getFullYear()} Silver Taxi</p>
                    <p><a href="https://silvertaxi.in/privacypolicy.html" style="color: #218838; text-decoration: none;">Privacy Policy</a> | <a href="https://silvertaxi.in/terms&condition.html" style="color: #218838; text-decoration: none;">Terms of Conditions</a></p>
                </div>
            </div>
        </body>
        </html>

    `;
}