-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phNo" TEXT NOT NULL,
    "dob" DATETIME NOT NULL,
    "healthCard" BOOLEAN NOT NULL,
    "playingRole" TEXT NOT NULL,
    "tshirtSize" TEXT NOT NULL,
    "batsmanRating" INTEGER NOT NULL,
    "handedBatsman" TEXT NOT NULL,
    "battingComment" TEXT NOT NULL,
    "bowlerRating" INTEGER NOT NULL,
    "armBowler" TEXT NOT NULL,
    "typeBowler" TEXT NOT NULL,
    "bowlingComment" TEXT NOT NULL,
    "fielderRating" INTEGER NOT NULL,
    "fielderComment" TEXT NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" DATETIME,
    "teamId" TEXT,
    "soldFor" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "imageId" TEXT NOT NULL,
    CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Player_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "PlayerImage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Player" ("address", "armBowler", "batsmanRating", "battingComment", "bowlerRating", "bowlingComment", "createdAt", "dob", "email", "fielderComment", "fielderRating", "firstName", "handedBatsman", "healthCard", "id", "imageId", "lastName", "phNo", "playingRole", "soldFor", "teamId", "tshirtSize", "type", "typeBowler", "updatedAt") SELECT "address", "armBowler", "batsmanRating", "battingComment", "bowlerRating", "bowlingComment", "createdAt", "dob", "email", "fielderComment", "fielderRating", "firstName", "handedBatsman", "healthCard", "id", "imageId", "lastName", "phNo", "playingRole", "soldFor", "teamId", "tshirtSize", "type", "typeBowler", "updatedAt" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE UNIQUE INDEX "Player_email_key" ON "Player"("email");
CREATE UNIQUE INDEX "Player_teamId_key" ON "Player"("teamId");
CREATE UNIQUE INDEX "Player_imageId_key" ON "Player"("imageId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
