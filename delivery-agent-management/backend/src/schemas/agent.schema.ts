import { z } from "zod";

export const createAgentSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be at most 100 characters")
    .trim(),
  phone: z
    .string()
    .regex(
      /^\+?[1-9]\d{7,14}$/,
      "Phone must be a valid international number (e.g. +911234567890)"
    ),
  email: z
    .string()
    .email("Email is invalid")
    .max(255)
    .toLowerCase(),
  serviceArea: z
    .string()
    .min(2, "Service area must be at least 2 characters")
    .max(100, "Service area must be at most 100 characters")
    .trim(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const updateAgentSchema = createAgentSchema.partial();

export const agentIdSchema = z.object({
  id: z.string().uuid("Agent ID must be a valid UUID"),
});

export const listAgentsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive("Page must be a positive integer")
    .optional()
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100, "Limit must be at most 100")
    .optional()
    .default(10),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  q: z.string().max(100).optional(),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type ListAgentsQuery = z.infer<typeof listAgentsQuerySchema>;
