DROP INDEX "lower_username_idx";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "inviteId" uuid DEFAULT gen_random_uuid();--> statement-breakpoint
CREATE INDEX "username_idx" ON "user" USING btree ("username");