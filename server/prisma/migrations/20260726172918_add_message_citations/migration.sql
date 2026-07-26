/*
  Warnings:

  - The primary key for the `messages` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_notebook_id_fkey";

-- AlterTable
ALTER TABLE "messages" DROP CONSTRAINT "messages_pkey",
ADD COLUMN     "citations" JSONB,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "notebook_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "messages_notebook_id_idx" ON "messages"("notebook_id");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_notebook_id_fkey" FOREIGN KEY ("notebook_id") REFERENCES "notebooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
