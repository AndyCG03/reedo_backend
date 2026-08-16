-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "username" VARCHAR(30) NOT NULL,
    "display_name" VARCHAR(60) NOT NULL,
    "bio" VARCHAR(280),
    "avatar_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_username_key" ON "user_profiles"("username");
