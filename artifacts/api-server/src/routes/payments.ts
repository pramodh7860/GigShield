import { Router } from "express";
import Stripe from "stripe";
import { db } from "@workspace/db";
import { policiesTable, workersTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY must be set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS: Record<string, { name: string; weeklyPremium: number; maxPayoutPerWeek: number }> = {
  basic: { name: "Basic Shield", weeklyPremium: 49, maxPayoutPerWeek: 500 },
  standard: { name: "Standard Shield", weeklyPremium: 99, maxPayoutPerWeek: 1200 },
  premium: { name: "Premium Shield", weeklyPremium: 179, maxPayoutPerWeek: 2500 },
};

router.post("/create-intent", async (req, res) => {
  const { planId, workerId, zone } = req.body;

  if (!planId || !workerId || !zone) {
    res.status(400).json({ error: "validation_error", message: "planId, workerId, and zone are required" });
    return;
  }

  const plan = PLANS[planId];
  if (!plan) {
    res.status(400).json({ error: "validation_error", message: "Invalid plan ID" });
    return;
  }

  const [worker] = await db.select().from(workersTable).where(eq(workersTable.id, workerId));
  if (!worker) {
    res.status(404).json({ error: "not_found", message: "Worker not found" });
    return;
  }

  const amountInPaise = Math.round(plan.weeklyPremium * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInPaise,
    currency: "inr",
    metadata: {
      planId,
      workerId: String(workerId),
      zone,
      planName: plan.name,
    },
    description: `GigShield ${plan.name} - Weekly Premium for ${worker.name}`,
  });

  res.json({
    clientSecret: paymentIntent.client_secret,
    amount: plan.weeklyPremium,
    planName: plan.name,
  });
});

router.post("/confirm", async (req, res) => {
  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    res.status(400).json({ error: "validation_error", message: "paymentIntentId is required" });
    return;
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    res.status(400).json({ error: "payment_failed", message: `Payment status: ${paymentIntent.status}` });
    return;
  }

  const { planId, workerId, zone, planName } = paymentIntent.metadata;
  const plan = PLANS[planId];
  if (!plan) {
    res.status(400).json({ error: "invalid_plan", message: "Plan not found in metadata" });
    return;
  }

  await db.update(policiesTable)
    .set({ status: "cancelled" })
    .where(and(eq(policiesTable.workerId, parseInt(workerId)), eq(policiesTable.status, "active")));

  const [policy] = await db.insert(policiesTable).values({
    workerId: parseInt(workerId),
    planId,
    planName,
    status: "active",
    weeklyPremium: plan.weeklyPremium,
    maxPayoutPerWeek: plan.maxPayoutPerWeek,
    zone,
    startDate: new Date(),
  }).returning();

  res.json({
    policy: {
      ...policy,
      startDate: policy.startDate.toISOString(),
      endDate: policy.endDate?.toISOString() ?? null,
      createdAt: policy.createdAt.toISOString(),
    },
    paymentIntentId,
  });
});

export default router;
