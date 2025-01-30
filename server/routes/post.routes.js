import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { getsortedComments, likeComments, likePosts, likeReplies, postComments, postingContent, postReplies, showPosts, showReplies } from "../controllers/post.controller.js";
import upload from "../middleware/multer.middleware.js";


const router=Router();

router.route("/posting_content").post(
    verifyJWT, upload.array("image",3), postingContent
)
router.route("/view_content").get(
    showPosts
)
router.route("/like_content").patch(
    verifyJWT,likePosts
)
router.route("/post_comment").post(
    verifyJWT, postComments
)
router.route("/view_comment").post(
    getsortedComments
)
router.route("/like_comment").patch(
    verifyJWT, likeComments
)
router.route("/reply_comment").post(
    verifyJWT, postReplies
)
router.route("/show_reply").post(
    showReplies
)
router.route("/like_reply").patch(
    verifyJWT, likeReplies
)
export default router