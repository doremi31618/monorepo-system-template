CREATE TABLE "post_daily_views" (
	"post_id" uuid NOT NULL,
	"view_date" date NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "post_daily_views_post_id_view_date_pk" PRIMARY KEY("post_id","view_date")
);
--> statement-breakpoint
ALTER TABLE "post_daily_views" ADD CONSTRAINT "post_daily_views_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;