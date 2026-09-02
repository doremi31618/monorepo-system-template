CREATE TABLE "mail_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"mail_from" text NOT NULL,
	"mail_to" text NOT NULL,
	"cc" text,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
