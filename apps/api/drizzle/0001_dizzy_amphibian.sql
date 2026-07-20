DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "pastes"
		WHERE "visibility" = 'private' AND "user_id" IS NULL
	) THEN
		RAISE EXCEPTION 'Cannot enforce private paste ownership: resolve private pastes without an owner before migrating';
	END IF;
END;
$$;
--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "folders"
		WHERE "parent_folder_id" IS NULL
		GROUP BY "user_id", "name"
		HAVING count(*) > 1
	) THEN
		RAISE EXCEPTION 'Cannot enforce root folder uniqueness: resolve duplicate root folder names before migrating';
	END IF;
END;
$$;
--> statement-breakpoint
DELETE FROM "paste_tags" AS "duplicate"
USING "paste_tags" AS "keeper"
WHERE "duplicate"."paste_id" = "keeper"."paste_id"
	AND "duplicate"."tag_id" = "keeper"."tag_id"
	AND "duplicate"."id" > "keeper"."id";
--> statement-breakpoint
ALTER TABLE "folders" DROP CONSTRAINT "folders_parent_user_fk";
--> statement-breakpoint
ALTER TABLE "pastes" DROP CONSTRAINT "pastes_folder_user_fk";
--> statement-breakpoint
DROP INDEX "pastes_user_folder_idx";--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_user_fk" FOREIGN KEY ("parent_folder_id","user_id") REFERENCES "public"."folders"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pastes" ADD CONSTRAINT "pastes_folder_user_fk" FOREIGN KEY ("folder_id","user_id") REFERENCES "public"."folders"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "folders_root_name_uq" ON "folders" USING btree ("user_id","name") WHERE "folders"."parent_folder_id" IS NULL;--> statement-breakpoint
CREATE INDEX "folders_parent_folder_id_idx" ON "folders" USING btree ("parent_folder_id","user_id");--> statement-breakpoint
CREATE INDEX "invitations_organization_id_idx" ON "invitations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitations_email_idx" ON "invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitations_inviter_id_idx" ON "invitations" USING btree ("inviter_id");--> statement-breakpoint
CREATE INDEX "members_organization_id_idx" ON "members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "members_user_id_idx" ON "members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "paste_tags_paste_tag_uq" ON "paste_tags" USING btree ("paste_id","tag_id");--> statement-breakpoint
CREATE INDEX "paste_tags_tag_id_idx" ON "paste_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "pastes_user_updated_idx" ON "pastes" USING btree ("user_id","updated_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "pastes_folder_user_updated_idx" ON "pastes" USING btree ("folder_id","user_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "pastes_public_updated_idx" ON "pastes" USING btree ("visibility","updated_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
ALTER TABLE "pastes" ADD CONSTRAINT "pastes_private_requires_user_chk" CHECK ("pastes"."visibility" <> 'private' OR "pastes"."user_id" IS NOT NULL);
