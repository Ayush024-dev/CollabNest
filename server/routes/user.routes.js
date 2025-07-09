import { Router } from "express";
import { aboutUser, alluserInfo, isloggedin, loginUser, logoutUser, registerUser, verifyEmail, getUserPosts, sendConnectionRequest, getUserConnectionStatus, AcceptOrRejectConnection, showNotifications, RemoveOrWithdrawConnection, toggleReadStatus } from "../controllers/user.controller.js";
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

// Connection and notification routes
router.route("/sendConnectionReq").post(
    verifyJWT,
    sendConnectionRequest
)

router.route("/getUserConnectionStatus").post(
    verifyJWT,
    getUserConnectionStatus
)

router.route("/AcceptOrRejectConnectionRequest").post(
    verifyJWT,
    AcceptOrRejectConnection
)

router.route("/showNotification").get(
    verifyJWT,
    showNotifications
)

router.route("/RemoveOrWithdrawRequest").post(
    verifyJWT,
    RemoveOrWithdrawConnection
)

router.route("/toggleStatus").patch(
    verifyJWT,
    toggleReadStatus
)

export default router