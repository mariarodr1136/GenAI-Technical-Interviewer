import { Router } from "express";
import {
  handleDebrief,
  handleHint,
  handleInterviewTurn,
  handleStart,
  handleTextTurn
} from "../controllers/interviewController.js";
import { audioUpload } from "../middleware/upload.js";

const router = Router();

router.post("/turn", audioUpload.single("audio"), handleInterviewTurn);
router.post("/text-turn", handleTextTurn);
router.post("/start", handleStart);
router.post("/hint", handleHint);
router.post("/debrief", handleDebrief);

export default router;
