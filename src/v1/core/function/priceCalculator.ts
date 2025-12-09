import { Tariff } from '../models/tariff';

const findPrice = async (tariffId: string, distance: number) => {
    if (!tariffId) {
        return null;
    }

    const tariffData = await Tariff.findOne({
        where: { tariffId: tariffId }
    });

    if (!tariffData) {
        console.error(`Tariff with id ${tariffId} not found`);
        return null;
    }

    const price = tariffData.price * distance;
    return { price };
};

export { findPrice };
