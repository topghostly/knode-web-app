CREATE TYPE "public"."experience_level_t" AS ENUM('JUNIOR', 'MID', 'SENIOR', 'STAFF');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "experience_level" "experience_level_t";