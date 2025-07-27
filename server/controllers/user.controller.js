import User from "../models/user.model.js";
import Post from "../models/post.model.js"
import ConnectionRequest from "../models/connectionReq.model.js";
import Notification from "../models/notification.model.js";

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
        const { username, designation, institute, Bio } = req.body;

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
                Bio,
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
        const user = req.user;

        const user_id = req.userId

        // console.log("my id: ", user_id)


        const encryptedId = encrypt(user_id.toString());

        // console.log("After encryption: ", encryptedId)

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
            const encryptedId = encrypt(element._id.toString());
            JsonData[encryptedId] = {
                ...element.toObject(),
                _id: encryptedId  // Encrypt only the value part's _id
            };
        });

        return res.status(200).send(JsonData);
    } catch (error) {
        console.error(error);
        throw new ApiError(500, error?.message || "Cannot get info");
    }
});

// Connection Request and Notification

const sendConnectionRequest = AsyncHandler(async (req, res) => {
    try {
        const senderId = req.userId

        const { decryptedreceiverId } = req.body;

        const receiverId = decrypt(decryptedreceiverId);

        if (senderId.toString() === receiverId) throw new ApiError(401, "Cannot send connection to yourself!!");

        const existingUser = await ConnectionRequest.findOne({ sender: senderId, receiver: receiverId })

        if (existingUser) throw new ApiError(401, "Connection request already sent!!")

        const loggedinUser = await User.findById(senderId).select('connections');

        const isAlreadyConnected = loggedinUser.connections.some(conn =>
            conn.toString() === receiverId
        );

        if (isAlreadyConnected) {
            throw new ApiError(401, "User is already a connection!!")
        }

        // Creation of connection request after all the checks
        await ConnectionRequest.create({
            sender: senderId,
            receiver: receiverId
        })

        // creation of notification
        const notification = await Notification.create({
            user: receiverId,
            from: senderId,
            type: 'connection_req'
        });

        // Encrypt user and from fields for frontend
        const encryptedNotification = {
            ...notification.toObject(),
            user: encrypt(notification.user.toString()),
            from: encrypt(notification.from.toString()),
        };

        // Emit notification
        const io = req.app.get('io');
        const encryptedRoom = encrypt(receiverId.toString());
        io.to(encryptedRoom).emit('newNotification', encryptedNotification);
        console.log('Emitted newNotification to room:', encryptedRoom, encryptedNotification);

        return res.json(
            new ApiResponse(200, encryptedNotification, "Connection request sent!!")
        )

    } catch (error) {
        console.log(error);
        throw new ApiError(500, error?.message || "Could not send the request");
    }
})

const AcceptOrRejectConnection = AsyncHandler(async (req, res) => {
    try {
        const { encryptedId, type } = req.body;
        const myId = req.userId;

        if (!encryptedId) throw new ApiError(404, "User not found");

        if (!type || (type !== "Accept" && type !== "Reject"))
            throw new ApiError(401, "Invalid operation");

        const senderId = decrypt(encryptedId);

        // ❌ Delete the connection request regardless of Accept/Reject
        const deletePost = await ConnectionRequest.findOneAndDelete({
            sender: senderId,
            receiver: myId,
        });

        if (!deletePost) throw new ApiError(404, "No connection request found");


        // ✅ If connection accepted
        if (type === "Accept") {
            // Push senderId into my connections
            await User.findByIdAndUpdate(myId, {
                $addToSet: { connections: senderId },
            });

            // Push myId into sender's connections
            await User.findByIdAndUpdate(senderId, {
                $addToSet: { connections: myId },
            });

            // Create notification for sender
            const newNotification = await Notification.create({
                user: senderId,
                from: myId,
                type: "connection_accepted",
            });

            // Emit real-time notification to sender
            const io = req.app.get("io");
            const encryptedRoom = encrypt(senderId.toString());
            io.to(encryptedRoom).emit("newNotification", {
                type: "connection_accepted",
                from: myId,
                createdAt: newNotification.createdAt,
                notificationId: newNotification._id,
            });
            console.log('Emitted newNotification to room:', encryptedRoom, {
                type: "connection_accepted",
                from: myId,
                createdAt: newNotification.createdAt,
                notificationId: newNotification._id,
            });
        }

        return res.status(200).json({
            message: `Connection request ${type === "Accept" ? "accepted" : "rejected"} successfully.`,
        });
    } catch (error) {
        console.log(error);
        throw new ApiError(500, error?.message || "Not able to follow right now, Please try later");
    }
});


