# File Tree: silver-taxi-revamp-server

**Generated:** 11/3/2025, 12:13:16 PM
**Root Path:** `/home/trs/shan-projects/Trs/code/silver-taxi-revamp/silver-taxi-revamp-server`

```
├── 📁 prompt
│   └── 📝 activity-log-implementation-guide.markdown
├── 📁 src
│   ├── 📁 common
│   │   ├── 📁 configs
│   │   │   ├── ⚙️ firebase_config.json
│   │   │   └── 📄 razorpay.ts
│   │   ├── 📁 db
│   │   │   ├── 📄 firebase.ts
│   │   │   ├── 📄 postgres.ts
│   │   │   └── 📄 redis.ts
│   │   ├── 📁 functions
│   │   │   ├── 📄 distanceAndTime.ts
│   │   │   └── 📄 tollguruDistnce.ts
│   │   ├── 📁 middleware
│   │   │   └── 📄 auth.ts
│   │   ├── 📁 services
│   │   │   ├── 📁 firebase
│   │   │   │   └── 📄 appNotify.ts
│   │   │   ├── 📁 jwt
│   │   │   │   └── 📄 jwt.ts
│   │   │   ├── 📁 mail
│   │   │   │   ├── 📁 templates
│   │   │   │   │   └── 📄 booking.ts
│   │   │   │   └── 📄 mail.ts
│   │   │   ├── 📁 notification
│   │   │   │   └── 📄 notificationManager.ts
│   │   │   ├── 📁 payments
│   │   │   │   └── 📄 razorpayService.ts
│   │   │   ├── 📁 rabbitmq
│   │   │   │   ├── 📁 workers
│   │   │   │   │   ├── 📄 driverWorker.ts
│   │   │   │   │   └── 📄 notificationWorker.ts
│   │   │   │   ├── 📄 consumer.ts
│   │   │   │   ├── 📄 index.ts
│   │   │   │   ├── 📄 publisher.ts
│   │   │   │   └── 📄 worker.ts
│   │   │   ├── 📁 sms
│   │   │   │   └── 📄 sms.ts
│   │   │   ├── 📁 socket
│   │   │   │   └── 📄 websocket.ts
│   │   │   ├── 📁 whatsApp
│   │   │   │   └── 📄 wachat.ts
│   │   │   ├── 📄 node-cache.ts
│   │   │   ├── 📄 telagram copy.ts
│   │   │   └── 📄 telagram.ts
│   │   ├── 📁 types
│   │   │   ├── 📄 config.ts
│   │   │   └── 📄 jwt.ts
│   │   └── 📁 validations
│   │       ├── 📄 bookingSchema.ts
│   │       ├── 📄 customNotificationSchema.ts
│   │       ├── 📄 customerSchema.ts
│   │       ├── 📄 driverSchema.ts
│   │       ├── 📄 globalSchema.ts
│   │       ├── 📄 redisSchema.ts
│   │       ├── 📄 tripSchema.ts
│   │       └── 📄 vendorSchema.ts
│   ├── 📁 utils
│   │   ├── 📁 cron
│   │   │   └── 📄 schedular.ts
│   │   ├── 📁 uploads
│   │   ├── 📄 cryptoJs.ts
│   │   ├── 📄 dayjs.ts
│   │   ├── 📄 env.ts
│   │   ├── 📄 logger.ts
│   │   ├── 📄 minio.image.ts
│   │   ├── 📄 multer.fileUpload.ts
│   │   └── 📄 redis.configs.ts
│   ├── 📁 v1
│   │   ├── 📁 admin
│   │   │   ├── 📁 controller
│   │   │   │   ├── 📄 allIncludesController.ts
│   │   │   │   ├── 📄 allPriceChangeController.ts
│   │   │   │   ├── 📄 authController.ts
│   │   │   │   ├── 📄 blogController.ts
│   │   │   │   ├── 📄 bookingController.ts
│   │   │   │   ├── 📄 companyProfileController.ts
│   │   │   │   ├── 📄 customerController.ts
│   │   │   │   ├── 📄 driverController.ts
│   │   │   │   ├── 📄 dynamicRouteController.ts
│   │   │   │   ├── 📄 enquiryController.ts
│   │   │   │   ├── 📄 invoiceController.ts
│   │   │   │   ├── 📄 ipTrackingController.ts
│   │   │   │   ├── 📄 notificationController.ts
│   │   │   │   ├── 📄 offersController.ts
│   │   │   │   ├── 📄 paymentTransController.ts
│   │   │   │   ├── 📄 permitChargesController.ts
│   │   │   │   ├── 📄 popularRoutesController.ts
│   │   │   │   ├── 📄 promoCodesController.ts
│   │   │   │   ├── 📄 serviceController.ts
│   │   │   │   ├── 📄 tariffController.ts
│   │   │   │   ├── 📄 toggleController.ts
│   │   │   │   ├── 📄 transactionController.ts
│   │   │   │   ├── 📄 vehicleController.ts
│   │   │   │   └── 📄 vendorController.ts
│   │   │   └── 📁 router
│   │   │       ├── 📄 allIncludesRouter.ts
│   │   │       ├── 📄 allPriceChangeRouter.ts
│   │   │       ├── 📄 authRouter.ts
│   │   │       ├── 📄 blogRouter.ts
│   │   │       ├── 📄 bookingRouter.ts
│   │   │       ├── 📄 companyProfileRouter.ts
│   │   │       ├── 📄 customerRouter.ts
│   │   │       ├── 📄 driverRouter.ts
│   │   │       ├── 📄 dynamicRoutesRouter.ts
│   │   │       ├── 📄 enquiryRouter.ts
│   │   │       ├── 📄 index.ts
│   │   │       ├── 📄 invoiceRouter.ts
│   │   │       ├── 📄 ipTrackingRouter.ts
│   │   │       ├── 📄 notificationRouter.ts
│   │   │       ├── 📄 offersRouter.ts
│   │   │       ├── 📄 paymentTransRouter.ts
│   │   │       ├── 📄 permitChargesRouter.ts
│   │   │       ├── 📄 popularRoutesRouter.ts
│   │   │       ├── 📄 promoCodeRouter.ts
│   │   │       ├── 📄 serviceRouter.ts
│   │   │       ├── 📄 tariffRouter.ts
│   │   │       ├── 📄 toggleRouter.ts
│   │   │       ├── 📄 transactionRouter.ts
│   │   │       ├── 📄 vehicleRouter.ts
│   │   │       └── 📄 vendorRouter.ts
│   │   ├── 📁 apps
│   │   │   ├── 📁 customer
│   │   │   │   ├── 📁 controller
│   │   │   │   │   ├── 📄 auth.controller.ts
│   │   │   │   │   ├── 📄 booking.controller.ts
│   │   │   │   │   ├── 📄 common.controller.ts
│   │   │   │   │   ├── 📄 customer.controller.ts
│   │   │   │   │   ├── 📄 customer.wallet.controller.ts
│   │   │   │   │   ├── 📄 enquiry.controller.ts
│   │   │   │   │   ├── 📄 notifications.controller.ts
│   │   │   │   │   ├── 📄 offer.controller.ts
│   │   │   │   │   └── 📄 promoCode.controller.ts
│   │   │   │   └── 📁 routes
│   │   │   │       ├── 📄 auth.route.ts
│   │   │   │       ├── 📄 booking.route.ts
│   │   │   │       ├── 📄 customer.route.ts
│   │   │   │       ├── 📄 customer.wallet.route.ts
│   │   │   │       ├── 📄 enquiry.route.ts
│   │   │   │       ├── 📄 index.route.ts
│   │   │   │       ├── 📄 notifications.routes.ts
│   │   │   │       ├── 📄 offers.routes.ts
│   │   │   │       └── 📄 promoCode.route.ts
│   │   │   ├── 📁 driver
│   │   │   │   ├── 📁 controller
│   │   │   │   │   ├── 📄 analytics.controller.ts
│   │   │   │   │   ├── 📄 appAuth.controller.ts
│   │   │   │   │   ├── 📄 booking.controller.ts
│   │   │   │   │   ├── 📄 driver.controller.ts
│   │   │   │   │   ├── 📄 driverNotification.controller.ts
│   │   │   │   │   ├── 📄 earnings.controller.ts
│   │   │   │   │   ├── 📄 fileUpload.controller.ts
│   │   │   │   │   ├── 📄 trip.controller.ts
│   │   │   │   │   ├── 📄 vehicle.controller.ts
│   │   │   │   │   └── 📄 wallet.controller.ts
│   │   │   │   └── 📁 routers
│   │   │   │       ├── 📄 analytics.route.ts
│   │   │   │       ├── 📄 appAuth.route.ts
│   │   │   │       ├── 📄 booking.route.ts
│   │   │   │       ├── 📄 driver.route.ts
│   │   │   │       ├── 📄 driverNotification.route.ts
│   │   │   │       ├── 📄 earnings.route.ts
│   │   │   │       ├── 📄 index.route.ts
│   │   │   │       ├── 📄 trip.route.ts
│   │   │   │       ├── 📄 vehicle.route.ts
│   │   │   │       └── 📄 wallet.route.ts
│   │   │   └── 📁 vendor
│   │   │       ├── 📁 controller
│   │   │       │   ├── 📄 auth.controller.ts
│   │   │       │   ├── 📄 booking.controller.ts
│   │   │       │   ├── 📄 estimation.controller.ts
│   │   │       │   └── 📄 vendor.controller.ts
│   │   │       └── 📁 routes
│   │   │           ├── 📄 auth.route.ts
│   │   │           ├── 📄 booking.route.ts
│   │   │           ├── 📄 estimation.route.ts
│   │   │           ├── 📄 index.route.ts
│   │   │           └── 📄 vendor.route.ts
│   │   ├── 📁 core
│   │   │   ├── 📁 data
│   │   │   │   ├── ⚙️ failed-driver-wallet.json
│   │   │   │   ├── ⚙️ failed-driver.json
│   │   │   │   ├── ⚙️ failed-vendor-payment.json
│   │   │   │   ├── ⚙️ silver-drivers.json
│   │   │   │   ├── ⚙️ silver-vendor-payments.json
│   │   │   │   └── ⚙️ silver-vendor.json
│   │   │   ├── 📁 function
│   │   │   │   ├── 📁 createFn
│   │   │   │   │   └── 📄 invoiceCreate.ts
│   │   │   │   ├── 📁 payment
│   │   │   │   │   └── 📄 razorpay.ts
│   │   │   │   ├── 📁 queue
│   │   │   │   │   └── 📄 handleQueueMsgs.ts
│   │   │   │   ├── 📄 bookingActivity.ts
│   │   │   │   ├── 📄 commissionCalculation.ts
│   │   │   │   ├── 📄 cronJobs.ts
│   │   │   │   ├── 📄 dataFn.ts
│   │   │   │   ├── 📄 distancePriceCalculation.ts
│   │   │   │   ├── 📄 driverActivity.ts
│   │   │   │   ├── 📄 driverFunctions.ts
│   │   │   │   ├── 📄 getTariffs.ts
│   │   │   │   ├── 📄 index.ts
│   │   │   │   ├── 📄 notificationCreate.ts
│   │   │   │   ├── 📄 objectArrays.ts
│   │   │   │   ├── 📄 odoCalculation.ts
│   │   │   │   ├── 📄 offersCalculation.ts
│   │   │   │   ├── 📄 polylineCreate.ts
│   │   │   │   ├── 📄 postBookingCreation.ts
│   │   │   │   ├── 📄 priceCalculator.ts
│   │   │   │   ├── 📄 referCode.ts
│   │   │   │   └── 📄 toggleStatus.ts
│   │   │   ├── 📁 models
│   │   │   │   ├── 📄 admin.ts
│   │   │   │   ├── 📄 allIncludes.ts
│   │   │   │   ├── 📄 allPriceChanges.ts
│   │   │   │   ├── 📄 blog.ts
│   │   │   │   ├── 📄 booking.ts
│   │   │   │   ├── 📄 bookingActivityLog.ts
│   │   │   │   ├── 📄 cities.ts
│   │   │   │   ├── 📄 companyProfile.ts
│   │   │   │   ├── 📄 configKeys.ts
│   │   │   │   ├── 📄 customer.ts
│   │   │   │   ├── 📄 customerNotification.ts
│   │   │   │   ├── 📄 customerTransactions.ts
│   │   │   │   ├── 📄 customerWallets.ts
│   │   │   │   ├── 📄 dayPackages.ts
│   │   │   │   ├── 📄 diverBankDetails.ts
│   │   │   │   ├── 📄 driver.ts
│   │   │   │   ├── 📄 driverActivityLog.ts
│   │   │   │   ├── 📄 driverBookingLog.ts
│   │   │   │   ├── 📄 driverNotification.ts
│   │   │   │   ├── 📄 driverWalletRequest.ts
│   │   │   │   ├── 📄 driverWallets.ts
│   │   │   │   ├── 📄 dynamicRoutes.ts
│   │   │   │   ├── 📄 enquiry.ts
│   │   │   │   ├── 📄 hourlyPackages.ts
│   │   │   │   ├── 📄 index.ts
│   │   │   │   ├── 📄 invoice.ts
│   │   │   │   ├── 📄 ipTracking.ts
│   │   │   │   ├── 📄 notification.ts
│   │   │   │   ├── 📄 notificationTemplates.ts
│   │   │   │   ├── 📄 offerUsage.ts
│   │   │   │   ├── 📄 offers.ts
│   │   │   │   ├── 📄 paymentTransaction.ts
│   │   │   │   ├── 📄 permitCharges.ts
│   │   │   │   ├── 📄 popularRoutes.ts
│   │   │   │   ├── 📄 promoCodeUsage.ts
│   │   │   │   ├── 📄 promoCodes.ts
│   │   │   │   ├── 📄 referralUsage.ts
│   │   │   │   ├── 📄 services.ts
│   │   │   │   ├── 📄 states.ts
│   │   │   │   ├── 📄 tableConfig.ts
│   │   │   │   ├── 📄 tariff.ts
│   │   │   │   ├── 📄 topDestinations.ts
│   │   │   │   ├── 📄 vehicleTypes.ts
│   │   │   │   ├── 📄 vehicles.ts
│   │   │   │   ├── 📄 vendor.ts
│   │   │   │   ├── 📄 vendorBankDetails.ts
│   │   │   │   ├── 📄 vendorNotification.ts
│   │   │   │   ├── 📄 vendorWallets.ts
│   │   │   │   └── 📄 walletTransaction.ts
│   │   │   └── 📁 scripts
│   │   │       ├── 📄 migrateDriverWallet.ts
│   │   │       ├── 📄 migrateDrivers.ts
│   │   │       ├── 📄 migrateVendor.ts
│   │   │       └── 📄 migrateVendorPaymnet.ts
│   │   ├── 📁 public
│   │   │   ├── 📁 controller
│   │   │   │   └── 📄 common.controller.ts
│   │   │   └── 📁 router
│   │   │       └── 📄 common.route.ts
│   │   ├── 📁 types
│   │   │   ├── 📄 booking.d.ts
│   │   │   ├── 📄 company.d.ts
│   │   │   ├── 📄 enquiry.d.ts
│   │   │   └── 📄 index.d.ts
│   │   ├── 📁 webhook
│   │   │   └── 📄 razorpayWebhook.ts
│   │   └── 📁 website
│   │       ├── 📁 controller
│   │       │   ├── 📄 booking.controller.ts
│   │       │   ├── 📄 calculation.controller.ts
│   │       │   ├── 📄 config.controller.ts
│   │       │   ├── 📄 distancePrice.controller.ts
│   │       │   ├── 📄 enquiry.controller.ts
│   │       │   ├── 📄 form.controller.ts
│   │       │   ├── 📄 offers.controller.ts
│   │       │   ├── 📄 service.controller.ts
│   │       │   └── 📄 website.controller.ts
│   │       └── 📁 routers
│   │           ├── 📄 booking.route.ts
│   │           ├── 📄 calculation.route.ts
│   │           ├── 📄 config.route.ts
│   │           ├── 📄 enquiry.route.ts
│   │           ├── 📄 findDistance.route.ts
│   │           ├── 📄 form.route.ts
│   │           ├── 📄 index.route.ts
│   │           ├── 📄 offer.route.ts
│   │           ├── 📄 service.route.ts
│   │           └── 📄 website.route.ts
│   ├── 📄 app.ts
│   ├── 📄 cronServer.ts
│   ├── 📄 rabbitServer.ts
│   └── 📄 server.ts
├── ⚙️ .dockerignore
├── ⚙️ .env.copy
├── ⚙️ .gitignore
├── 📝 Multiple.md
├── 📝 README.md
├── ⚙️ docker-compose.yml
├── ⚙️ package-lock.json
├── ⚙️ package.json
├── 📝 rules.md
└── ⚙️ tsconfig.json
```

---
*Generated by FileTree Pro Extension*