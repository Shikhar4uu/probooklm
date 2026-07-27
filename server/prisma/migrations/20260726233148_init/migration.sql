-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "citations" JSONB;

-- CreateIndex
CREATE INDEX "messages_notebook_id_idx" ON "messages"("notebook_id");
