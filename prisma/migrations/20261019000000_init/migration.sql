-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "discord_id" TEXT NOT NULL,
    "minecraft_username" TEXT NOT NULL,
    "minecraft_uuid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_discord_id_key" ON "players"("discord_id");
