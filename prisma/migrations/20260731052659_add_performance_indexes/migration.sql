-- AlterTable
ALTER TABLE "AuthEvent" ALTER COLUMN "timeStamp" SET DEFAULT (extract(epoch from now()) * 1000)::bigint;

-- CreateIndex
CREATE INDEX "AuthEvent_timeStamp_idx" ON "AuthEvent"("timeStamp" DESC);

-- CreateIndex
CREATE INDEX "AuthEvent_applicationId_timeStamp_idx" ON "AuthEvent"("applicationId", "timeStamp" DESC);

-- CreateIndex
CREATE INDEX "AuthEvent_userId_timeStamp_idx" ON "AuthEvent"("userId", "timeStamp" DESC);

-- CreateIndex
CREATE INDEX "AuthEvent_eventType_timeStamp_idx" ON "AuthEvent"("eventType", "timeStamp" DESC);

-- CreateIndex
CREATE INDEX "AuthEvent_applicationId_eventType_timeStamp_idx" ON "AuthEvent"("applicationId", "eventType", "timeStamp" DESC);

-- CreateIndex
CREATE INDEX "Log_userId_createdAt_idx" ON "Log"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "User_firstName_lastName_idx" ON "User"("firstName", "lastName");
