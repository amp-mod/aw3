ALTER TABLE "user" DROP CONSTRAINT "user_inviter_user_id_fk";
--> statement-breakpoint
ALTER TABLE "config" ADD COLUMN "config_value" jsonb;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "isResolved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_curators" ADD COLUMN "isManager" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "displayName" varchar(30) DEFAULT '';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "accentColour" text DEFAULT '#4fa55c';--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_inviter_user_id_fk" FOREIGN KEY ("inviter") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "config" DROP COLUMN "value";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "verified";