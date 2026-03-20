import { Router } from "express";
import Stripe from "stripe";
import {
  getNextId,
  policiesCollection,
  sanitizeMongoDoc,
  toIso,
  workersCollection,
} from "../lib/mongo";

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

  const numericWorkerId = Number.parseInt(String(workerId), 10);
  if (Number.isNaN(numericWorkerId)) {
    res.status(400).json({ error: "validation_error", message: "Invalid workerId" });
    return;
  }

  const worker = await workersCollection().findOne({ id: numericWorkerId });
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
      workerId: String(numericWorkerId),
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

  const numericWorkerId = parseInt(workerId, 10);

  await policiesCollection().updateMany(
    { workerId: numericWorkerId, status: "active" },
    { $set: { status: "cancelled" } },
  );

  const now = new Date();
  const policy = {
    id: await getNextId("policies"),
    workerId: numericWorkerId,
    planId,
    planName,
    status: "active",
    weeklyPremium: plan.weeklyPremium,
    maxPayoutPerWeek: plan.maxPayoutPerWeek,
    zone,
    startDate: now,
    endDate: null,
    createdAt: now,
  };

  await policiesCollection().insertOne(policy);

  res.json({
    policy: {
      ...sanitizeMongoDoc(policy as Record<string, unknown>),
      startDate: toIso(policy.startDate),
      endDate: policy.endDate ? toIso(policy.endDate) : null,
      createdAt: toIso(policy.createdAt),
    },
    paymentIntentId,
  });
});

export default router;
