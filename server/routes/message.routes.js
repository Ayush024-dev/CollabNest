import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";
import { EditMessage, getLastSeen, getMessage, lastConversation, sendMessage } from "../controllers/message.controller.js";


const router=Router();

//Routes
router.route("/SendMessage").post(
    verifyJWT,
    upload.fields([{ name: "file", maxCount: 1 }]),
    sendMessage
);

router.route("/GetMessage").post(
  verifyJWT,
  getMessage
)

router.route("/GetLastConversation").get(
  verifyJWT,
  lastConversation
)

router.route("/EditMessage").patch(
  verifyJWT,
  EditMessage
)

router.route("/GetStatus").post(
  verifyJWT,
  getLastSeen
)

export default router;