import { PrismaClient, Priority, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Team Task Manager…");

  // Hash a single shared password for demo accounts.
  const password = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Alex Admin",
      passwordHash: password,
      role: "ADMIN",
      avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Alex%20Admin",
    },
  });

  const members = await Promise.all(
    [
      { email: "jordan@example.com", name: "Jordan Lee" },
      { email: "sam@example.com", name: "Sam Patel" },
      { email: "riley@example.com", name: "Riley Chen" },
    ].map((m) =>
      prisma.user.upsert({
        where: { email: m.email },
        update: {},
        create: {
          ...m,
          passwordHash: password,
          role: "MEMBER",
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}`,
        },
      }),
    ),
  );

  const projectsData = [
    {
      name: "Q4 Platform Refresh",
      description: "Modernize the core platform UI and migrate to the new design system.",
      tasks: [
        { title: "Audit existing component library", status: "DONE", priority: "MEDIUM", dueOffsetDays: -2 },
        { title: "Build new design tokens", status: "IN_PROGRESS", priority: "HIGH", dueOffsetDays: 3 },
        { title: "Migrate dashboard pages", status: "TODO", priority: "HIGH", dueOffsetDays: 14 },
        { title: "Write migration playbook", status: "TODO", priority: "LOW", dueOffsetDays: 21 },
      ],
    },
    {
      name: "Mobile App MVP",
      description: "Ship the first cut of the mobile app with auth and core flows.",
      tasks: [
        { title: "Set up React Native project", status: "DONE", priority: "MEDIUM", dueOffsetDays: -5 },
        { title: "Implement login + signup", status: "DONE", priority: "HIGH", dueOffsetDays: -1 },
        { title: "Wire push notifications", status: "IN_PROGRESS", priority: "MEDIUM", dueOffsetDays: 7 },
        { title: "Submit to TestFlight", status: "TODO", priority: "HIGH", dueOffsetDays: 10 },
      ],
    },
    {
      name: "Customer Onboarding Revamp",
      description: "Reduce time-to-first-value for new customers.",
      tasks: [
        { title: "Interview 10 new customers", status: "IN_PROGRESS", priority: "HIGH", dueOffsetDays: 2 },
        { title: "Draft new onboarding flow", status: "TODO", priority: "MEDIUM", dueOffsetDays: 9 },
        { title: "A/B test welcome emails", status: "TODO", priority: "LOW", dueOffsetDays: 15 },
      ],
    },
  ] as const;

  // Wipe demo projects to keep seed idempotent
  await prisma.project.deleteMany({ where: { name: { in: projectsData.map((p) => p.name) } } });

  for (let i = 0; i < projectsData.length; i++) {
    const p = projectsData[i];
    const project = await prisma.project.create({
      data: {
        name: p.name,
        description: p.description,
        ownerId: admin.id,
        members: { connect: members.map((m) => ({ id: m.id })) },
      },
    });

    for (let j = 0; j < p.tasks.length; j++) {
      const t = p.tasks[j];
      const due = new Date();
      due.setDate(due.getDate() + t.dueOffsetDays);
      await prisma.task.create({
        data: {
          title: t.title,
          projectId: project.id,
          assigneeId: members[j % members.length].id,
          createdById: admin.id,
          status: t.status as TaskStatus,
          priority: t.priority as Priority,
          dueDate: due,
        },
      });
    }

    await prisma.activity.create({
      data: {
        action: "PROJECT_CREATED",
        message: `${admin.name} created project "${project.name}"`,
        userId: admin.id,
        projectId: project.id,
      },
    });
  }

  // A couple of recent status-change activities for the feed
  const someTask = await prisma.task.findFirst({ where: { status: "DONE" } });
  if (someTask) {
    await prisma.activity.create({
      data: {
        action: "TASK_STATUS_CHANGED",
        message: `${members[0].name} moved task "${someTask.title}" → DONE`,
        userId: members[0].id,
        projectId: someTask.projectId,
        metadata: { taskId: someTask.id, from: "IN_PROGRESS", to: "DONE" },
      },
    });
  }

  console.log("✅ Seed complete.");
  console.log("   Admin login → admin@example.com / password123");
  console.log("   Member login → jordan@example.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
