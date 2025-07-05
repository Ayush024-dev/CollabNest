import { Router } from "express";
import { aboutUser, alluserInfo, isloggedin, loginUser, logoutUser, registerUser, verifyEmail, getUserPosts } from "../controllers/user.controller.js";
import upload from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router= Router()

router.route("/register").post(
    upload.single("avatar"),
    registerUser
)
router.route("/verifyemail").post(
    verifyEmail
)
router.route("/login").post(
    loginUser
)
router.route("/logOut").post(
    verifyJWT,
    logoutUser
)
router.route("/aboutYou").post(
    verifyJWT,
    aboutUser
)
router.route("/isLoggedIn").get(
    verifyJWT,
    isloggedin
)
router.route("/allUserInfo").get(
    alluserInfo
)

router.route("/getUserFeeds").post(
    verifyJWT,
    getUserPosts
)

export default router