CREATE TYPE "public"."category" AS ENUM('none', 'cryptocurrency', 'cybersecurity', 'fixit', 'gaming', 'help', 'software', 'note', 'config', 'question', 'log', 'project', 'snippet', 'education');--> statement-breakpoint
CREATE TYPE "public"."expiration" AS ENUM('never', 'burn_after_read', '10m', '1h', '1d', '1w', '2w');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('public', 'private', 'unlisted', 'organization');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" varchar(512) NOT NULL,
	"provider_id" varchar(512) NOT NULL,
	"access_token" varchar(512),
	"refresh_token" varchar(512),
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" varchar(512),
	"id_token" varchar(512),
	"password" varchar(512),
	CONSTRAINT "accounts_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
CREATE TABLE "folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(512) NOT NULL,
	"parent_folder_id" uuid,
	CONSTRAINT "folders_id_user_uc" UNIQUE("id","user_id")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"email" varchar(512),
	"inviter_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" varchar(512),
	"status" varchar(512),
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" varchar(512)
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" varchar(512) NOT NULL,
	"slug" varchar(512) NOT NULL,
	"logo" varchar(512),
	"metadata" varchar(512),
	CONSTRAINT "organizations_name_unique" UNIQUE("name"),
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "paste_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paste_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pastes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid,
	"folder_id" uuid,
	"title" varchar(128) NOT NULL,
	"description" varchar(512),
	"slug" varchar(64),
	"category" "category" DEFAULT 'none' NOT NULL,
	"content" text NOT NULL,
	"syntax_id" uuid,
	"expires_at" timestamp,
	"expiration" "expiration" DEFAULT 'never' NOT NULL,
	"encrypted" boolean DEFAULT false,
	"password_hash" varchar(512),
	"hits" integer DEFAULT 0 NOT NULL,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"organization_id" uuid,
	CONSTRAINT "pastes_slug_unique" UNIQUE("slug"),
	CONSTRAINT "pastes_folder_requires_user_chk" CHECK ("pastes"."folder_id" IS NULL OR "pastes"."user_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "realtime_pastes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"title" varchar(128) NOT NULL,
	"slug" varchar(64) NOT NULL,
	"content" text NOT NULL,
	"syntax_id" uuid,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"organization_id" uuid,
	CONSTRAINT "realtime_pastes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(512) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" varchar(512),
	"user_agent" varchar(512),
	"impersonatedBy" uuid,
	"activeOrganizationId" uuid,
	"activeTeamId" uuid,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "syntaxes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" varchar(64) NOT NULL,
	"extension" varchar(32),
	"color" varchar(32) NOT NULL,
	CONSTRAINT "syntaxes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" varchar(32) NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" varchar(512) NOT NULL,
	"email" varchar(512) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" varchar(512),
	"role" varchar(512),
	"banned" boolean,
	"ban_reason" varchar(512),
	"ban_expires" numeric,
	CONSTRAINT "users_name_unique" UNIQUE("name"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"identifier" varchar(512) NOT NULL,
	"value" varchar(512) NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_folder_id_folders_id_fk" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_user_fk" FOREIGN KEY ("parent_folder_id","user_id") REFERENCES "public"."folders"("id","user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paste_tags" ADD CONSTRAINT "paste_tags_paste_id_pastes_id_fk" FOREIGN KEY ("paste_id") REFERENCES "public"."pastes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paste_tags" ADD CONSTRAINT "paste_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pastes" ADD CONSTRAINT "pastes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pastes" ADD CONSTRAINT "pastes_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pastes" ADD CONSTRAINT "pastes_syntax_id_syntaxes_id_fk" FOREIGN KEY ("syntax_id") REFERENCES "public"."syntaxes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pastes" ADD CONSTRAINT "pastes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pastes" ADD CONSTRAINT "pastes_folder_user_fk" FOREIGN KEY ("folder_id","user_id") REFERENCES "public"."folders"("id","user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "realtime_pastes" ADD CONSTRAINT "realtime_pastes_syntax_id_syntaxes_id_fk" FOREIGN KEY ("syntax_id") REFERENCES "public"."syntaxes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "realtime_pastes" ADD CONSTRAINT "realtime_pastes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "folders_sibling_name_uq" ON "folders" USING btree ("user_id","parent_folder_id","name");--> statement-breakpoint
CREATE INDEX "folders_tree_idx" ON "folders" USING btree ("user_id","parent_folder_id");--> statement-breakpoint
CREATE INDEX "pastes_user_folder_idx" ON "pastes" USING btree ("user_id","folder_id");