import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get comments for a blog
export const getComments = async (req, res) => {
  try {
    const { blogId } = req.params;

    const comments = await prisma.comment.findMany({
      where: { blogId: parseInt(blogId) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a comment
export const createComment = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Check if blog exists
    const blog = await prisma.blog.findUnique({
      where: { id: parseInt(blogId) },
    });

    if (!blog) {
      res.status(404).json({ message: "Blog not found" });
      return;
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        user: {
          connect: { id: userId },
        },
        blog: {
          connect: { id: parseInt(blogId) },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a comment
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    // Check if user is the comment owner
    if (comment.userId !== userId) {
      res
        .status(401)
        .json({ message: "Not authorized to update this comment" });
      return;
    }

    // Update comment
    const updatedComment = await prisma.comment.update({
      where: { id: parseInt(id) },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.json(updatedComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    // Check if user is the comment owner or blog owner
    if (comment.userId !== userId) {
      // Check if user is the blog owner
      const blog = await prisma.blog.findUnique({
        where: { id: comment.blogId },
      });

      if (!blog || blog.authorId !== userId) {
        res
          .status(401)
          .json({ message: "Not authorized to delete this comment" });
        return;
      }
    }

    // Delete comment
    await prisma.comment.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Comment removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
