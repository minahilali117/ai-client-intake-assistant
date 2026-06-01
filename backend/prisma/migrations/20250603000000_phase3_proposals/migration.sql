-- AlterEnum
ALTER TYPE "ActivityAction" ADD VALUE 'PROPOSAL_GENERATED';
ALTER TYPE "ActivityAction" ADD VALUE 'PROPOSAL_EDITED';

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "inquiry_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "project_summary" TEXT NOT NULL,
    "suggested_features" TEXT NOT NULL,
    "technical_approach" TEXT NOT NULL,
    "estimated_complexity" TEXT NOT NULL,
    "suggested_timeline" TEXT NOT NULL,
    "questions_to_ask" TEXT NOT NULL,
    "generated_by_ai" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proposals_inquiry_id_key" ON "proposals"("inquiry_id");
CREATE INDEX "proposals_lead_id_idx" ON "proposals"("lead_id");
CREATE INDEX "proposals_deleted_at_idx" ON "proposals"("deleted_at");
CREATE INDEX "inquiries_project_type_idx" ON "inquiries"("project_type");

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
