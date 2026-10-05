import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validate(schema: ZodSchema, target: "body" | "query" | "params" = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const issues = (result.error as ZodError).issues;
      const details = issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: details[0]?.message ?? "Validation failed",
          details,
        },
      });
      return;
    }
    // Replace the target with the parsed/coerced values (supports Express 5 query getter)
    Object.defineProperty(req, target, {
      value: result.data,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    next();
  };
}
