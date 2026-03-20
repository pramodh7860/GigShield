import { Router } from "express";
import {
  claimsCollection,
  getNextId,
  policiesCollection,
  sanitizeMongoDoc,
  toIso,
  triggersCollection,
  workersCollection,
} from "../lib/mongo";

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

  const filter = zone ? { zone } : {};
  const triggers = await triggersCollection()
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  res.json({
    triggers: triggers.map((t: any) => ({
      ...sanitizeMongoDoc(t as Record<string, unknown>),
      createdAt: toIso((t as any).createdAt),
    }))
  });
});

router.post("/", async (req, res) => {
  const { type, zone, description, severity, rainfallMm, temperatureCelsius, orderDropPercent } = req.body;

  if (!type || !zone || !description || !severity) {
    res.status(400).json({ error: "validation_error", message: "Missing required fields" });
    return;
  }

  const activePolicies = await policiesCollection()
    .find({ zone, status: "active" })
    .toArray();

  const workerIds = Array.from(new Set(activePolicies.map((policy: any) => policy.workerId)));
  const workers = await workersCollection().find({ id: { $in: workerIds } }).toArray();
  const workersById = new Map<number, any>(workers.map((w: any) => [w.id, w]));

  const payoutFraction = PAYOUT_BY_SEVERITY[severity] ?? 0.5;
  let totalPayout = 0;
  const createdClaims: Array<Record<string, unknown>> = [];

  for (const policy of activePolicies as any[]) {
    const worker = workersById.get(policy.workerId);
    if (!worker) {
      continue;
    }

    const amount = Math.round(policy.maxPayoutPerWeek * payoutFraction * 100) / 100;
    const fraudScore = Math.random() * 20;

    createdClaims.push({
      workerId: worker.id,
      policyId: policy.id,
      amount,
      status: "approved",
      triggerType: type,
      triggerDescription: description,
      zone,
      fraudScore,
    });

    totalPayout += amount;
  }

  const trigger = {
    id: await getNextId("triggers"),
    type,
    zone,
    description,
    severity,
    rainfallMm: rainfallMm ?? null,
    temperatureCelsius: temperatureCelsius ?? null,
    orderDropPercent: orderDropPercent ?? null,
    affectedWorkers: createdClaims.length,
    totalPayout,
    createdAt: new Date(),
  };

  await triggersCollection().insertOne(trigger);

  if (createdClaims.length > 0) {
    const paidAt = new Date();
    const claimsToInsert = await Promise.all(createdClaims.map(async (claim) => ({
      ...claim,
      id: await getNextId("claims"),
      triggerId: trigger.id,
      status: "paid",
      notes: null,
      createdAt: paidAt,
      paidAt,
    })));
    await claimsCollection().insertMany(claimsToInsert);
  }

  res.status(201).json({
    trigger: {
      ...sanitizeMongoDoc(trigger as Record<string, unknown>),
      createdAt: toIso(trigger.createdAt),
    },
    claimsCreated: createdClaims.length,
    totalPayout,
  });
});

export default router;
