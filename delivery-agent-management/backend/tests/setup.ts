import "dotenv/config";
import app from "../src/app";

// Ensure test environment
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://dam_user:dam_password@localhost:5432/dam_db";
process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export { app };
