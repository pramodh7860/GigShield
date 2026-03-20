import { db as workspaceDb } from "@workspace/db";

const db: any = workspaceDb;

export const workersCollection = () => db.collection("workers");
export const policiesCollection = () => db.collection("policies");
export const claimsCollection = () => db.collection("claims");
export const triggersCollection = () => db.collection("triggers");

function countersCollection() {
  return db.collection("counters");
}

export async function getNextId(counterName: string): Promise<number> {
  const result: any = await countersCollection().findOneAndUpdate(
    { _id: counterName },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  );

  if (typeof result?.seq === "number") {
    return result.seq;
  }

  if (typeof result?.value?.seq === "number") {
    return result.value.seq;
  }

  const fallback = await countersCollection().findOne({ _id: counterName });
  return (fallback as any)?.seq ?? 1;
}

export function parseNumericId(raw: string): number {
  return Number.parseInt(raw, 10);
}

export function toIso(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export function sanitizeMongoDoc<T extends Record<string, unknown>>(doc: T): Omit<T, "_id"> {
  const { _id, ...rest } = doc;
  void _id;
  return rest;
}
