import { MongoClient } from "mongodb";

const DEFAULT_MONGODB_URI =
  "mongodb+srv://pramodhkumar782006:pramodh786@cluster0.a0woy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

export const MONGODB_URI =
  process.env.MONGODB_URI ?? process.env.DATABASE_URL ?? DEFAULT_MONGODB_URI;
export const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? "asset-explorer";

const globalForMongo = globalThis as typeof globalThis & {
  __workspaceMongoClient?: MongoClient;
};

export const mongoClient =
  globalForMongo.__workspaceMongoClient ?? new MongoClient(MONGODB_URI);

if (!globalForMongo.__workspaceMongoClient) {
  globalForMongo.__workspaceMongoClient = mongoClient;
}

void mongoClient.connect().catch((error) => {
  console.error("MongoDB connection error:", error);
});

export const db: any = mongoClient.db(MONGODB_DB_NAME);

export * from "./types";
