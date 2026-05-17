-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "listingType" TEXT NOT NULL DEFAULT 'SALE',
    "title" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "subLocation" TEXT,
    "propertyType" TEXT NOT NULL,
    "bedrooms" TEXT NOT NULL,
    "bathrooms" TEXT,
    "areaSqft" REAL,
    "areaSqm" REAL,
    "price" REAL NOT NULL,
    "priceLabel" TEXT,
    "floor" TEXT,
    "view" TEXT,
    "furnished" TEXT,
    "handover" TEXT,
    "handoverDate" DATETIME,
    "isDistress" BOOLEAN NOT NULL DEFAULT false,
    "originalPrice" REAL,
    "parkingSpots" INTEGER,
    "isRented" BOOLEAN NOT NULL DEFAULT false,
    "rentAmount" REAL,
    "rentedUntil" TEXT,
    "description" TEXT,
    "agentId" TEXT NOT NULL,
    CONSTRAINT "Listing_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Listing" ("agentId", "areaSqft", "areaSqm", "bathrooms", "bedrooms", "createdAt", "description", "expiresAt", "floor", "furnished", "handover", "handoverDate", "id", "isDistress", "isRented", "location", "originalPrice", "parkingSpots", "price", "priceLabel", "projectName", "propertyType", "rentAmount", "rentedUntil", "status", "subLocation", "title", "updatedAt", "view") SELECT "agentId", "areaSqft", "areaSqm", "bathrooms", "bedrooms", "createdAt", "description", "expiresAt", "floor", "furnished", "handover", "handoverDate", "id", "isDistress", "isRented", "location", "originalPrice", "parkingSpots", "price", "priceLabel", "projectName", "propertyType", "rentAmount", "rentedUntil", "status", "subLocation", "title", "updatedAt", "view" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
