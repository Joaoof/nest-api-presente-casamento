-- CreateIndex
CREATE INDEX "gifts_status_idx" ON "gifts"("status");

-- CreateIndex
CREATE INDEX "gifts_createdAt_idx" ON "gifts"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "gifts_name_idx" ON "gifts"("name" ASC);

-- CreateIndex
CREATE INDEX "gifts_status_createdAt_idx" ON "gifts"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_gifts_name_asc" ON "gifts"("name");
