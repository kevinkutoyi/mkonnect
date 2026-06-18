-- AlterTable: add offeredServices array column to masseuse_profiles
ALTER TABLE "masseuse_profiles" ADD COLUMN "offeredServices" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
