import { prisma } from "./prisma";

type NotificationInput = {
  userId: string;
  type:
    | "TASK_ASSIGNED"
    | "TASK_STATUS_CHANGED"
    | "TASK_REASSIGNED"
    | "PROJECT_ASSIGNED"
    | "TASK_COMMENT"
    | "TASK_DUE_SOON";
  message: string;
  taskId?: string | null;
  projectId?: string | null;
};

export async function notify(input: NotificationInput) {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        message: input.message,
        taskId: input.taskId ?? null,
        projectId: input.projectId ?? null,
      },
    });
  } catch (e) {
    // Silent fail — notifications are non-critical
    // eslint-disable-next-line no-console
    console.error("[notification-failed]", e);
  }
}

export async function notifyMany(inputs: NotificationInput[]) {
  if (inputs.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: inputs.map((i) => ({
        userId: i.userId,
        type: i.type,
        message: i.message,
        taskId: i.taskId ?? null,
        projectId: i.projectId ?? null,
      })),
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[notification-failed]", e);
  }
}
