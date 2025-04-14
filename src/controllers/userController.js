import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate and parse ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            blogs: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Get user's public blogs
    const blogs = await prisma.blog.findMany({
      where: {
        authorId: parseInt(id),
        published: true,
      },
      select: {
        id: true,
        title: true,
        excerpt: true,
        featuredImage: true,
        category: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    const formattedBlogs = blogs.map((blog) => ({
      ...blog,
      commentsCount: blog._count.comments,
      likesCount: blog._count.likes,
      _count: undefined,
    }));

    res.json({
      ...user,
      blogsCount: user._count.blogs,
      recentBlogs: formattedBlogs,
      _count: undefined,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, avatar, bio } = req.body;
    const userId = req.user.id;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        avatar,
        bio,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        bio: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      res.status(400).json({ message: "Current password is incorrect" });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's blogs
export const getUserBlogs = async (req, res) => {
  try {
    const userId = req.user.id;

    const blogs = await prisma.blog.findMany({
      where: { authorId: userId },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        excerpt: true,
        featuredImage: true,
        category: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    const formattedBlogs = blogs.map((blog) => ({
      ...blog,
      commentsCount: blog._count.comments,
      likesCount: blog._count.likes,
      _count: undefined,
    }));

    res.json(formattedBlogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
