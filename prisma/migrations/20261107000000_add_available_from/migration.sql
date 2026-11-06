-- Null means the home is free now. A past date means the same thing.
ALTER TABLE "Listing" ADD COLUMN "availableFrom" DATETIME;
