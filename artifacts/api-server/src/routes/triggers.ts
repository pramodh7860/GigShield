import { Router } from "express";
import { db } from "@workspace/db";
import { triggersTable, claimsTable, policiesTable, workersTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

const PAYOUT_BY_SEVERITY: Record<string, number> = {
  low: 0.25,
  medium: 0.5,
  high: 0.75,
  critical: 1.0,
};

router.get("/", async (req, res) => {
  const zone = req.query.zone as string | undefined;
  const limit = parseInt(req.query.limit as string) || 20;

  const query = db.select().from(triggersTable)
    .orderBy(desc(triggersTable.createdAt))
    .limit(limit);

  const triggers = zone
    ? await query.where(eq(triggersTable.zone, zone))
    : await query;

  res.json({
    triggers: triggers.map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    }))
  });
});

router.post("/", async (req, res) => {
  const { type, zone, description, severity, rainfallMm, temperatureCelsius, orderDropPercent } = req.body;

  if (!type || !zone || !description || !severity) {
    res.status(400).json({ error: "validation_error", message: "Missing required fields" });
    return;
  }

  const activePolicies = await db.select({
    policy: policiesTable,
    worker: workersTable,
  })
    .from(policiesTable)
    .innerJoin(workersTable, eq(policiesTable.workerId, workersTable.id))
    .where(and(eq(policiesTable.zone, zone), eq(policiesTable.status, "active")));

  const payoutFraction = PAYOUT_BY_SEVERITY[severity] ?? 0.5;
  let totalPayout = 0;
  const createdClaims = [];

  for (const { policy, worker } of activePolicies) {
    const amount = Math.round(policy.maxPayoutPerWeek * payoutFraction * 100) / 100;
    const fraudScore = Math.random() * 20;

    createdClaims.push({
      workerId: worker.id,
      policyId: policy.id,
      triggerId: 0,
      amount,
      status: "approved",
      triggerType: type,
      triggerDescription: description,
      zone,
      fraudScore,
    });

    totalPayout += amount;
  }

  const [trigger] = await db.insert(triggersTable).values({
    type,
    zone,
    description,
    severity,
    rainfallMm: rainfallMm ?? null,
    temperatureCelsius: temperatureCelsius ?? null,
    orderDropPercent: orderDropPercent ?? null,
    affectedWorkers: createdClaims.length,
    totalPayout,
  }).returning();

  if (createdClaims.length > 0) {
    const claimsToInsert = createdClaims.map(c => ({ ...c, triggerId: trigger.id, paidAt: new Date() }));
    const insertedClaims = await db.insert(claimsTable).values(
      claimsToInsert.map(c => ({ ...c, status: "paid" }))
    ).returning();

    await db.update(triggersTable)
      .set({ affectedWorkers: insertedClaims.length })
      .where(eq(triggersTable.id, trigger.id));
  }

  res.status(201).json({
    trigger: { ...trigger, createdAt: trigger.createdAt.toISOString() },
    claimsCreated: createdClaims.length,
    totalPayout,
  });
});

export default router;
