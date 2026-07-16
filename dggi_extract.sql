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
    "created_at" timestamp with time zone DEFAULT "now"(),
    "linked_case_id" "text",
    "group" "text",
    "sio" "uuid",
    "sio_name" "text",
    "created_by" "uuid",
    "created_by_name" "text"
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
    "relative_tel" "text",
    "sio_name" "text",
    "arrest_batch_id" "text",
    "party_name" "text" DEFAULT ''::"text" NOT NULL,
    "unit_gstin" "text" DEFAULT ''::"text" NOT NULL,
    "prosecution_filed" "text" DEFAULT ''::"text" NOT NULL,
    "created_by" "uuid",
    "created_by_name" "text"
);


-- Table: dggi_closure_records

CREATE TABLE IF NOT EXISTS "public"."dggi_closure_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "source_record_id" "text",
    "is_ir" boolean DEFAULT false NOT NULL,
    "group" "text",
    "intel_source" "text",
    "date_of_receipt" "date",
    "taxpayer_name" "text",
    "gstins" "text",
    "file_no" "text",
    "date_of_initiation" "date",
    "intel_approved_date" "date",
    "mode_of_initiation" "text",
    "intelligence_action_date" "date",
    "handling_io_sio" "uuid",
    "issue_involved" "text",
    "latest_status" "text",
    "pr_adg_comments" "text",
    "detection_amount" "text",
    "recovery_itc" "text",
    "recovery_cash" "text",
    "digit_id" "text",
    "bo_id" "text",
    "hsn_code" "text",
    "closure_by" "text",
    "due_date" "date",
    "date_of_ir" "date",
    "date_of_non_ir" "date",
    "converted_from_non_ir" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "sio_name" "text",
    "closure_reason" "text",
    "transferred_to" "text",
    "created_by" "uuid",
    "created_by_name" "text"
);


-- Table: dggi_computed_deadlines

CREATE TABLE IF NOT EXISTS "public"."dggi_computed_deadlines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "rule_id" "text" NOT NULL,
    "source_table" "text" NOT NULL,
    "record_id" "text" NOT NULL,
    "row_id" "uuid" NOT NULL,
    "reference_date" "date" NOT NULL,
    "deadline_date" "date" NOT NULL,
    "label" "text" NOT NULL,
    "legal_reference" "text",
    "skipped" boolean DEFAULT false NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sio_user_id" "text",
    "group_name" "text",
    "entity_name" "text",
    "officer_name" "text",
    "critical_days" integer,
    "warning_days" integer,
    "max_reminder_days" integer
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
    "sio" "uuid",
    "sio_name" "text",
    "created_by" "uuid",
    "created_by_name" "text"
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
    "linked_case_id" "text",
    "created_by" "uuid",
    "created_by_name" "text"
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
    "assigned_group" "text",
    "sio_name" "text",
    "e_office_ref_no" "text",
    "created_by" "uuid",
    "created_by_name" "text"
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
    "sender_mobile" "text",
    "sio_name" "text",
    "created_by" "uuid",
    "created_by_name" "text"
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
    "sio" "uuid",
    "sio_name" "text",
    "created_by" "uuid",
    "created_by_name" "text"
);


-- Table: dggi_mpr_records

CREATE TABLE IF NOT EXISTS "public"."dggi_mpr_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "year" integer NOT NULL,
    "month" integer NOT NULL,
    "report_type" "text" NOT NULL,
    "filed" boolean DEFAULT false NOT NULL,
    "filed_date" "date",
    "filed_by" "text",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "dggi_mpr_records_month_check" CHECK ((("month" >= 1) AND ("month" <= 12)))
);


-- Table: dggi_non_ir_case_records

CREATE TABLE IF NOT EXISTS "public"."dggi_non_ir_case_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "file_number" "text",
    "date_of_initiation" "date",
    "group_name" "text",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "linked_case_id" "text",
    "group" "text",
    "sio" "uuid",
    "sio_name" "text",
    "created_by" "uuid",
    "created_by_name" "text"
);


-- Table: dggi_notifications

CREATE TABLE IF NOT EXISTS "public"."dggi_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "user_id" "uuid",
    "rule_id" "text" NOT NULL,
    "source_table" "text" NOT NULL,
    "record_id" "text" NOT NULL,
    "row_id" "uuid",
    "deadline_date" "date" NOT NULL,
    "days_until" integer NOT NULL,
    "label" "text" NOT NULL,
    "legal_reference" "text",
    "read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
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
    "sio" "uuid",
    "sio_name" "text",
    "linked_arrest_id" "uuid",
    "created_by" "uuid",
    "created_by_name" "text"
);


