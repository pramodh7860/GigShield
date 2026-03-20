import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workersTable } from "./workers";
import { policiesTable } from "./policies";
import { triggersTable } from "./triggers";

export const claimsTable = pgTable("claims", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").notNull().references(() => workersTable.id),
  policyId: integer("policy_id").notNull().references(() => policiesTable.id),
  triggerId: integer("trigger_id").notNull().references(() => triggersTable.id),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("pending"),
  triggerType: text("trigger_type").notNull(),
  triggerDescription: text("trigger_description").notNull(),
  zone: text("zone").notNull(),
  fraudScore: real("fraud_score").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
});

export const insertClaimSchema = createInsertSchema(claimsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Claim = typeof claimsTable.$inferSelect;