const getUserConnectionStatus = AsyncHandler(async (req, res) => {
    try {
        const { encryptedUserId } = req.body;
        const receiverId = decrypt(encryptedUserId);
        const myId = req.userId;


        const existingRequest = await ConnectionRequest.findOne({
            sender: myId,
            receiver: receiverId
        });

        if (existingRequest) {
            return res.status(200).json({ Connection_status: "pending" });
        }


        const me = await User.findById(myId).select("connections");
        const isAlreadyConnected = me.connections.some(conn =>
            conn.toString() === receiverId
        );

        if (isAlreadyConnected) {
            return res.status(200).json({ Connection_status: "Connection" });
        }


        return res.status(200).json({ Connection_status: "No_Connection" });

    } catch (error) {
        console.log(error);
        throw new ApiError(500, error?.message || "Could not get connection status!");
    }
});

const showNotifications = AsyncHandler(async (req, res) => {
    try {
      const myId = req.userId;
  
      let notifications = await Notification.find({ user: myId });
  
      notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
      // Encrypt user and from fields for each notification
      const encryptedNotifications = notifications.map((notif) => ({
        ...notif.toObject(),
        user: encrypt(notif.user.toString()),
        from: encrypt(notif.from.toString()),
      }));
  
      return res.json(
        new ApiResponse(200, encryptedNotifications, "Notifications fetched successfully")
      );
  
    } catch (error) {
      console.log(error);
      throw new ApiError(500, error?.message || "Not able to show notifications!!");
    }
  });
  

const toggleReadStatus = AsyncHandler(async (req, res) => {
    try {
        const { notification_id } = req.body;

        const updateNotification = await Notification.findByIdAndUpdate(
            notification_id,
            { $set: { read: true } },
            { new: true } 
        );

        if (!updateNotification) {
            throw new ApiError(404, "No such notification received!!");
        }
        console.log(updateNotification);
        return res.status(200).json({ message: "toggle done" });
    } catch (error) {
        console.log(error);
        throw new ApiError(500, error?.message || "Trouble setting up the read status!!");
    }
});

const RemoveOrWithdrawConnection = AsyncHandler(async (req, res) => {
    try {
        

        const { encryptedUserId } = req.body;
        const myId = req.userId;

        if (!encryptedUserId) throw new ApiError(404, "User not found");

        const receiverId = decrypt(encryptedUserId);

        const request = await ConnectionRequest.findOneAndDelete({ sender: myId, receiver: receiverId });

        if (request){
            const notification=await Notification.findOneAndDelete({ user: receiverId, from: myId})

            if(!notification) throw new ApiError(401, "Notification not registered");


            res.status(200).json({ message: "Request withdrawn successfully" });
        }

        const me = await User.findById(myId).select("connections");

        if (!me) {
            throw new ApiError(404, "User not found");
        }

        const isConnected = me.connections.some(conn =>
            conn.toString() === receiverId
        );


        if (!isConnected) throw new ApiError(401, "No connection to remove");

        await User.findByIdAndUpdate(myId, {
            $pull: { connections: receiverId }
        });

        await User.findByIdAndUpdate(receiverId, {
            $pull: { connections: myId }
        });

        return res.status(200).json({ message: "Connection removed" });

    } catch (error) {
        console.log(error);

        throw new ApiError(500, error?.message || "Server Error!!")
    }
})


const getNewNotificationCount = AsyncHandler(async (req, res) => {
    try {
        const myId = req.userId;
        const count = await Notification.countDocuments({ user: myId, read: false });
        return res.status(200).json({ count });
    } catch (error) {
        console.log(error);
        throw new ApiError(500, error?.message || "Could not get notification count");
    }
});

export {
    registerUser,
    verifyEmail,
    loginUser,
    logoutUser,
    aboutUser,
    isloggedin,
    alluserInfo,
    sendConnectionRequest,
    getUserConnectionStatus,
    AcceptOrRejectConnection,
    showNotifications,
    RemoveOrWithdrawConnection,
    toggleReadStatus,
    getNewNotificationCount
}