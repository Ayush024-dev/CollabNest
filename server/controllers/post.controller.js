import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Comment from "../models/comments.model.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from 'fs/promises';
import { ApiResponse } from "../utils/ApirResponse.js";

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
        const io = req.app.get('io');
        io.emit('newPost', newpost);
        return res.status(201).json(
            new ApiResponse(201, newpost, "Post published successfully!!")
        )



    } catch (error) {
        console.log(error);
        throw new ApiError(500, error?.message || "Server Error");
    }
})

const showPosts = AsyncHandler(async (req, res) => {
    //store the posts in a variable
    //sort the posts based on likes and if likes are same then sort it based on created at timestamp
    //sent it to the client

    try {
        const post = await Post.find();
        post.sort((a, b) => {
            if (Object.keys(a.likes).length == Object.keys(b.likes).length) return b.updatedAt - a.updatedAt;

            return Object.keys(a.likes).length - Object.keys(b.likes).length;

        })

        return res.status(200).json(
            new ApiResponse(200, post, "post viewed successfully")
        )
    } catch (error) {
        console.log(error);
        throw new ApiError(500, error?.message || "Could not show feed");

    }
})

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

        const io = req.app.get('io');
        io.emit('newComment', newComment);

        return res.status(200).json(
            new ApiResponse(200, newComment, "Comment posted")
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

        return res.status(200).json(
            new ApiResponse(200, comment, "comment viewed succufully")
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

        

        const io = req.app.get('io');
        io.emit("newReply", {commentId, reply});

        console.log("reply posted")
        return res.status(200).json(
            new ApiResponse(200, updatedComment, "reply posted")
        )
    } catch (error) {
        console.error(error);
        throw new ApiError(500, error?.message || "Could not post your reply")

    }
})
const showReplies = AsyncHandler(async (req, res) => {
    try {
        const { commentId } = req.body; //Here commentId is comming undefined
        console.log("My comment Id: ",commentId)
        if(!commentId) throw new ApiError(404, "comment not found")
        const comment = await Comment.findById(commentId);
        // console.log(comment);
        const replyies = comment.replies;
        console.log("My reply: " ,replyies)
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

        return res.status(200).json(
            new ApiResponse(200, replyies, "replies views successfully")
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
        const updatedComments=await comment.save();

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
