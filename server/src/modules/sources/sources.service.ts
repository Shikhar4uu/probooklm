import { prisma } from '../../infra/db.js'

export function listSources(notebookId: string) {
  return prisma.source.findMany({
    where: { notebookId },              // ← ISOLATION: only this notebook's sources
    orderBy: { createdAt: 'desc' },
  })
}

export function createSourceRow(data: {
  notebookId: string; type: string; title: string; originUri?: string
}) {
  return prisma.source.create({ data: { ...data, status: 'uploading' } })
}

export function deleteSource(id: string) {
  return prisma.source.delete({ where: { id } })  // chunks auto-delete via cascade
}

export function getSource(id: string) {
  return prisma.source.findUnique({ where: { id } })
}