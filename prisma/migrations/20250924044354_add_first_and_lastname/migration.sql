-- AlterTable
ALTER TABLE "public"."AuthEvent" ALTER COLUMN "timeStamp" SET DEFAULT (extract(epoch from now()) * 1000)::bigint;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT;
