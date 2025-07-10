import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = AsyncHandler(async(req, res, next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
        // console.log(token);

        if(!token) throw new ApiError(401, "Unauthorized request");

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        
        const user= await User.findById(decodedToken._id).select("-_id -password -AccessToken");
    
        if(!user) throw new ApiError(401, "Invalid Access Token");

        req.user= user;
        req.userId=decodedToken._id;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
})