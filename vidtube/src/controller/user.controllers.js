import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/ApiResponse.js"; 
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import { JsonWebTokenError } from "jsonwebtoken";

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

const generateAccessAndRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId);
        if(!user) throw new ApiError(400,"No user found");
    
        const accessToken = generateAccessToken();
        const refreshToken = generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
    } catch (error) {
        console.log("There is a error setting access and refresh token!")
        throw new ApiError(500,"Error at generate access and refresh token!");
    }
}


const loginUser = asyncHandler(async(req,res)=>{
    const {email, username, password} = req.body;

    //validate
    if(!email){
        throw new ApiError(400,"Email is required!");
    }

    // find user
    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(400,"User does not exist!")
    }

    // validate password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(500,"Password do not match!")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    if(!loggedInUser){
        throw new ApiError(500,"User is not logged in !")
    }

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(
        200,
        {
            user: loggedInUser, accessToken, refreshToken
        },
        "User logged in Successfully!"
    ))
})

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

const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(req.user._id,{
        $set:{
            refreshToken:undefined,
        }
    },{new:true}
    )

    const options = {
        httpOnly:true,
        secure:process.env.NODE_ENV==="production",
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully!"))
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Refresh Token is required");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)

        if(!user){
            throw new ApiError(401,"Invalid refresh token !")
        }

        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Invalid refresh token");
        }

        const options = {
            httpOnly:true,
            secure:process.env.NODE_ENV == "production"
        }

        const {accessToken, refreshToken:newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToke",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,
                    refreshToken:newRefreshToken
                }
            )
        )
    } catch (error) {
        throw new ApiError(500,"Something went wrong while refreshing access token")
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordValid){
        throw new ApiError(401,"Old password is incorrect !")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave:false});
    return res.status(200).json(new ApiResponse(200,{},"Password changed successfully!"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse(200,req.user,"Current User Details"));
})

const updateAccountDetails = asyncHandler(async (req,res)=>{
    const {fullName,email} = req.body;

    if(!fullName){
        throw new ApiError(400,"FullName is required !")
    }
    if(!email){
        throw new ApiError(400,"Email is required !")
    } 

    const user = User.findByIdAndUpdate(req.user?._id,{
        $set:{
            fullname:fullName,
            email:email
        }},  
        {new:true}
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200,user,"Account Details Updated !"))
})

const updateUserAvatar = asyncHandler(async (req,res)=>{
    const avatarLocalPath = res.files?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"File is required!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(500,"Something went wrong while uploading avatar !");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,{
            $set:{
                avatar:avatar.url
            }
        },{new:true}
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200,user,"Avatar Updated !"))
})


const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400,"File is required!")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(500,"Something went wrong while uploading cover image!");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,{
            $set:{
                coverImage:coverImage.url
            }
        },{new:true}
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200,user,"Cover Image Updated !"))
})


const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError(400,"No user is selected !"
        )
    }
    const  channel = await user.aggregate([
        // {},{},{}
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                $from:"subscription",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscription",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscriberedTo"
            }
        },
        {
            $addField:{
                subscribersCount:{
                    $size:"$susbscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscriber.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            // project only the necessary data
            $project:{
                fullname:1,
                username:1,
                avatar:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                coverImage:1,
                email:1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,"Channel not found!")
    }

    return res.status(200)
    .json(new ApiResponse(200,channel[0],"Channel profile fetched successfully!"))
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                foreignField:"_id",
                localField:"watchHistory",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            foreignField:"_id",
                            localField:"owner",
                            as:"owner",
                            pipeline:[{
                                $project:{
                                    fullname:1,
                                    username:1,
                                    avatar:1
                                }
                            }]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(new ApiResponse(20, user[0],"Watch history fetched successfully!"))
})

export { registerUser, loginUser, refreshAccessToken, logoutUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage,changeCurrentPassword,getUserChannelProfile,getWatchHistory,getCurrentUser };
