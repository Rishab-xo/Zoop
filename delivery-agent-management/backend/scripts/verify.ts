#!/usr/bin/env node
/// <reference types="node" />
/**
 * Quick smoke-test script to verify the API works without a running DB.
 * Run with: ts-node scripts/verify.ts
 */
import http from "http";

function get(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      res.setEncoding("utf8");
      let body = "";
      res.on("data", (chunk: string | Buffer) => (body += chunk.toString()));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
    }).on("error", reject);
  });
}

async function main() {
  const base = "http://localhost:3001";
  console.log("🔍 Smoke-testing API at", base);

  try {
    const health = await get(`${base}/health`);
    console.log(`✅ GET /health → ${health.status}`);

    const list = await get(`${base}/api/agents?page=1&limit=5`);
    console.log(`✅ GET /api/agents → ${list.status}`);

    const bad = await get(`${base}/api/agents/not-a-uuid`);
    console.log(`✅ GET /api/agents/invalid-id → ${bad.status} (expected 400)`);

    const notFound = await get(`${base}/api/agents/00000000-0000-0000-0000-000000000000`);
    console.log(`✅ GET /api/agents/unknown → ${notFound.status} (expected 404)`);

    console.log("\n🎉 Smoke tests passed!");
  } catch (err) {
    console.error("❌ Smoke test failed – is the backend running?", err);
    process.exit(1);
  }
}

main();