-- Table: dggi_prosecution_non_arrest_records

CREATE TABLE IF NOT EXISTS "public"."dggi_prosecution_non_arrest_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "record_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "linked_case_id" "text",
    "group" "text",
    "sio" "uuid",
    "sio_name" "text",
    "person_name" "text",
    "age" "text",
    "date_of_arrest" "date",
    "amount_evaded_crore" "text",
    "entity_name" "text",
    "gstin" "text",
    "brief_modus_operandi" "text",
    "prosecution_complaint_status" "text",
    "date_of_filing" "date",
    "reasons_not_filed" "text",
    "created_by" "uuid",
    "created_by_name" "text"
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
    "brief_description" "text",
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
    "sio" "uuid",
    "sio_name" "text",
    "attachment_batch_id" "text",
    "bank_name" "text",
    "bank_ifsc" "text",
    "created_by" "uuid",
    "created_by_name" "text"
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
    "transferred_to" "text",
    "handling_io_sio_name" "text",
    "closure_reason" "text",
    "pr_adg_comments_updated_at" timestamp with time zone,
    "created_by" "uuid",
    "created_by_name" "text",
    CONSTRAINT "dggi_records_group_check" CHECK (("group" = ANY (ARRAY['Group A'::"text", 'Group B'::"text", 'Group C'::"text", 'Group D'::"text", 'Group E'::"text", 'Group F'::"text"]))),
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
    "sio" "uuid",
    "sio_name" "text",
    "submitted_by_name" "text",
    "created_by" "uuid",
    "created_by_name" "text"
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
    "sio" "uuid",
    "competency" "text",
    "sio_name" "text",
    "adjudicating_authority" "text",
    "common_adjudicating_authority" "text",
    "created_by" "uuid",
    "created_by_name" "text"
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
    "sio" "uuid",
    "sio_name" "text",
    "seized_by_name" "text",
    "created_by" "uuid",
    "created_by_name" "text"
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
    "sio" "uuid",
    "sio_name" "text",
    "created_by" "uuid",
    "created_by_name" "text"
);


-- Table: dggi_user_group_assignments

CREATE TABLE IF NOT EXISTS "public"."dggi_user_group_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "group_name" "text" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "dggi_user_group_valid_group" CHECK (("group_name" = ANY (ARRAY['Group A'::"text", 'Group B'::"text", 'Group C'::"text", 'Group D'::"text", 'Group E'::"text", 'Group F'::"text"])))
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
    "enabled_modules" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "pno" "text",
    CONSTRAINT "votum_users_dggi_role_check" CHECK ((("dggi_role" IS NULL) OR ("dggi_role" = ANY (ARRAY['ADG'::"text", 'DD_INT'::"text", 'DD'::"text", 'AD'::"text", 'ADC'::"text", 'JD'::"text", 'SIO'::"text", 'IO'::"text"]))))
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
    "organization_type" "public"."organization_type" DEFAULT 'other'::"public"."organization_type" NOT NULL,
    "enabled_modules" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "transcription_quota_used_seconds" integer DEFAULT 0 NOT NULL,
    "transcription_quota_reset_at" timestamp with time zone DEFAULT "date_trunc"('month'::"text", "now"()) NOT NULL,
    "storage_limit_bytes" bigint DEFAULT '21474836480'::bigint,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "translation_base_price" numeric(10,2) DEFAULT NULL::numeric,
    "auto_destruct" boolean DEFAULT false NOT NULL,
    "auto_destruct_days" integer DEFAULT 0 NOT NULL
);


-- ── Primary key and unique constraints ──────────────────────────────────

ALTER TABLE ONLY "public"."designations"
    ADD CONSTRAINT "designations_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_alert_circular_records"
    ADD CONSTRAINT "dggi_alert_circular_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_arrest_records"
    ADD CONSTRAINT "dggi_arrest_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_closure_records"
    ADD CONSTRAINT "dggi_closure_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_computed_deadlines"
    ADD CONSTRAINT "dggi_computed_deadlines_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_computed_deadlines"
    ADD CONSTRAINT "dggi_computed_deadlines_uniq" UNIQUE ("workspace_id", "rule_id", "row_id");

