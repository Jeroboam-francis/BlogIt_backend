import express from "express";
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get comments for a blog
router.get("/blog/:blogId", getComments);

// Protected routes
router.post("/blog/:blogId", protect, createComment);
router.put("/:id", protect, updateComment);
router.delete("/:id", protect, deleteComment);

export default router;
