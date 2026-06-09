-- ================================================================
-- DGGI extract: dggi_* tables + FK-linked tables
-- Generated from dump.sql
-- ================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET row_security = off;



-- ── DGGI functions ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION "public"."dggi_can_access_by_record_id"("p_workspace_id" "text", "p_record_id" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dggi_records r
    WHERE r.workspace_id = p_workspace_id
      AND r.record_id    = p_record_id
      AND public.dggi_can_access_record(r.workspace_id, r."group", r.handling_io_sio)
  );
$$;


ALTER FUNCTION "public"."dggi_can_access_by_record_id"("p_workspace_id" "text", "p_record_id" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."dggi_can_access_record"("p_workspace_id" "text", "p_group" "text", "p_handling_io_sio" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.votum_users u
    WHERE u.id = auth.uid()
      AND u.workspace_id::text = p_workspace_id
      AND (
        u.dggi_role IN ('ADG', 'DD_INT')
        OR (
          u.dggi_role IN ('ADC', 'DD')
          AND EXISTS (
            SELECT 1
            FROM public.dggi_user_group_assignments g
            WHERE g.user_id = u.id
              AND g.workspace_id = u.workspace_id
              AND g.group_name = p_group
          )
        )
        OR (
          u.dggi_role IN ('SIO', 'IO')
          AND (
            u.id::text = p_handling_io_sio
            OR u.name = p_handling_io_sio
          )
        )
      )
  );
$$;


ALTER FUNCTION "public"."dggi_can_access_record"("p_workspace_id" "text", "p_group" "text", "p_handling_io_sio" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."dggi_can_access_record"("p_workspace_id" "text", "p_group" "text", "p_assigned_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.votum_users u
    WHERE u.id = auth.uid()
      AND u.workspace_id::text = p_workspace_id
      AND (
        u.dggi_role IN ('ADG', 'DD_INT')
        OR (
          u.dggi_role IN ('ADC', 'DD')
          AND EXISTS (
            SELECT 1
            FROM public.dggi_user_group_assignments g
            WHERE g.user_id = u.id
              AND g.workspace_id = u.workspace_id
              AND g.group_name = p_group
          )
        )
        OR (
          u.dggi_role IN ('SIO', 'IO')
          AND p_assigned_user_id = u.id
        )
      )
  );
$$;


ALTER FUNCTION "public"."dggi_can_access_record"("p_workspace_id" "text", "p_group" "text", "p_assigned_user_id" "uuid") OWNER TO "postgres";


-- ── Table definitions ───────────────────────────────────────────────────


-- Table: designations

CREATE TABLE IF NOT EXISTS "public"."designations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "level" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


-- Table: dggi_alert_circular_records

CREATE TABLE IF NOT EXISTS "public"."dggi_alert_circular_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "alert_circular_no_date" "text",
    "gstin" "text",
    "cgst_commissionerate" "text",
    "cgst_zone" "text",
    "legal_trade_name" "text",
    "jurisdiction" "text",
    "itc_tax_involved_lakhs" "text",
    "tax_period_involved" "text",
    "docs_shared" "text",
    "scn_ruds_shared" "text",
    "remarks" "text",
    "sio_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "linked_case_id" "text",
    "group" "text",
    "sio" "uuid"
);


-- Table: dggi_arrest_records

CREATE TABLE IF NOT EXISTS "public"."dggi_arrest_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "date_of_arrest" "date",
    "financial_year" "text",
    "commissionerate" "text",
    "unit_name_reg" "text",
    "amount_crore" "text",
    "role_evidence" "text",
    "signature" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "linked_case_id" "text",
    "group" "text",
    "sio" "uuid",
    "arrested_name" "text",
    "arrested_designation" "text",
    "arrested_age" "text",
    "relative_name" "text",
    "relative_address" "text",
    "relative_tel" "text"
);


-- Table: dggi_closure_records
-- Mirrors dggi_records in full; one row per closed case.
-- source_record_id → dggi_records.record_id of the originating case.
-- record_id        → auto-generated CLR-### UID for this closure entry.