ALTER TABLE ONLY "public"."dggi_deadline_alerts_sent"
    ADD CONSTRAINT "dggi_deadline_alerts_sent_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_deadline_alerts_sent"
    ADD CONSTRAINT "dggi_deadline_alerts_sent_workspace_id_rule_id_record_id_re_key" UNIQUE ("workspace_id", "rule_id", "record_id", "reminder_bucket");

ALTER TABLE ONLY "public"."dggi_incident_report_records"
    ADD CONSTRAINT "dggi_incident_report_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_intel_closure_records"
    ADD CONSTRAINT "dggi_intel_closure_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_intel_other_source_records"
    ADD CONSTRAINT "dggi_intel_other_source_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_intel_rapid_records"
    ADD CONSTRAINT "dggi_intel_rapid_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_modus_operandi_records"
    ADD CONSTRAINT "dggi_modus_operandi_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_mpr_records"
    ADD CONSTRAINT "dggi_mpr_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_mpr_records"
    ADD CONSTRAINT "dggi_mpr_records_workspace_id_year_month_report_type_key" UNIQUE ("workspace_id", "year", "month", "report_type");

ALTER TABLE ONLY "public"."dggi_non_ir_case_records"
    ADD CONSTRAINT "dggi_non_ir_case_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_notifications"
    ADD CONSTRAINT "dggi_notifications_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_prosecution_arrest_records"
    ADD CONSTRAINT "dggi_prosecution_arrest_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_prosecution_non_arrest_records"
    ADD CONSTRAINT "dggi_prosecution_non_arrest_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_provisional_attachment_records"
    ADD CONSTRAINT "dggi_provisional_attachment_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_records"
    ADD CONSTRAINT "dggi_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_report_compliance_records"
    ADD CONSTRAINT "dggi_report_compliance_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_scn_records"
    ADD CONSTRAINT "dggi_scn_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_seizure_records"
    ADD CONSTRAINT "dggi_seizure_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_str_records"
    ADD CONSTRAINT "dggi_str_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_user_group_assignments"
    ADD CONSTRAINT "dggi_user_group_assignments_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dggi_user_group_assignments"
    ADD CONSTRAINT "dggi_user_group_unique" UNIQUE ("user_id", "group_name");

ALTER TABLE ONLY "public"."votum_users"
    ADD CONSTRAINT "votum_users_invite_code_key" UNIQUE ("invite_code");

ALTER TABLE ONLY "public"."votum_users"
    ADD CONSTRAINT "votum_users_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."votum_users"
    ADD CONSTRAINT "votum_users_whatsapp_phone_key" UNIQUE ("phone");

ALTER TABLE ONLY "public"."votum_workspace"
    ADD CONSTRAINT "votum_workspace_email_key" UNIQUE ("email");

ALTER TABLE ONLY "public"."votum_workspace"
    ADD CONSTRAINT "votum_workspace_pkey" PRIMARY KEY ("id");


-- ── Foreign key constraints ─────────────────────────────────────────────

