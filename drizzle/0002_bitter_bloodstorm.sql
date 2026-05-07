CREATE TABLE "audit_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"action" text NOT NULL,
	"actor_id" bigint,
	"target_id" bigint,
	"target_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"extra" jsonb
);
--> statement-breakpoint
CREATE TABLE "authenticator" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"name" varchar(255) DEFAULT 'New Passkey',
	"public_key" text NOT NULL,
	"counter" bigint DEFAULT 0 NOT NULL,
	"device_type" varchar(32) NOT NULL,
	"backed_up" boolean DEFAULT false NOT NULL,
	"transports" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text
);
--> statement-breakpoint
CREATE TABLE "featured_gallery" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "featured_gallery_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"gallery_id" bigint NOT NULL,
	"why" text
);
--> statement-breakpoint
CREATE TABLE "featured_project" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "featured_project_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"project_id" bigint NOT NULL,
	"why" text
);
--> statement-breakpoint
CREATE TABLE "follow" (
	"follower_id" bigint NOT NULL,
	"following_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "follow_follower_id_following_id_pk" PRIMARY KEY("follower_id","following_id")
);
--> statement-breakpoint
CREATE TABLE "gallery" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "gallery_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
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
CREATE TABLE "gallery_curators" (
	"gallery_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	CONSTRAINT "gallery_curators_gallery_id_user_id_pk" PRIMARY KEY("gallery_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notification_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"recipient_id" bigint NOT NULL,
	"issuer_id" bigint,
	"type" text NOT NULL,
	"target_id" bigint,
	"target_type" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "project_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"title" varchar(150) NOT NULL,
	"instructions" varchar(2000) DEFAULT '',
	"notes" varchar(2000) DEFAULT '',
	"json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"moderator_note" text,
	"image" text,
	"status" text DEFAULT 'unshared',
	"cc_version" smallint DEFAULT 4,
	"flashingLights" boolean DEFAULT false NOT NULL,
	"original" bigint,
	"search_index" "tsvector"
);
--> statement-breakpoint
CREATE TABLE "projects_to_galleries" (
	"project_id" bigint NOT NULL,
	"gallery_id" bigint NOT NULL,
	CONSTRAINT "projects_to_galleries_project_id_gallery_id_pk" PRIMARY KEY("project_id","gallery_id")
);
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "session_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "id" SET DATA TYPE char(64);--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "user_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "username" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "bio" SET DATA TYPE varchar(2000);--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "bio" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "ip" "inet";--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "tos_revision" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "pp_revision" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "hasPFP" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "isPrivate" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "featured_project_id" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "featured_project_title_index" smallint DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "passkeys" jsonb;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "status" text DEFAULT 'normal';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned_expiry" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "scratch_linked" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "scratch_username" varchar(64) DEFAULT '';--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_gallery" ADD CONSTRAINT "featured_gallery_gallery_id_gallery_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."gallery"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_project" ADD CONSTRAINT "featured_project_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow" ADD CONSTRAINT "follow_follower_id_user_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow" ADD CONSTRAINT "follow_following_id_user_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery" ADD CONSTRAINT "gallery_host_id_user_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_curators" ADD CONSTRAINT "gallery_curators_gallery_id_gallery_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."gallery"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_curators" ADD CONSTRAINT "gallery_curators_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_recipient_id_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_issuer_id_user_id_fk" FOREIGN KEY ("issuer_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_original_project_id_fk" FOREIGN KEY ("original") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "projects_to_galleries" ADD CONSTRAINT "projects_to_galleries_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects_to_galleries" ADD CONSTRAINT "projects_to_galleries_gallery_id_gallery_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."gallery"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_target_idx" ON "audit_log" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "auth_user_id_idx" ON "authenticator" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "featured_gallery_id_idx" ON "featured_gallery" USING btree ("gallery_id");--> statement-breakpoint
CREATE INDEX "featured_project_id_idx" ON "featured_project" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "follower_idx" ON "follow" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "following_idx" ON "follow" USING btree ("following_id");--> statement-breakpoint
CREATE INDEX "gallery_host_id_idx" ON "gallery" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "gallery_search_idx" ON "gallery" USING gin ("search_index");--> statement-breakpoint
CREATE INDEX "gallery_curator_idx" ON "gallery_curators" USING btree ("gallery_id","user_id");--> statement-breakpoint
CREATE INDEX "recipient_idx" ON "notification" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "is_read_idx" ON "notification" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notif_target_idx" ON "notification" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "project_id_idx" ON "project" USING btree ("id");--> statement-breakpoint
CREATE INDEX "project_user_id_idx" ON "project" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_search_idx" ON "project" USING gin ("search_index");--> statement-breakpoint
CREATE INDEX "project_gallery_idx" ON "projects_to_galleries" USING btree ("gallery_id");--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_featured_project_id_project_id_fk" FOREIGN KEY ("featured_project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "username_idx" ON "user" USING btree ("username");