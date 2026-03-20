import { Router } from "express";
import {
  getNextId,
  parseNumericId,
  policiesCollection,
  sanitizeMongoDoc,
  toIso,
} from "../lib/mongo";

const router = Router();

const PLANS = [
  {
    id: "basic",
    name: "Basic Shield",
    description: "Essential coverage for occasional disruptions",
    weeklyPremium: 49,
    maxPayoutPerWeek: 500,
    coverageTypes: ["rain", "storm"],
    features: [
      "Rain & storm coverage",
      "Auto-payout within 2 hours",
      "Basic zone coverage",
      "Email alerts",
    ],
  },
  {
    id: "standard",
    name: "Standard Shield",
    description: "Comprehensive coverage for regular gig workers",
    weeklyPremium: 99,
    maxPayoutPerWeek: 1200,
    coverageTypes: ["rain", "heat", "storm", "flood"],
    features: [
      "All weather types covered",
      "Auto-payout within 1 hour",
      "City-wide zone coverage",
      "SMS + Email alerts",
      "Heat wave coverage",
      "Priority support",
    ],
  },
  {
    id: "premium",
    name: "Premium Shield",
    description: "Maximum protection including platform outages",
    weeklyPremium: 179,
    maxPayoutPerWeek: 2500,
    coverageTypes: ["rain", "heat", "storm", "flood", "curfew", "platform_outage"],
    features: [
      "All weather + platform coverage",
      "Instant auto-payout",
      "All-zone coverage",
      "SMS + Email + App alerts",
      "Platform outage coverage",
      "Curfew protection",
      "Dedicated support",
      "Monthly earnings report",
    ],
  },
];

router.get("/", (_req, res) => {
  res.json({ plans: PLANS });
});

router.post("/", async (req, res) => {
  const { workerId, planId, zone } = req.body;

  if (!workerId || !planId || !zone) {
    res.status(400).json({ error: "validation_error", message: "Missing required fields" });
    return;
  }

  const plan = PLANS.find(p => p.id === planId);
  if (!plan) {
    res.status(400).json({ error: "validation_error", message: "Invalid plan ID" });
    return;
  }

  const numericWorkerId = Number.parseInt(String(workerId), 10);
  if (Number.isNaN(numericWorkerId)) {
    res.status(400).json({ error: "validation_error", message: "Invalid workerId" });
    return;
  }

  await policiesCollection().updateMany(
    { workerId: numericWorkerId, status: "active" },
    { $set: { status: "cancelled" } },
  );

  const now = new Date();
  const policy = {
    id: await getNextId("policies"),
    workerId: numericWorkerId,
    planId: plan.id,
    planName: plan.name,
    status: "active",
    weeklyPremium: plan.weeklyPremium,
    maxPayoutPerWeek: plan.maxPayoutPerWeek,
    zone,
    startDate: now,
    endDate: null,
    createdAt: now,
  };

  await policiesCollection().insertOne(policy);

  res.status(201).json({
    ...sanitizeMongoDoc(policy as Record<string, unknown>),
    startDate: toIso(policy.startDate),
    endDate: policy.endDate ? toIso(policy.endDate) : null,
    createdAt: toIso(policy.createdAt),
  });
});

router.get("/:id", async (req, res) => {
  const id = parseNumericId(req.params.id);
  const policy = await policiesCollection().findOne({ id });
  if (!policy) {
    res.status(404).json({ error: "not_found", message: "Policy not found" });
    return;
  }
  res.json({
    ...sanitizeMongoDoc(policy as Record<string, unknown>),
    startDate: toIso((policy as any).startDate),
    endDate: (policy as any).endDate ? toIso((policy as any).endDate) : null,
    createdAt: toIso((policy as any).createdAt),
  });
});

router.delete("/:id", async (req, res) => {
  const id = parseNumericId(req.params.id);
  const result = await policiesCollection().findOneAndUpdate(
    { id },
    { $set: { status: "cancelled", endDate: new Date() } },
    { returnDocument: "after" },
  );

  const policy = (result as any)?.value ?? result;
  if (!policy) {
    res.status(404).json({ error: "not_found", message: "Policy not found" });
    return;
  }
  res.json({
    ...sanitizeMongoDoc(policy as Record<string, unknown>),
    startDate: toIso((policy as any).startDate),
    endDate: (policy as any).endDate ? toIso((policy as any).endDate) : null,
    createdAt: toIso((policy as any).createdAt),
  });
});

export default router;
