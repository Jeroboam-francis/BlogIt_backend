// backend/src/controllers/blogController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all blogs
export const getBlogs = async (req, res) => {
  try {
    const { category } = req.query;
    
    const whereClause = {
      published: true,
      ...(category && { category })
    };

    const blogs = await prisma.blog.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json(blogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single blog
export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await prisma.blog.findUnique({
      where: { id: parseInt(id) },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            likes: true
          }
        }
      }
    });

    if (!blog) {
      res.status(404).json({ message: 'Blog not found' });
      return;
    }

    // Check if the current user has liked this blog
    let hasLiked = false;
    
    if (req.user) {
      const like = await prisma.like.findUnique({
        where: {
          userId_blogId: {
            userId: req.user.id,
            blogId: parseInt(id)
          }
        }
      });
      
      hasLiked = !!like;
    }

    res.json({
      ...blog,
      likesCount: blog._count.likes,
      hasLiked,
      _count: undefined
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new blog
export const createBlog = async (req, res) => {
  try {
    const { title, excerpt, content, featuredImage, category, published } = req.body;

    const blog = await prisma.blog.create({
      data: {
        title,
        excerpt,
        content,
        featuredImage,
        category,
        published: published || false,
        author: {
          connect: { id: req.user.id }
        }
      }
    });

    res.status(201).json(blog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update blog
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, excerpt, content, featuredImage, category, published } = req.body;

    // Check if blog exists
    const blog = await prisma.blog.findUnique({
      where: { id: parseInt(id) }
    });

    if (!blog) {
      res.status(404).json({ message: 'Blog not found' });
      return;
    }

    // Make sure user is the blog owner
    if (blog.authorId !== req.user.id) {
      res.status(401).json({ message: 'Not authorized to update this blog' });
      return;
    }

    const updatedBlog = await prisma.blog.update({
      where: { id: parseInt(id) },
      data: {
        title,
        excerpt,
        content,
        featuredImage,
        category,
        published
      }
    });

    res.json(updatedBlog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete blog
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if blog exists
    const blog = await prisma.blog.findUnique({
      where: { id: parseInt(id) }
    });

    if (!blog) {
      res.status(404).json({ message: 'Blog not found' });
      return;
    }

    // Make sure user is the blog owner
    if (blog.authorId !== req.user.id) {
      res.status(401).json({ message: 'Not authorized to delete this blog' });
      return;
    }

    // Delete the blog
    await prisma.blog.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Blog removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Like or unlike a blog
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const blogId = parseInt(id);

    // Check if blog exists
    const blog = await prisma.blog.findUnique({
      where: { id: blogId }
    });

    if (!blog) {
      res.status(404).json({ message: 'Blog not found' });
      return;
    }

    // Check if the user has already liked this blog
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_blogId: {
          userId,
          blogId
        }
      }
    });

    if (existingLike) {
      // User has already liked the blog, so unlike it
      await prisma.like.delete({
        where: {
          userId_blogId: {
            userId,
            blogId
          }
        }
      });
      
      res.json({ liked: false });
    } else {
      // User hasn't liked the blog yet, so add a like
      await prisma.like.create({
        data: {
          user: {
            connect: { id: userId }
          },
          blog: {
            connect: { id: blogId }
          }
        }
      });
      
      res.json({ liked: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};