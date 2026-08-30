CREATE TABLE "user_redirects" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_redirects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"from_username" varchar(20) NOT NULL,
	"redirect_to_user_id" bigint NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_redirects_from_username_unique" UNIQUE("from_username")
);
--> statement-breakpoint
DROP INDEX "username_idx";--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "id" bigint PRIMARY KEY NOT NULL GENERATED ALWAYS AS IDENTITY (sequence name "report_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "user_id" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "usernameUpdatedAt" timestamp with time zone DEFAULT '1970-01-01T00:00:00.000Z' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "hasFeaturedProject" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_redirects" ADD CONSTRAINT "user_redirects_redirect_to_user_id_user_id_fk" FOREIGN KEY ("redirect_to_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_redirect_from_idx" ON "user_redirects" USING btree ("from_username");--> statement-breakpoint
CREATE INDEX "user_redirect_expires_idx" ON "user_redirects" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lower_username_idx" ON "user" USING btree (lower("username"));