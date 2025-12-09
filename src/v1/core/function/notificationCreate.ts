import { DriverNotification } from "../models/driverNotification";
import { Notification } from "../models/notification";
import { debugLogger as debug, infoLogger as log } from "../../../utils/logger";
import { CustomerNotification } from "../models/customerNotification";
import { VendorNotification } from "../models/vendorNotification";

interface DriverNotify {
  imageUrl?: string;
  title: string;
  message: string;
  type?: string;
  ids: any
}
interface CustomerNotify {
  imageUrl?: string;
  title: string;
  message: string;
  type?: string;
  ids: any
}
interface VendorNotify {
  imageUrl?: string;
  title: string;
  message: string;
  type?: string;
  ids: any
}

export const createDriverNotification = async (
  notification: DriverNotify
): Promise<boolean> => {
  try {
    log.info(`Driver notification ${notification.ids.driverId} entry $>>`);
    if (
      !notification.ids ||
      !notification.message ||
      !notification.ids.adminId ||
      !notification.ids.driverId
    ) {
      // console.log("Notification >> ", notification);
      return false;
    }

    const notify: any = {
      title: notification.title,
      message: notification.message,
      driverId: notification?.ids?.driverId,
      adminId: notification?.ids?.adminId,
      route: "",
      type: notification?.type || "notification",
      read: false,
      date: new Date(),
      time: new Date().toLocaleTimeString(),
      imageUrl: notification.imageUrl || null,
      templateId: notification?.ids?.templateId || null
    };

    log.info(`Driver notification >> ${notification.ids}`);
    const newNotification = await DriverNotification.create(notify);

    newNotification.notifyId = `notify-${newNotification.id}`;
    await newNotification.save();

    log.info(`Driver notification ${notification.ids.driverId} exit <<$`);
    return true;
  } catch (error) {
    log.info(`Error creating driver notification >> ${error}`);
    return false;
  }
};

export const createCustomerNotification = async (
  notification: CustomerNotify
): Promise<boolean> => {
  try {
    log.info(`Customer notification ${notification.ids.customerId} entry $>>`);
    if (
      !notification.message ||
      !notification.ids.adminId ||
      !notification.ids.customerId
    ) {
      // console.log("Notification >> ", notification);
      return false;
    }

    const notify: any = {
      title: notification.title,
      message: notification.message,
      customerId: notification?.ids.customerId,
      adminId: notification?.ids.adminId,
      route: "",
      type: notification?.type || "notification",
      read: false,
      date: new Date(),
      time: new Date().toLocaleTimeString(),
      imageUrl: notification.imageUrl || null,
      templateId: notification?.ids?.templateId || null
    };

    debug.info(
      `Customer notification >> ${(notification.ids.adminId, notification.ids.customerId)
      }`
    );
    const newNotification = await CustomerNotification.create(notify);

    newNotification.notifyId = `notify-${newNotification.id}`;
    await newNotification.save();

    log.info(`Customer notification ${notification.ids.customerId} exit <<$`);
    return true;
  } catch (error) {
    debug.info(`Error creating driver notification >> ${error}`);
    return false;
  }
};

export const createVendorNotification = async (
  notification: VendorNotify
): Promise<boolean> => {
  try {
    log.info(`Vendor notification ${notification.ids.vendorId} entry $>>`);
    if (
      !notification.ids ||
      !notification.message ||
      !notification.ids.adminId ||
      !notification.ids.vendorId
    ) {
      // console.log("Notification >> ", notification);
      return false;
    }

    const notify: any = {
      title: notification.title,
      message: notification.message,
      driverId: notification?.ids?.vendorId,
      adminId: notification?.ids?.adminId,
      route: "",
      type: notification?.type || "notification",
      read: false,
      date: new Date(),
      time: new Date().toLocaleTimeString(),
      imageUrl: notification.imageUrl || null,
      templateId: notification?.ids?.templateId || null
    };

    debug.info(`Vendor notification >> ${notification.ids}`);
    const newNotification = await VendorNotification.create(notify);

    newNotification.notifyId = `notify-${newNotification.id}`;
    await newNotification.save();

    log.info(`Vendor notification ${notification.ids.vendorId} exit <<$`);
    return true;
  } catch (error) {
    debug.info(`Error creating vendor notification >> ${error}`);
    return false;
  }
};

export const createNotification = async (
  notification: Notification
): Promise<{ success: boolean; notificationId: string | null }> => {
  try {
    log.info(`Notification entry $>>`);
    const newNotification = await Notification.create(notification);

    newNotification.notificationId = `notify-${newNotification.id}`;
    await newNotification.save();

    log.info(`Notification exit <<$`);
    return {
      success: true,
      notificationId: newNotification.notificationId,
    };
  } catch (error) {
    debug.info(`Error creating notification >> ${error}`);
    return {
      success: false,
      notificationId: null,
    };
  }
};
