import { Router } from "express";
import { handleInterviewTurn } from "../controllers/interviewController.js";
import { audioUpload } from "../middleware/upload.js";

const router = Router();

router.post("/turn", audioUpload.single("audio"), handleInterviewTurn);

export default router;
