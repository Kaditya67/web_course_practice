import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    // validation
    if(
        [fullName, email, username, password].some((field) => field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required!")
    }

    // check for existing user
    const existed_user = await User.findOne({
        $or:[{username},{email}]
    })
    if(existed_user){
        throw new ApiError(409,"User with email or username already exists!")
    }

    // images
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing !")
    }
    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image file is missing !")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    let coverImage = ""
    if(coverImageLocalPath){
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const created_user = await User.findById(user._id).select("-password -refreshToken")
    if(!created_user){
        throw new ApiError(500,"Something went wrong while registering a user !")
    }

    return res.status(201).json(new ApiResponse(200,created_user, "User registered successfully !"))

});

export { registerUser };