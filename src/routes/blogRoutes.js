import express from "express";
import {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleLike,
} from "../controllers/blogController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getBlogs);
router.get("/:id", getBlogById);

// Protected routes
router.post("/", protect, createBlog);
router.put("/:id", protect, updateBlog);
router.delete("/:id", protect, deleteBlog);
router.post("/:id/like", protect, toggleLike);

export default router;
