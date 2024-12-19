import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/ApiResponse.js"; 
import bcrypt from 'bcrypt';

const uploadImage = async (imagePath) => {
    try {
        const uploadedImage = await uploadOnCloudinary(imagePath);
        console.log("Uploaded image: ", uploadedImage);
        return uploadedImage;
    } catch (error) {
        console.log("Error uploading image: ", error);
        throw new ApiError(500, "Failed to upload image!");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;

    console.log("Request Body:", req.body);

    // Validate required fields
    if ([fullname, email, username, password].some(field => !field?.trim())) {
        throw new ApiError(400, "All fields are required!");
    }

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email }],
    });
    if (existingUser) {
        throw new ApiError(400, "User with this email or username already exists!");
    }

    // Image uploads
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    let avatar, coverImage;

    if (avatarLocalPath) avatar = await uploadImage(avatarLocalPath);
    if (coverImageLocalPath) coverImage = await uploadImage(coverImageLocalPath);

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            fullname,
            avatar: avatar?.url || "",
            coverImage: coverImage?.url || "",
            email,
            password: hashedPassword,
            username: username.toLowerCase(),
        });

        const createdUser = await User.findById(user._id).select("-password -refreshToken");
        if (!createdUser) throw new ApiError(500, "Failed to retrieve the created user!");

        return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully!"));
    } catch (error) {
        console.error("Error creating user in MongoDB:", error.message);

        // Cleanup uploaded files on failure
        if (avatar) await deleteFromCloudinary(avatar.public_id);
        if (coverImage) await deleteFromCloudinary(coverImage.public_id);

        throw new ApiError(500, "Failed to register user. Cleaned up uploaded images.");
    }
});

export { registerUser };
