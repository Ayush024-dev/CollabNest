import { v2 as cloudinary } from "cloudinary";
import dotenv from 'dotenv';
dotenv.config();

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const delete_from_cloudinary = async (public_id) => {
    try {
        if (!public_id) return null;

        const response = await cloudinary.uploader.destroy(public_id);
        console.log("File deleted from Cloudinary:", response);
        return response;
    } catch (error) {
        console.error("Cloudinary delete failed:", error);
        return null;
    }
}

export { delete_from_cloudinary }