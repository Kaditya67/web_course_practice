import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({path: "./src/.env"});

cloudinary.config({ 
    cloud_name: process.env.CLOUDNINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDNINARY_API_KEY, 
    api_secret: process.env.CLOUDNINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        
        console.log("Cloudinary Config:", {
            cloud_name: process.env.CLOUDNINARY_CLOUD_NAME,
            api_key: process.env.CLOUDNINARY_API_KEY,
            api_secret: process.env.CLOUDNINARY_API_SECRET,
        });
        if (!localFilePath) {
            throw new Error("Local file path is missing!");
        }

        console.log("Uploading file to Cloudinary:", localFilePath);
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        console.log("File uploaded on Cloudinary. URL:", response.url);

        // Delete file from local server after successful upload
        fs.unlinkSync(localFilePath);

        return response;
    } catch (error) {
        console.error("Error during Cloudinary upload:", error);

        // Ensure local file is deleted even if upload fails
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        throw new Error("Failed to upload file to Cloudinary.");
    }
}

const deleteFromCloudinary = async(publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId)
        console.log("Deleted from cloudinary. Public Id: ",publicId,result)
    } catch (error) {
        console.log("Error deleting from cloudinary : ",error)
        return null
    }
}
export {uploadOnCloudinary,deleteFromCloudinary} 