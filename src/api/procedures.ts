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
      imageUrls: z.string().optional().nullable(),
      videoUrls: z.string().optional().nullable(),
      videoType: z.string().optional().nullable(),
    })
  ),
  async (c) => {
    const { userId, content, imageUrls, videoUrls, videoType } = c.req.valid("json");

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return c.json({ error: 'User not found. Please sign in again.' }, 404);
    }

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

// Get Conversations (list of people you've messaged)
export const getConversations = router.post(
  "/getConversations",
  zValidator(
    "json",
    z.object({
      userId: z.string(),
    })
  ),
  async (c) => {
    const { userId } = c.req.valid("json");

    // Get all unique conversations
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: true,
        receiver: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by conversation partner
    const conversationsMap = new Map();
    
    messages.forEach(msg => {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;
      
      if (!conversationsMap.has(partnerId)) {
        const unreadCount = messages.filter(m => 
          m.senderId === partnerId && 
          m.receiverId === userId && 
          !m.readAt
        ).length;
        
        conversationsMap.set(partnerId, {
          userId: partnerId,
          userName: partner.name || 'Anonymous',
          userImage: partner.profilePicture || null,
          isOnline: partner.isOnline || false,
          lastMessage: msg.content,
          timestamp: msg.createdAt,
          unread: unreadCount,
        });
      }
    });

    const conversations = Array.from(conversationsMap.values());
    
    return c.json({ conversations });
  }
);

// Get Chat Messages (conversation with specific user)
export const getChatMessages = router.post(
  "/getChatMessages",
  zValidator(
    "json",
    z.object({
      userId: z.string(),
      partnerId: z.string(),
    })
  ),
  async (c) => {
    const { userId, partnerId } = c.req.valid("json");

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
      include: {
        sender: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return c.json({ messages });
  }
);

// Send Message
export const sendMessage = router.post(
  "/sendMessage",
  zValidator(
    "json",
    z.object({
      senderId: z.string(),
      receiverId: z.string(),
      content: z.string(),
    })
  ),
  async (c) => {
    const { senderId, receiverId, content } = c.req.valid("json");

    const message = await prisma.message.create({
      data: {
        id: generateId(),
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    return c.json({ message });
  }
);

// Mark Messages as Read (with notification option)
export const markMessagesAsRead = router.post(
  "/markMessagesAsRead",
  zValidator(
    "json",
    z.object({
      userId: z.string(),
      partnerId: z.string(),
      withoutNotifying: z.boolean().optional(),
    })
  ),
  async (c) => {
    const { userId, partnerId, withoutNotifying = false } = c.req.valid("json");

    await prisma.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
        openedWithoutNotifying: withoutNotifying,
      },
    });

    return c.json({ success: true });
  }
);

// Update Online Status
export const updateOnlineStatus = router.post(
  "/updateOnlineStatus",
  zValidator(
    "json",
    z.object({
      userId: z.string(),
      isOnline: z.boolean(),
    })
  ),
  async (c) => {
    const { userId, isOnline } = c.req.valid("json");

    await prisma.user.update({
      where: { id: userId },
      data: {
        isOnline,
        lastSeen: new Date(),
      },
    });

    return c.json({ success: true });
  }
);

// Update Privacy Settings
export const updatePrivacySettings = router.post(
  "/updatePrivacySettings",
  zValidator(
    "json",
    z.object({
      userId: z.string(),
      readReceiptsEnabled: z.boolean(),
    })
  ),
  async (c) => {
    const { userId, readReceiptsEnabled } = c.req.valid("json");

    const user = await prisma.user.update({
      where: { id: userId },
      data: { readReceiptsEnabled },
    });

    return c.json({ success: true, user });
  }
);

// Report Issue
export const reportIssue = router.post(
  "/reportIssue",
  zValidator(
    "json",
    z.object({
      userId: z.string(),
      subject: z.string(),
      description: z.string(),
    })
  ),
  async (c) => {
    const { userId, subject, description } = c.req.valid("json");

    const issue = await prisma.issue.create({
      data: {
        id: generateId(),
        userId,
        subject,
        description,
        status: "PENDING",
      },
    });

    return c.json({ success: true, issue });
  }
);

// Update Profile Picture
export const updateProfilePicture = router.post(
  "/updateProfilePicture",
  zValidator(
    "json",
    z.object({
      userId: z.string(),
      profilePicture: z.string().nullable(), // Allow null to remove picture
    })
  ),
  async (c) => {
    const { userId, profilePicture } = c.req.valid("json");

    const user = await prisma.user.update({
      where: { id: userId },
      data: { profilePicture },
    });

    return c.json({ success: true, user });
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
  getConversations,
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
  updateOnlineStatus,
  updatePrivacySettings,
  reportIssue,
  updateProfilePicture,
};
