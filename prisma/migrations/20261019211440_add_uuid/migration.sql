/*
  Warnings:

  - A unique constraint covering the columns `[uuid]` on the table `MinecraftUser` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uuid` to the `MinecraftUser` table without a default value. This is not possible if the table is not empty.
  - Made the column `lowercase_name` on table `MinecraftUser` required. This step will fail if there are existing NULL values in that column.
  - Made the column `normalized_name` on table `MinecraftUser` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "MinecraftUser" ADD COLUMN     "uuid" TEXT NOT NULL,
ALTER COLUMN "lowercase_name" SET NOT NULL,
ALTER COLUMN "normalized_name" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MinecraftUser_uuid_key" ON "MinecraftUser"("uuid");
