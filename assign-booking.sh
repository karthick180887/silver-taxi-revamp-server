#!/bin/bash

# Script to assign booking SLTB260102443 to driver with phone 9944226010
# Usage: ./assign-booking.sh

BOOKING_ID="SLTB260102443"
DRIVER_PHONE="9944226010"
API_URL="${API_URL:-http://localhost:3060}"

echo "🔍 Finding driver by phone: $DRIVER_PHONE"
echo ""

# First, you need to get the driverId and adminId from the database
# Run this SQL query:
echo "📋 Step 1: Run this SQL query to get driverId and adminId:"
echo ""
echo "SELECT \"driverId\", \"adminId\", \"name\", \"phone\" FROM drivers WHERE phone = '$DRIVER_PHONE' OR phone LIKE '%$DRIVER_PHONE%';"
echo ""
echo "📋 Step 2: Update the variables below with the results, then run this script again"
echo ""

# TODO: Update these after running the SQL query
DRIVER_ID="YOUR_DRIVER_ID_HERE"
ADMIN_ID="YOUR_ADMIN_ID_HERE"

if [ "$DRIVER_ID" = "YOUR_DRIVER_ID_HERE" ] || [ "$ADMIN_ID" = "YOUR_ADMIN_ID_HERE" ]; then
    echo "❌ Please update DRIVER_ID and ADMIN_ID in this script first!"
    exit 1
fi

echo "🚀 Assigning booking $BOOKING_ID to driver $DRIVER_ID..."
echo ""

# Make the API call
curl -X POST "$API_URL/admin/booking/assign-driver" \
  -H "Content-Type: application/json" \
  -d "{
    \"bookingId\": \"$BOOKING_ID\",
    \"driverId\": \"$DRIVER_ID\",
    \"adminId\": \"$ADMIN_ID\"
  }" | jq '.'

echo ""
echo "✅ Done! The API will automatically send:"
echo "   - Socket.IO notification (NEW_TRIP_OFFER event)"
echo "   - FCM push notification"
echo "   - Driver notification record"

