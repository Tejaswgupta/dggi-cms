-- Migration: create dggi_seizure_records (Goods Seizure Register)
-- One row per goods-seizure case. Feeds the seizure_scn_primary /
-- seizure_scn_extended deadline rules already defined in deadline-rules.json.

CREATE TABLE "public"."dggi_seizure_records" (
    "id"                        uuid DEFAULT gen_random_uuid() NOT NULL,
    "workspace_id"              text NOT NULL,
    "record_id"                 text,
    "linked_case_id"            text,
    "entity_name"               text,
    "seizure_details"           text,
    "date_of_seizure"           date,
    "scn_issued"                text DEFAULT 'No',
    "scn_issue_date"            date,
    "extended_by_commissioner"  text DEFAULT 'No',
    "latest_status"             text,
    "sio"                       uuid,
    "sio_name"                  text,
    "group"                     text,
    "created_by"                uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "created_by_name"           text,
    "deleted_at"                timestamp with time zone,
    "deleted_by"                uuid,
    "created_at"                timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY "public"."dggi_seizure_records"
    ADD CONSTRAINT "dggi_seizure_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_seizure_records"
    ADD CONSTRAINT "dggi_seizure_records_sio_fkey"
    FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

CREATE INDEX "dggi_seizure_records_workspace_idx" ON "public"."dggi_seizure_records" USING btree ("workspace_id");
CREATE INDEX "dggi_seizure_records_linked_case_idx" ON "public"."dggi_seizure_records" USING btree ("linked_case_id");

GRANT SELECT, INSERT, DELETE, UPDATE ON TABLE "public"."dggi_seizure_records" TO "authenticated";