ALTER TABLE ONLY "public"."designations"
    ADD CONSTRAINT "designations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."dggi_alert_circular_records"
    ADD CONSTRAINT "dggi_alert_circular_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."dggi_alert_circular_records"
    ADD CONSTRAINT "dggi_alert_circular_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_arrest_records"
    ADD CONSTRAINT "dggi_arrest_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."dggi_arrest_records"
    ADD CONSTRAINT "dggi_arrest_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_closure_records"
    ADD CONSTRAINT "dggi_closure_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."dggi_closure_records"
    ADD CONSTRAINT "dggi_closure_records_handling_io_sio_fkey" FOREIGN KEY ("handling_io_sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_incident_report_records"
    ADD CONSTRAINT "dggi_incident_report_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."dggi_incident_report_records"
    ADD CONSTRAINT "dggi_incident_report_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_intel_closure_records"
    ADD CONSTRAINT "dggi_intel_closure_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."dggi_intel_other_source_records"
    ADD CONSTRAINT "dggi_intel_other_source_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."dggi_intel_other_source_records"
    ADD CONSTRAINT "dggi_intel_other_source_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_intel_rapid_records"
    ADD CONSTRAINT "dggi_intel_rapid_records_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_intel_rapid_records"
    ADD CONSTRAINT "dggi_intel_rapid_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."dggi_intel_rapid_records"
    ADD CONSTRAINT "dggi_intel_rapid_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_modus_operandi_records"
    ADD CONSTRAINT "dggi_modus_operandi_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."dggi_modus_operandi_records"
    ADD CONSTRAINT "dggi_modus_operandi_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_non_ir_case_records"
    ADD CONSTRAINT "dggi_non_ir_case_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."dggi_non_ir_case_records"
    ADD CONSTRAINT "dggi_non_ir_case_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_prosecution_arrest_records"
    ADD CONSTRAINT "dggi_prosecution_arrest_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."dggi_prosecution_arrest_records"
    ADD CONSTRAINT "dggi_prosecution_arrest_records_linked_arrest_id_fkey" FOREIGN KEY ("linked_arrest_id") REFERENCES "public"."dggi_arrest_records"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_prosecution_arrest_records"
    ADD CONSTRAINT "dggi_prosecution_arrest_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_prosecution_non_arrest_records"
    ADD CONSTRAINT "dggi_prosecution_non_arrest_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."dggi_prosecution_non_arrest_records"
    ADD CONSTRAINT "dggi_prosecution_non_arrest_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_provisional_attachment_records"
    ADD CONSTRAINT "dggi_provisional_attachment_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."dggi_provisional_attachment_records"
    ADD CONSTRAINT "dggi_provisional_attachment_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_records"
    ADD CONSTRAINT "dggi_records_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_records"
    ADD CONSTRAINT "dggi_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."dggi_records"
    ADD CONSTRAINT "dggi_records_handling_io_sio_fkey" FOREIGN KEY ("handling_io_sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_report_compliance_records"
    ADD CONSTRAINT "dggi_report_compliance_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."dggi_report_compliance_records"
    ADD CONSTRAINT "dggi_report_compliance_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_scn_records"
    ADD CONSTRAINT "dggi_scn_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."dggi_scn_records"
    ADD CONSTRAINT "dggi_scn_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_seizure_records"
    ADD CONSTRAINT "dggi_seizure_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."dggi_seizure_records"
    ADD CONSTRAINT "dggi_seizure_records_seized_by_fkey" FOREIGN KEY ("seized_by") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_seizure_records"
    ADD CONSTRAINT "dggi_seizure_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_str_records"
    ADD CONSTRAINT "dggi_str_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."dggi_str_records"
    ADD CONSTRAINT "dggi_str_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dggi_user_group_assignments"
    ADD CONSTRAINT "dggi_user_group_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."votum_users"
    ADD CONSTRAINT "public_votum_users_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id");

ALTER TABLE ONLY "public"."votum_users"
    ADD CONSTRAINT "votum_users_cc_fkey" FOREIGN KEY ("cc") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;


-- ── Check constraints ───────────────────────────────────────────────────


-- ── Indexes ─────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX "designations_workspace_name_key" ON "public"."designations" USING "btree" ("workspace_id", "lower"("name"));

CREATE INDEX "dggi_alert_circular_workspace_idx" ON "public"."dggi_alert_circular_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_arrest_records_workspace_idx" ON "public"."dggi_arrest_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_closure_records_is_ir_idx" ON "public"."dggi_closure_records" USING "btree" ("is_ir");

CREATE INDEX "dggi_closure_records_source_record_idx" ON "public"."dggi_closure_records" USING "btree" ("source_record_id");

CREATE INDEX "dggi_closure_records_workspace_idx" ON "public"."dggi_closure_records" USING "btree" ("workspace_id");

CREATE INDEX "idx_dggi_computed_deadlines_group" ON "public"."dggi_computed_deadlines" USING "btree" ("workspace_id", "group_name", "skipped", "deadline_date");

CREATE INDEX "idx_dggi_computed_deadlines_lookup" ON "public"."dggi_computed_deadlines" USING "btree" ("workspace_id", "deadline_date", "skipped");

CREATE INDEX "idx_dggi_computed_deadlines_sio" ON "public"."dggi_computed_deadlines" USING "btree" ("workspace_id", "sio_user_id", "skipped", "deadline_date");

CREATE INDEX "idx_dggi_computed_deadlines_workspace_skipped" ON "public"."dggi_computed_deadlines" USING "btree" ("workspace_id", "skipped", "deadline_date");

CREATE INDEX "idx_dggi_deadline_alerts_sent_lookup" ON "public"."dggi_deadline_alerts_sent" USING "btree" ("workspace_id", "rule_id", "record_id", "reminder_bucket");

CREATE INDEX "dggi_incident_report_records_workspace_idx" ON "public"."dggi_incident_report_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_intel_closure_workspace_idx" ON "public"."dggi_intel_closure_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_intel_other_source_workspace_idx" ON "public"."dggi_intel_other_source_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_intel_rapid_workspace_idx" ON "public"."dggi_intel_rapid_records" USING "btree" ("workspace_id");

CREATE INDEX "dggi_modus_operandi_workspace_idx" ON "public"."dggi_modus_operandi_records" USING "btree" ("workspace_id");

CREATE INDEX "idx_dggi_mpr_workspace_month" ON "public"."dggi_mpr_records" USING "btree" ("workspace_id", "year", "month");

CREATE INDEX "dggi_non_ir_case_records_workspace_idx" ON "public"."dggi_non_ir_case_records" USING "btree" ("workspace_id");

CREATE INDEX "idx_dggi_notifications_user" ON "public"."dggi_notifications" USING "btree" ("workspace_id", "user_id", "read", "created_at" DESC);

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

CREATE INDEX "idx_votum_users_id_workspace" ON "public"."votum_users" USING "btree" ("id") INCLUDE ("workspace_id");

CREATE INDEX "idx_votum_users_invite_code" ON "public"."votum_users" USING "btree" ("invite_code");

CREATE INDEX "idx_votum_users_whatsapp_phone" ON "public"."votum_users" USING "btree" ("phone");

CREATE INDEX "idx_votum_users_whatsapp_verified" ON "public"."votum_users" USING "btree" ("phone") WHERE ("whatsapp_phone_verified" = true);

CREATE UNIQUE INDEX "votum_users_pno_idx" ON "public"."votum_users" USING "btree" ("pno") WHERE ("pno" IS NOT NULL);


-- ── Trigger support functions ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION "public"."audit_users_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_change(
            'votum_users',
            NEW.id,
            'INSERT',
            NULL,
            NULL,
            to_jsonb(NEW),
            'important',
            'User created: ' || NEW.name || ' (' || COALESCE(NEW.email, 'no email') || ')',
            NEW.id, -- User creating themselves
            NEW.workspace_id
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Role change (CRITICAL)
        IF OLD.role IS DISTINCT FROM NEW.role THEN
            PERFORM log_audit_change(
                'votum_users',
                NEW.id,
                'UPDATE',
                'role',
                to_jsonb(OLD.role),
                to_jsonb(NEW.role),
                'critical',
                'User role changed from ' || COALESCE(OLD.role, 'none') || ' to ' || COALESCE(NEW.role, 'none') || ' for ' || NEW.name,
                auth.uid(),
                NEW.workspace_id,
                jsonb_build_object(
                    'user_name', NEW.name,
                    'user_email', NEW.email
                )
            );
        END IF;
        
        -- Workspace change (CRITICAL)
        IF OLD.workspace_id IS DISTINCT FROM NEW.workspace_id THEN
            PERFORM log_audit_change(
                'votum_users',
                NEW.id,
                'UPDATE',
                'workspace_id',
                to_jsonb(OLD.workspace_id),
                to_jsonb(NEW.workspace_id),
                'critical',
                'User workspace changed for ' || NEW.name,
                auth.uid(),
                NEW.workspace_id
            );
        END IF;
        
        -- Skills change
        IF OLD.skills IS DISTINCT FROM NEW.skills THEN
            PERFORM log_audit_change(
                'votum_users',
                NEW.id,
                'UPDATE',
                'skills',
                to_jsonb(OLD.skills),
                to_jsonb(NEW.skills),
                'minor',
                'User skills updated for ' || NEW.name,
                auth.uid(),
                NEW.workspace_id
            );
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_change(
            'votum_users',
            OLD.id,
            'DELETE',
            NULL,
            to_jsonb(OLD),
            NULL,
            'critical',
            'User deleted: ' || OLD.name || ' (' || COALESCE(OLD.email, 'no email') || ')',
            auth.uid(),
            OLD.workspace_id
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."audit_users_changes"() OWNER TO "postgres";


-- ── Triggers ────────────────────────────────────────────────────────────

CREATE OR REPLACE TRIGGER "audit_users_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."votum_users" FOR EACH ROW EXECUTE FUNCTION "public"."audit_users_changes"();


-- ── Row Level Security ──────────────────────────────────────────────────

ALTER TABLE "public"."designations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "designations_delete" ON "public"."designations" FOR DELETE USING (("workspace_id" IN ( SELECT "votum_users"."workspace_id"
   FROM "public"."votum_users"
  WHERE ("votum_users"."id" = "auth"."uid"()))));

