SELECT "id","email","name","password","created_at","updated_at"
FROM "users"
WHERE "users"."email" = 'kkk';


select "id", "email", "name", "password", "created_at", "updated_at" from "users" where "users"."email" = 'sss';


CREATE EXTENSION IF NOT EXISTS "pgcrypto";


ALTER TABLE refresh_tokens RENAME TO user_refresh_tokens;
ALTER TABLE user_refresh_tokens DROP Constraint  refresh_tokens_user_id_users_id_fk;
ALTER TABLE user_refresh_tokens ADD CONSTRAINT user_refresh_tokens_user_id_users_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_sessions ADD PRIMARY KEY (session_token);