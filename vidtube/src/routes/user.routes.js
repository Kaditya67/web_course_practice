import { Router } from "express";
import { changeCurrentPassword, loginUser, logoutUser, refreshAccessToken, registerUser,getCurrentUser, getUserChannelProfile, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getWatchHistory } from "../controller/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js"; 

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

router.route("/login").post(loginUser)
router.route("/refresh-token").post(refreshAccessToken)

// only verified user can see
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
router.route("/history").get(verifyJWT,getWatchHistory)

export default router;
