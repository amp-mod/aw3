CREATE TABLE "comment" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "comment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"author_id" bigint NOT NULL,
	"project_id" bigint,
	"gallery_id" bigint,
	"parent_id" bigint,
	"content" varchar(2000) NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "report" (
	"recipient_id" bigint NOT NULL,
	"type" text NOT NULL,
	"chosenReason" varchar(64),
	"description" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_gallery_id_gallery_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."gallery"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_parent_id_comment_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_like" ADD CONSTRAINT "project_like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_like" ADD CONSTRAINT "project_like_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_view" ADD CONSTRAINT "project_view_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_view" ADD CONSTRAINT "project_view_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comment_project_idx" ON "comment" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "comment_gallery_idx" ON "comment" USING btree ("gallery_id");--> statement-breakpoint
CREATE INDEX "comment_author_idx" ON "comment" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "comment_parent_idx" ON "comment" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "project_like_project_idx" ON "project_like" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_like_user_idx" ON "project_like" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_view_project_idx" ON "project_view" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_view_created_at_idx" ON "project_view" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "unique_user_view_idx" ON "project_view" USING btree ("project_id","user_id");--> statement-breakpoint
CREATE INDEX "unique_visitor_view_idx" ON "project_view" USING btree ("project_id","visitor_id");--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "scratch_linked";