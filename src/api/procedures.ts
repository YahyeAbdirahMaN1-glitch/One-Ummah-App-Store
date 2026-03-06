import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { generateId } from "../lib/utils";

export const router = new Hono();

// ==================== AUTH PROCEDURES ====================

// Sign Up
export const signUp = router.post(
  "/signUp",
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string(),
      gender: z.enum(["male", "female"]),
    })
  ),
  async (c) => {
    const { email, password, name, gender } = c.req.valid("json");

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return c.json({ error: "Email already exists" }, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        id: generateId(),
        email,
        password: hashedPassword,
        name,
        gender,
      },
    });

    return c.json({ userId: user.id });
  }
);

// Sign In
export const signIn = router.post(
  "/signIn",
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
      password: z.string(),
    })
  ),
  async (c) => {
    const { email, password } = c.req.valid("json");

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Update last seen
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastSeen: new Date(),
        isOnline: true 
      },
    });

    return c.json({ userId: user.id, user });
  }
);

// Get User
export const getUser = router.post(
  "/getUser",
  zValidator(
    "json",
    z.object({
      userId: z.string(),
    })
  ),
  async (c) => {
    const { userId } = c.req.valid("json");

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ user });
  }
);

// Update Profile
export const updateProfile = router.post(
  "/updateProfile",
  zValidator(
    "json",
    z.object({
      userId: z.string(),
      name: z.string().optional(),
      bio: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      profilePicture: z.string().nullable().optional(),
      gender: z.enum(["male", "female"]).optional(),
    })
  ),
  async (c) => {
    const { userId, name, bio, city, country, profilePicture, gender } = c.req.valid("json");

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(profilePicture !== undefined && { profilePicture }),
        ...(gender !== undefined && { gender }),
      },
    });

    return c.json({ user: updatedUser });
  }
);

// ==================== POST PROCEDURES ====================

// Create Post
export const createPost = router.post(
  "/createPost",
  zValidator(
    "json",
    z.object({
      userId: z.string(),
      content: z.string(),
      imageUrls: z.string().optional(),
      videoUrls: z.string().optional(),
      videoType: z.string().optional(),
    })
  ),
  async (c) => {
    const { userId, content, imageUrls, videoUrls, videoType } = c.req.valid("json");

    const post = await prisma.post.create({
      data: {
        id: generateId(),
        userId,
        content: content || "",
        imageUrls: imageUrls || "[]",
        videoUrls: videoUrls || null,
        videoType: videoType || null,
      },
      include: {
        user: true,
        comments: true,
        likes: true,
      },
    });

    return c.json({ post });
  }
);

// Get Posts (Feed)
export const getPosts = router.post(
  "/getPosts",
  zValidator(
    "json",
    z.object({
      userId: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    })
  ),
  async (c) => {
    const { limit = 20, offset = 0 } = c.req.valid("json");

    const posts = await prisma.post.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        comments: {
          include: {
            user: true,
          },
        },
        likes: true,
        dislikes: true,
        shares: true,
        reposts: true,
        views: true,
      },
    });

    // Calculate counts
    const postsWithCounts = posts.map(post => ({
      ...post,
      likesCount: post.likes.length,
      dislikesCount: post.dislikes.length,
      sharesCount: post.shares.length,
      repostsCount: post.reposts.length,
      viewsCount: post.views.length,
      commentsCount: post.comments.length,
    }));

    return c.json({ posts: postsWithCounts });
  }
);

// Track Post View
export const trackPostView = router.post(
  "/trackPostView",
  zValidator(
    "json",
    z.object({
      postId: z.string(),
      userId: z.string().optional(),
    })
  ),
  async (c) => {
    const { postId, userId } = c.req.valid("json");

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    // Check if user already viewed this post (prevent duplicate views)
    if (userId) {
      const existingView = await prisma.view.findFirst({
        where: {
          postId,
          userId,
        },
      });

      if (existingView) {
        return c.json({ message: "Already viewed" });
      }
    }

    // Create view record
    await prisma.view.create({
      data: {
        id: generateId(),
        postId,
        userId: userId || null,
      },
    });

    return c.json({ success: true });
  }
);

// Create Comment
export const createComment = router.post(
  "/createComment",
  zValidator(
    "json",
    z.object({
      postId: z.string(),
      userId: z.string(),
      content: z.string(),
    })
  ),
  async (c) => {
    const { postId, userId, content } = c.req.valid("json");

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        id: generateId(),
        postId,
        userId,
        content,
      },
      include: {
        user: true,
      },
    });

    return c.json({ comment });
  }
);

// Get Comments for Post
export const getComments = router.post(
  "/getComments",
  zValidator(
    "json",
    z.object({
      postId: z.string(),
    })
  ),
  async (c) => {
    const { postId } = c.req.valid("json");

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        user: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return c.json({ comments });
  }
);

// ==================== MESSAGE PROCEDURES ====================

// Get Unread Messages Count
export const getUnreadMessagesCount = router.post(
  "/getUnreadMessagesCount",
  zValidator(
    "json",
    z.object({
      userId: z.string(),
    })
  ),
  async (c) => {
    const { userId } = c.req.valid("json");

    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        read: false,
      },
    });

    return c.json({ count });
  }
);

// Get Recent Messages
export const getRecentMessages = router.post(
  "/getRecentMessages",
  zValidator(
    "json",
    z.object({
      userId: z.string(),
      lastChecked: z.string().optional(), // ISO timestamp
    })
  ),
  async (c) => {
    const { userId, lastChecked } = c.req.valid("json");

    const messages = await prisma.message.findMany({
      where: {
        receiverId: userId,
        ...(lastChecked && {
          createdAt: {
            gt: new Date(lastChecked),
          },
        }),
      },
      include: {
        sender: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return c.json({ messages });
  }
);

// ==================== EXPORT ====================

export default {
  signUp,
  signIn,
  getUser,
  updateProfile,
  createPost,
  getPosts,
  trackPostView,
  createComment,
  getComments,
  getUnreadMessagesCount,
  getRecentMessages,
};
