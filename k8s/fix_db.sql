UPDATE vehicles SET "driverId" = NULL WHERE "driverId" NOT IN (SELECT "driverId" FROM drivers);
