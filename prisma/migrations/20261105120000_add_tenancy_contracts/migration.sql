-- CreateTable
CREATE TABLE "TenancyContract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'AWAITING_TENANT',
    "ownerId" TEXT NOT NULL,
    "listingId" TEXT,
    "documentId" TEXT NOT NULL,
    "tenantEmail" TEXT NOT NULL,
    "tenantName" TEXT,
    "tokenHash" TEXT NOT NULL,
    "linkExpiresAt" DATETIME NOT NULL,
    "ownerSignedAt" DATETIME NOT NULL,
    "tenantSignedAt" DATETIME,
    "tenantIp" TEXT,
    "pdfSha256" TEXT,
    CONSTRAINT "TenancyContract_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TenancyContract_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TenancyContract_tokenHash_key" ON "TenancyContract"("tokenHash");
CREATE INDEX "TenancyContract_ownerId_idx" ON "TenancyContract"("ownerId");
CREATE INDEX "TenancyContract_listingId_idx" ON "TenancyContract"("listingId");
