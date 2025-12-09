import express, { Router } from "express";
import { distanceFind, generateToken, uploadImage } from "../controller/common.controller";
import upload from "../../../utils/multer.fileUpload"
import multer from "multer";

const router: Router = express.Router();

// Routes
router.post("/jwt/signup", generateToken);

router.use(
    '/image-upload',
    (req, res, next) => {
        upload.single('image')(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // Handle Multer-specific errors
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'File too large. Max size is 5MB.',
                        error: err.code
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: `Multer error: ${err.message}`,
                    error: err.code
                });
            } else if (err) {
                // Handle other errors
                return res.status(500).json({
                    success: false,
                    message: `Unexpected error: ${err.message}`,
                    error: err
                });
            }
            next();
        });
    },
    uploadImage
);


router.get('/distance', distanceFind);


export default router