import { Router } from "express";
import crypto from "crypto";
import {
  getNextId,
  toIso,
  workersCollection,
  sanitizeMongoDoc,
} from "../lib/mongo";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "gigshield_salt").digest("hex");
}

function generateToken(workerId: number): string {
  return crypto.createHash("sha256").update(`${workerId}:${Date.now()}:gigshield_secret`).digest("hex");
}

type WorkerDoc = {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  zone: string;
  platform: string;
  trustScore: number;
  riskScore: number;
  isActive: boolean;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

function formatWorker(worker: WorkerDoc) {
  const w = sanitizeMongoDoc(worker as unknown as Record<string, unknown>) as WorkerDoc;
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
    createdAt: toIso(w.createdAt),
  };
}

const tokenStore = new Map<string, number>();

router.post("/register", async (req, res) => {
  const { name, email, password, phone, zone, platform } = req.body;

  if (!name || !email || !password || !zone || !platform) {
    res.status(400).json({ error: "validation_error", message: "Missing required fields" });
    return;
  }

  const existing = await workersCollection().findOne({ email });
  if (existing) {
    res.status(409).json({ error: "conflict", message: "Email already registered" });
    return;
  }

  const riskScore = Math.random() * 30 + 40;
  const now = new Date();
  const worker: WorkerDoc = {
    id: await getNextId("workers"),
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
    createdAt: now,
    updatedAt: now,
  };

  await workersCollection().insertOne(worker);

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

  const worker = await workersCollection().findOne({ email });
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

  const worker = await workersCollection().findOne({ id: workerId });
  if (!worker) {
    res.status(401).json({ error: "unauthorized", message: "Worker not found" });
    return;
  }

  res.json(formatWorker(worker));
});

export { tokenStore, formatWorker };
export default router;
