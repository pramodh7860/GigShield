import { Router } from "express";
import { db } from "@workspace/db";
import { workersTable, policiesTable, claimsTable, triggersTable } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { formatWorker, tokenStore } from "./auth";

const router = Router();

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [worker] = await db.select().from(workersTable).where(eq(workersTable.id, id));
  if (!worker) {
    res.status(404).json({ error: "not_found", message: "Worker not found" });
    return;
  }
  res.json(formatWorker(worker));
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, phone, zone, platform } = req.body;

  const updates: Partial<typeof workersTable.$inferInsert> = {};
  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (zone) updates.zone = zone;
  if (platform) updates.platform = platform;
  updates.updatedAt = new Date();

  const [worker] = await db.update(workersTable).set(updates).where(eq(workersTable.id, id)).returning();
  if (!worker) {
    res.status(404).json({ error: "not_found", message: "Worker not found" });
    return;
  }
  res.json(formatWorker(worker));
});

router.get("/:workerId/policies", async (req, res) => {
  const workerId = parseInt(req.params.workerId);
  const policies = await db.select().from(policiesTable)
    .where(eq(policiesTable.workerId, workerId))
    .orderBy(desc(policiesTable.createdAt));

  res.json({
    policies: policies.map(p => ({
      ...p,
      startDate: p.startDate.toISOString(),
      endDate: p.endDate?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    }))
  });
});

router.get("/:id/dashboard", async (req, res) => {
  const id = parseInt(req.params.id);
  const [worker] = await db.select().from(workersTable).where(eq(workersTable.id, id));
  if (!worker) {
    res.status(404).json({ error: "not_found", message: "Worker not found" });
    return;
  }

  const [activePolicy] = await db.select().from(policiesTable)
    .where(and(eq(policiesTable.workerId, id), eq(policiesTable.status, "active")))
    .limit(1);

  const recentClaims = await db.select().from(claimsTable)
    .where(eq(claimsTable.workerId, id))
    .orderBy(desc(claimsTable.createdAt))
    .limit(10);

  const allClaims = await db.select().from(claimsTable).where(eq(claimsTable.workerId, id));
  const totalPaid = allClaims
    .filter(c => c.status === "paid")
    .reduce((sum, c) => sum + c.amount, 0);

  const recentTriggers = await db.select().from(triggersTable)
    .where(eq(triggersTable.zone, worker.zone))
    .orderBy(desc(triggersTable.createdAt))
    .limit(5);

  res.json({
    worker: formatWorker(worker),
    activePolicy: activePolicy ? {
      ...activePolicy,
      startDate: activePolicy.startDate.toISOString(),
      endDate: activePolicy.endDate?.toISOString() ?? null,
      createdAt: activePolicy.createdAt.toISOString(),
    } : null,
    recentClaims: recentClaims.map(c => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      paidAt: c.paidAt?.toISOString() ?? null,
    })),
    totalEarningsProtected: activePolicy ? activePolicy.maxPayoutPerWeek * 4 : 0,
    totalClaims: allClaims.length,
    totalPaid,
    recentTriggers: recentTriggers.map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
    coverageStatus: activePolicy ? "active" : "inactive",
  });
});

export default router;
