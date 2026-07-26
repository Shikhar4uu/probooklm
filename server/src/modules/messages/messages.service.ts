// server/src/modules/messages/messages.service.ts
import { prisma } from '../../infra/db.js'
import type { Prisma } from '@prisma/client'

export function listMessages(notebookId: string) {
  return prisma.message.findMany({
    where: { notebookId },          // ← isolation
    orderBy: { createdAt: 'asc' },
  })
}

export function saveMessage(data: {
  notebookId: string
  role: string
  content: string
  citations?: unknown
}) {
  return prisma.message.create({
    data: {
      notebookId: data.notebookId,
      role: data.role,
      content: data.content,
      citations: (data.citations ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  })
}