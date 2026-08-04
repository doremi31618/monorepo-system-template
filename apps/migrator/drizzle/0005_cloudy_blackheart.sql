DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_provider_type') THEN
		CREATE TYPE "auth_provider_type" AS ENUM ('google', 'Line');
	END IF;
END $$;

DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'token_type') THEN
		ALTER TYPE "token_type" RENAME TO "auth_token_type";
	END IF;
END $$;

-- 確保 auth_token 使用新的 enum 名稱
ALTER TABLE "auth_token" ALTER COLUMN "type" SET DATA TYPE "public"."auth_token_type";

CREATE TABLE IF NOT EXISTS "auth_provider" (
	"user_id" integer NOT NULL,
	"provider" "auth_provider_type" NOT NULL,
	"provider_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_provider" ADD CONSTRAINT "auth_provider_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
