ALTER TABLE "project" ADD COLUMN "scratchProjectID" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "frame" varchar(32);