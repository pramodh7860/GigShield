import { Router } from "express";
import { db } from "@workspace/db";
import { workersTable, policiesTable, claimsTable, triggersTable } from "@workspace/db/schema";
import { eq, desc, ilike, count, sql } from "drizzle-orm";
import { formatWorker } from "./auth";

const router = Router();

router.get("/workers", async (req, res) => {
  const search = req.query.search as string | undefined;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  let workers = await db.select().from(workersTable)
    .orderBy(desc(workersTable.createdAt))
    .limit(limit)
    .offset(offset);

  if (search) {
    workers = workers.filter(w =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.email.toLowerCase().includes(search.toLowerCase())
    );
  }

  const allWorkers = search
    ? (await db.select().from(workersTable)).filter(w =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.email.toLowerCase().includes(search.toLowerCase())
    )
    : await db.select().from(workersTable);

  const workerData = await Promise.all(workers.map(async (w) => {
    const [activePolicy] = await db.select().from(policiesTable)
      .where(eq(policiesTable.workerId, w.id))
      .limit(1);
    const allClaims = await db.select().from(claimsTable).where(eq(claimsTable.workerId, w.id));
    const totalPaid = allClaims.filter(c => c.status === "paid").reduce((s, c) => s + c.amount, 0);

    return {
      ...formatWorker(w),
      activePolicyId: activePolicy?.id ?? null,
      totalClaims: allClaims.length,
      totalPaid,
    };
  }));

  res.json({ workers: workerData, total: allWorkers.length });
});

router.get("/claims", async (req, res) => {
  const status = req.query.status as string | undefined;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  let claims = await db.select({
    claim: claimsTable,
    worker: workersTable,
  })
    .from(claimsTable)
    .innerJoin(workersTable, eq(claimsTable.workerId, workersTable.id))
    .orderBy(desc(claimsTable.createdAt))
    .limit(limit)
    .offset(offset);

  if (status) {
    claims = claims.filter(({ claim }) => claim.status === status);
  }

  const all = await db.select().from(claimsTable);

  res.json({
    claims: claims.map(({ claim, worker }) => ({
      ...claim,
      createdAt: claim.createdAt.toISOString(),
      paidAt: claim.paidAt?.toISOString() ?? null,
      workerName: worker.name,
      workerEmail: worker.email,
      fraudScore: claim.fraudScore,
    })),
    total: all.length,
  });
});

router.patch("/claims/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, notes } = req.body;

  const updates: Partial<typeof claimsTable.$inferInsert> = { status };
  if (notes) updates.notes = notes;
  if (status === "paid") updates.paidAt = new Date();

  const [claim] = await db.update(claimsTable).set(updates).where(eq(claimsTable.id, id)).returning();
  if (!claim) {
    res.status(404).json({ error: "not_found", message: "Claim not found" });
    return;
  }

  const [worker] = await db.select().from(workersTable).where(eq(workersTable.id, claim.workerId));

  res.json({
    ...claim,
    createdAt: claim.createdAt.toISOString(),
    paidAt: claim.paidAt?.toISOString() ?? null,
    workerName: worker?.name ?? "Unknown",
    workerEmail: worker?.email ?? "Unknown",
    fraudScore: claim.fraudScore,
  });
});

router.get("/overview", async (req, res) => {
  const allWorkers = await db.select().from(workersTable);
  const allPolicies = await db.select().from(policiesTable);
  const allClaims = await db.select().from(claimsTable);
  const allTriggers = await db.select().from(triggersTable);

  const activeWorkers = allWorkers.filter(w => w.isActive).length;
  const activePolicies = allPolicies.filter(p => p.status === "active").length;
  const pendingClaims = allClaims.filter(c => c.status === "pending").length;
  const totalPayouts = allClaims.filter(c => c.status === "paid").reduce((s, c) => s + c.amount, 0);

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyPayouts = allClaims
    .filter(c => c.status === "paid" && c.paidAt && c.paidAt > oneWeekAgo)
    .reduce((s, c) => s + c.amount, 0);

  const fraudAlerts = allClaims.filter(c => c.fraudScore > 70).length;

  const zoneMap = new Map<string, { count: number; payout: number }>();
  for (const trigger of allTriggers) {
    const existing = zoneMap.get(trigger.zone) ?? { count: 0, payout: 0 };
    zoneMap.set(trigger.zone, {
      count: existing.count + 1,
      payout: existing.payout + trigger.totalPayout,
    });
  }

  const triggersByZone = Array.from(zoneMap.entries()).map(([zone, data]) => ({
    zone,
    count: data.count,
    payout: data.payout,
  }));

  const recentActivity = [
    ...allClaims.slice(-5).map(c => ({
      type: "claim",
      description: `Claim #${c.id} ${c.status} - ₹${c.amount}`,
      timestamp: c.createdAt.toISOString(),
    })),
    ...allTriggers.slice(-5).map(t => ({
      type: "trigger",
      description: `${t.type} trigger in ${t.zone} - ${t.affectedWorkers} affected`,
      timestamp: t.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

  res.json({
    totalWorkers: allWorkers.length,
    activeWorkers,
    activePolicies,
    totalClaims: allClaims.length,
    pendingClaims,
    totalPayouts,
    weeklyPayouts,
    fraudAlerts,
    triggersByZone,
    recentActivity,
  });
});

router.get("/triggers", async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const triggers = await db.select().from(triggersTable)
    .orderBy(desc(triggersTable.createdAt))
    .limit(limit)
    .offset(offset);

  const all = await db.select().from(triggersTable);

  res.json({
    triggers: triggers.map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
    total: all.length,
  });
});

export default router;
