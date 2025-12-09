import { findDistanceAndTime } from "../../../common/functions/distanceAndTime";
import {Request, Response } from "express";
import { getTariffs } from "../../core/function";

// export const calculationController = async (req: Request, res: Response): Promise<void> => {

//     const { from, to, pickupDate, dropDate, service, domain } = req.body;

//     try {

//         const tenantData = await findTenant(domain);
//         if (!tenantData) {
//             res.status(404).json({
//                 success: false,
//                 message: "Tenant not found",
//             });
//             return;
//         }

//         const tariffsData = await getTariffs(tenantData.tenantId, tenantData.adminId);
//         if (!tariffsData) {
//             res.status(404).json({
//                 success: false,
//                 message: "Tariffs not found",
//             });
//             return;
//         }
//         // Find Distance 
//         const result = await findDistanceAndTime(from, to);
//         if (typeof result === 'string') {
//             throw new Error(result);
//         }  

//         const { distance, duration } = result;

//         const tariffs = tariffsData.map((tariff) => {
//             const price = tariff.price * (distance? distance : 0);
//             return {
//                 tariff,
//                 price,
//                 pickupDate,
//                 dropDate,
//                 service,
//                 distance,
//                 duration,
//                 from,
//                 to,
//                 domain,
//                 tenatId:tenantData.tenantId
//             }
//         })

//         res.status(200).json({
//             success: true,
//             message: "Calculation successful",
//             tariffs: tariffs
//         });
//     } catch (error) {
//         console.error("Error in calculation:", error);
//         res.status(500).json({
//             success: false,
//             message: "Error in calculation",
//         });
//     }
// };
