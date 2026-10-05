import { Request, Response, NextFunction } from "express";
import * as agentService from "../services/agent.service";
import type { CreateAgentInput, UpdateAgentInput, ListAgentsQuery } from "../schemas/agent.schema";

// In Express v5, params values can be string | string[]; after validation they are strings
function paramId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

export async function listAgents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = req.query as unknown as ListAgentsQuery;
    const { data, hit } = await agentService.listAgents(query);
    res.setHeader("X-Cache", hit ? "HIT" : "MISS");
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

export async function getAgent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { data, hit } = await agentService.getAgent(paramId(req));
    res.setHeader("X-Cache", hit ? "HIT" : "MISS");
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

export async function createAgent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = req.body as CreateAgentInput;
    const agent = await agentService.createAgent(input);
    res.status(201).json(agent);
  } catch (err) {
    next(err);
  }
}

export async function updateAgent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = req.body as UpdateAgentInput;
    const agent = await agentService.updateAgent(paramId(req), input);
    res.status(200).json(agent);
  } catch (err) {
    next(err);
  }
}

export async function deleteAgent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await agentService.deleteAgent(paramId(req));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
