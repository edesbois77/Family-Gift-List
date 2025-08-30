-- AlterTable
ALTER TABLE "Article" ADD COLUMN "summarizedAt" DATETIME;
ALTER TABLE "Article" ADD COLUMN "summaryChars" INTEGER;
ALTER TABLE "Article" ADD COLUMN "summaryModel" TEXT;
ALTER TABLE "Article" ADD COLUMN "summaryOrigin" TEXT;
