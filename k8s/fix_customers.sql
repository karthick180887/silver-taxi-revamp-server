UPDATE customers SET "vendorId" = NULL WHERE "vendorId" NOT IN (SELECT "vendorId" FROM vendor);
