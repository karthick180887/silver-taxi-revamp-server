import schedule from "node-schedule";
import { infoLogger as log } from "../logger";
import {
  handlePriceUpdate,
  notifyPendingDriverAcceptance,
  notifyLateTripPickups,
  checkDocumentExpiry
} from "../../v1/core/function/cronJobs";

export const startCronJobs = async () => {
  log.info("⏰ Cron Jobs Started...");

  // Every day at midnight
  schedule.scheduleJob("0 0 * * *", async () => {
    try {
      log.info("🌙 Running daily price update...");
      await handlePriceUpdate();
    } catch (err) {
      log.info(`❌ Error in daily price update: ${JSON.stringify(err, null, 2)}`);
    }
  });

  // Every day at midnight - Document expiry check
  schedule.scheduleJob("0 0 * * *", async () => {
    try {
      log.info("🌙 Running daily document expiry check...");
      await checkDocumentExpiry();
    } catch (err) {
      log.info(`❌ Error in daily document expiry check: ${JSON.stringify(err, null, 2)}`);
    }
  });

  // Every 1 minute: check pending driver acceptance
  schedule.scheduleJob("*/10 * * * *", async () => {
    try {
      log.info("⏰ Running Pending Driver Acceptance Check...");
      await notifyPendingDriverAcceptance();
    } catch (err) {
      log.info(`❌ Error in Pending Driver Acceptance Check: ${JSON.stringify(err, null, 2)}`);
    }
  });

  // Every 30 minutes: check late trip pickups
  schedule.scheduleJob("*/30 * * * *", async () => {
    try {
      log.info("⏰ Running Late Trip Pickup Check...");
      await notifyLateTripPickups();
    } catch (err) {
      log.info(`❌ Error in Late Trip Pickup Check: ${JSON.stringify(err, null, 2)}`);
    }
  });

};

