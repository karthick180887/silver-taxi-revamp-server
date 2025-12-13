import { Driver } from "../models/driver";
import { infoLogger as log, debugLogger as debug } from "../../../utils/logger";

const verifiedFieldMapping: Record<string, string> = {
  rcBookImageBack: 'rcBackVerified',
  rcBookImageFront: 'rcFrontVerified',
  insuranceImage: 'insuranceVerified',
  panCardImage: 'panCardVerified',
};

export function updateWithDocumentStatus(
  modelInstance: any,
  updates: any,
  fields: string[],
  updateDocStatus = false
) {
  for (const key of fields) {
    if (updates[key] !== undefined) {
      modelInstance[key] = updates[key];

      const mappedVerifiedField = verifiedFieldMapping[key] || `${key}Verified`;
      const isProfile = key === 'profile';
      const remarkField = `${key}Remark`;

      if (mappedVerifiedField in modelInstance) {

        const currentStatus = modelInstance[mappedVerifiedField];

        if (currentStatus === 'rejected') {
          modelInstance[mappedVerifiedField] = 'pending';
          modelInstance.adminVerified = 'Pending';

          if (isProfile) {
            modelInstance.profileVerified = 'pending';
          } else {
            modelInstance.documentVerified = 'pending';
          }
        }
      }

      if (remarkField in modelInstance) {
        modelInstance[remarkField] = null;
      }
    }
  }
}

export function vehicleUpdateWithDocumentStatus(
  modelInstance: any,
  updates: any,
  fields: string[],
  updateDocStatus = false
) {
  for (const key of fields) {
    if (updates[key] !== undefined) {
      modelInstance[key] = updates[key];

      const mappedVerifiedField = verifiedFieldMapping[key] || `${key}Verified`;
      const isProfile = key === 'profile';
      const remarkField = `${key}Remark`;

      if (mappedVerifiedField in modelInstance) {

        console.log("mappedVerifiedField", mappedVerifiedField);
        const currentStatus = modelInstance[mappedVerifiedField];

        console.log("currentStatus", currentStatus);
        if (currentStatus === 'rejected') {
          modelInstance[mappedVerifiedField] = 'pending';
          modelInstance.adminVerified = 'Pending';

          if (isProfile) {
            modelInstance.profileVerified = 'pending';
          } else {
            modelInstance.documentVerified = 'pending';
          }
        }

        if (currentStatus === 'accepted') {
          modelInstance[mappedVerifiedField] = 'pending';
          modelInstance.adminVerified = 'Pending';

          if (isProfile) {
            modelInstance.profileVerified = 'pending';
          } else {
            modelInstance.documentVerified = 'pending';
          }
        }
      }

      if (remarkField in modelInstance) {
        modelInstance[remarkField] = null;
      }
    }
  }
}


export const driverLocationUpdate = async (driverId: string, lat: number, lng: number) => {
  try {
    log.info(`Updating location for driverId: ${driverId} latitude: ${lat} longitude: ${lng} entry $>>`);
    const driver = await Driver.findOne({ where: { driverId } });
    if (!driver) {
      debug.info(`Driver not found for driverId: ${driverId}`);
      return null;
    }
    driver.geoLocation = {
      latitude: lat,
      longitude: lng,
      timestamp: new Date(),
    };
    await driver.save();
    log.info(`Driver location updated successfully for driverId: ${driverId} exit <<$`);
    return driver;
  } catch (error) {
    debug.error(`Error updating location for driverId: ${driverId} error: ${error}`);
    return null;
  }
}

