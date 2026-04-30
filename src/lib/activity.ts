import { prisma } from "./prisma";

type ActivityInput = {
  action: string;
  message: string;
  userId: string;
  projectId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logActivity(input: ActivityInput) {
  try {
    await prisma.activity.create({
      data: {
        action: input.action,
        message: input.message,
        userId: input.userId,
        projectId: input.projectId ?? null,
        metadata: (input.metadata as never) ?? undefined,
      },
    });
  } catch (e) {
    // Don't fail the request if activity logging fails.
    // eslint-disable-next-line no-console
    console.error("[activity-log-failed]", e);
  }
}
