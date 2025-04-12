import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone").unique(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    email: true,
    password: true,
    phone: true,
    isAdmin: true,
  })
  .extend({
    password: z
      .string()
      .min(8)
      .regex(
        /^(?=.*[a-zA-Z])(?=.*\d).+$/,
        "Password must contain at least one letter and one number"
      ),
  });

// Profile schema
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  avatarId: integer("avatar_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProfileSchema = createInsertSchema(profiles).pick({
  userId: true,
  name: true,
  avatarId: true,
});

// Content schema - this will complement the external API data
export const content = pgTable("content", {
  id: serial("id").primaryKey(),
  tmdbId: integer("tmdb_id").notNull().unique(),
  type: text("type").notNull(), // movie or tv
  addedAt: timestamp("added_at").defaultNow().notNull(),
  addedBy: integer("added_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

export const insertContentSchema = createInsertSchema(content).pick({
  tmdbId: true,
  type: true,
  addedBy: true,
});

// Reviews schema
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id")
    .notNull()
    .references(() => content.id, { onDelete: "cascade" }),
  profileId: integer("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  rating: integer("rating"), // 1-5 stars
  review: text("review"),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviews)
  .pick({
    contentId: true,
    profileId: true,
    rating: true,
    review: true,
    isPublic: true,
  })
  .extend({
    rating: z.number().min(1).max(5).optional(),
  });

// My List schema
export const myList = pgTable(
  "my_list",
  {
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    contentId: integer("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey(t.profileId, t.contentId),
  })
);

export const insertMyListSchema = createInsertSchema(myList).pick({
  profileId: true,
  contentId: true,
});

// Logs schema (for admin)
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  details: text("details"),
});

export const insertLogSchema = createInsertSchema(logs).pick({
  action: true,
  userId: true,
  details: true,
});
