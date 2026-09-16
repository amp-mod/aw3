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
CREATE TABLE "comment" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "comment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"author_id" bigint NOT NULL,
	"recipient_id" bigint NOT NULL,
	"type" text NOT NULL,
	"parent_id" bigint,
	"content" varchar(2000) NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text
);
--> statement-breakpoint
CREATE TABLE "featured_project" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "featured_project_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"project_id" bigint NOT NULL,
	"why" text
);
--> statement-breakpoint
CREATE TABLE "featured_studio" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "featured_studio_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"studio_id" bigint NOT NULL,
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
	"original" bigint,
	"scratchProjectID" text,
	"search_index" "tsvector"
);
--> statement-breakpoint
CREATE TABLE "project_like" (
	"user_id" bigint NOT NULL,
	"project_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_like_user_id_project_id_pk" PRIMARY KEY("user_id","project_id")
);
--> statement-breakpoint
CREATE TABLE "project_view" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "project_view_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"project_id" bigint NOT NULL,
	"user_id" bigint,
	"visitor_id" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects_to_studios" (
	"project_id" bigint NOT NULL,
	"studio_id" bigint NOT NULL,
	CONSTRAINT "projects_to_studios_project_id_studio_id_pk" PRIMARY KEY("project_id","studio_id")
);
--> statement-breakpoint
CREATE TABLE "report" (
	"recipient_id" bigint NOT NULL,
	"type" text NOT NULL,
	"chosenReason" varchar(64),
	"description" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "report_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" char(64) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip" "inet",
	"user_agent" text
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
CREATE TABLE "user" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"username" varchar(20) NOT NULL,
	"password_hash" text NOT NULL,
	"tos_revision" integer DEFAULT 0,
	"pp_revision" integer DEFAULT 0,
	"rank" smallint DEFAULT 0,
	"bio" varchar(2000) DEFAULT '',
	"hasPFP" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"isPrivate" boolean DEFAULT false,
	"featured_project_id" integer,
	"featured_project_title_index" smallint DEFAULT 0,
	"passkeys" jsonb,
	"status" text DEFAULT 'normal',
	"banned_expiry" timestamp with time zone,
	"ban_reason" text,
	"scratch_username" varchar(64) DEFAULT '',
	"verified" boolean DEFAULT false,
	"frame" varchar(32),
	"usernameUpdatedAt" timestamp with time zone DEFAULT '1970-01-01T00:00:00.000Z' NOT NULL,
	"hasFeaturedProject" boolean DEFAULT false,
	"inviteId" uuid DEFAULT gen_random_uuid(),
	"inviter" integer,
	"email" text,
	"isEmailVerified" boolean DEFAULT false NOT NULL,
	"verifyID" uuid DEFAULT gen_random_uuid(),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "user_redirects" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_redirects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"from_username" varchar(20) NOT NULL,
	"redirect_to_user_id" bigint NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_redirects_from_username_unique" UNIQUE("from_username")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_parent_id_comment_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_project" ADD CONSTRAINT "featured_project_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_studio" ADD CONSTRAINT "featured_studio_studio_id_studio_id_fk" FOREIGN KEY ("studio_id") REFERENCES "public"."studio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow" ADD CONSTRAINT "follow_follower_id_user_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow" ADD CONSTRAINT "follow_following_id_user_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_recipient_id_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_issuer_id_user_id_fk" FOREIGN KEY ("issuer_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_original_project_id_fk" FOREIGN KEY ("original") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_like" ADD CONSTRAINT "project_like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_like" ADD CONSTRAINT "project_like_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_view" ADD CONSTRAINT "project_view_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_view" ADD CONSTRAINT "project_view_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects_to_studios" ADD CONSTRAINT "projects_to_studios_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects_to_studios" ADD CONSTRAINT "projects_to_studios_studio_id_studio_id_fk" FOREIGN KEY ("studio_id") REFERENCES "public"."studio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio" ADD CONSTRAINT "studio_host_id_user_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_curators" ADD CONSTRAINT "studio_curators_studio_id_studio_id_fk" FOREIGN KEY ("studio_id") REFERENCES "public"."studio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_curators" ADD CONSTRAINT "studio_curators_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_featured_project_id_project_id_fk" FOREIGN KEY ("featured_project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_inviter_user_id_fk" FOREIGN KEY ("inviter") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_redirects" ADD CONSTRAINT "user_redirects_redirect_to_user_id_user_id_fk" FOREIGN KEY ("redirect_to_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_target_idx" ON "audit_log" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "auth_user_id_idx" ON "authenticator" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "comment_author_idx" ON "comment" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "comment_parent_idx" ON "comment" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "featured_project_id_idx" ON "featured_project" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "featured_studio_id_idx" ON "featured_studio" USING btree ("studio_id");--> statement-breakpoint
CREATE INDEX "follower_idx" ON "follow" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "following_idx" ON "follow" USING btree ("following_id");--> statement-breakpoint
CREATE INDEX "recipient_idx" ON "notification" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "is_read_idx" ON "notification" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notif_target_idx" ON "notification" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "project_id_idx" ON "project" USING btree ("id");--> statement-breakpoint
CREATE INDEX "project_user_id_idx" ON "project" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_search_idx" ON "project" USING gin ("search_index");--> statement-breakpoint
CREATE INDEX "project_like_project_idx" ON "project_like" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_like_user_idx" ON "project_like" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_view_project_idx" ON "project_view" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_view_created_at_idx" ON "project_view" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "unique_user_view_idx" ON "project_view" USING btree ("project_id","user_id");--> statement-breakpoint
CREATE INDEX "unique_visitor_view_idx" ON "project_view" USING btree ("project_id","visitor_id");--> statement-breakpoint
CREATE INDEX "project_studio_idx" ON "projects_to_studios" USING btree ("studio_id");--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "studio_host_id_idx" ON "studio" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "studio_search_idx" ON "studio" USING gin ("search_index");--> statement-breakpoint
CREATE INDEX "studio_curator_idx" ON "studio_curators" USING btree ("studio_id","user_id");--> statement-breakpoint
CREATE INDEX "username_idx" ON "user" USING btree ("username");--> statement-breakpoint
CREATE INDEX "user_redirect_from_idx" ON "user_redirects" USING btree ("from_username");--> statement-breakpoint
CREATE INDEX "user_redirect_expires_idx" ON "user_redirects" USING btree ("expires_at");