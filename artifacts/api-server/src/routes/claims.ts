import { Router } from "express";
import { db } from "@workspace/db";
import { claimsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

function formatClaim(c: typeof claimsTable.$inferSelect) {
  return {
    ...c,
    createdAt: c.createdAt.toISOString(),
    paidAt: c.paidAt?.toISOString() ?? null,
  };
}

router.get("/", async (req, res) => {
  const workerId = req.query.workerId ? parseInt(req.query.workerId as string) : undefined;
  const status = req.query.status as string | undefined;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const conditions = [];
  if (workerId) conditions.push(eq(claimsTable.workerId, workerId));
  if (status) conditions.push(eq(claimsTable.status, status));

  const query = db.select().from(claimsTable)
    .orderBy(desc(claimsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const claims = conditions.length > 0
    ? await query.where(and(...conditions))
    : await query;

  const allQuery = db.select().from(claimsTable);
  const all = conditions.length > 0
    ? await allQuery.where(and(...conditions))
    : await allQuery;

  res.json({ claims: claims.map(formatClaim), total: all.length });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [claim] = await db.select().from(claimsTable).where(eq(claimsTable.id, id));
  if (!claim) {
    res.status(404).json({ error: "not_found", message: "Claim not found" });
    return;
  }
  res.json(formatClaim(claim));
});

export default router;