CREATE POLICY "designations_insert" ON "public"."designations" FOR INSERT WITH CHECK (("workspace_id" IN ( SELECT "votum_users"."workspace_id"
   FROM "public"."votum_users"
  WHERE ("votum_users"."id" = "auth"."uid"()))));

CREATE POLICY "designations_select" ON "public"."designations" FOR SELECT USING (("workspace_id" IN ( SELECT "votum_users"."workspace_id"
   FROM "public"."votum_users"
  WHERE ("votum_users"."id" = "auth"."uid"()))));

CREATE POLICY "designations_update" ON "public"."designations" FOR UPDATE USING (("workspace_id" IN ( SELECT "votum_users"."workspace_id"
   FROM "public"."votum_users"
  WHERE ("votum_users"."id" = "auth"."uid"()))));

ALTER TABLE "public"."dggi_computed_deadlines" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace members can read computed deadlines" ON "public"."dggi_computed_deadlines" FOR SELECT USING (true);

ALTER TABLE "public"."dggi_notifications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace members can mark notifications read" ON "public"."dggi_notifications" FOR UPDATE USING (true);

CREATE POLICY "workspace members can read their notifications" ON "public"."dggi_notifications" FOR SELECT USING (true);

ALTER TABLE "public"."votum_workspace" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_select_own" ON "public"."votum_workspace" FOR SELECT USING (("id" IN ( SELECT "votum_users"."workspace_id"
   FROM "public"."votum_users"
  WHERE ("votum_users"."id" = "auth"."uid"()))));