DROP TABLE IF EXISTS "public"."dggi_closure_records";

CREATE TABLE "public"."dggi_closure_records" (
    "id"                        "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id"              "text" NOT NULL,
    "record_id"                 "text",
    "source_record_id"          "text",
    "is_ir"                     boolean DEFAULT false NOT NULL,
    "group"                     "text",
    "intel_source"              "text",
    "date_of_receipt"           "date",
    "taxpayer_name"             "text",
    "gstins"                    "text",
    "file_no"                   "text",
    "date_of_initiation"        "date",
    "intel_approved_date"       "date",
    "mode_of_initiation"        "text",
    "intelligence_action_date"  "date",
    "handling_io_sio"           "uuid",
    "issue_involved"            "text",
    "latest_status"             "text",
    "pr_adg_comments"           "text",
    "detection_amount"          "text",
    "recovery_itc"              "text",
    "recovery_cash"             "text",
    "digit_id"                  "text",
    "bo_id"                     "text",
    "hsn_code"                  "text",
    "closure_by"                "text",
    "due_date"                  "date",
    "date_of_ir"                "date",
    "date_of_non_ir"            "date",
    "converted_from_non_ir"     "text",
    "created_at"                timestamp with time zone DEFAULT "now"()
);


-- Table: dggi_cpgram_records

CREATE TABLE IF NOT EXISTS "public"."dggi_cpgram_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "cpgram_registration_no" "text",
    "date_of_receipt" "date",
    "complainant_name" "text",
    "complaint_subject" "text",
    "department_referred" "text",
    "date_sent_to_department" "date",
    "reply_status" "text",
    "date_of_reply" "date",
    "remarks" "text",
    "handling_officer" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "linked_case_id" "text",
    "disposed" "text",
    "group" "text",
    "sio" "uuid"
);


-- Table: dggi_deadline_alerts_sent

CREATE TABLE IF NOT EXISTS "public"."dggi_deadline_alerts_sent" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "rule_id" "text" NOT NULL,
    "record_id" "text" NOT NULL,
    "reminder_bucket" integer NOT NULL,
    "last_sent_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


-- Table: dggi_dfl_records

CREATE TABLE IF NOT EXISTS "public"."dggi_dfl_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "dfl_request_no" "text",
    "date_of_request" "date",
    "case_file_no" "text",
    "entity_name" "text",
    "nature_of_request" "text",
    "devices_submitted" "text",
    "lab_received_date" "date",
    "report_received_date" "date",
    "findings_summary" "text",
    "action_taken" "text",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "linked_case_id" "text",
    "group" "text",
    "sio" "uuid"
);


-- Table: dggi_evidence_room_records

CREATE TABLE IF NOT EXISTS "public"."dggi_evidence_room_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "case_file_no" "text",
    "entity_name" "text",
    "evidence_description" "text",
    "date_of_seizure" "date",
    "evidence_type" "text",
    "quantity" "text",
    "storage_location" "text",
    "condition" "text",
    "date_released" "date",
    "released_to" "text",
    "court_order_ref" "text",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "linked_case_id" "text",
    "group" "text",
    "sio" "uuid",
    "seized_by" "uuid"
);


-- Table: dggi_incident_report_records

CREATE TABLE IF NOT EXISTS "public"."dggi_incident_report_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "sr_no_date" "text",
    "file_number" "text",
    "company_name" "text",
    "detection_recovery" "text",
    "description" "text",
    "group" "text",
    "officer_name" "text",
    "bo_id_no" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "int_no" "text",
    "linked_case_id" "text",
    "recovery_itc" "text",
    "recovery_cash" "text",
    "detection_amount" "text",
    "incident_date" "date",
    "arrest" "text",
    "digit_id" "text",
    "gstin" "text",
    "sio" "uuid"
);


-- Table: dggi_informer_reward_records

