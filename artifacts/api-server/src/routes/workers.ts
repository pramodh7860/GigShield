import { Router } from "express";
import { formatWorker } from "./auth";
import {
  claimsCollection,
  parseNumericId,
  policiesCollection,
  toIso,
  triggersCollection,
  workersCollection,
  sanitizeMongoDoc,
} from "../lib/mongo";

const router = Router();

router.get("/:id", async (req, res) => {
  const id = parseNumericId(req.params.id);
  const worker = await workersCollection().findOne({ id });
  if (!worker) {
    res.status(404).json({ error: "not_found", message: "Worker not found" });
    return;
  }
  res.json(formatWorker(worker));
});

router.put("/:id", async (req, res) => {
  const id = parseNumericId(req.params.id);
  const { name, phone, zone, platform } = req.body;

  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (zone) updates.zone = zone;
  if (platform) updates.platform = platform;
  updates.updatedAt = new Date();

  const result = await workersCollection().findOneAndUpdate(
    { id },
    { $set: updates },
    { returnDocument: "after" },
  );

  const worker = (result as any)?.value ?? result;
  if (!worker) {
    res.status(404).json({ error: "not_found", message: "Worker not found" });
    return;
  }
  res.json(formatWorker(worker));
});

router.get("/:workerId/policies", async (req, res) => {
  const workerId = parseNumericId(req.params.workerId);
  const policies = await policiesCollection()
    .find({ workerId })
    .sort({ createdAt: -1 })
    .toArray();

  res.json({
    policies: policies.map((p: any) => ({
      ...sanitizeMongoDoc(p as Record<string, unknown>),
      startDate: toIso((p as any).startDate),
      endDate: (p as any).endDate ? toIso((p as any).endDate) : null,
      createdAt: toIso((p as any).createdAt),
    }))
  });
});

router.get("/:id/dashboard", async (req, res) => {
  const id = parseNumericId(req.params.id);
  const worker = await workersCollection().findOne({ id });
  if (!worker) {
    res.status(404).json({ error: "not_found", message: "Worker not found" });
    return;
  }

  const activePolicy = await policiesCollection().findOne({
    workerId: id,
    status: "active",
  });

  const recentClaims = await claimsCollection()
    .find({ workerId: id })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  const allClaims = await claimsCollection().find({ workerId: id }).toArray();
  const totalPaid = allClaims
    .filter((c: any) => c.status === "paid")
    .reduce((sum: number, c: any) => sum + c.amount, 0);

  const recentTriggers = await triggersCollection()
    .find({ zone: (worker as any).zone })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();

  res.json({
    worker: formatWorker(worker),
    activePolicy: activePolicy ? {
      ...sanitizeMongoDoc(activePolicy as Record<string, unknown>),
      startDate: toIso((activePolicy as any).startDate),
      endDate: (activePolicy as any).endDate ? toIso((activePolicy as any).endDate) : null,
      createdAt: toIso((activePolicy as any).createdAt),
    } : null,
    recentClaims: recentClaims.map((c: any) => ({
      ...sanitizeMongoDoc(c as Record<string, unknown>),
      createdAt: toIso((c as any).createdAt),
      paidAt: (c as any).paidAt ? toIso((c as any).paidAt) : null,
    })),
    totalEarningsProtected: activePolicy ? (activePolicy as any).maxPayoutPerWeek * 4 : 0,
    totalClaims: allClaims.length,
    totalPaid,
    recentTriggers: recentTriggers.map((t: any) => ({
      ...sanitizeMongoDoc(t as Record<string, unknown>),
      createdAt: toIso((t as any).createdAt),
    })),
    coverageStatus: activePolicy ? "active" : "inactive",
  });
});

export default router;
