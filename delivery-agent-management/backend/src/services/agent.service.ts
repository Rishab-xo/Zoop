import { Prisma } from "@prisma/client";
import prisma from "./prisma";
import {
  getCachedAgent,
  setCachedAgent,
  getCachedList,
  setCachedList,
  invalidateAgent,
  invalidateListOnly,
} from "../cache/helpers";
import { createError } from "../middleware/errorHandler";
import type { CreateAgentInput, UpdateAgentInput, ListAgentsQuery } from "../schemas/agent.schema";

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function isDuplicateError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

function extractDuplicateField(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const fields = err.meta?.target as string[] | undefined;
    if (fields?.includes("email")) return "email";
    if (fields?.includes("phone")) return "phone";
  }
  return "field";
}

// ────────────────────────────────────────────────────────────────────────────
// Service functions
// ────────────────────────────────────────────────────────────────────────────

export async function listAgents(
  query: ListAgentsQuery
): Promise<{ data: object; hit: boolean }> {
  const { data, hit, key } = await getCachedList(query as Record<string, unknown>);
  if (hit) return { data, hit: true };

  const { page, limit, status, q } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.AgentWhereInput = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { serviceArea: { contains: q, mode: "insensitive" } },
    ];
  }

  const [agents, total] = await Promise.all([
    prisma.agent.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.agent.count({ where }),
  ]);

  const result = {
    data: agents,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };

  await setCachedList(key, result);
  return { data: result, hit: false };
}

export async function getAgent(id: string): Promise<{ data: object; hit: boolean }> {
  const { data, hit } = await getCachedAgent(id);
  if (hit) return { data, hit: true };

  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) {
    throw createError("Agent not found", 404, "NOT_FOUND");
  }

  await setCachedAgent(id, agent);
  return { data: agent, hit: false };
}

export async function createAgent(input: CreateAgentInput): Promise<object> {
  try {
    const agent = await prisma.agent.create({ data: input });
    await invalidateListOnly();
    return agent;
  } catch (err) {
    if (isDuplicateError(err)) {
      const field = extractDuplicateField(err);
      throw createError(
        `An agent with this ${field} already exists`,
        409,
        "CONFLICT",
        [{ field, message: `Duplicate ${field}` }]
      );
    }
    throw err;
  }
}

export async function updateAgent(id: string, input: UpdateAgentInput): Promise<object> {
  // Verify agent exists first
  const existing = await prisma.agent.findUnique({ where: { id } });
  if (!existing) {
    throw createError("Agent not found", 404, "NOT_FOUND");
  }

  try {
    const agent = await prisma.agent.update({ where: { id }, data: input });
    await invalidateAgent(id);
    return agent;
  } catch (err) {
    if (isDuplicateError(err)) {
      const field = extractDuplicateField(err);
      throw createError(
        `An agent with this ${field} already exists`,
        409,
        "CONFLICT",
        [{ field, message: `Duplicate ${field}` }]
      );
    }
    throw err;
  }
}

export async function deleteAgent(id: string): Promise<void> {
  const existing = await prisma.agent.findUnique({ where: { id } });
  if (!existing) {
    throw createError("Agent not found", 404, "NOT_FOUND");
  }

  await prisma.agent.delete({ where: { id } });
  await invalidateAgent(id);
}
