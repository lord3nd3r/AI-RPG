-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dmUserId" TEXT NOT NULL,
    "aiProvider" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "maxPlayers" INTEGER NOT NULL DEFAULT 4,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Game_dmUserId_fkey" FOREIGN KEY ("dmUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Game" ("aiProvider", "createdAt", "description", "dmUserId", "id", "name") SELECT "aiProvider", "createdAt", "description", "dmUserId", "id", "name" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
