import { Router } from "express";
import { formatWorker } from "./auth";
import {
  claimsCollection,
  parseNumericId,
  policiesCollection,
  sanitizeMongoDoc,
  toIso,
  triggersCollection,
  workersCollection,
} from "../lib/mongo";

const router = Router();

router.get("/workers", async (req, res) => {
  const search = req.query.search as string | undefined;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const filter = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const workers = await workersCollection()
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .toArray();

  const allWorkersCount = await workersCollection().countDocuments(filter);

  const workerData = await Promise.all(workers.map(async (w: any) => {
    const activePolicy = await policiesCollection().findOne({
      workerId: (w as any).id,
      status: "active",
    });
    const allClaims = await claimsCollection().find({ workerId: (w as any).id }).toArray();
    const totalPaid = allClaims
      .filter((c: any) => c.status === "paid")
      .reduce((s: number, c: any) => s + c.amount, 0);

    return {
      ...formatWorker(w),
      activePolicyId: activePolicy?.id ?? null,
      totalClaims: allClaims.length,
      totalPaid,
    };
  }));

  res.json({ workers: workerData, total: allWorkersCount });
});

router.get("/claims", async (req, res) => {
  const status = req.query.status as string | undefined;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const filter = status ? { status } : {};

  const claims = await claimsCollection()
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .toArray();

  const total = await claimsCollection().countDocuments(filter);
  const workerIds = Array.from(new Set(claims.map((claim: any) => claim.workerId)));
  const workers = await workersCollection().find({ id: { $in: workerIds } }).toArray();
  const workersById = new Map<number, any>(workers.map((worker: any) => [worker.id, worker]));

  res.json({
    claims: claims.map((claim: any) => ({
      ...sanitizeMongoDoc(claim as Record<string, unknown>),
      createdAt: toIso(claim.createdAt),
      paidAt: claim.paidAt ? toIso(claim.paidAt) : null,
      workerName: workersById.get(claim.workerId)?.name ?? "Unknown",
      workerEmail: workersById.get(claim.workerId)?.email ?? "Unknown",
      fraudScore: claim.fraudScore,
    })),
    total,
  });
});

router.patch("/claims/:id", async (req, res) => {
  const id = parseNumericId(req.params.id);
  const { status, notes } = req.body;

  const updates: Record<string, unknown> = { status };
  if (notes) updates.notes = notes;
  if (status === "paid") updates.paidAt = new Date();

  const result = await claimsCollection().findOneAndUpdate(
    { id },
    { $set: updates },
    { returnDocument: "after" },
  );

  const claim = (result as any)?.value ?? result;
  if (!claim) {
    res.status(404).json({ error: "not_found", message: "Claim not found" });
    return;
  }

  const worker = await workersCollection().findOne({ id: (claim as any).workerId });

  res.json({
    ...sanitizeMongoDoc(claim as Record<string, unknown>),
    createdAt: toIso((claim as any).createdAt),
    paidAt: (claim as any).paidAt ? toIso((claim as any).paidAt) : null,
    workerName: worker?.name ?? "Unknown",
    workerEmail: worker?.email ?? "Unknown",
    fraudScore: (claim as any).fraudScore,
  });
});

router.get("/overview", async (req, res) => {
  const allWorkers = await workersCollection().find({}).toArray();
  const allPolicies = await policiesCollection().find({}).toArray();
  const allClaims = await claimsCollection().find({}).toArray();
  const allTriggers = await triggersCollection().find({}).toArray();

  const activeWorkers = allWorkers.filter((w: any) => w.isActive).length;
  const activePolicies = allPolicies.filter((p: any) => p.status === "active").length;
  const pendingClaims = allClaims.filter((c: any) => c.status === "pending").length;
  const totalPayouts = allClaims
    .filter((c: any) => c.status === "paid")
    .reduce((s: number, c: any) => s + c.amount, 0);

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyPayouts = allClaims
    .filter((c: any) => c.status === "paid" && c.paidAt && c.paidAt > oneWeekAgo)
    .reduce((s: number, c: any) => s + c.amount, 0);

  const fraudAlerts = allClaims.filter((c: any) => c.fraudScore > 70).length;

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
    ...allClaims
      .slice()
      .sort((a: any, b: any) => new Date(String((b as any).createdAt)).getTime() - new Date(String((a as any).createdAt)).getTime())
      .slice(0, 5)
      .map((c: any) => ({
      type: "claim",
      description: `Claim #${c.id} ${c.status} - ₹${c.amount}`,
      timestamp: toIso((c as any).createdAt),
    })),
    ...allTriggers
      .slice()
      .sort((a: any, b: any) => new Date(String((b as any).createdAt)).getTime() - new Date(String((a as any).createdAt)).getTime())
      .slice(0, 5)
      .map((t: any) => ({
      type: "trigger",
      description: `${t.type} trigger in ${t.zone} - ${t.affectedWorkers} affected`,
      timestamp: toIso((t as any).createdAt),
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

  const triggers = await triggersCollection()
    .find({})
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .toArray();

  const total = await triggersCollection().countDocuments({});

  res.json({
    triggers: triggers.map((t: any) => ({
      ...sanitizeMongoDoc(t as Record<string, unknown>),
      createdAt: toIso((t as any).createdAt),
    })),
    total,
  });
});

export default router;
