CREATE TABLE "oauth_artifacts" (
	"model" text NOT NULL,
	"id_hash" varchar(64) NOT NULL,
	"payload" jsonb NOT NULL,
	"grant_id_hash" varchar(64),
	"user_code_hash" varchar(64),
	"uid" text,
	"expires_at" timestamp with time zone,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_artifacts_model_id_hash_pk" PRIMARY KEY("model","id_hash")
);
--> statement-breakpoint
CREATE TABLE "oauth_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"actor_id" text,
	"client_id" text,
	"resource_uri" text,
	"ip_address" text,
	"user_agent" text,
	"outcome" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_clients" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"client_type" text NOT NULL,
	"token_endpoint_auth_method" text NOT NULL,
	"redirect_uris" jsonb NOT NULL,
	"allowed_scopes" jsonb NOT NULL,
	"allowed_resources" jsonb NOT NULL,
	"client_secret_hash" text,
	"secret_created_at" timestamp with time zone,
	"dynamic" boolean DEFAULT false NOT NULL,
	"metadata" jsonb NOT NULL,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"client_id" text NOT NULL,
	"resource_uri" text NOT NULL,
	"scopes" jsonb NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_rate_limits" (
	"bucket" text NOT NULL,
	"subject_hash" varchar(64) NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_rate_limits_bucket_subject_hash_pk" PRIMARY KEY("bucket","subject_hash")
);
--> statement-breakpoint
CREATE TABLE "oauth_resources" (
	"uri" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"allowed_scopes" jsonb NOT NULL,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_signing_keys" (
	"kid" text PRIMARY KEY NOT NULL,
	"public_jwk" jsonb NOT NULL,
	"status" text NOT NULL,
	"activated_at" timestamp with time zone NOT NULL,
	"retired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "oauth_consents" ADD CONSTRAINT "oauth_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_consents" ADD CONSTRAINT "oauth_consents_client_id_oauth_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_consents" ADD CONSTRAINT "oauth_consents_resource_uri_oauth_resources_uri_fk" FOREIGN KEY ("resource_uri") REFERENCES "public"."oauth_resources"("uri") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "oauth_artifacts_grant_id_idx" ON "oauth_artifacts" USING btree ("grant_id_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_artifacts_user_code_idx" ON "oauth_artifacts" USING btree ("user_code_hash");--> statement-breakpoint
CREATE INDEX "oauth_artifacts_uid_idx" ON "oauth_artifacts" USING btree ("uid");--> statement-breakpoint
CREATE INDEX "oauth_artifacts_expires_at_idx" ON "oauth_artifacts" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "oauth_audit_events_created_at_idx" ON "oauth_audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "oauth_audit_events_client_id_idx" ON "oauth_audit_events" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "oauth_clients_enabled_idx" ON "oauth_clients" USING btree ("disabled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_consents_subject_client_resource_idx" ON "oauth_consents" USING btree ("user_id","client_id","resource_uri");