CREATE TABLE IF NOT EXISTS "public"."dggi_informer_reward_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "informer_code" "text",
    "date_of_information" "date",
    "file_no" "text",
    "entity_name" "text",
    "amount_detected" "text",
    "amount_recovered" "text",
    "reward_percentage" "text",
    "reward_amount" "text",
    "reward_sanctioned_date" "date",
    "reward_paid_date" "date",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "linked_case_id" "text",
    "group" "text",
    "sio" "uuid"
);


-- Table: dggi_intel_closure_records

CREATE TABLE IF NOT EXISTS "public"."dggi_intel_closure_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "reference_no" "text",
    "rapid_id" "text",
    "file_no" "text",
    "closure_date" "date",
    "closure_reason" "text",
    "remarks" "text",
    "closed_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "linked_case_id" "text"
);


-- Table: dggi_intel_other_source_records

CREATE TABLE IF NOT EXISTS "public"."dggi_intel_other_source_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "source_name" "text",
    "reference_no" "text",
    "date_of_receipt" "date",
    "nature_of_intel" "text",
    "entity_name" "text",
    "gstin" "text",
    "action_taken" "text",
    "date_of_action_taken" "date",
    "status" "text",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "linked_case_id" "text",
    "non_ir_no" "text",
    "non_ir_date" "date",
    "sio" "uuid",
    "assigned_group" "text"
);


-- Table: dggi_intel_rapid_records

CREATE TABLE IF NOT EXISTS "public"."dggi_intel_rapid_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "rapid_id" "text",
    "file_no_ref_id" "text",
    "receipt_mode" "text",
    "received_against_entity" "text",
    "nature_gist" "text",
    "last_updated_on" "date",
    "action_taken" "text",
    "remarks" "text",
    "date_of_action_taken" "date",
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "assigned_group" "text",
    "assigned_user_id" "uuid",
    "group_allocation_date" "date",
    "adg_putup_date" "date",
    "ir_date" "date",
    "linked_case_id" "text",
    "non_ir_no" "text",
    "non_ir_date" "date",
    "transferred_to" "text",
    "sio" "uuid",
    "sender_email" "text",
    "sender_mobile" "text"
);


-- Table: dggi_modus_operandi_records

CREATE TABLE IF NOT EXISTS "public"."dggi_modus_operandi_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "brief_facts" "text",
    "methodology" "text",
    "gst_law_provision" "text",
    "cases_booked_amounts" "text",
    "widespread_evasion" "text",
    "board_clarification" "text",
    "court_advance_rulings" "text",
    "other_info" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "linked_case_id" "text",
    "group" "text",
    "sio" "uuid"
);


-- Table: dggi_non_ir_case_records

CREATE TABLE IF NOT EXISTS "public"."dggi_non_ir_case_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "file_number" "text",
    "date_of_initiation" "date",
    "sio_name" "text",
    "group_name" "text",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "linked_case_id" "text",
    "group" "text",
    "sio" "uuid"
);


-- Table: dggi_prosecution_arrest_records

CREATE TABLE IF NOT EXISTS "public"."dggi_prosecution_arrest_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "arrested_person_name" "text",
    "age" "text",
    "date_of_arrest" "date",
    "status_of_person" "text",
    "amount_evaded_crore" "text",
    "entity_name" "text",
    "gstin" "text",
    "brief_modus_operandi" "text",
    "prosecution_complaint_status" "text",
    "date_of_filing" "date",
    "reasons_not_filed" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "bail_status" "text",
    "linked_case_id" "text",
    "group" "text",
    "sio" "uuid"
);


-- Table: dggi_prosecution_non_arrest_records

CREATE TABLE IF NOT EXISTS "public"."dggi_prosecution_non_arrest_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "opening_balance" "text",
    "cases_examined" "text",
    "prosecution_sanctioned_filed" "text",
    "no_of_persons" "text",
    "new_adjudication_orders" "text",
    "closing_balance" "text",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "date_of_order" "date",
    "linked_case_id" "text",
    "group" "text",
    "sio" "uuid"
);


