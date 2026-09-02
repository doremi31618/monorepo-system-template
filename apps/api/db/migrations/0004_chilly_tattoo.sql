DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'token_type') THEN
		CREATE TYPE "token_type" AS ENUM ('session', 'refresh', 'reset_password');
	END IF;
END $$;

CREATE TABLE IF NOT EXISTS "auth_token" (
	"user_id" integer NOT NULL,
	"token" text PRIMARY KEY NOT NULL,
	"type" "token_type" NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auth_token_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);

INSERT INTO auth_token (user_id, token, type, expires_at, created_at, updated_at) 
SELECT user_id, session_token, 'session', expires_at, created_at, updated_at FROM user_sessions;

INSERT INTO auth_token (user_id, token, type, expires_at, created_at, updated_at) 
SELECT user_id, refresh_token, 'refresh', expires_at, created_at, created_at FROM user_refresh_tokens;

DROP TABLE user_sessions;
DROP TABLE user_refresh_tokens;
