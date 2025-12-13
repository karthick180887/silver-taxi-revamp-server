import { clientConfig, formConfig } from "../../../utils/redis.configs";
import { Request, Response } from "express";


export const redisConfigController = async (req: Request, res: Response) : Promise<void> => {

    const id = req?.headers?.origin?.split('/')[2].split(":")[0]
    console.log("id",id)
    if (!id) res.status(404).json(`Invalid Form config`)
    else {
        const result = await formConfig(id)
        const result2 = await clientConfig(id)

        if (!result?.success) {
            console.error(`Invalid form id : ${id}`);
            res.status(404).json(`Invalid / Empty Form config`)
        } else if (!result2?.success) {
            console.error(`Invalid config id : ${id}`);
            res.status(404).json(`Invalid config`)
        } else {
            res.status(200).json({ ...result.data, ...result2.data })
        }
    }
}

