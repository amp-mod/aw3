ALTER TABLE "user" DROP CONSTRAINT "user_inviter_user_id_fk";
--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'comment'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "comment" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "comment" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "comment" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "comment" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "config" ADD COLUMN "config_value" jsonb;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "isResolved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_curators" ADD COLUMN "isManager" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "displayName" varchar(30) DEFAULT '';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "accentColour" text DEFAULT '#4fa55c';--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_inviter_user_id_fk" FOREIGN KEY ("inviter") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "config" DROP COLUMN "value";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "verified";