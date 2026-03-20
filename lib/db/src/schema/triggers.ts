import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const triggersTable = pgTable("triggers", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  zone: text("zone").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(),
  rainfallMm: real("rainfall_mm"),
  temperatureCelsius: real("temperature_celsius"),
  orderDropPercent: real("order_drop_percent"),
  affectedWorkers: integer("affected_workers").notNull().default(0),
  totalPayout: real("total_payout").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTriggerSchema = createInsertSchema(triggersTable).omit({
  id: true,
  createdAt: true,
});

export type InsertTrigger = z.infer<typeof insertTriggerSchema>;
export type Trigger = typeof triggersTable.$inferSelect;
