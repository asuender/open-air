CREATE TABLE "documents" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"project" text
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirements" (
	"id" text PRIMARY KEY,
	"level" text,
	"type" text NOT NULL,
	"text" text NOT NULL,
	"document" text,
	CONSTRAINT "check_level" CHECK ("level" in ('', 'must', 'should', 'info')),
	CONSTRAINT "check_type" CHECK ("type" in ('', 'technical', 'non-technical'))
);
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_projects_id_fkey" FOREIGN KEY ("project") REFERENCES "projects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_document_documents_id_fkey" FOREIGN KEY ("document") REFERENCES "documents"("id") ON DELETE CASCADE;