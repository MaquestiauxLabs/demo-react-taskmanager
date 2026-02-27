import type { PrismaClient } from "../generated/client";

type CommentSeed = {
  content: string;
  creatorEmail: string;
  taskTitle?: string;
  projectTitle?: string;
};

const COMMENTS: CommentSeed[] = [
  {
    content: "Started working on this task. Will provide updates soon.",
    creatorEmail: "admin@taskmanager.local",
    taskTitle: "Platform launch",
  },
  {
    content: "Reviewed the initial design. Looks good overall.",
    creatorEmail: "jane.doe@taskmanager.local",
    projectTitle: "Platform launch",
  },
  {
    content: "Added some additional notes for the team.",
    creatorEmail: "john.smith@taskmanager.local",
    projectTitle: "Platform launch",
  },
];

function toLookupKey(value: string) {
  return value.trim().toLowerCase();
}

export async function seedComments(prisma: PrismaClient) {
  await prisma.comment.deleteMany();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
    },
  });

  const tasks = await prisma.task.findMany({
    select: {
      id: true,
      title: true,
    },
  });

  const projects = await prisma.project.findMany({
    select: {
      id: true,
      title: true,
    },
  });

  const userIdByEmail = new Map(users.map((user) => [user.email, user.id]));
  const taskIdByTitle = new Map(
    tasks.map((task) => [toLookupKey(task.title), task.id]),
  );
  const projectIdByTitle = new Map(
    projects.map((project) => [toLookupKey(project.title), project.id]),
  );

  for (const comment of COMMENTS) {
    const creatorId = userIdByEmail.get(comment.creatorEmail);

    if (!creatorId) {
      throw new Error(
        `Cannot seed comment: user "${comment.creatorEmail}" not found.`,
      );
    }

    const created = await prisma.comment.create({
      data: {
        content: comment.content,
        creatorId,
      },
    });

    if (comment.taskTitle) {
      const taskId = taskIdByTitle.get(toLookupKey(comment.taskTitle));

      if (!taskId) {
        throw new Error(
          `Cannot seed comment: task "${comment.taskTitle}" not found.`,
        );
      }

      await prisma.commentTask.create({
        data: {
          commentId: created.id,
          taskId,
        },
      });
    }

    if (comment.projectTitle) {
      const projectId = projectIdByTitle.get(toLookupKey(comment.projectTitle));

      if (!projectId) {
        throw new Error(
          `Cannot seed comment: project "${comment.projectTitle}" not found.`,
        );
      }

      await prisma.commentProject.create({
        data: {
          commentId: created.id,
          projectId,
        },
      });
    }
  }
}
