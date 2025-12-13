import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "../../uploads");

        // Check if the directory exists, if not, create it
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    // Log file details for debugging
    console.log('[Multer FileFilter] File received:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        encoding: file.encoding
    });
    
    // Accept files with image mimetype
    if (file.mimetype && file.mimetype.startsWith("image/")) {
        cb(null, true);
    } 
    // Also accept files without mimetype (Flutter might send without proper mimetype)
    // Check by file extension as fallback
    else if (file.originalname) {
        const ext = file.originalname.toLowerCase().split('.').pop();
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
        if (ext && imageExtensions.includes(ext)) {
            console.log('[Multer FileFilter] Accepting file by extension:', ext);
            cb(null, true);
        } else {
            console.log('[Multer FileFilter] Rejecting file - invalid type:', file.mimetype || 'no mimetype', 'extension:', ext);
            cb(new Error("Only image files are allowed!"), false);
        }
    } else {
        console.log('[Multer FileFilter] Rejecting file - no mimetype or originalname');
        cb(new Error("Only image files are allowed!"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 3 * 1024 * 1024 }, // Limit: 3MB
});

export default upload;
