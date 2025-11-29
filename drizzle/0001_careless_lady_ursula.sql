ALTER TABLE "user" ADD COLUMN "bio" varchar(256) DEFAULT '';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "rank" smallint DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "age";