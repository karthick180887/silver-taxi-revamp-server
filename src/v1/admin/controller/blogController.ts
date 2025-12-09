import { Request, Response } from "express";
import { Blog } from "../../core/models";


export const getAllBlogs = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;

        const blogs = await Blog.findAll(
            {
                where: { adminId },
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                order: [['createdAt', 'DESC']],
            });

        if (!blogs) {
            res.status(404).json({
                success: false,
                message: "Blogs not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Blogs retrieved successfully",
            data: blogs,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error getting all blogs",
            error: error,
        });
    }
};

export const getBlogById = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;

        const { id } = req.params;
        const blog = await Blog.findOne({
            where: { blogId: id, adminId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
        });

        if (!blog) {
            res.status(404).json({
                success: false,
                message: "Blog not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Blog retrieved successfully",
            data: blog,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error getting blog by id",
            error: error,
        });
    }
};

export const createBlog = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;

        const {
            title,
            htmlContent,
            status,
            description,
            coverImage,
            url
        } = req.body;

        if (!title || !htmlContent || !url) {
            res.status(400).json({
                success: false,
                message: "Missing required fields (title, htmlContent)",
            });
            return;
        }

        const blog = await Blog.create({
            adminId,
            title,
            url,
            htmlContent,
            description,
            status: status ?? true,
            coverImage
        });

        res.status(201).json({
            success: true,
            message: "Blog created successfully",
            data: blog,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error creating blog",
            error: error,
        });
    }
};

export const updateBlog = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;

        const { id } = req.params;
        const {
            htmlContent,
            status,
            description,
            coverImage,
            title,
            url
        } = req.body;


        const blog = await Blog.findOne({
            where: { blogId: id, adminId },
        });

        if (!blog) {
            res.status(404).json({
                success: false,
                message: "Blog not found",
            });
            return;
        }

        const updatedBlog = await blog.update({
            title,
            htmlContent,
            status,
            description,
            coverImage,
            url
        });
        await updatedBlog.save();

        res.status(200).json({
            success: true,
            message: "Blog updated successfully",
            data: updatedBlog,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating blog",
            error: error,
        });
    }
};

export const deleteBlog = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;

        const { id } = req.params;

        const blog = await Blog.findOne({
            where: { blogId: id }
        });

        if (!blog) {
            res.status(404).json({
                success: false,
                message: "Blog not found",
            });
            return;
        }

        await blog.destroy();

        res.status(200).json({
            success: true,
            message: "Blog deleted successfully",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting blog",
            error: error,
        });
    }
};




