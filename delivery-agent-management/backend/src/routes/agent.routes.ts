import { Router } from "express";
import * as agentController from "../controllers/agent.controller";
import { validate } from "../middleware/validate";
import {
  createAgentSchema,
  updateAgentSchema,
  agentIdSchema,
  listAgentsQuerySchema,
} from "../schemas/agent.schema";

const router = Router();

router.get("/", validate(listAgentsQuerySchema, "query"), agentController.listAgents);

router.post("/", validate(createAgentSchema), agentController.createAgent);

router.get(
  "/:id",
  validate(agentIdSchema, "params"),
  agentController.getAgent
);

router.patch(
  "/:id",
  validate(agentIdSchema, "params"),
  validate(updateAgentSchema),
  agentController.updateAgent
);

router.delete(
  "/:id",
  validate(agentIdSchema, "params"),
  agentController.deleteAgent
);

export default router;