-- Table: dggi_provisional_attachment_records

CREATE TABLE IF NOT EXISTS "public"."dggi_provisional_attachment_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "person_name" "text",
    "gstin_pan" "text",
    "person_status" "text",
    "expected_liability" "text",
    "entity_gstin" "text",
    "issue_involved" "text",
    "person_involvement" "text",
    "arrest" "text",
    "dossier_prepared" "text",
    "value_immovable" "text",
    "value_movable" "text",
    "value_shares" "text",
    "value_bank" "text",
    "value_third_party" "text",
    "value_others" "text",
    "value_total" "text",
    "balance_0_3m" "text",
    "balance_3_6m" "text",
    "balance_6_9m" "text",
    "balance_9_12m" "text",
    "investigation_completed" "text",
    "scn_issued" "text",
    "letter_issued" "text",
    "oio_issued" "text",
    "permanent_attachment" "text",
    "group_sio" "text",
    "date_of_attachment" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "linked_scn_no" "text",
    "linked_case_id" "text",
    "group" "text",
    "date_of_scn_issuance" "date",
    "date_of_release" "date",
    "out_of_monitoring" boolean DEFAULT false,
    "description_of_property" "text",
    "sio" "uuid"
);


-- Table: dggi_records

CREATE TABLE IF NOT EXISTS "public"."dggi_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "intel_source" "text",
    "date_of_receipt" "date",
    "taxpayer_name" "text",
    "gstins" "text",
    "file_no" "text",
    "date_of_initiation" "date",
    "intel_approved_date" "date",
    "mode_of_initiation" "text",
    "intelligence_action_date" "date",
    "issue_involved" "text",
    "latest_status" "text",
    "pr_adg_comments" "text",
    "is_ir" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "group" "text",
    "due_date" "date",
    "record_id" "text",
    "hsn_code" "text",
    "closure_by" "text",
    "date_of_ir" "date",
    "date_of_non_ir" "date",
    "detection_amount" "text",
    "recovery_itc" "text",
    "recovery_cash" "text",
    "digit_id" "text",
    "bo_id" "text",
    "converted_from_non_ir" "text",
    "assigned_user_id" "uuid",
    "handling_io_sio" "uuid",
    CONSTRAINT "dggi_records_group_check" CHECK (("group" = ANY (ARRAY['Group A'::"text", 'Group B'::"text", 'Group C'::"text", 'Group D'::"text", 'Group E'::"text"]))),
    CONSTRAINT "dggi_records_mode_of_initiation_check" CHECK (("mode_of_initiation" = ANY (ARRAY['Letter'::"text", 'Email'::"text", 'Summons'::"text", 'Inspection'::"text", 'Search'::"text"])))
);


-- Table: dggi_report_compliance_records

CREATE TABLE IF NOT EXISTS "public"."dggi_report_compliance_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "report_type" "text",
    "report_period" "text",
    "due_date" "date",
    "submission_date" "date",
    "submitted_by" "text",
    "submitted_to" "text",
    "status" "text",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "linked_case_id" "text",
    "group" "text",
    "sio" "uuid"
);


-- Table: dggi_scn_records

CREATE TABLE IF NOT EXISTS "public"."dggi_scn_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "scn_no" "text",
    "date_of_scn" "date",
    "noticee_name" "text",
    "gstin_pan" "text",
    "demand_tax" "text",
    "demand_interest" "text",
    "demand_penalty" "text",
    "period_involved" "text",
    "last_date_oio" "date",
    "issue" "text",
    "adjudication_formation" "text",
    "file_no" "text",
    "din_no" "text",
    "date_uploading_bo" "date",
    "adjudication_status" "text",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "appeal_stage" "text",
    "linked_case_id" "text",
    "group" "text",
    "sio" "uuid"
);


-- Table: dggi_seizure_records

