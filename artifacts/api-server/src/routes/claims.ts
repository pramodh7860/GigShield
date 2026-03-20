import { Router } from "express";
import {
  claimsCollection,
  parseNumericId,
  sanitizeMongoDoc,
  toIso,
} from "../lib/mongo";

const router = Router();

function formatClaim(claim: Record<string, unknown>) {
  const c = sanitizeMongoDoc(claim);
  return {
    ...c,
    createdAt: toIso(c.createdAt),
    paidAt: c.paidAt ? toIso(c.paidAt) : null,
  };
}

router.get("/", async (req, res) => {
  const workerId = req.query.workerId ? parseInt(req.query.workerId as string) : undefined;
  const status = req.query.status as string | undefined;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const filter: Record<string, unknown> = {};
  if (workerId) filter.workerId = workerId;
  if (status) filter.status = status;

  const claims = await claimsCollection()
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .toArray();

  const total = await claimsCollection().countDocuments(filter);

  res.json({ claims: claims.map((c: any) => formatClaim(c as Record<string, unknown>)), total });
});

router.get("/:id", async (req, res) => {
  const id = parseNumericId(req.params.id);
  const claim = await claimsCollection().findOne({ id });
  if (!claim) {
    res.status(404).json({ error: "not_found", message: "Claim not found" });
    return;
  }
  res.json(formatClaim(claim));
});

export default router;
