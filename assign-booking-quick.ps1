# Quick PowerShell script to assign booking SLTB260102443 to driver 9944226010
# Usage: .\assign-booking-quick.ps1

$BOOKING_ID = "SLTB260102443"
$DRIVER_PHONE = "9944226010"
$API_URL = if ($env:API_URL) { $env:API_URL } else { "http://localhost:3060" }

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Assign Booking: $BOOKING_ID to Driver: $DRIVER_PHONE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Step 1: Run this SQL query to find the driver:" -ForegroundColor Yellow
Write-Host ""
Write-Host "SELECT `"driverId`", `"adminId`", `"name`", `"phone`" FROM drivers WHERE phone = '$DRIVER_PHONE' OR phone LIKE '%$DRIVER_PHONE%';" -ForegroundColor White
Write-Host ""
Write-Host "📋 Step 2: Copy the driverId and adminId from the results above" -ForegroundColor Yellow
Write-Host "📋 Step 3: Paste them below and run this script again" -ForegroundColor Yellow
Write-Host ""

# TODO: Update these after running the SQL query
$DRIVER_ID = "YOUR_DRIVER_ID_HERE"
$ADMIN_ID = "YOUR_ADMIN_ID_HERE"

if ($DRIVER_ID -eq "YOUR_DRIVER_ID_HERE" -or $ADMIN_ID -eq "YOUR_ADMIN_ID_HERE") {
    Write-Host "❌ Please update DRIVER_ID and ADMIN_ID in this script first!" -ForegroundColor Red
    Write-Host ""
    Write-Host "After updating, run: .\assign-booking-quick.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Assigning booking $BOOKING_ID to driver $DRIVER_ID..." -ForegroundColor Green
Write-Host ""

$body = @{
    bookingId = $BOOKING_ID
    driverId = $DRIVER_ID
    adminId = $ADMIN_ID
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_URL/admin/bookings/assign-driver" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "✅ Booking assigned successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host ($response | ConvertTo-Json -Depth 10)
    Write-Host ""
    Write-Host "📱 Notifications sent via API to driver $DRIVER_PHONE:" -ForegroundColor Cyan
    Write-Host "   ✅ Socket.IO (NEW_TRIP_OFFER event)" -ForegroundColor Green
    Write-Host "   ✅ FCM push notification" -ForegroundColor Green
    Write-Host "   ✅ Driver notification record created" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Done!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error assigning booking:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
    if ($_.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

