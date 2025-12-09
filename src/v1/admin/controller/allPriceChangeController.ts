import { Request, Response } from "express";
import { AllPriceChanges } from "../../core/models";
import { handlePriceUpdate } from "../../core/function/cronJobs";


export const getAllPriceChange = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.body.adminId ?? req.query.adminId;

    const priceChange = await AllPriceChanges.findAll({
      where: { adminId },
      attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      message: "Price changes retrieved successfully",
      data: priceChange,
    });
    return;

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting price changes",
      error: (error as Error).message,
    });
  }
};
export const getAllPriceChangeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.body.adminId ?? req.query.adminId;
    const { serviceId } = req.params;

    const priceChange = await AllPriceChanges.findOne({
      where: { serviceId, adminId },
      attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
    });

    // console.log("nothing", priceChange)
    if (!priceChange) {
      console.log("nothing inside if ", priceChange)
      res.status(404).json({
        success: false,
        message: "Price changes not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Single Price changes retrieved successfully",
      data: priceChange,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting price changes",
      error: (error as Error).message,
    });
  }
};

export const createPriceChange = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.body.adminId ?? req.query.adminId;

    const {
      fromDate,
      toDate,
      price,
      serviceId,
      status,
    } = req.body;


    const priceChangesData = await AllPriceChanges.findOne({
      where: { serviceId, status: true }
    });

    if (priceChangesData) {
      res.status(400).json({
        success: false,
        message: "Price changes already exists in the service",
      });
      return;
    }


    const priceChange = await AllPriceChanges.create({
      adminId,
      fromDate,
      status: status ?? true,
      toDate,
      price,
      serviceId,
    });

    await priceChange.save();
    await handlePriceUpdate()

    res.status(200).json({
      success: true,
      message: `Price changes created successfully`,
      data: priceChange,
    });
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting price changes",
      error: (error as Error).message,
    });
  }
};
export const updatePriceChange = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.body.adminId ?? req.query.adminId;
    const { id } = req.params;

    const {
      fromDate,
      toDate,
      price,
      status
    } = req.body;



    const priceChange = await AllPriceChanges.findOne({
      where: { priceId: id, adminId },
    })

    if (!priceChange) {
      res.status(404).json({
        success: false,
        message: "Price changes not found",
      });
      return;
    }

    const updatedPriceChange = await priceChange.update({
      fromDate,
      toDate,
      price,
      status: status ?? true,
    });

    await updatedPriceChange.save();
    await handlePriceUpdate()

    res.status(200).json({
      success: true,
      message: `Price changes Updated successfully`,
      data: priceChange,
    });
    return
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting price changes",
      error: (error as Error).message,
    });
  }
};
export const deletePriceChange = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.body.adminId ?? req.query.adminId;
    const { id } = req.params;
    const priceChange = await AllPriceChanges.findOne({
      where: { priceId: id, adminId },
    })

    if (!priceChange) {
      res.status(404).json({
        success: false,
        message: "Price changes not found",
      });
      return;
    }

    await priceChange.destroy({ force: true });
    await handlePriceUpdate()

    res.status(200).json({
      success: true,
      message: "Price changes deleted successfully",
    });
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting price changes",
      error: (error as Error).message,
    });
  }
};


