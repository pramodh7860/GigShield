import { Router } from "express";
import { db } from "@workspace/db";
import { policiesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

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

  await db.update(policiesTable)
    .set({ status: "cancelled" })
    .where(and(eq(policiesTable.workerId, workerId), eq(policiesTable.status, "active")));

  const [policy] = await db.insert(policiesTable).values({
    workerId,
    planId: plan.id,
    planName: plan.name,
    status: "active",
    weeklyPremium: plan.weeklyPremium,
    maxPayoutPerWeek: plan.maxPayoutPerWeek,
    zone,
    startDate: new Date(),
  }).returning();

  res.status(201).json({
    ...policy,
    startDate: policy.startDate.toISOString(),
    endDate: policy.endDate?.toISOString() ?? null,
    createdAt: policy.createdAt.toISOString(),
  });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [policy] = await db.select().from(policiesTable).where(eq(policiesTable.id, id));
  if (!policy) {
    res.status(404).json({ error: "not_found", message: "Policy not found" });
    return;
  }
  res.json({
    ...policy,
    startDate: policy.startDate.toISOString(),
    endDate: policy.endDate?.toISOString() ?? null,
    createdAt: policy.createdAt.toISOString(),
  });
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [policy] = await db.update(policiesTable)
    .set({ status: "cancelled", endDate: new Date() })
    .where(eq(policiesTable.id, id))
    .returning();
  if (!policy) {
    res.status(404).json({ error: "not_found", message: "Policy not found" });
    return;
  }
  res.json({
    ...policy,
    startDate: policy.startDate.toISOString(),
    endDate: policy.endDate?.toISOString() ?? null,
    createdAt: policy.createdAt.toISOString(),
  });
});

export default router;
