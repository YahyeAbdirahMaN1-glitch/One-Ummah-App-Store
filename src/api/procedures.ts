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
        shares: true,
        reposts: true,
      },
    });

    return c.json({ posts });
  }
);

// ==================== EXPORT ====================

export default {
  signUp,
  signIn,
  getUser,
  createPost,
  getPosts,
};
