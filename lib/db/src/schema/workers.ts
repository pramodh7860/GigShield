import { pgTable, serial, text, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workersTable = pgTable("workers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone"),
  zone: text("zone").notNull(),
  platform: text("platform").notNull(),
  trustScore: real("trust_score").notNull().default(100),
  riskScore: real("risk_score").notNull().default(50),
  isActive: boolean("is_active").notNull().default(true),
  role: text("role").notNull().default("worker"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWorkerSchema = createInsertSchema(workersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type Worker = typeof workersTable.$inferSelect;
