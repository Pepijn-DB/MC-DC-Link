/*
  Warnings:

  - You are about to drop the `players` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "players";

-- CreateTable
CREATE TABLE "guilds" (
    "id" SERIAL NOT NULL,
    "discord_id" TEXT NOT NULL,
    "channel_id" TEXT,
    "embed_url" TEXT,

    CONSTRAINT "guilds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guilds_discord_id_key" ON "guilds"("discord_id");
