import { z } from "zod";

export const CreateTaskSchema = z.object({
  description: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]) ,
  model: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export function normalizeCreateTask(input: CreateTaskInput) {
  const parsed = CreateTaskSchema.parse(input);
  const fallback = process.env.OPENAI_MODEL?.trim();
  const model = parsed.model?.trim() || fallback;
  if (!model) {
    const err: any = new Error("model is required");
    err.statusCode = 400;
    throw err;
  }
  return { ...parsed, model };
}
