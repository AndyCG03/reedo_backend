-- Rename `user_profiles` to `users` preserving existing data.
-- The `display_name` column is dropped and an optional `email` is added as
-- part of the UserProfile -> User refactor.

-- RenameTable
ALTER TABLE "user_profiles" RENAME TO "users";

-- DropColumn (displayName no longer part of the aggregate)
ALTER TABLE "users" DROP COLUMN "display_name";

-- AddColumn (optional email)
ALTER TABLE "users" ADD COLUMN "email" VARCHAR(320);

-- Rename indexes/constraints so they match Prisma's expected names for "users".
ALTER INDEX "user_profiles_pkey" RENAME TO "users_pkey";
ALTER INDEX "user_profiles_username_key" RENAME TO "users_username_key";