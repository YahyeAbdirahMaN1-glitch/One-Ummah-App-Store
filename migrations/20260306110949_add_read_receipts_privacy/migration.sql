-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "image" TEXT,
    "handle" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "rememberPassword" BOOLEAN NOT NULL DEFAULT false,
    "gender" TEXT NOT NULL,
    "birthDate" DATETIME,
    "bio" TEXT,
    "profilePicture" TEXT,
    "city" TEXT,
    "country" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "typingStatus" TEXT NOT NULL DEFAULT 'NOT_TYPING',
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readReceiptsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("bio", "birthDate", "city", "country", "createdAt", "email", "gender", "handle", "id", "image", "isOnline", "lastSeen", "name", "password", "profilePicture", "rememberPassword", "typingStatus") SELECT "bio", "birthDate", "city", "country", "createdAt", "email", "gender", "handle", "id", "image", "isOnline", "lastSeen", "name", "password", "profilePicture", "rememberPassword", "typingStatus" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
