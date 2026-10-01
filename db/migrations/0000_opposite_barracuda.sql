CREATE TYPE "public"."answer_type_t" AS ENUM('TEXT', 'CODE', 'MULTIPLE_CHOICE');--> statement-breakpoint
CREATE TYPE "public"."status_t" AS ENUM('READY', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');--> statement-breakpoint
CREATE TABLE "answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"user_answer" text NOT NULL,
	"score" smallint,
	"rubric_result" jsonb,
	"feedback" text,
	"missing_points" jsonb,
	"better_answer" text,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"graded_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "answers_questionId_unique" UNIQUE("question_id"),
	CONSTRAINT "answers_score_range" CHECK ("answers"."score" IS NULL OR "answers"."score" BETWEEN 0 AND 10)
);
--> statement-breakpoint
CREATE TABLE "session_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"technology_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"question_text" text NOT NULL,
	"answer_type" "answer_type_t" NOT NULL,
	"grading_rubric" jsonb NOT NULL,
	"options" jsonb,
	"correct_option" text,
	"code_language" varchar(255),
	"topic" varchar(255) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_questions_session_id_position_unique" UNIQUE("session_id","position"),
	CONSTRAINT "session_questions_position_range" CHECK ("session_questions"."position" BETWEEN 1 AND 10),
	CONSTRAINT "session_questions_answer_type_fields" CHECK (CASE "session_questions"."answer_type"
        WHEN 'TEXT' THEN "session_questions"."options" IS NULL AND "session_questions"."correct_option" IS NULL AND "session_questions"."code_language" IS NULL
        WHEN 'CODE' THEN "session_questions"."options" IS NULL AND "session_questions"."correct_option" IS NULL AND "session_questions"."code_language" IS NOT NULL
        WHEN 'MULTIPLE_CHOICE' THEN jsonb_typeof("session_questions"."options") = 'array' AND jsonb_array_length("session_questions"."options") = 4 AND "session_questions"."correct_option" IS NOT NULL AND "session_questions"."code_language" IS NULL
      END)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "status_t" DEFAULT 'READY' NOT NULL,
	"score" numeric(5, 2),
	"generator_version" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	CONSTRAINT "sessions_completed_after_started" CHECK ("sessions"."started_at" IS NULL OR "sessions"."completed_at" IS NULL OR "sessions"."completed_at" >= "sessions"."started_at")
);
--> statement-breakpoint
CREATE TABLE "technologies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "technologies_name_unique" UNIQUE("name"),
	CONSTRAINT "technologies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_technologies" (
	"user_id" uuid NOT NULL,
	"technology_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_technologies_user_id_technology_id_pk" PRIMARY KEY("user_id","technology_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_session_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."session_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_questions" ADD CONSTRAINT "session_questions_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_questions" ADD CONSTRAINT "session_questions_technology_id_technologies_id_fk" FOREIGN KEY ("technology_id") REFERENCES "public"."technologies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_technologies" ADD CONSTRAINT "user_technologies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_technologies" ADD CONSTRAINT "user_technologies_technology_id_technologies_id_fk" FOREIGN KEY ("technology_id") REFERENCES "public"."technologies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "answers_graded_at_idx" ON "answers" USING btree ("graded_at");--> statement-breakpoint
CREATE INDEX "session_questions_session_id_idx" ON "session_questions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "session_questions_technology_id_idx" ON "session_questions" USING btree ("technology_id");--> statement-breakpoint
CREATE INDEX "session_questions_topic_idx" ON "session_questions" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "sessions_user_id_status_idx" ON "sessions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "sessions_user_id_created_at_idx" ON "sessions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "technologies_is_active_idx" ON "technologies" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "user_technologies_technology_id_idx" ON "user_technologies" USING btree ("technology_id");--> statement-breakpoint
CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER technologies_set_updated_at BEFORE UPDATE ON "technologies" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER answers_set_updated_at BEFORE UPDATE ON "answers" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
