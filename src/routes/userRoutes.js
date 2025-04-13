import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUserBlogs,
} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/:id", getUserProfile);

// Protected routes
router.put("/profile", protect, updateUserProfile);
router.put("/password", protect, changePassword);
router.get("/blogs/me", protect, getUserBlogs);

export default router;