CREATE TABLE IF NOT EXISTS "public"."dggi_seizure_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "case_file_no" "text",
    "entity_name" "text",
    "goods_description" "text",
    "seizure_type" "text",
    "quantity" "text",
    "seizure_value" "text",
    "mahazar_no" "text",
    "storage_location" "text",
    "date_of_seizure" "date",
    "seized_by" "uuid",
    "scn_issued" "text",
    "scn_issue_date" "date",
    "scn_no" "text",
    "extended_by_commissioner" "text",
    "extension_order_date" "date",
    "goods_returned" "text",
    "return_date" "date",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "linked_case_id" "text",
    "group" "text",
    "sio" "uuid"
);


-- Table: dggi_str_records

CREATE TABLE IF NOT EXISTS "public"."dggi_str_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "str_reference_no" "text",
    "date_of_str" "date",
    "entity_name" "text",
    "gstin" "text",
    "amount_involved" "text",
    "nature_of_offence" "text",
    "fiu_reference_no" "text",
    "action_taken" "text",
    "status" "text",
    "remarks" "text",
    "sio_group" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "linked_case_id" "text",
    "group" "text",
    "file_no_ref_id" "text",
    "receipt_mode" "text",
    "received_against_entity" "text",
    "nature_gist" "text",
    "sender_email_mobile" "text",
    "assigned_group" "text",
    "group_allocation_date" "date",
    "adg_putup_date" "date",
    "ir_date" "date",
    "last_updated_on" "date",
    "date_of_action_taken" "date",
    "non_ir_no" "text",
    "non_ir_date" "date",
    "sio" "uuid"
);


-- Table: dggi_user_group_assignments

CREATE TABLE IF NOT EXISTS "public"."dggi_user_group_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "group_name" "text" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "dggi_user_group_valid_group" CHECK (("group_name" = ANY (ARRAY['Group A'::"text", 'Group B'::"text", 'Group C'::"text", 'Group D'::"text", 'Group E'::"text"])))
);


-- Table: votum_users

