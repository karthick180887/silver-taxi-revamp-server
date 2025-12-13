import { Service } from "../models/services";
import { Tariff, TariffAttributes } from "../models/tariff";
import { Vehicle } from "../models/vehicles";
import { Op } from "sequelize";

export type TariffType = {
    id: number;
    adminId: string;
    tariffId: string;
    serviceId: string;
    vehicleId: string;
    type: string | null;
    price: number;
    extraPrice: number;
    status: boolean;
    createdBy: string;
    includes: any; // Adjust type as necessary
    createdAt: Date;
    vehicles: Vehicle[]; // Assuming vehicles is an array of Vehicle objects
    services: Service[]; // Assuming services is an array of Service objects
}

const getTariffs = async (adminId: string, serviceId: string): Promise<any> => {
    try {
        const tariffs = await Tariff.findAll({
            where: {
                adminId,
                status: true,
                serviceId: serviceId,
                createdBy: "Admin",
                price: { [Op.gt]: 1 }
            },
            attributes: { exclude: ['id', 'includes', 'updatedAt', 'createdAt', 'deletedAt'] },
            include: [
                {
                    model: Vehicle,
                    as: 'vehicles',
                    order: [['order', 'ASC']],
                    where: { isActive: true, isAdminVehicle: true },
                    attributes: [
                        'vehicleId', 'name',
                        'type', 'fuelType',
                        'isActive', 'seats',
                        'bags', 'order',
                        'imageUrl',
                        'permitCharge',
                    ]
                },
                {
                    model: Service,
                    as: 'services',
                    where: { isActive: true },
                    attributes: { exclude: ['id', 'updatedAt', 'createdAt', 'deletedAt'] }
                }
            ],
        });

        if (!tariffs || tariffs.length === 0) {
            console.log("No tariffs found for admin:", adminId);
            return null;
        }


        return tariffs;
    } catch (error) {
        console.error("Error fetching tariffs:", error);
        throw new Error("Error fetching tariffs");
    }
};


export default getTariffs;