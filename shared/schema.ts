import { pgTable, serial, varchar, text, integer, timestamp, boolean, jsonb, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  isWriter: boolean("is_writer").default(false).notNull(),
  coinBalance: integer("coin_balance").default(100).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Novels table
export const novels = pgTable("novels", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  authorId: integer("author_id").references(() => users.id),
  genre: varchar("genre", { length: 50 }).notNull(),
  description: text("description").notNull(),
  coverUrl: varchar("cover_url", { length: 500 }),
  status: varchar("status", { length: 50 }).default("ongoing").notNull(),
  rating: integer("rating").default(0).notNull(),
  totalChapters: integer("total_chapters").default(0).notNull(),
  freeChapters: integer("free_chapters").default(5).notNull(),
  chapterPrice: integer("chapter_price").default(10).notNull(),
  totalReads: integer("total_reads").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chapters table
export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  novelId: integer("novel_id").references(() => novels.id).notNull(),
  chapterNumber: integer("chapter_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  wordCount: integer("word_count").default(0).notNull(),
  isFree: boolean("is_free").default(false).notNull(),
  price: integer("price").default(10).notNull(),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Reading Progress
export const readingProgress = pgTable("reading_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  novelId: integer("novel_id").references(() => novels.id).notNull(),
  chapterId: integer("chapter_id").references(() => chapters.id).notNull(),
  progress: integer("progress").default(0).notNull(), // percentage 0-100
  lastReadAt: timestamp("last_read_at").defaultNow().notNull(),
});

// Unlocked Chapters (purchased chapters)
export const unlockedChapters = pgTable("unlocked_chapters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  chapterId: integer("chapter_id").references(() => chapters.id).notNull(),
  novelId: integer("novel_id").references(() => novels.id).notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});

// Following Novels
export const followingNovels = pgTable("following_novels", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  novelId: integer("novel_id").references(() => novels.id).notNull(),
  followedAt: timestamp("followed_at").defaultNow().notNull(),
});

// Coin Transactions
export const coinTransactions = pgTable("coin_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(), // positive for add, negative for spend
  type: varchar("type", { length: 50 }).notNull(), // purchase, unlock_chapter, bonus
  description: text("description"),
  metadata: jsonb("metadata"), // extra info like chapter_id, package_id, etc
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Novel Views - tracks unique user views per novel
export const novelViews = pgTable("novel_views", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  novelId: integer("novel_id").references(() => novels.id).notNull(),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
}, (table) => ({
  // Ensure one view per user per novel
  uniqueUserNovel: unique().on(table.userId, table.novelId),
}));

// Novel Reviews - user reviews and ratings for novels
export const novelReviews = pgTable("novel_reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  novelId: integer("novel_id").references(() => novels.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // One review per user per novel
  uniqueUserNovelReview: unique().on(table.userId, table.novelId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  novels: many(novels),
  readingProgress: many(readingProgress),
  unlockedChapters: many(unlockedChapters),
  followingNovels: many(followingNovels),
  coinTransactions: many(coinTransactions),
  novelViews: many(novelViews),
  novelReviews: many(novelReviews),
}));

export const novelsRelations = relations(novels, ({ one, many }) => ({
  author: one(users, {
    fields: [novels.authorId],
    references: [users.id],
  }),
  chapters: many(chapters),
  readingProgress: many(readingProgress),
  followers: many(followingNovels),
  views: many(novelViews),
  reviews: many(novelReviews),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  novel: one(novels, {
    fields: [chapters.novelId],
    references: [novels.id],
  }),
  unlockedBy: many(unlockedChapters),
}));

export const novelViewsRelations = relations(novelViews, ({ one }) => ({
  user: one(users, {
    fields: [novelViews.userId],
    references: [users.id],
  }),
  novel: one(novels, {
    fields: [novelViews.novelId],
    references: [novels.id],
  }),
}));

export const novelReviewsRelations = relations(novelReviews, ({ one }) => ({
  user: one(users, {
    fields: [novelReviews.userId],
    references: [users.id],
  }),
  novel: one(novels, {
    fields: [novelReviews.novelId],
    references: [novels.id],
  }),
}));
