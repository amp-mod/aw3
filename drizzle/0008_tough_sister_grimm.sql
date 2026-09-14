CREATE TABLE "featured_studio" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "featured_studio_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"studio_id" bigint NOT NULL,
	"why" text
);
--> statement-breakpoint
CREATE TABLE "projects_to_studios" (
	"project_id" bigint NOT NULL,
	"studio_id" bigint NOT NULL,
	CONSTRAINT "projects_to_studios_project_id_studio_id_pk" PRIMARY KEY("project_id","studio_id")
);
--> statement-breakpoint
CREATE TABLE "studio" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "studio_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"host_id" bigint NOT NULL,
	"title" varchar(150) NOT NULL,
	"description" varchar(2000) DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"moderator_note" text,
	"image" text,
	"hidden" boolean DEFAULT false,
	"search_index" "tsvector"
);
--> statement-breakpoint
CREATE TABLE "studio_curators" (
	"studio_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	CONSTRAINT "studio_curators_studio_id_user_id_pk" PRIMARY KEY("studio_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "featured_gallery" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "gallery" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "gallery_curators" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "projects_to_galleries" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "featured_gallery" CASCADE;--> statement-breakpoint
DROP TABLE "gallery" CASCADE;--> statement-breakpoint
DROP TABLE "gallery_curators" CASCADE;--> statement-breakpoint
DROP TABLE "projects_to_galleries" CASCADE;--> statement-breakpoint
ALTER TABLE "comment" DROP CONSTRAINT "comment_project_id_project_id_fk";
--> statement-breakpoint
ALTER TABLE "comment" DROP CONSTRAINT "comment_gallery_id_gallery_id_fk";
--> statement-breakpoint
DROP INDEX "comment_project_idx";--> statement-breakpoint
DROP INDEX "comment_gallery_idx";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "inviter" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "recipient_id" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "isEmailVerified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "verifyID" uuid DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "featured_studio" ADD CONSTRAINT "featured_studio_studio_id_studio_id_fk" FOREIGN KEY ("studio_id") REFERENCES "public"."studio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects_to_studios" ADD CONSTRAINT "projects_to_studios_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects_to_studios" ADD CONSTRAINT "projects_to_studios_studio_id_studio_id_fk" FOREIGN KEY ("studio_id") REFERENCES "public"."studio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio" ADD CONSTRAINT "studio_host_id_user_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_curators" ADD CONSTRAINT "studio_curators_studio_id_studio_id_fk" FOREIGN KEY ("studio_id") REFERENCES "public"."studio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_curators" ADD CONSTRAINT "studio_curators_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "featured_studio_id_idx" ON "featured_studio" USING btree ("studio_id");--> statement-breakpoint
CREATE INDEX "project_studio_idx" ON "projects_to_studios" USING btree ("studio_id");--> statement-breakpoint
CREATE INDEX "studio_host_id_idx" ON "studio" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "studio_search_idx" ON "studio" USING gin ("search_index");--> statement-breakpoint
CREATE INDEX "studio_curator_idx" ON "studio_curators" USING btree ("studio_id","user_id");--> statement-breakpoint
ALTER TABLE "comment" DROP COLUMN "project_id";--> statement-breakpoint
ALTER TABLE "comment" DROP COLUMN "gallery_id";