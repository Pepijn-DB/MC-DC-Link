-- CreateTable
CREATE TABLE "MinecraftUser" (
    "id" SERIAL NOT NULL,
    "lowercase_name" TEXT,
    "normalized_name" TEXT,

    CONSTRAINT "MinecraftUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MinecraftUser_lowercase_name_key" ON "MinecraftUser"("lowercase_name");

-- CreateIndex
CREATE UNIQUE INDEX "MinecraftUser_normalized_name_key" ON "MinecraftUser"("normalized_name");
