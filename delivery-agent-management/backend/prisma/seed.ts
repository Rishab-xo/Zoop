/// <reference types="node" />
import { PrismaClient, AgentStatus } from "@prisma/client";

const prisma = new PrismaClient();

const agents = [
  {
    fullName: "Arjun Sharma",
    phone: "+911234567890",
    email: "arjun.sharma@zoop.in",
    serviceArea: "Bengaluru North",
    status: AgentStatus.ACTIVE,
  },
  {
    fullName: "Priya Nair",
    phone: "+911234567891",
    email: "priya.nair@zoop.in",
    serviceArea: "Mumbai Central",
    status: AgentStatus.ACTIVE,
  },
  {
    fullName: "Ravi Kumar",
    phone: "+911234567892",
    email: "ravi.kumar@zoop.in",
    serviceArea: "Delhi South",
    status: AgentStatus.INACTIVE,
  },
  {
    fullName: "Sunita Patel",
    phone: "+911234567893",
    email: "sunita.patel@zoop.in",
    serviceArea: "Chennai East",
    status: AgentStatus.ACTIVE,
  },
  {
    fullName: "Mohan Das",
    phone: "+911234567894",
    email: "mohan.das@zoop.in",
    serviceArea: "Hyderabad West",
    status: AgentStatus.ACTIVE,
  },
  {
    fullName: "Kavita Singh",
    phone: "+911234567895",
    email: "kavita.singh@zoop.in",
    serviceArea: "Pune Metro",
    status: AgentStatus.INACTIVE,
  },
  {
    fullName: "Deepak Rao",
    phone: "+911234567896",
    email: "deepak.rao@zoop.in",
    serviceArea: "Bengaluru South",
    status: AgentStatus.ACTIVE,
  },
  {
    fullName: "Anita Verma",
    phone: "+911234567897",
    email: "anita.verma@zoop.in",
    serviceArea: "Kolkata Central",
    status: AgentStatus.ACTIVE,
  },
  {
    fullName: "Suresh Mehta",
    phone: "+911234567898",
    email: "suresh.mehta@zoop.in",
    serviceArea: "Ahmedabad North",
    status: AgentStatus.ACTIVE,
  },
  {
    fullName: "Lakshmi Iyer",
    phone: "+911234567899",
    email: "lakshmi.iyer@zoop.in",
    serviceArea: "Jaipur Central",
    status: AgentStatus.INACTIVE,
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { email: agent.email },
      update: {},
      create: agent,
    });
  }

  const count = await prisma.agent.count();
  console.log(`✅ Seeded ${count} agents successfully.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
