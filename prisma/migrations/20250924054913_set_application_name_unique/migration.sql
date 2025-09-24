/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Application` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."AuthEvent" ALTER COLUMN "timeStamp" SET DEFAULT (extract(epoch from now()) * 1000)::bigint;

-- CreateIndex
CREATE UNIQUE INDEX "Application_name_key" ON "public"."Application"("name");
