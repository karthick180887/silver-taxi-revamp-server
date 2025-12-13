const http = require('http');

// Test booking data
const bookingData = {
    adminId: "admin-1", // You may need to adjust this
    name: "Test Customer",
    email: "test@example.com",
    phone: "9876543210",
    pickup: "Test Pickup Location, Test City",
    drop: "Test Drop Location, Test City",
    pickupDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    serviceType: "One way",
    vehicleType: "Sedan",
    paymentMethod: "Cash",
    estimatedAmount: 500,
    discountAmount: 0,
    finalAmount: 500,
    distance: 10,
    advanceAmount: 0,
    upPaidAmount: 500,
    paymentStatus: "Unpaid",
    status: "Booking Confirmed",
    type: "Manual",
    createdBy: "Admin"
};

const postData = JSON.stringify(bookingData);

const options = {
    hostname: 'localhost',
    port: 30060,
    path: '/v1/bookings',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('\nResponse Body:');
        try {
            const parsed = JSON.parse(data);
            console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();

