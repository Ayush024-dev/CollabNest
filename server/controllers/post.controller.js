import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Comment from "../models/comments.model.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from 'fs/promises';
import { ApiResponse } from "../utils/ApirResponse.js";
import { encrypt, decrypt } from "../utils/encryption.js";


// const getuserinfo= async (req, res) => {
//     try {
//         const AccessToken= req.cookies?.accessToken || req.header("Authorization")?.replace("bearer ","");

//         console.log("my token ", AccessToken)

//         const user= await User.findOne({AccessToken}); 

//         return res.status(200).json(user);
//     } catch (error) {
//         console.error(error);
//         throw new ApiError(500, error?.message || "Cannot find user details")
//     }
// }

const postingContent = AsyncHandler(async (req, res) => {
    try {
        const { type, content, field } = req.body;

        if (!type || !content) throw new ApiError(401, "Cannot Post without content or field");


        if (type == "ideate" && !field) throw new ApiError(401, "Please provide the field of your idea")

        let imageLocalpath, images = [];
        console.log(req.files)
        if (req.files.length > 0) {
            // `req.files` is an array, so assign it directly to `imageLocalpath`
            imageLocalpath = req.files.map(file => file.path);
            // console.log(req.files)

            // Upload all images to Cloudinary and get their URLs
            images = await Promise.all(imageLocalpath.map(async (localPath) => {
                return await uploadOnCloudinary(localPath);
            }));
            // console.log(images)
            for (let i = 0; i < imageLocalpath.length; i++) {
                try {
                    await fs.unlink(imageLocalpath[i]);
                    console.log("Local file removed successfully.");
                } catch (unlinkError) {
                    console.error("Failed to delete local file:", unlinkError);
                }
            }
        }


        // Create a new post using the uploaded image URL(s)
        const AccessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("bearer ", "");
        // console.log("token ", AccessToken)
        const user = await User.findOne({ AccessToken });
        // console.log(user) 
        const newpost = await Post.create({
            postId: user._id,
            type,
            content,
            field,
            image: images.map(image => image.url)
        });

        // Encrypt postId for frontend
        const encryptedPost = {
            ...newpost.toObject(),
            postId: encrypt(newpost.postId.toString()),
        };

        const io = req.app.get('io');
        io.emit('newPost', encryptedPost);
        return res.status(201).json(
            new ApiResponse(201, encryptedPost, "Post published successfully!!")
        )



    } catch (error) {
        console.log(error);
        throw new ApiError(500, error?.message || "Server Error");
    }
})

