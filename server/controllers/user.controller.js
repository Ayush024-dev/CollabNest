import User from "../models/user.model.js";
import Post from "../models/post.model.js"
import { ApiResponse } from "../utils/ApirResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../utils/mailer.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from 'fs/promises';
import { encrypt, decrypt } from "../utils/encryption.js";

const GenerateAccessToken = async (userid) => {
    try {
        const user = await User.findById(userid)
        const accessToken = user.generateAccessToken()

        user.AccessToken = accessToken;
        await user.save({ validateBeforeSave: false });

        return accessToken


    } catch (error) {
        console.log(error);
        throw new ApiError(500, error.message)
    }
}

const registerUser = AsyncHandler(async (req, res) => {
    try {
        const { name, email, password, confirm_password } = req.body;

        console.log(req.body);


        if (
            [name, email, password, confirm_password].some((field) => field?.trim() === "")
        ) {
            throw new ApiError(400, "All fields are required")
        }

        const existedUser = await User.findOne({ email });

        if (existedUser) throw new ApiError(409, "User already exists");

        if (password != confirm_password) throw new ApiError(409, "Passwords don't match");

        // console.log(req.file)

        let avatarLocalPath;
        let avatar;

        if (req.file) {
            avatarLocalPath = req.file.path;
            avatar = await uploadOnCloudinary(avatarLocalPath);
        }



        // console.log(avatar);




        const user = await User.create({
            name,
            email,
            password,
            avatar: avatar?.url || ""
        });

        // console.log(user);

        try {
            await fs.unlink(avatarLocalPath);
            console.log("Local file removed successfully.");
        } catch (unlinkError) {
            console.error("Failed to delete local file:", unlinkError);
        }

        await sendEmail({ email, emailType: "VERIFY", userId: user._id })

        const createdUser = await User.findById(user._id).select(
            "-password"
        )
        return res.status(201).json(
            new ApiResponse(200, createdUser, "Verification link sent successfully, Please verify your email!")
        )

    } catch (error) {
        console.log(error);
        throw new ApiError(500, error.message);
    }
})

const verifyEmail = AsyncHandler(async (req, res) => {
    try {
        const { token } = req.body;

        console.log(token);

        const user = await User.findOne({
            verifyToken: token,
            verifyTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            throw new ApiError(404, "Invalid or expired token")
        }


        user.isVerified = true;
        user.verifyToken = undefined;
        user.verifyTokenExpiry = undefined;


        const accessToken = await GenerateAccessToken(user._id);

        user.AccessToken = accessToken;
        await user.save();

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(201)
            .cookie("accessToken", accessToken, options)
            .json(
                new ApiResponse(200, user, "Email verified successfully")
            )
    } catch (error) {
        console.log(error);

        throw new ApiError(500, error.message);
    }


})

const loginUser = AsyncHandler(async (req, res) => {
    try {
        const { email, username, password } = req.body;

        if (!email && !username) throw new ApiError(404, "Bad Credentials!!")

        const user = await User.findOne({ $or: [{ username }, { email }] });

        if (!user) throw new ApiError(404, "User doesn't exists!!")




        const PasswordCorrect = await user.isPasswordCorrect(password);

        if (!PasswordCorrect) throw new ApiError(409, "Bad Credentials!!");

        // Check if user is verified

        if (!user.isVerified) {
            // Send verification email
            await sendEmail({ email: user.email, emailType: "VERIFY", userId: user._id });
            throw new ApiError(401, "Email not verified. A verification link has been sent to your email address. Please verify your email before logging in.");
        }

        const accessToken = await GenerateAccessToken(user._id);

        user.AccessToken = accessToken;

        await user.save({ validateBeforeSave: false });

        // console.log(user.AccessToken)

        const loggedInUser = await User.findById(user._id).select("-password -AccessToken");

        const options = {
            httpOnly: true,
            secure: true,
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser,
                        accessToken
                    },
                    "User logged In Successfully"
                )
            );





    } catch (error) {
        console.log(error);

        throw new ApiError(500, error.message);
    }
})

const logoutUser = AsyncHandler(async (req, res) => {
    try {
        const AccessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        const user = await User.findOne({ AccessToken });
        await User.findByIdAndUpdate(
            user._id,
            {
                $unset: {
                    AccessToken: "" // this removes the field from document
                }
            },
            {
                new: true
            }
        )

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .json(new ApiResponse(200, {}, "User logged Out"))
    } catch (error) {
        console.log(error);
        throw new ApiError(500, error?.message)
    }
})

const aboutUser = AsyncHandler(async (req, res) => {
    try {
        const { username, designation, institute, bio } = req.body;

        if (!username || !designation || !institute) {
            throw new ApiError(404, "Please provide required fields!!");
        }

        // Extract access token from cookies or Authorization header
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!accessToken) {
            throw new ApiError(401, "Access token not found. Please login again.");
        }

        // Find user by accessToken
        const user = await User.findOne({ AccessToken: accessToken });

        if (!user) {
            throw new ApiError(404, "User not found. Invalid access token.");
        }

        // Update user details and remove the accessToken field
        await User.findByIdAndUpdate(
            user._id,
            {
                username,
                designation,
                institute,
                bio,
                $unset: { AccessToken: "" }, // Remove the accessToken field
            },
            { new: true } // Return the updated document (optional)
        );

        // Clear the accessToken cookie
        const options = {
            httpOnly: true,
            secure: true, // Use true only for HTTPS
            sameSite: 'None', // For cross-origin
        };

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .json(new ApiResponse(200, {}, "Thank you for sharing!."));
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong");
    }
});

const isloggedin = AsyncHandler(async (req, res) => {
    try {
        const user=req.user;

        const user_id = req.userId

        console.log("my id: ",user_id)


        const encryptedId = encrypt(user_id.toString());

        console.log("After encryption: ", encryptedId)

        res.status(200).json({ message: true, user_id: encryptedId, user });
    } catch (error) {
        console.log(error);
        throw new ApiError(500, { message: false });
    }
})

const alluserInfo = AsyncHandler(async (req, res) => {
    try {
      const data = await User.find().select("_id name avatar institute");
      let JsonData = {};
  
      data.forEach(element => {
        JsonData[element._id] = {
          ...element.toObject(),
          _id: encrypt(element._id.toString())  // Encrypt only the value part's _id
        };
      });
  
      return res.status(200).send(JsonData);
    } catch (error) {
      console.error(error);
      throw new ApiError(500, error?.message || "Cannot get info");
    }
  });


const getUserPosts = AsyncHandler(async (req, res) => {
    try {
        const encryptedId = req.body;
        const userid = decrypt(encryptedId);
        const userPosts = await Post.find({ postId: userid });

        const user = await User.findOne({ _id: userid });

        const isLoggedInUser = false;
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!accessToken) isLoggedInUser = false;
        else {
            const loggedIn = await User.findOne({ AccessToken: accessToken });

            if (loggedIn._id == userid) isLoggedInUser = true;
            else isLoggedInUser = false;
        }

        return res.status(200).json(
            new ApiResponse(200, { userPosts: userPosts, user: user, isLoggedInUser: isLoggedInUser }, "Posts fetched!!")
        )
    } catch (error) {
        console.log(error);
        throw new ApiError(500, error?.message || "Could not get User Post")
    }
})


export {
    registerUser,
    verifyEmail,
    loginUser,
    logoutUser,
    aboutUser,
    isloggedin,
    alluserInfo,
    getUserPosts
}