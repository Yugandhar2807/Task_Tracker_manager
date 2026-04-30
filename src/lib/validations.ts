import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const projectCreateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  description: z.string().trim().max(500).optional().nullable(),
  memberIds: z.array(z.string().min(1)).optional().default([]),
});
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

export const projectUpdateSchema = projectCreateSchema.partial();

// Accept either a date-only string ("YYYY-MM-DD") from <input type="date"> or a full ISO datetime.
// `undefined` stays `undefined` (field omitted from update), an empty string or null becomes `null` (clear it).
const flexibleDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined;
    if (v === null) return null;
    const trimmed = v.trim();
    if (trimmed === "") return null;
    return trimmed;
  })
  .refine((v) => v === undefined || v === null || !Number.isNaN(Date.parse(v)), {
    message: "Invalid date",
  });

export const taskCreateSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(160),
  description: z.string().trim().max(2000).optional().nullable(),
  projectId: z.string().min(1, "Project is required"),
  assigneeId: z.string().min(1).optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional().default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("MEDIUM"),
  dueDate: flexibleDate,
});
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  assigneeId: z.string().min(1).optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: flexibleDate,
});
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