CREATE TABLE IF NOT EXISTS "public"."votum_users" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "avatar_url" "text",
    "google_calender_integrated" boolean DEFAULT false,
    "workspace_id" "uuid",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "text" DEFAULT '''user''::text'::"text",
    "refresh_token" "text",
    "gmail_integrated" boolean DEFAULT false,
    "skills" "text"[],
    "cal_config" "jsonb" DEFAULT '{}'::"jsonb",
    "designation" "text",
    "cc" "uuid",
    "outlook_calendar_integrated" boolean DEFAULT false,
    "outlook_calendar_email" character varying(255),
    "last_outlook_sync" timestamp with time zone,
    "timezone" "text" DEFAULT 'UTC'::"text" NOT NULL,
    "google_drive_integrated" boolean DEFAULT false,
    "onedrive_integrated" boolean DEFAULT false,
    "invite_code" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone" character varying(20),
    "whatsapp_phone_verified" boolean DEFAULT false,
    "whatsapp_otp" character varying(6),
    "whatsapp_otp_expires_at" timestamp with time zone,
    "whatsapp_otp_send_count" integer DEFAULT 0,
    "whatsapp_otp_send_date" timestamp with time zone,
    "checklist_state" "jsonb" DEFAULT '{"isDismissed": false, "completedItems": []}'::"jsonb",
    "dggi_role" "text",
    CONSTRAINT "votum_users_dggi_role_check" CHECK ((("dggi_role" IS NULL) OR ("dggi_role" = ANY (ARRAY['ADG'::"text", 'ADC'::"text", 'DD'::"text", 'SIO'::"text", 'IO'::"text", 'DD_INT'::"text"]))))
);


-- Table: votum_workspace

CREATE TABLE IF NOT EXISTS "public"."votum_workspace" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "email" "text",
    "avatar_url" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "accept_other_users" boolean DEFAULT true,
    "invite_code" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bank_details" "jsonb",
    "address" "text",
    "contact" "text",
    "notification_settings" "jsonb" DEFAULT '{"timezone": "UTC", "notification_time": "09:00", "invoice_reminders_enabled": true, "task_notifications_enabled": true, "email_notifications_enabled": true}'::"jsonb",
    "cal_team_config" "jsonb" DEFAULT '{}'::"jsonb",
    "delegation_workflow_enabled" boolean DEFAULT false,
    "quota" integer DEFAULT 0,
    "organization_type" "public"."organization_type" DEFAULT 'other'::"public"."organization_type" NOT NULL,
    "enabled_modules" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "transcription_quota_seconds" integer DEFAULT 0 NOT NULL,
    "transcription_quota_used_seconds" integer DEFAULT 0 NOT NULL,
    "transcription_quota_reset_at" timestamp with time zone DEFAULT "date_trunc"('month'::"text", "now"()) NOT NULL,
    "storage_limit_bytes" bigint DEFAULT '21474836480'::bigint,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


-- ── Constraints ─────────────────────────────────────────────────────────

ALTER TABLE ONLY "public"."designations"
    ADD CONSTRAINT "designations_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."designations"
    ADD CONSTRAINT "designations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."dggi_alert_circular_records"
    ADD CONSTRAINT "dggi_alert_circular_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_alert_circular_records"
    ADD CONSTRAINT "dggi_alert_circular_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_arrest_records"
    ADD CONSTRAINT "dggi_arrest_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_arrest_records"
    ADD CONSTRAINT "dggi_arrest_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_closure_records"
    ADD CONSTRAINT "dggi_closure_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_closure_records"
    ADD CONSTRAINT "dggi_closure_records_handling_io_sio_fkey" FOREIGN KEY ("handling_io_sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_cpgram_records"
    ADD CONSTRAINT "dggi_cpgram_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_cpgram_records"
    ADD CONSTRAINT "dggi_cpgram_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_deadline_alerts_sent"
    ADD CONSTRAINT "dggi_deadline_alerts_sent_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_deadline_alerts_sent"
    ADD CONSTRAINT "dggi_deadline_alerts_sent_workspace_id_rule_id_record_id_re_key" UNIQUE ("workspace_id", "rule_id", "record_id", "reminder_bucket");

ALTER TABLE ONLY "public"."dggi_dfl_records"
    ADD CONSTRAINT "dggi_dfl_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_dfl_records"
    ADD CONSTRAINT "dggi_dfl_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_evidence_room_records"
    ADD CONSTRAINT "dggi_evidence_room_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_evidence_room_records"
    ADD CONSTRAINT "dggi_evidence_room_records_seized_by_fkey" FOREIGN KEY ("seized_by") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_evidence_room_records"
    ADD CONSTRAINT "dggi_evidence_room_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_incident_report_records"
    ADD CONSTRAINT "dggi_incident_report_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_incident_report_records"
    ADD CONSTRAINT "dggi_incident_report_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_informer_reward_records"
    ADD CONSTRAINT "dggi_informer_reward_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_informer_reward_records"
    ADD CONSTRAINT "dggi_informer_reward_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_intel_closure_records"
    ADD CONSTRAINT "dggi_intel_closure_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_intel_other_source_records"
    ADD CONSTRAINT "dggi_intel_other_source_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_intel_other_source_records"
    ADD CONSTRAINT "dggi_intel_other_source_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_intel_rapid_records"
    ADD CONSTRAINT "dggi_intel_rapid_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_intel_rapid_records"
    ADD CONSTRAINT "dggi_intel_rapid_records_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_intel_rapid_records"
    ADD CONSTRAINT "dggi_intel_rapid_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_modus_operandi_records"
    ADD CONSTRAINT "dggi_modus_operandi_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_modus_operandi_records"
    ADD CONSTRAINT "dggi_modus_operandi_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_non_ir_case_records"
    ADD CONSTRAINT "dggi_non_ir_case_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_non_ir_case_records"
    ADD CONSTRAINT "dggi_non_ir_case_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_prosecution_arrest_records"
    ADD CONSTRAINT "dggi_prosecution_arrest_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_prosecution_arrest_records"
    ADD CONSTRAINT "dggi_prosecution_arrest_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_prosecution_non_arrest_records"
    ADD CONSTRAINT "dggi_prosecution_non_arrest_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_prosecution_non_arrest_records"
    ADD CONSTRAINT "dggi_prosecution_non_arrest_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_provisional_attachment_records"
    ADD CONSTRAINT "dggi_provisional_attachment_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_provisional_attachment_records"
    ADD CONSTRAINT "dggi_provisional_attachment_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_records"
    ADD CONSTRAINT "dggi_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_records"
    ADD CONSTRAINT "dggi_records_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_records"
    ADD CONSTRAINT "dggi_records_handling_io_sio_fkey" FOREIGN KEY ("handling_io_sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_report_compliance_records"
    ADD CONSTRAINT "dggi_report_compliance_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_report_compliance_records"
    ADD CONSTRAINT "dggi_report_compliance_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_scn_records"
    ADD CONSTRAINT "dggi_scn_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_scn_records"
    ADD CONSTRAINT "dggi_scn_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_seizure_records"
    ADD CONSTRAINT "dggi_seizure_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_seizure_records"
    ADD CONSTRAINT "dggi_seizure_records_seized_by_fkey" FOREIGN KEY ("seized_by") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_seizure_records"
    ADD CONSTRAINT "dggi_seizure_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_str_records"
    ADD CONSTRAINT "dggi_str_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_str_records"
    ADD CONSTRAINT "dggi_str_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_user_group_assignments"
    ADD CONSTRAINT "dggi_user_group_assignments_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_user_group_assignments"
    ADD CONSTRAINT "dggi_user_group_unique" UNIQUE ("user_id", "group_name");

ALTER TABLE ONLY "public"."dggi_user_group_assignments"
    ADD CONSTRAINT "dggi_user_group_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."votum_users"
    ADD CONSTRAINT "votum_users_invite_code_key" UNIQUE ("invite_code");

ALTER TABLE ONLY "public"."votum_users"
    ADD CONSTRAINT "votum_users_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."votum_users"
    ADD CONSTRAINT "votum_users_whatsapp_phone_key" UNIQUE ("phone");

ALTER TABLE ONLY "public"."votum_users"
    ADD CONSTRAINT "public_votum_users_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id");

ALTER TABLE ONLY "public"."votum_users"
    ADD CONSTRAINT "votum_users_cc_fkey" FOREIGN KEY ("cc") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."votum_workspace"
    ADD CONSTRAINT "votum_workspace_email_key" UNIQUE ("email");

ALTER TABLE ONLY "public"."votum_workspace"
    ADD CONSTRAINT "votum_workspace_pkey" PRIMARY KEY ("id");


-- ── Indexes ─────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX "designations_workspace_name_key" ON "public"."designations" USING "btree" ("workspace_id", "lower"("name"));

CREATE INDEX "dggi_alert_circular_workspace_idx" ON "public"."dggi_alert_circular_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_arrest_records_workspace_idx" ON "public"."dggi_arrest_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_closure_records_is_ir_idx" ON "public"."dggi_closure_records" USING "btree" ("is_ir");
CREATE INDEX "dggi_closure_records_workspace_idx" ON "public"."dggi_closure_records" USING "btree" ("workspace_id");
CREATE INDEX "dggi_closure_records_source_record_idx" ON "public"."dggi_closure_records" USING "btree" ("source_record_id");

CREATE INDEX "dggi_cpgram_workspace_idx" ON "public"."dggi_cpgram_records" USING "btree" ("workspace_id");

CREATE INDEX "idx_dggi_deadline_alerts_sent_lookup" ON "public"."dggi_deadline_alerts_sent" USING "btree" ("workspace_id", "rule_id", "record_id", "reminder_bucket");

CREATE INDEX "dggi_dfl_workspace_idx" ON "public"."dggi_dfl_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_evidence_room_workspace_idx" ON "public"."dggi_evidence_room_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_incident_report_records_workspace_idx" ON "public"."dggi_incident_report_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_informer_reward_workspace_idx" ON "public"."dggi_informer_reward_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_intel_closure_workspace_idx" ON "public"."dggi_intel_closure_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_intel_other_source_workspace_idx" ON "public"."dggi_intel_other_source_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_intel_rapid_workspace_idx" ON "public"."dggi_intel_rapid_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_modus_operandi_workspace_idx" ON "public"."dggi_modus_operandi_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_non_ir_case_records_workspace_idx" ON "public"."dggi_non_ir_case_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_prosecution_arrest_workspace_idx" ON "public"."dggi_prosecution_arrest_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_prosecution_non_arrest_workspace_idx" ON "public"."dggi_prosecution_non_arrest_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_provisional_attachment_records_workspace_idx" ON "public"."dggi_provisional_attachment_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_records_group_idx" ON "public"."dggi_records" USING "btree" ("group");

CREATE INDEX "dggi_records_workspace_idx" ON "public"."dggi_records" USING "btree" ("workspace_id");

CREATE INDEX "idx_dggi_records_assigned_user" ON "public"."dggi_records" USING "btree" ("assigned_user_id");

CREATE INDEX "dggi_report_compliance_workspace_idx" ON "public"."dggi_report_compliance_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_scn_records_workspace_idx" ON "public"."dggi_scn_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_seizure_records_workspace_idx" ON "public"."dggi_seizure_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_str_workspace_idx" ON "public"."dggi_str_records" USING "btree" ("workspace_id");

CREATE INDEX "idx_dggi_uga_group" ON "public"."dggi_user_group_assignments" USING "btree" ("group_name");

CREATE INDEX "idx_dggi_uga_user" ON "public"."dggi_user_group_assignments" USING "btree" ("user_id");

CREATE INDEX "idx_dggi_uga_workspace" ON "public"."dggi_user_group_assignments" USING "btree" ("workspace_id");

CREATE INDEX "idx_votum_users_checklist_state" ON "public"."votum_users" USING "gin" ("checklist_state");

CREATE INDEX "idx_votum_users_dggi_role" ON "public"."votum_users" USING "btree" ("dggi_role");

CREATE INDEX "idx_votum_users_invite_code" ON "public"."votum_users" USING "btree" ("invite_code");

CREATE INDEX "idx_votum_users_whatsapp_phone" ON "public"."votum_users" USING "btree" ("phone");

CREATE INDEX "idx_votum_users_whatsapp_verified" ON "public"."votum_users" USING "btree" ("phone") WHERE ("whatsapp_phone_verified" = true);


-- ── Triggers ────────────────────────────────────────────────────────────

CREATE OR REPLACE TRIGGER "audit_users_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."votum_users" FOR EACH ROW EXECUTE FUNCTION "public"."audit_users_changes"();


-- ── Row Level Security ──────────────────────────────────────────────────


-- ── Grants ──────────────────────────────────────────────────────────────

GRANT ALL ON TABLE "public"."designations" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_alert_circular_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_arrest_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_closure_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_cpgram_records" TO "authenticated";

GRANT SELECT ON TABLE "public"."dggi_deadline_alerts_sent" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_dfl_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_evidence_room_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_incident_report_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_informer_reward_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_intel_closure_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_intel_other_source_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_intel_rapid_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_modus_operandi_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_non_ir_case_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_prosecution_arrest_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_prosecution_non_arrest_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_provisional_attachment_records" TO "authenticated";

GRANT ALL ON TABLE "public"."dggi_records" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_report_compliance_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_scn_records" TO "authenticated";

GRANT ALL ON TABLE "public"."dggi_seizure_records" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_str_records" TO "authenticated";

GRANT ALL ON TABLE "public"."dggi_user_group_assignments" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_user_group_assignments" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_users" TO PUBLIC;

GRANT ALL ON TABLE "public"."votum_users" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_workspace" TO PUBLIC;

GRANT ALL ON TABLE "public"."votum_workspace" TO "service_role";
