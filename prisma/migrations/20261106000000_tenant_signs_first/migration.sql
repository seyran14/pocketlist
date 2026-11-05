-- The tenant now signs first, so a contract can exist without the owner's signature.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TenancyContract" (
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
    "ownerSignedAt" DATETIME,
    "tenantSignedAt" DATETIME,
    "tenantIp" TEXT,
    "pdfSha256" TEXT,
    CONSTRAINT "TenancyContract_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TenancyContract_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TenancyContract" ("id", "createdAt", "status", "ownerId", "listingId", "documentId", "tenantEmail", "tenantName", "tokenHash", "linkExpiresAt", "ownerSignedAt", "tenantSignedAt", "tenantIp", "pdfSha256")
SELECT "id", "createdAt", "status", "ownerId", "listingId", "documentId", "tenantEmail", "tenantName", "tokenHash", "linkExpiresAt", "ownerSignedAt", "tenantSignedAt", "tenantIp", "pdfSha256" FROM "TenancyContract";
DROP TABLE "TenancyContract";
ALTER TABLE "new_TenancyContract" RENAME TO "TenancyContract";
CREATE UNIQUE INDEX "TenancyContract_tokenHash_key" ON "TenancyContract"("tokenHash");
CREATE INDEX "TenancyContract_ownerId_idx" ON "TenancyContract"("ownerId");
CREATE INDEX "TenancyContract_listingId_idx" ON "TenancyContract"("listingId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
