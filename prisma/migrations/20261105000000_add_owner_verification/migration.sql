-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "occupancy" TEXT;
ALTER TABLE "Listing" ADD COLUMN "chequeCount" INTEGER;

-- CreateTable
CREATE TABLE "ListingReview" (
    "listingId" TEXT NOT NULL PRIMARY KEY,
    "propertyNumber" TEXT NOT NULL,
    "isExclusive" BOOLEAN NOT NULL,
    "amountPaid" REAL,
    "poaAvailable" BOOLEAN NOT NULL,
    "checks" TEXT,
    "note" TEXT,
    "reviewedAt" DATETIME,
    CONSTRAINT "ListingReview_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OwnerDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "deedNumber" TEXT,
    "uploaderId" TEXT NOT NULL,
    "listingId" TEXT,
    CONSTRAINT "OwnerDocument_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OwnerDocument_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "OwnerDocument_uploaderId_kind_idx" ON "OwnerDocument"("uploaderId", "kind");
CREATE INDEX "OwnerDocument_listingId_idx" ON "OwnerDocument"("listingId");
CREATE INDEX "OwnerDocument_sha256_idx" ON "OwnerDocument"("sha256");
CREATE INDEX "OwnerDocument_deedNumber_idx" ON "OwnerDocument"("deedNumber");
