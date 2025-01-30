import { v2 as cloudinary } from "cloudinary";
import fs from 'fs/promises'; // Use promises version of fs
import dotenv from 'dotenv';
dotenv.config();

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localfilepath) => {
    try {
        if (!localfilepath) return null;

        const response = await cloudinary.uploader.upload(
            localfilepath, {
            resource_type: "auto"
        });
        console.log("File is uploaded on Cloudinary:", response.url);

        return response;
    } catch (error) {
        console.error("Cloudinary upload failed:", error);

        // Remove the temp file
        try {
            await fs.unlink(localfilepath);
            console.log("Local file removed successfully.");
        } catch (unlinkError) {
            console.error("Failed to delete local file:", unlinkError);
        }

        return null;
    }
};

export { uploadOnCloudinary };
