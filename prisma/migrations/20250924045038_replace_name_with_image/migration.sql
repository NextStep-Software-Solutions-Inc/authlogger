/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."AuthEvent" ALTER COLUMN "timeStamp" SET DEFAULT (extract(epoch from now()) * 1000)::bigint;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "name",
ADD COLUMN     "image" TEXT;
