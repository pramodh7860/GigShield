import { Router } from "express";
import { db } from "@workspace/db";
import { workersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "gigshield_salt").digest("hex");
}

function generateToken(workerId: number): string {
  return crypto.createHash("sha256").update(`${workerId}:${Date.now()}:gigshield_secret`).digest("hex");
}

function formatWorker(w: typeof workersTable.$inferSelect) {
  return {
    id: w.id,
    name: w.name,
    email: w.email,
    phone: w.phone,
    zone: w.zone,
    platform: w.platform,
    trustScore: w.trustScore,
    riskScore: w.riskScore,
    isActive: w.isActive,
    role: w.role,
    createdAt: w.createdAt.toISOString(),
  };
}

const tokenStore = new Map<string, number>();

router.post("/register", async (req, res) => {
  const { name, email, password, phone, zone, platform } = req.body;

  if (!name || !email || !password || !zone || !platform) {
    res.status(400).json({ error: "validation_error", message: "Missing required fields" });
    return;
  }

  const existing = await db.select().from(workersTable).where(eq(workersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "conflict", message: "Email already registered" });
    return;
  }

  const riskScore = Math.random() * 30 + 40;
  const [worker] = await db.insert(workersTable).values({
    name,
    email,
    passwordHash: hashPassword(password),
    phone: phone || null,
    zone,
    platform,
    trustScore: 100,
    riskScore,
    isActive: true,
    role: "worker",
  }).returning();

  const token = generateToken(worker.id);
  tokenStore.set(token, worker.id);

  res.status(201).json({ token, worker: formatWorker(worker) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "validation_error", message: "Email and password required" });
    return;
  }

  const [worker] = await db.select().from(workersTable).where(eq(workersTable.email, email));
  if (!worker || worker.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "unauthorized", message: "Invalid email or password" });
    return;
  }

  const token = generateToken(worker.id);
  tokenStore.set(token, worker.id);

  res.json({ token, worker: formatWorker(worker) });
});

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized", message: "No token provided" });
    return;
  }

  const token = authHeader.slice(7);
  const workerId = tokenStore.get(token);
  if (!workerId) {
    res.status(401).json({ error: "unauthorized", message: "Invalid token" });
    return;
  }

  const [worker] = await db.select().from(workersTable).where(eq(workersTable.id, workerId));
  if (!worker) {
    res.status(401).json({ error: "unauthorized", message: "Worker not found" });
    return;
  }

  res.json(formatWorker(worker));
});

export { tokenStore, formatWorker };
export default router;
