-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Gift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "giftListId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "price" REAL,
    "deliveryCost" REAL,
    "size" TEXT,
    "productUrl" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Gift_giftListId_fkey" FOREIGN KEY ("giftListId") REFERENCES "GiftList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Gift" ("createdAt", "deliveryCost", "description", "giftListId", "id", "imageUrl", "price", "priority", "productUrl", "quantity", "size", "title") SELECT "createdAt", "deliveryCost", "description", "giftListId", "id", "imageUrl", "price", "priority", "productUrl", "quantity", "size", "title" FROM "Gift";
DROP TABLE "Gift";
ALTER TABLE "new_Gift" RENAME TO "Gift";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