const showPosts = AsyncHandler(async (req, res) => {
    try {
        let decryptedUserId = "";
        let isLoggedInUser = false;
        let posts = [];
        let user = null;

        // Step 1: Get accessToken from cookies or headers
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        let loggedInUser = null;

        if (accessToken) {
            loggedInUser = await User.findOne({ AccessToken: accessToken });
        }

        // Step 2: Check if request has userId (Profile.jsx case)
        if (req.method === "POST" && req.body && req.body !== "") {
            const { encryptedId } = req.body;
            // console.log("Received encryptedId:", encryptedId);

            if (!encryptedId) {
                throw new ApiError(400, "Encrypted user ID is required");
            }

            try {
                decryptedUserId = decrypt(encryptedId);
                // console.log("Decrypted userId:", decryptedUserId);
            } catch (decryptError) {
                console.error("Decryption failed:", decryptError);
                throw new ApiError(400, "Invalid user ID format");
            }

            // Get posts for that user
            posts = await Post.find({ postId: decryptedUserId });

            // Find that user (for profile info)
            user = await User.findOne({ _id: decryptedUserId });

            if (!user) {
                throw new ApiError(404, "User not found");
            }

            // Check if loggedInUser is same as decrypted one
            if (loggedInUser && loggedInUser._id.toString() === decryptedUserId.toString()) {
                isLoggedInUser = true;
            }

        } else {
            // Step 3: If GET request from Feed.jsx (no id provided)
            posts = await Post.find();
            decryptedUserId = loggedInUser?._id?.toString() || "";
        }

        // Step 4: Sort posts by likes, then updatedAt
        posts.sort((a, b) => {
            const likeDiff = Object.keys(b.likes).length - Object.keys(a.likes).length;
            if (likeDiff !== 0) return likeDiff;
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        // Step 5: Prepare initialLikes map for frontend
        const initialLikes = new Map();
        posts.forEach(p => {
            if (p.likes && p.likes.has(loggedInUser._id.toString())) {
                initialLikes.set(p._id.toString(), true);
            }
        });

        // Step 6: Prepare final response
        const encryptedPost = posts.map((m) => ({
            ...m.toObject(),
            postId: encrypt(m.postId.toString()),
        }));
        const responsePayload = {
            encryptedPost,
            initialLikes: Object.fromEntries(initialLikes),
        };

        if (user) {
            // Sanitize user object before sending
            const { _id, password, AccessToken, ...sanitizedUser } = user._doc;
            responsePayload.user = sanitizedUser;
            responsePayload.isLoggedInUser = isLoggedInUser;
        }

        return res.status(200).json(new ApiResponse(200, responsePayload, "Posts fetched successfully"));

    } catch (error) {
        console.error(error);
        throw new ApiError(500, error?.message || "Could not fetch posts");
    }
});


const likePosts = AsyncHandler(async (req, res) => {
    try {
        const AccessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("bearer ", "");
        const user = await User.findOne({ AccessToken });
        const userid = user._id;

        const { postId } = req.body;

        if (!postId) throw new ApiError(401, "postid not given")

        const currPost = await Post.findById({ _id: postId });

        const likes = currPost.likes;

        // console.log(userid.toString())

        if (likes.has(userid.toString())) likes.delete(userid.toString());

        else {
            likes.set(userid.toString(), true)

        }

        currPost.likes = likes;

        // console.log(likes);

        await currPost.save();
        const io = req.app.get('io');
        io.emit('newLikeorDislike', currPost);
        return res.status(200).json(
            new ApiResponse(200, {}, "")
        )
    } catch (error) {
        console.log(error);
        throw new ApiError(500, error?.message || "not able to like post");

    }
})

const postComments = AsyncHandler(async (req, res) => {
    try {
        const AccessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("bearer ", "");
        const user = await User.findOne({ AccessToken });
        const { postId, comment } = req.body;

        if (!comment) throw new ApiError(409, "Empty comments can't be posted");
        if (!postId) throw new ApiError(409, "Cannot find the post");
        const person = user

        const personId = person._id

        const newComment = await Comment.create({
            postId,
            personId,
            comment
        })

        // Encrypt personId for frontend
        const encryptedComment = {
            ...newComment.toObject(),
            personId: encrypt(newComment.personId.toString()),
        };

        const io = req.app.get('io');
        io.emit('newComment', encryptedComment);

        return res.status(200).json(
            new ApiResponse(200, encryptedComment, "Comment posted")
        )

    } catch (error) {
        console.log(error);
        throw new ApiError(500, error?.message || "Not able to post comments");
    }
})

const getsortedComments = AsyncHandler(async (req, res) => {
    try {
        const { postId } = req.body;
        const comment = await Comment.find({ postId })
        const AccessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("bearer ", "");
        const user = await User.findOne({ AccessToken });
        const userId = user._id;
        comment.sort((a, b) => {
            // Step 1: Place comments by the logged-in user (userId) first
            const isAUser = a.personId.toString() === userId.toString();
            const isBUser = b.personId.toString() === userId.toString();

            if (isAUser !== isBUser) {
                return isAUser ? -1 : 1; // Logged-in user's comments go first
            }

            // Step 2: If likes are different, sort by likes (descending order)
            const likesA = Object.keys(a.likes || {}).length;
            const likesB = Object.keys(b.likes || {}).length;

            if (likesA !== likesB) {
                return likesB - likesA; // More likes come first
            }

            // Step 3: If likes are the same, sort by updatedAt (descending order)
            const updatedAtA = new Date(a.updatedAt);
            const updatedAtB = new Date(b.updatedAt);

            return updatedAtB - updatedAtA; // More recently updated comments come first
        });

        const InitialLikes = new Map();
        const InitiallikedReply = new Map();

        comment.forEach(p => {
            if (p.likes && p.likes.has(userId.toString())) {
                InitialLikes.set(p._id, true);
            }

            if (p.replies) {
                p.replies.forEach(rpy => {
                    if (rpy.likes && rpy.likes.has(userId.toString())) {
                        InitiallikedReply.set(rpy._id, true);
                    }
                })
            }
        });

        // Encrypt personId for frontend
        const encryptedComment = comment.map(c => {
            const encryptedReplies = c.replies
                ? c.replies.map(rpy => ({
                    ...rpy.toObject(),
                    replyingId: encrypt(rpy.replyingId.toString()),
                }))
                : [];
            return {
                ...c.toObject(),
                personId: encrypt(c.personId.toString()),
                replies: encryptedReplies,
            };
        });

        return res.status(200).json(
            new ApiResponse(200, { comments: encryptedComment, initialLikes: Object.fromEntries(InitialLikes), InitiallikedReply: Object.fromEntries(InitiallikedReply) }, "comment viewed succufully")
        )
    } catch (error) {
        console.error(error);
        throw new ApiError(500, error?.message || "can't get comments");

    }
})

const likeComments = AsyncHandler(async (req, res) => {
    try {
        const AccessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("bearer ", "");
        const user = await User.findOne({ AccessToken });
        const userid = user._id;

        const { commentId } = req.body;

        const comment = await Comment.findById({ _id: commentId });

        const likes = comment.likes;

        if (likes.has(userid.toString())) likes.delete(userid.toString());

        else likes.set(userid.toString(), true)

        comment.likes = likes;

        // console.log(likes);

        const updatedComments = await comment.save();

        const io = req.app.get('io');
        io.emit("updatedComment", updatedComments)

        return res.status(200).json(
            new ApiResponse(200, {}, "liked the post")
        )

    } catch (error) {
        console.error(error);
        throw new ApiError(500, error?.message || "Could not like comments")

    }
})
const postReplies = AsyncHandler(async (req, res) => {
    try {
        const AccessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("bearer ", "");
        const user = await User.findOne({ AccessToken });

        const { commentId, reply } = req.body;

        const replyingId = user._id;

        if (!commentId) throw new ApiError(404, "Comment not found");

        const newReply = {
            replyingId,
            reply
        };

        const comment = await Comment.findById({ _id: commentId });
        comment.replies.push(newReply);

        const updatedComment = await comment.save();

        // Get the newly added reply (last one in the array)
        const newReplyObj = updatedComment.replies[updatedComment.replies.length - 1];

        // Create encrypted reply object for socket emission
        const encryptedReply = {
            ...newReplyObj.toObject(),
            replyingId: encrypt(newReplyObj.replyingId.toString()),
        };

        const io = req.app.get('io');
        io.emit("newReply", { commentId, reply: encryptedReply });

        console.log("reply posted")

        const encryptedReplies = updatedComment.replies
            ? updatedComment.replies.map(rpy => ({
                ...rpy.toObject(),
                replyingId: encrypt(rpy.replyingId.toString()),
            }))
            : [];

        const encryptedComment = {
            ...updatedComment.toObject(),
            personId: encrypt(updatedComment.personId.toString()),
            replies: encryptedReplies,
        };

        return res.status(200).json(
            new ApiResponse(200, encryptedComment, "reply posted")
        )
    } catch (error) {
        console.error(error);
        throw new ApiError(500, error?.message || "Could not post your reply")

    }
})
const showReplies = AsyncHandler(async (req, res) => {
    try {
        const { commentId } = req.body; //Here commentId is comming undefined
        console.log("My comment Id: ", commentId)
        if (!commentId) throw new ApiError(404, "comment not found")
        const comment = await Comment.findById(commentId);
        // console.log(comment);
        const replyies = comment.replies;
        console.log("My reply: ", replyies)
        const AccessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("bearer ", "");
        const user = await User.findOne({ AccessToken });
        const userId = user._id;

        replyies.sort((a, b) => {
            // Step 1: Place replies by the logged-in user (userId) first
            const isAUser = a.replyingId.toString() === userId.toString();
            const isBUser = b.replyingId.toString() === userId.toString();

            if (isAUser !== isBUser) {
                return isAUser ? -1 : 1; // Logged-in user's comments go first
            }

            // Step 2: If likes are different, sort by likes (descending order)
            const likesA = Object.keys(a.likes || {}).length;
            const likesB = Object.keys(b.likes || {}).length;

            if (likesA !== likesB) {
                return likesB - likesA; // More likes come first
            }

            // Step 3: If likes are the same, sort by updatedAt (descending order)
            const updatedAtA = new Date(a.updatedAt);
            const updatedAtB = new Date(b.updatedAt);

            return updatedAtB - updatedAtA; // More recently updated comments come first
        });

        // Encrypt replyingId for each reply before sending to frontend
        const encryptedReplies = replyies.map(reply => ({
            ...reply.toObject(),
            replyingId: encrypt(reply.replyingId.toString()),
        }));

        return res.status(200).json(
            new ApiResponse(200, encryptedReplies, "replies views successfully")
        )
    } catch (error) {
        console.error(error);
        throw new ApiError(500, error?.message || "Could not show replies");
    }
})
const likeReplies = AsyncHandler(async (req, res) => {
    try {
        const AccessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("bearer ", "");
        const user = await User.findOne({ AccessToken });
        const userid = user._id;

        const { replyId, commentId } = req.body;

        if (!replyId || !commentId) throw new ApiError(404, "Either comment or reply not found");

        const comment = await Comment.findById(commentId);
        if (!comment) throw new ApiError(404, "Comment not found");

        const myreply = comment.replies.id(replyId);
        if (!myreply) throw new ApiError(404, "Reply not found");

        const likes = myreply.likes;

        if (likes.has(userid.toString())) {
            likes.delete(userid.toString());
        } else {
            likes.set(userid.toString(), true);
        }

        // Update the reply's likes
        myreply.likes = likes;

        // Save the parent document
        const updatedComments = await comment.save();

        const io = req.app.get('io');
        io.emit("updatedComment", updatedComments)

        console.log("Liked reply");
        return res.status(200).json(new ApiResponse(200, {}, "Liked the reply"));
    } catch (error) {
        console.error(error);
        throw new ApiError(500, error?.message || "Could not like this reply");
    }
});



export {
    postingContent,
    showPosts,
    likePosts,
    postComments,
    getsortedComments,
    likeComments,
    postReplies,
    showReplies,
    likeReplies
}                                      
