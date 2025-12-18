#!/bin/bash
PGPASSWORD=admin_password psql -U postgres -d defaultdb -c "UPDATE bookings SET \"startOtp\" = '659312', \"endOtp\" = '123456' WHERE \"bookingId\" = 'SLTB260102126'"
