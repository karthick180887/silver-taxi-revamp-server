UPDATE vehicles SET "driverId" = NULL WHERE "driverId" NOT IN (SELECT "driverId" FROM drivers);
SELECT conname FROM pg_constraint WHERE conrelid = 'vendor'::regclass;