CREATE POLICY "workspace_update_admin" ON "public"."votum_workspace" FOR UPDATE USING ((("id" IN ( SELECT "votum_users"."workspace_id"
   FROM "public"."votum_users"
  WHERE ("votum_users"."id" = "auth"."uid"()))) AND (EXISTS ( SELECT 1
   FROM "public"."votum_users"
  WHERE (("votum_users"."id" = "auth"."uid"()) AND ("votum_users"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"])))))));


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
          u.dggi_role IN ('ADC', 'JD', 'DD', 'AD')
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
          u.dggi_role IN ('ADC', 'JD', 'DD', 'AD')
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

CREATE OR REPLACE FUNCTION "public"."dggi_provisional_attachment_batch_page"("p_workspace_id" "text", "p_role" "text", "p_groups" "text"[], "p_uid" "uuid", "p_search" "text", "p_date_from" "text", "p_date_to" "text", "p_sort_col" "text", "p_sort_asc" boolean, "p_limit" integer, "p_offset" integer) RETURNS TABLE("batch_key" "text", "is_fallback" boolean, "date_of_attachment" "text", "date_of_scn_issuance" "text", "date_of_release" "text", "total_batches" bigint)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $_$
DECLARE
  v_sort_col text := COALESCE(NULLIF(p_sort_col, ''), 'created_at');
BEGIN
  RETURN QUERY EXECUTE format(
    $sql$
    WITH filtered AS (
      SELECT
        id,
        COALESCE(NULLIF(attachment_batch_id, ''), id::text) AS batch_key,
        (attachment_batch_id IS NULL OR attachment_batch_id = '')  AS is_fallback,
        date_of_attachment::text,
        date_of_scn_issuance::text,
        date_of_release::text,
        %1$I                                                       AS _sort_val,
        created_at
      FROM dggi_provisional_attachment_records
      WHERE workspace_id = %2$L
        AND (
          %3$L IN ('ADG', 'DD_INT')
          OR (
            %3$L IN ('IO', 'SIO')
            AND sio = %4$L::uuid
          )
          OR (
            %3$L IN ('ADC', 'JD', 'DD', 'AD')
            AND "group" = ANY(%5$L::text[])
          )
          OR (
            %3$L NOT IN ('ADG','DD_INT','IO','SIO','ADC','JD','DD','AD')
            AND "group" = '__none__'
          )
        )
        AND (%6$L = '' OR (
              person_name   ILIKE '%%' || %6$L || '%%'
           OR gstin_pan     ILIKE '%%' || %6$L || '%%'
           OR entity_gstin  ILIKE '%%' || %6$L || '%%'
           OR issue_involved ILIKE '%%' || %6$L || '%%'
           OR group_sio     ILIKE '%%' || %6$L || '%%'
        ))
        AND (%7$L = '' OR date_of_attachment::text >= %7$L)
        AND (%8$L = '' OR date_of_attachment::text <= %8$L)
    ),
    first_per_batch AS (
      SELECT DISTINCT ON (batch_key)
        batch_key,
        is_fallback,
        date_of_attachment,
        date_of_scn_issuance,
        date_of_release,
        _sort_val,
        created_at
      FROM filtered
      ORDER BY batch_key, %9$s
    ),
    ordered AS (
      SELECT *,
             COUNT(*) OVER () AS total_batches,
             ROW_NUMBER() OVER (ORDER BY %9$s) AS rn
      FROM first_per_batch
    )
    SELECT
      batch_key,
      is_fallback,
      date_of_attachment,
      date_of_scn_issuance,
      date_of_release,
      total_batches
    FROM ordered
    WHERE rn > %10$s AND rn <= %10$s + %11$s
    ORDER BY rn
    $sql$,
    v_sort_col,                                 -- %1$I  sort column (identifier)
    p_workspace_id,                             -- %2$L
    p_role,                                     -- %3$L
    p_uid,                                      -- %4$L
    p_groups,                                   -- %5$L
    p_search,                                   -- %6$L
    p_date_from,                                -- %7$L
    p_date_to,                                  -- %8$L
    CASE WHEN p_sort_asc
         THEN format('%I ASC, created_at ASC', v_sort_col)
         ELSE format('%I DESC, created_at DESC', v_sort_col)
    END,                                        -- %9$s  (ORDER BY fragment)
    p_offset,                                   -- %10$s
    p_limit                                     -- %11$s
  );
END;
$_$;


ALTER FUNCTION "public"."dggi_provisional_attachment_batch_page"("p_workspace_id" "text", "p_role" "text", "p_groups" "text"[], "p_uid" "uuid", "p_search" "text", "p_date_from" "text", "p_date_to" "text", "p_sort_col" "text", "p_sort_asc" boolean, "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


-- ── Grants ──────────────────────────────────────────────────────────────

GRANT ALL ON TABLE "public"."designations" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."designations" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."designations" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_alert_circular_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_alert_circular_records" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_alert_circular_records" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_arrest_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_arrest_records" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_arrest_records" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_closure_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_closure_records" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_closure_records" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_computed_deadlines" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_computed_deadlines" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_computed_deadlines" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_deadline_alerts_sent" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_deadline_alerts_sent" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_deadline_alerts_sent" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_incident_report_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_incident_report_records" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_incident_report_records" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_intel_closure_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_intel_closure_records" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_intel_closure_records" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_intel_other_source_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_intel_other_source_records" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_intel_other_source_records" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_intel_rapid_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_intel_rapid_records" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_intel_rapid_records" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_modus_operandi_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_modus_operandi_records" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_modus_operandi_records" TO "service_role";

GRANT ALL ON TABLE "public"."dggi_mpr_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_non_ir_case_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_non_ir_case_records" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_non_ir_case_records" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_notifications" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_notifications" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_notifications" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_prosecution_arrest_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_prosecution_arrest_records" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_prosecution_arrest_records" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_prosecution_non_arrest_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_prosecution_non_arrest_records" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_prosecution_non_arrest_records" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_provisional_attachment_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_provisional_attachment_records" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_provisional_attachment_records" TO "service_role";

GRANT ALL ON TABLE "public"."dggi_records" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_records" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_report_compliance_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_report_compliance_records" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_report_compliance_records" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_scn_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_scn_records" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_scn_records" TO "service_role";

GRANT ALL ON TABLE "public"."dggi_seizure_records" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_seizure_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_seizure_records" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_str_records" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_str_records" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_str_records" TO "service_role";

GRANT ALL ON TABLE "public"."dggi_user_group_assignments" TO PUBLIC;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_user_group_assignments" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_user_group_assignments" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_users" TO PUBLIC;

GRANT ALL ON TABLE "public"."votum_users" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_users" TO "authenticated";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_workspace" TO PUBLIC;

GRANT ALL ON TABLE "public"."votum_workspace" TO "service_role";

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_workspace" TO "authenticated";
