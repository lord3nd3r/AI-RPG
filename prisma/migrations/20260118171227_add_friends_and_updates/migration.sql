-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Friendship_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Friendship_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PartyMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartyMessage_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PartyMessage_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameCharacter" (
    "gameId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "currentHp" INTEGER NOT NULL DEFAULT 10,
    "maxHp" INTEGER NOT NULL DEFAULT 10,
    "currentMp" INTEGER NOT NULL DEFAULT 10,
    "maxMp" INTEGER NOT NULL DEFAULT 10,
    "exp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "statusEffects" TEXT NOT NULL DEFAULT '[]',
    "inventory" TEXT NOT NULL DEFAULT '[]',

    PRIMARY KEY ("gameId", "characterId"),
    CONSTRAINT "GameCharacter_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GameCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GameCharacter" ("characterId", "currentHp", "exp", "gameId", "inventory", "level", "maxHp", "statusEffects") SELECT "characterId", "currentHp", "exp", "gameId", "inventory", "level", "maxHp", "statusEffects" FROM "GameCharacter";
DROP TABLE "GameCharacter";
ALTER TABLE "new_GameCharacter" RENAME TO "GameCharacter";
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "characterId" TEXT,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("content", "createdAt", "gameId", "id", "role") SELECT "content", "createdAt", "gameId", "id", "role" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Friendship_receiverId_idx" ON "Friendship"("receiverId");

-- CreateIndex
CREATE INDEX "Friendship_senderId_idx" ON "Friendship"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_senderId_receiverId_key" ON "Friendship"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "PartyMessage_gameId_idx" ON "PartyMessage"("gameId");

-- CreateIndex
CREATE INDEX "PartyMessage_createdAt_idx" ON "PartyMessage"("createdAt");
