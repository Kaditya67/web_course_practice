import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDNINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDNINARY_API_KEY, 
    api_secret: process.env.CLOUDNINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        const response = cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        console.log("File uploaded on cloudinary. Src : "+response.url)

        // delete file from local server
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export {uploadOnCloudinary} 