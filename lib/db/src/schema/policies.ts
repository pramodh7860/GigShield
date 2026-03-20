import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workersTable } from "./workers";

export const policiesTable = pgTable("policies", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").notNull().references(() => workersTable.id),
  planId: text("plan_id").notNull(),
  planName: text("plan_name").notNull(),
  status: text("status").notNull().default("active"),
  weeklyPremium: real("weekly_premium").notNull(),
  maxPayoutPerWeek: real("max_payout_per_week").notNull(),
  zone: text("zone").notNull(),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPolicySchema = createInsertSchema(policiesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertPolicy = z.infer<typeof insertPolicySchema>;
export type Policy = typeof policiesTable.$inferSelect;
