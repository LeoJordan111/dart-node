/*
  Warnings:

  - You are about to drop the column `email` on the `Player` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Player_email_key";

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "email";
