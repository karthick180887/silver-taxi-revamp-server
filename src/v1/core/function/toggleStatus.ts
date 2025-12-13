

import { Model, ModelStatic } from "sequelize";

export const toggleStatus = async (
    Model: ModelStatic<Model>, tableCol: string, id: string, status: boolean, reason?: string
) => {

    interface ToggleStatusItem extends Model {
        isActive: boolean;
        inActiveReason?: string;
    }


    const item = await Model.findOne({ where: { [tableCol]: id } }) as ToggleStatusItem;

    // Step 2: Check if the item exists
    if (!item) {
        throw new Error("Item not found");
    }

    // Step 3: Toggle the `isActive` status
    const newStatus = status; // Invert the current status
    // console.log("newStatus----->", newStatus);

    // Step 4: Update the `isActive` field with the new status
    item.set("isActive", newStatus);

    if (item.get("driverId")) {
        console.log("Updating last active/inactive date for driver...");
        if (newStatus === true) item.set("lastActiveDate", new Date());
        if (newStatus === false) item.set("lastInActiveDate", new Date());
    }

    if (reason) {568
        item.set("inActiveReason", reason);
    }
    // Step 5: Save the updated item back to the database
    await item.save();


    // Optional: Return the updated item or the new status
    return { item, newStatus, reason };


};