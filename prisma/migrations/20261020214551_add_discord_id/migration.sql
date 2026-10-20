/*
  Warnings:

  - A unique constraint covering the columns `[discord_id]` on the table `MinecraftUser` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "MinecraftUser" ADD COLUMN     "discord_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MinecraftUser_discord_id_key" ON "MinecraftUser"("discord_id");
