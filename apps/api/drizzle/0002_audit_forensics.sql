ALTER TABLE "organizations" ADD COLUMN "audit_log_retention_days" integer DEFAULT 90 NOT NULL;
ALTER TABLE "activity_logs" ADD COLUMN "user_agent" text;
ALTER TABLE "activity_logs" ADD COLUMN "app_version" varchar(20);
ALTER TABLE "activity_logs" ADD COLUMN "prev_hash" varchar(64);
ALTER TABLE "activity_logs" ADD COLUMN "content_hash" varchar(64);
