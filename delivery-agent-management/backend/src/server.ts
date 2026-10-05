import "dotenv/config";
import app from "./app";
import prisma from "./services/prisma";

const PORT = parseInt(process.env.PORT || "3001", 10);

async function start() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`   Agents: http://localhost:${PORT}/api/agents`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
