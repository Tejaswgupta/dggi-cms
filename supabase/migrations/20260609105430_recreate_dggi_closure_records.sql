-- Migration: recreate dggi_closure_records in parity with dggi_records
-- Each closed case (IR on any closure, NON-IR on merits) writes one row here.
-- source_record_id → dggi_records.record_id of the originating case
-- record_id        → auto-generated CLR-### UID for this closure entry

-- Drop old table (old schema had unrelated columns: file_number, closure_report_no, etc.)
DROP TABLE IF EXISTS "public"."dggi_closure_records";

CREATE TABLE "public"."dggi_closure_records" (
    "id"                        uuid DEFAULT gen_random_uuid() NOT NULL,
    "workspace_id"              text NOT NULL,
    "record_id"                 text,
    "source_record_id"          text,
    "is_ir"                     boolean DEFAULT false NOT NULL,
    "group"                     text,
    "intel_source"              text,
    "date_of_receipt"           date,
    "taxpayer_name"             text,
    "gstins"                    text,
    "file_no"                   text,
    "date_of_initiation"        date,
    "intel_approved_date"       date,
    "mode_of_initiation"        text,
    "intelligence_action_date"  date,
    "handling_io_sio"           uuid,
    "issue_involved"            text,
    "latest_status"             text,
    "pr_adg_comments"           text,
    "detection_amount"          text,
    "recovery_itc"              text,
    "recovery_cash"             text,
    "digit_id"                  text,
    "bo_id"                     text,
    "hsn_code"                  text,
    "closure_by"                text,
    "due_date"                  date,
    "date_of_ir"                date,
    "date_of_non_ir"            date,
    "converted_from_non_ir"     text,
    "created_at"                timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY "public"."dggi_closure_records"
    ADD CONSTRAINT "dggi_closure_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_closure_records"
    ADD CONSTRAINT "dggi_closure_records_handling_io_sio_fkey"
    FOREIGN KEY ("handling_io_sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

CREATE INDEX "dggi_closure_records_workspace_idx"     ON "public"."dggi_closure_records" USING btree ("workspace_id");
CREATE INDEX "dggi_closure_records_is_ir_idx"         ON "public"."dggi_closure_records" USING btree ("is_ir");
CREATE INDEX "dggi_closure_records_source_record_idx" ON "public"."dggi_closure_records" USING btree ("source_record_id");

GRANT SELECT, INSERT, DELETE, UPDATE ON TABLE "public"."dggi_closure_records" TO "authenticated";
