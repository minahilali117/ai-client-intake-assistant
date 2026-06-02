-- AlterEnum
ALTER TYPE "ActivityAction" ADD VALUE 'FILE_UPLOADED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "refresh_token_version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "inquiry_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attachments_inquiry_id_idx" ON "attachments"("inquiry_id");

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
