-- AlterTable
ALTER TABLE "Leg" ADD COLUMN     "dartsToFinish" INTEGER;

-- AlterTable
ALTER TABLE "Turn" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Dart" (
    "id" SERIAL NOT NULL,
    "turnId" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "multiplier" INTEGER NOT NULL,
    "isCheckoutAttempt" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Dart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Turn_playerId_createdAt_idx" ON "Turn"("playerId", "createdAt");

-- AddForeignKey
ALTER TABLE "Dart" ADD CONSTRAINT "Dart_turnId_fkey" FOREIGN KEY ("turnId") REFERENCES "Turn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
