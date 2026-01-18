-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameCharacter" (
    "gameId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "currentHp" INTEGER NOT NULL DEFAULT 10,
    "maxHp" INTEGER NOT NULL DEFAULT 10,
    "exp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "statusEffects" TEXT NOT NULL DEFAULT '[]',
    "inventory" TEXT NOT NULL DEFAULT '[]',

    PRIMARY KEY ("gameId", "characterId"),
    CONSTRAINT "GameCharacter_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GameCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GameCharacter" ("characterId", "gameId") SELECT "characterId", "gameId" FROM "GameCharacter";
DROP TABLE "GameCharacter";
ALTER TABLE "new_GameCharacter" RENAME TO "GameCharacter";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
