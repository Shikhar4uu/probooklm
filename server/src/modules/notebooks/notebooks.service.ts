// server/src/modules/notebooks/notebooks.service.ts
import { prisma } from '../../infra/db'

// List all notebooks, newest first
export function listNotebooks() {
  return prisma.notebook.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

// Create a new notebook
export function createNotebook(title: string, icon?: string) {
  return prisma.notebook.create({
    data: { title, icon },
  })
}

// Rename (or re-icon) a notebook
export function updateNotebook(id: string, title: string, icon?: string) {
  return prisma.notebook.update({
    where: { id },
    data: { title, icon },
  })
}

// Delete a notebook (its sources + chunks auto-delete via onDelete: Cascade)
export function deleteNotebook(id: string) {
  return prisma.notebook.delete({
    where: { id },
  })
}