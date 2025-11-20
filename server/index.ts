import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import { eq, and, desc } from "drizzle-orm";
import { db } from "./storage";
import { users, novels, chapters, readingProgress, unlockedChapters, followingNovels, coinTransactions } from "../shared/schema";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ==================== AUTH ENDPOINTS ====================

// Signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name,
        isWriter: false,
        coinBalance: 100, // Welcome bonus
      })
      .returning();

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: "User created successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: "Login successful",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user
app.get("/api/auth/me", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(userId as string)),
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user
app.patch("/api/auth/me", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { isWriter, coinBalance } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        isWriter,
        coinBalance,
        updatedAt: new Date(),
      })
      .where(eq(users.id, parseInt(userId as string)))
      .returning();

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================== NOVELS ENDPOINTS ====================

// Get all novels
app.get("/api/novels", async (req, res) => {
  try {
    const allNovels = await db.query.novels.findMany({
      orderBy: desc(novels.createdAt),
      with: {
        chapters: {
          orderBy: (chapters, { asc }) => [asc(chapters.chapterNumber)],
        },
      },
    });

    res.json({ novels: allNovels });
  } catch (error) {
    console.error("Get novels error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get novel by ID
app.get("/api/novels/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const novel = await db.query.novels.findFirst({
      where: eq(novels.id, parseInt(id)),
      with: {
        chapters: {
          orderBy: (chapters, { asc }) => [asc(chapters.chapterNumber)],
        },
      },
    });

    if (!novel) {
      return res.status(404).json({ error: "Novel not found" });
    }

    res.json({ novel });
  } catch (error) {
    console.error("Get novel error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================== CHAPTERS ENDPOINTS ====================

// Get chapter by ID
app.get("/api/chapters/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"];

    const chapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, parseInt(id)),
      with: {
        novel: true,
      },
    });

    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    // Check if chapter is unlocked for user
    if (userId && !chapter.isFree) {
      const unlocked = await db.query.unlockedChapters.findFirst({
        where: and(
          eq(unlockedChapters.userId, parseInt(userId as string)),
          eq(unlockedChapters.chapterId, chapter.id)
        ),
      });

      res.json({ chapter, isUnlocked: !!unlocked });
    } else {
      res.json({ chapter, isUnlocked: chapter.isFree });
    }
  } catch (error) {
    console.error("Get chapter error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Unlock chapter (purchase)
app.post("/api/chapters/:id/unlock", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get chapter
    const chapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, parseInt(id)),
    });

    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    // Check if already unlocked
    const alreadyUnlocked = await db.query.unlockedChapters.findFirst({
      where: and(
        eq(unlockedChapters.userId, parseInt(userId as string)),
        eq(unlockedChapters.chapterId, chapter.id)
      ),
    });

    if (alreadyUnlocked) {
      return res.status(400).json({ error: "Chapter already unlocked" });
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(userId as string)),
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has enough coins
    if (user.coinBalance < chapter.price) {
      return res.status(400).json({ error: "Insufficient coins" });
    }

    // Deduct coins
    await db
      .update(users)
      .set({
        coinBalance: user.coinBalance - chapter.price,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Unlock chapter
    await db.insert(unlockedChapters).values({
      userId: user.id,
      chapterId: chapter.id,
      novelId: chapter.novelId,
    });

    // Record transaction
    await db.insert(coinTransactions).values({
      userId: user.id,
      amount: -chapter.price,
      type: "unlock_chapter",
      description: `Unlocked chapter ${chapter.chapterNumber}: ${chapter.title}`,
      metadata: { chapterId: chapter.id, novelId: chapter.novelId },
    });

    res.json({
      message: "Chapter unlocked successfully",
      coinBalance: user.coinBalance - chapter.price,
    });
  } catch (error) {
    console.error("Unlock chapter error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================== USER DATA ENDPOINTS ====================

// Get user's unlocked chapters
app.get("/api/user/unlocked-chapters", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const unlocked = await db.query.unlockedChapters.findMany({
      where: eq(unlockedChapters.userId, parseInt(userId as string)),
    });

    res.json({ unlockedChapters: unlocked });
  } catch (error) {
    console.error("Get unlocked chapters error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user's following novels
app.get("/api/user/following", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const following = await db.query.followingNovels.findMany({
      where: eq(followingNovels.userId, parseInt(userId as string)),
      with: {
        novel: true,
      },
    });

    res.json({ following });
  } catch (error) {
    console.error("Get following novels error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Follow/Unfollow novel
app.post("/api/novels/:id/follow", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if already following
    const existing = await db.query.followingNovels.findFirst({
      where: and(
        eq(followingNovels.userId, parseInt(userId as string)),
        eq(followingNovels.novelId, parseInt(id))
      ),
    });

    if (existing) {
      // Unfollow
      await db
        .delete(followingNovels)
        .where(eq(followingNovels.id, existing.id));

      res.json({ message: "Unfollowed successfully", isFollowing: false });
    } else {
      // Follow
      await db.insert(followingNovels).values({
        userId: parseInt(userId as string),
        novelId: parseInt(id),
      });

      res.json({ message: "Followed successfully", isFollowing: true });
    }
  } catch (error) {
    console.error("Follow novel error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get reading progress
app.get("/api/user/reading-progress", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const progress = await db.query.readingProgress.findMany({
      where: eq(readingProgress.userId, parseInt(userId as string)),
      with: {
        novel: true,
        chapter: true,
      },
      orderBy: desc(readingProgress.lastReadAt),
    });

    res.json({ progress });
  } catch (error) {
    console.error("Get reading progress error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update reading progress
app.post("/api/reading-progress", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { novelId, chapterId, progress: progressValue } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if progress exists
    const existing = await db.query.readingProgress.findFirst({
      where: and(
        eq(readingProgress.userId, parseInt(userId as string)),
        eq(readingProgress.novelId, novelId),
        eq(readingProgress.chapterId, chapterId)
      ),
    });

    if (existing) {
      // Update
      await db
        .update(readingProgress)
        .set({
          progress: progressValue,
          lastReadAt: new Date(),
        })
        .where(eq(readingProgress.id, existing.id));
    } else {
      // Insert
      await db.insert(readingProgress).values({
        userId: parseInt(userId as string),
        novelId,
        chapterId,
        progress: progressValue,
      });
    }

    res.json({ message: "Progress updated successfully" });
  } catch (error) {
    console.error("Update progress error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Novea Backend API is running" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Novea Backend API running on port ${PORT}`);
  console.log(`📚 Database connected: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
});
