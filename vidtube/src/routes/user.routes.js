import { Router } from "express";
import { registerUser } from "../controller/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    (req, res, next) => {
        // Debug: Log all received files
        console.log("Files in middleware:", req.files);

        // Check if required files are uploaded
        const avatarFile = req.files?.avatar?.[0];
        const coverImageFile = req.files?.coverImage?.[0];

        if (!avatarFile) {
            return res.status(400).json({
                message: "Avatar file is missing! Please upload the avatar.",
            });
        }

        if (!coverImageFile) {
            return res.status(400).json({
                message: "Cover image file is missing! Please upload the cover image.",
            });
        }

        // If everything is okay, proceed to the next middleware
        next();
    },
    registerUser 
);

export default router;
