


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "ai";


ALTER SCHEMA "ai" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgsodium";








ALTER SCHEMA "public" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "ltree" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_jsonschema" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgmq";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."approval_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'withdrawn'
);


ALTER TYPE "public"."approval_status" OWNER TO "postgres";


CREATE TYPE "public"."approval_type" AS ENUM (
    'section_completion',
    'case_closure',
    'adjudication',
    'transfer',
    'recovery'
);


ALTER TYPE "public"."approval_type" OWNER TO "postgres";


CREATE TYPE "public"."audit_action" AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'LOGIN',
    'LOGOUT',
    'EXPORT',
    'SHARE'
);


ALTER TYPE "public"."audit_action" OWNER TO "postgres";


CREATE TYPE "public"."audit_change_category" AS ENUM (
    'critical',
    'important',
    'minor',
    'system'
);


ALTER TYPE "public"."audit_change_category" OWNER TO "postgres";


CREATE TYPE "public"."case_status" AS ENUM (
    'initiated',
    'under_inquiry',
    'pending_approval',
    'adjudication_pending',
    'recovery_pending',
    'transferred',
    'closed',
    'court_matter'
);


ALTER TYPE "public"."case_status" OWNER TO "postgres";


CREATE TYPE "public"."gst_application_type" AS ENUM (
    'complaint_proposal',
    'information_proposal',
    'research_proposal',
    'others'
);


ALTER TYPE "public"."gst_application_type" OWNER TO "postgres";


CREATE TYPE "public"."gst_approval_action" AS ENUM (
    'submit',
    'approve',
    'reject',
    'request_changes'
);


ALTER TYPE "public"."gst_approval_action" OWNER TO "postgres";


CREATE TYPE "public"."gst_case_status" AS ENUM (
    'draft',
    'pending_approval',
    'approved',
    'under_execution',
    'completed',
    'closed',
    'rejected'
);


ALTER TYPE "public"."gst_case_status" OWNER TO "postgres";


CREATE TYPE "public"."gst_designation" AS ENUM (
    'assistant_commissioner',
    'deputy_commissioner_enforcement_coordination',
    'additional_commissioner_enforcement',
    'special_commissioner',
    'joint_commissioner',
    'deputy_commissioner_enforcement'
);


ALTER TYPE "public"."gst_designation" OWNER TO "postgres";


CREATE TYPE "public"."gst_milestone_type" AS ENUM (
    'basic_details',
    'search_time',
    'interim_report',
    'recovery',
    'adjudication_finished'
);


ALTER TYPE "public"."gst_milestone_type" OWNER TO "postgres";


CREATE TYPE "public"."gst_proposal_role" AS ENUM (
    'assistant_commissioner_khangi',
    'deputy_commissioner_enforcement_coordination',
    'additional_commissioner_enforcement',
    'special_commissioner_state',
    'joint_commissioner',
    'deputy_commissioner_enforcement',
    'admin'
);


ALTER TYPE "public"."gst_proposal_role" OWNER TO "postgres";


CREATE TYPE "public"."gst_user_role" AS ENUM (
    'khangi_branch',
    'monitoring_officer',
    'jc_office',
    'inquiry_officer',
    'admin'
);


ALTER TYPE "public"."gst_user_role" OWNER TO "postgres";


CREATE TYPE "public"."org_unit_type" AS ENUM (
    'hq',
    'hq_branch',
    'division',
    'range',
    'unit',
    'office',
    'practice_group',
    'team',
    'department',
    'other'
);


ALTER TYPE "public"."org_unit_type" OWNER TO "postgres";


CREATE TYPE "public"."organization_type" AS ENUM (
    'government',
    'law_firm',
    'corporate_legal',
    'other',
    'district',
    'police'
);


ALTER TYPE "public"."organization_type" OWNER TO "postgres";


CREATE TYPE "public"."proposal_status" AS ENUM (
    'submitted',
    'under_review',
    'approved',
    'rejected',
    'in_execution',
    'completed'
);


ALTER TYPE "public"."proposal_status" OWNER TO "postgres";


CREATE TYPE "public"."proposal_type" AS ENUM (
    'complaint_to_proposal',
    'information_to_proposal',
    'research_proposal',
    'others'
);


ALTER TYPE "public"."proposal_type" OWNER TO "postgres";


CREATE TYPE "public"."section_status" AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'locked'
);


ALTER TYPE "public"."section_status" OWNER TO "postgres";


CREATE TYPE "public"."submitting_office_type" AS ENUM (
    'joint_commissioner_state_tax',
    'deputy_commissioner_enforcement',
    'flying_squad_unit',
    'deputy_commissioner_enforcement_coordination'
);


ALTER TYPE "public"."submitting_office_type" OWNER TO "postgres";


CREATE TYPE "public"."template_visibility" AS ENUM (
    'private',
    'shared',
    'org'
);


ALTER TYPE "public"."template_visibility" OWNER TO "postgres";


CREATE TYPE "public"."translation_status" AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'failed'
);


ALTER TYPE "public"."translation_status" OWNER TO "postgres";


CREATE TYPE "public"."translation_type" AS ENUM (
    'simple',
    'complex',
    'markdown',
    'json',
    'human'
);


ALTER TYPE "public"."translation_type" OWNER TO "postgres";


CREATE TYPE "public"."trust_transaction_status" AS ENUM (
    'pending',
    'completed',
    'failed',
    'cancelled',
    'reconciled'
);


ALTER TYPE "public"."trust_transaction_status" OWNER TO "postgres";


CREATE TYPE "public"."trust_transaction_type" AS ENUM (
    'deposit',
    'withdrawal',
    'transfer',
    'interest',
    'fee',
    'adjustment',
    'refund'
);


ALTER TYPE "public"."trust_transaction_type" OWNER TO "postgres";


CREATE TYPE "public"."user_designation" AS ENUM (
    'additional_commissioner_enforcement',
    'special_commissioner',
    'joint_commissioner',
    'deputy_commissioner_enforcement',
    'deputy_commissioner_coordination',
    'assistant_commissioner_khangi',
    'monitoring_officer',
    'investigation_officer'
);


ALTER TYPE "public"."user_designation" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_credits"("p_user_id" "uuid", "p_workspace_id" "text", "p_amount" integer, "p_type" "text", "p_description" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get current balance with lock
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id AND workspace_id = p_workspace_id
  FOR UPDATE;

  -- Create record if doesn't exist
  IF v_current_balance IS NULL THEN
    INSERT INTO user_credits (user_id, workspace_id, balance)
    VALUES (p_user_id, p_workspace_id, 0)
    ON CONFLICT (user_id, workspace_id) DO NOTHING;
    v_current_balance := 0;
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance + p_amount;

  -- Update balance and totals
  IF p_type = 'purchase' THEN
    UPDATE user_credits
    SET balance = v_new_balance,
        total_purchased = total_purchased + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id AND workspace_id = p_workspace_id;
  ELSIF p_type = 'bonus' OR p_type = 'grant' THEN
    UPDATE user_credits
    SET balance = v_new_balance,
        total_bonus = total_bonus + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id AND workspace_id = p_workspace_id;
  ELSE
    UPDATE user_credits
    SET balance = v_new_balance,
        updated_at = NOW()
    WHERE user_id = p_user_id AND workspace_id = p_workspace_id;
  END IF;

  -- Create transaction record
  INSERT INTO credit_transactions (
    user_id, workspace_id, type, amount,
    balance_before, balance_after, description
  ) VALUES (
    p_user_id, p_workspace_id, p_type, p_amount,
    v_current_balance, v_new_balance, p_description
  ) RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'balance_before', v_current_balance,
    'balance_after', v_new_balance,
    'amount_added', p_amount
  );
END;
$$;


ALTER FUNCTION "public"."add_credits"("p_user_id" "uuid", "p_workspace_id" "text", "p_amount" integer, "p_type" "text", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."advance_address_workflow"("address_uuid" "uuid", "approver_uuid" "uuid", "action_taken" "text", "comments_text" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_step_rec RECORD;
    next_step_order INTEGER;
    new_status TEXT;
BEGIN
    -- Get current step
    SELECT * INTO current_step_rec 
    FROM gst_address_approvals 
    WHERE address_id = address_uuid AND is_current_step = TRUE;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update current step
    UPDATE gst_address_approvals 
    SET action = action_taken, 
        comments = comments_text, 
        action_date = NOW(), 
        approver_id = approver_uuid,
        is_current_step = FALSE
    WHERE id = current_step_rec.id;
    
    IF action_taken = 'approve' THEN
        -- Determine next step
        next_step_order := current_step_rec.step_order + 1;
        
        CASE current_step_rec.step_order
            WHEN 1 THEN new_status := 'verified_by_khangi';
            WHEN 2 THEN new_status := 'approved_by_coordination';
            WHEN 3 THEN new_status := 'approved_by_additional_commissioner';
            WHEN 4 THEN new_status := 'approved_for_execution';
        END CASE;
        
        -- If there's a next step, activate it
        IF next_step_order <= 4 THEN
            UPDATE gst_address_approvals 
            SET is_current_step = TRUE
            WHERE address_id = address_uuid AND step_order = next_step_order;
        END IF;
        
    ELSIF action_taken = 'reject' THEN
        new_status := 'rejected';
    ELSIF action_taken = 'request_changes' THEN
        new_status := 'returned_for_revision';
    END IF;
    
    -- Update address status
    UPDATE gst_proposal_business_addresses 
    SET status = new_status, updated_at = NOW()
    WHERE id = address_uuid;
    
    -- Update overall proposal status based on all addresses
    PERFORM update_proposal_status_from_addresses((
        SELECT p.id FROM gst_proposals p
        JOIN gst_proposal_businesses b ON p.id = b.proposal_id
        JOIN gst_proposal_business_addresses a ON b.id = a.business_id
        WHERE a.id = address_uuid
        LIMIT 1
    ));
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."advance_address_workflow"("address_uuid" "uuid", "approver_uuid" "uuid", "action_taken" "text", "comments_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."advance_execution_workflow"("case_uuid" "uuid", "implementer_uuid" "uuid", "action_taken" "text", "notes_text" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_step_rec RECORD;
    next_step_order INTEGER;
    new_status TEXT;
BEGIN
    -- Get current step
    SELECT * INTO current_step_rec 
    FROM gst_case_execution_steps 
    WHERE case_id = case_uuid AND is_current_step = TRUE;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update current step (implementer_uuid should now be gst_user_designations.id)
    UPDATE gst_case_execution_steps 
    SET action = action_taken, 
        completion_notes = notes_text, 
        action_date = NOW(), 
        implementer_id = implementer_uuid,
        status = 'completed',
        is_current_step = FALSE
    WHERE id = current_step_rec.id;
    
    -- Determine next step and case status
    next_step_order := current_step_rec.step_order + 1;
    
    CASE current_step_rec.step_order
        WHEN 1 THEN new_status := 'execution_approved';
        WHEN 2 THEN new_status := 'under_execution_coordination';
        WHEN 3 THEN new_status := 'officers_assigned';
        WHEN 4 THEN new_status := 'under_execution';
    END CASE;
    
    -- If there's a next step, activate it
    IF next_step_order <= 4 THEN
        UPDATE gst_case_execution_steps 
        SET is_current_step = TRUE
        WHERE case_id = case_uuid AND step_order = next_step_order;
    ELSE
        new_status := 'execution_completed';
    END IF;
    
    -- Update case status
    UPDATE gst_enforcement_cases 
    SET status = new_status, updated_at = NOW()
    WHERE id = case_uuid;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."advance_execution_workflow"("case_uuid" "uuid", "implementer_uuid" "uuid", "action_taken" "text", "notes_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."advance_proposal_workflow"("proposal_uuid" "uuid", "approver_uuid" "uuid", "action_taken" "text", "comments_text" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_step_rec RECORD;
    next_step_order INTEGER;
    new_status TEXT;
BEGIN
    -- Get current step
    SELECT * INTO current_step_rec 
    FROM gst_proposal_approvals 
    WHERE proposal_id = proposal_uuid AND is_current_step = TRUE;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update current step (approver_uuid should now be gst_user_designations.id)
    UPDATE gst_proposal_approvals 
    SET action = action_taken, 
        comments = comments_text, 
        action_date = NOW(), 
        approver_id = approver_uuid,
        is_current_step = FALSE
    WHERE id = current_step_rec.id;
    
    IF action_taken = 'approve' THEN
        -- Determine next step
        next_step_order := current_step_rec.step_order + 1;
        
        CASE current_step_rec.step_order
            WHEN 1 THEN new_status := 'verified_by_khangi';
            WHEN 2 THEN new_status := 'approved_by_coordination';
            WHEN 3 THEN new_status := 'approved_by_additional_commissioner';
            WHEN 4 THEN new_status := 'approved_for_execution';
        END CASE;
        
        -- If there's a next step, activate it
        IF next_step_order <= 4 THEN
            UPDATE gst_proposal_approvals 
            SET is_current_step = TRUE
            WHERE proposal_id = proposal_uuid AND step_order = next_step_order;
        END IF;
        
    ELSIF action_taken = 'reject' THEN
        new_status := 'rejected';
    ELSIF action_taken = 'request_changes' THEN
        new_status := 'returned_for_revision';
    END IF;
    
    -- Update proposal status
    UPDATE gst_proposals 
    SET status = new_status, updated_at = NOW()
    WHERE id = proposal_uuid;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."advance_proposal_workflow"("proposal_uuid" "uuid", "approver_uuid" "uuid", "action_taken" "text", "comments_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."append_to_pdf_array"("email_to_update" "text", "new_pdf_element" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE annotators
  SET pdfs = array_append(pdfs, new_pdf_element)
  WHERE email = email_to_update;
END;
$$;


ALTER FUNCTION "public"."append_to_pdf_array"("email_to_update" "text", "new_pdf_element" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_cases_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_change(
            'votum_cases',
            NULL,
            'INSERT',
            NULL,
            NULL,
            to_jsonb(NEW),
            'important',
            'Case created',
            auth.uid(),
            NEW.workspace_id,
            jsonb_build_object(
                'case_id', NEW.id,
                'case_no', NEW.case_no,
                'cin_no', NEW.cin_no
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_audit_change(
            'votum_cases',
            NULL,
            'UPDATE',
            NULL,
            to_jsonb(OLD),
            to_jsonb(NEW),
            'important',
            'Case updated',
            auth.uid(),
            NEW.workspace_id,
            jsonb_build_object(
                'case_id', NEW.id,
                'case_no', NEW.case_no,
                'cin_no', NEW.cin_no
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_change(
            'votum_cases',
            NULL,
            'DELETE',
            NULL,
            to_jsonb(OLD),
            NULL,
            'critical',
            'Case deleted',
            auth.uid(),
            OLD.workspace_id,
            jsonb_build_object(
                'case_id', OLD.id,
                'case_no', OLD.case_no,
                'cin_no', OLD.cin_no
            )
        );
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."audit_cases_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_invoice_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_change(
            'votum_invoice',
            NEW.id,
            'INSERT',
            NULL,
            NULL,
            to_jsonb(NEW),
            'important',
            'Invoice created: #' || COALESCE(NEW.invoice_number::text, 'No number') || ' for ' || COALESCE(NEW.total_amount::text, '0'),
            auth.uid(),
            NEW.workspace_id
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Amount change
        IF OLD.total_amount IS DISTINCT FROM NEW.total_amount THEN
            PERFORM log_audit_change(
                'votum_invoice',
                NEW.id,
                'UPDATE',
                'total_amount',
                to_jsonb(OLD.total_amount),
                to_jsonb(NEW.total_amount),
                'important',
                'Invoice amount changed from ' || COALESCE(OLD.total_amount::text, '0') || ' to ' || COALESCE(NEW.total_amount::text, '0'),
                auth.uid(),
                NEW.workspace_id
            );
        END IF;
        
        -- Billed status change
        IF OLD.billed IS DISTINCT FROM NEW.billed THEN
            PERFORM log_audit_change(
                'votum_invoice',
                NEW.id,
                'UPDATE',
                'billed',
                to_jsonb(OLD.billed),
                to_jsonb(NEW.billed),
                'important',
                'Invoice billing status changed to ' || CASE WHEN NEW.billed THEN 'billed' ELSE 'not billed' END,
                auth.uid(),
                NEW.workspace_id
            );
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_change(
            'votum_invoice',
            OLD.id,
            'DELETE',
            NULL,
            to_jsonb(OLD),
            NULL,
            'critical',
            'Invoice deleted: #' || COALESCE(OLD.invoice_number::text, 'No number'),
            auth.uid(),
            OLD.workspace_id
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."audit_invoice_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_notes_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_change(
            'votum_notes',
            NEW.id,
            'INSERT',
            NULL,
            NULL,
            to_jsonb(NEW),
            'minor',
            'Note created: ' || COALESCE(NEW.title, 'Untitled note'),
            NEW.last_updated_by,
            NEW.workspace_id
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Title change
        IF OLD.title IS DISTINCT FROM NEW.title THEN
            PERFORM log_audit_change(
                'votum_notes',
                NEW.id,
                'UPDATE',
                'title',
                to_jsonb(OLD.title),
                to_jsonb(NEW.title),
                'minor',
                'Note title changed from "' || COALESCE(OLD.title, '') || '" to "' || COALESCE(NEW.title, '') || '"',
                NEW.last_updated_by,
                NEW.workspace_id
            );
        END IF;
        
        -- Content change (just log that it was updated, not the full content)
        IF OLD.note IS DISTINCT FROM NEW.note THEN
            PERFORM log_audit_change(
                'votum_notes',
                NEW.id,
                'UPDATE',
                'note',
                NULL, -- Don't store full content in audit log
                NULL,
                'minor',
                'Note content updated: ' || COALESCE(NEW.title, 'Untitled note'),
                NEW.last_updated_by,
                NEW.workspace_id
            );
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_change(
            'votum_notes',
            OLD.id,
            'DELETE',
            NULL,
            to_jsonb(OLD),
            NULL,
            'important',
            'Note deleted: ' || COALESCE(OLD.title, 'Untitled note'),
            OLD.last_updated_by,
            OLD.workspace_id
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."audit_notes_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_task_assignees_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_old_user_name text;
  v_workspace_id  uuid;
BEGIN
  SELECT name         INTO v_old_user_name FROM votum_users WHERE id = OLD.user_id;
  SELECT workspace_id INTO v_workspace_id  FROM votum_tasks  WHERE id = OLD.task_id;

  INSERT INTO votum_audit_logs (
    table_name, record_id, action, field_name,
    old_value, new_value, user_id, workspace_id
  ) VALUES (
    'task_assignees', OLD.task_id, 'UPDATE', 'assigned_to',
    to_jsonb(v_old_user_name), NULL, auth.uid(), v_workspace_id
  );

  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."audit_task_assignees_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_task_assignees_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_new_user_name text;
  v_workspace_id  uuid;
BEGIN
  SELECT name         INTO v_new_user_name FROM votum_users WHERE id = NEW.user_id;
  SELECT workspace_id INTO v_workspace_id  FROM votum_tasks  WHERE id = NEW.task_id;

  INSERT INTO votum_audit_logs (
    table_name, record_id, action, field_name,
    old_value, new_value, user_id, workspace_id
  ) VALUES (
    'task_assignees', NEW.task_id, 'UPDATE', 'assigned_to',
    NULL, to_jsonb(v_new_user_name), NEW.assigned_by, v_workspace_id
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."audit_task_assignees_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_time_entries_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_change(
            'votum_time_entries',
            NEW.id,
            'INSERT',
            NULL,
            NULL,
            to_jsonb(NEW),
            'minor',
            'Time entry added: ' || NEW.description || ' (' || (NEW.duration / 3600.0) || ' hours)',
            NEW.user_id,
            NEW.workspace_id
        );
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_audit_change(
            'votum_time_entries',
            NEW.id,
            'UPDATE',
            NULL,
            to_jsonb(OLD),
            to_jsonb(NEW),
            'minor',
            'Time entry updated',
            NEW.user_id,
            NEW.workspace_id
        );
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_change(
            'votum_time_entries',
            OLD.id,
            'DELETE',
            NULL,
            to_jsonb(OLD),
            NULL,
            'important',
            'Time entry deleted: ' || OLD.description,
            OLD.user_id,
            OLD.workspace_id
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."audit_time_entries_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_trust_accounts_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_change(
            'votum_trust_accounts',
            NEW.id,
            'INSERT',
            NULL,
            NULL,
            to_jsonb(NEW),
            'critical',
            'Trust account created: ' || NEW.account_name || ' (Balance: ' || NEW.balance || ')',
            NEW.last_updated_by,
            NEW.workspace_id
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Balance change (CRITICAL)
        IF OLD.balance != NEW.balance THEN
            PERFORM log_audit_change(
                'votum_trust_accounts',
                NEW.id,
                'UPDATE',
                'balance',
                to_jsonb(OLD.balance),
                to_jsonb(NEW.balance),
                'critical',
                'Trust account balance changed from ' || OLD.balance || ' to ' || NEW.balance || ' (' || NEW.account_name || ')',
                NEW.last_updated_by,
                NEW.workspace_id,
                jsonb_build_object(
                    'account_name', NEW.account_name,
                    'balance_change', NEW.balance - OLD.balance
                )
            );
        END IF;
        
        -- Status change
        IF OLD.status != NEW.status THEN
            PERFORM log_audit_change(
                'votum_trust_accounts',
                NEW.id,
                'UPDATE',
                'status',
                to_jsonb(OLD.status),
                to_jsonb(NEW.status),
                'important',
                'Trust account status changed from ' || OLD.status || ' to ' || NEW.status,
                NEW.last_updated_by,
                NEW.workspace_id
            );
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_change(
            'votum_trust_accounts',
            OLD.id,
            'DELETE',
            NULL,
            to_jsonb(OLD),
            NULL,
            'critical',
            'Trust account deleted: ' || OLD.account_name || ' (Final balance: ' || OLD.balance || ')',
            OLD.last_updated_by,
            OLD.workspace_id
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."audit_trust_accounts_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_trust_transactions_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_account_name text;
BEGIN
    -- Get account name for better description
    SELECT account_name INTO v_account_name 
    FROM votum_trust_accounts 
    WHERE id = COALESCE(NEW.trust_account_id, OLD.trust_account_id);
    
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_change(
            'votum_trust_transactions',
            NEW.id,
            'INSERT',
            NULL,
            NULL,
            to_jsonb(NEW),
            'critical',
            'Trust transaction created: ' || NEW.transaction_type || ' of ' || NEW.amount || ' (' || COALESCE(v_account_name, 'Unknown account') || ')',
            NEW.created_by,
            NEW.workspace_id,
            jsonb_build_object(
                'account_name', v_account_name,
                'transaction_type', NEW.transaction_type,
                'amount', NEW.amount
            )
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Status change
        IF OLD.status != NEW.status THEN
            PERFORM log_audit_change(
                'votum_trust_transactions',
                NEW.id,
                'UPDATE',
                'status',
                to_jsonb(OLD.status),
                to_jsonb(NEW.status),
                'important',
                'Trust transaction status changed from ' || OLD.status || ' to ' || NEW.status,
                NEW.updated_by,
                NEW.workspace_id
            );
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_change(
            'votum_trust_transactions',
            OLD.id,
            'DELETE',
            NULL,
            to_jsonb(OLD),
            NULL,
            'critical',
            'Trust transaction deleted: ' || OLD.transaction_type || ' of ' || OLD.amount || ' (' || COALESCE(v_account_name, 'Unknown account') || ')',
            OLD.created_by,
            OLD.workspace_id
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."audit_trust_transactions_changes"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."audit_votum_tasks_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_change_desc text;
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_change(
            'votum_tasks',
            NEW.id,
            'INSERT',
            NULL,
            NULL,
            to_jsonb(NEW),
            'important',
            'Task created: ' || NEW.name,
            NEW.last_updated_by,
            NEW.workspace_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Task name change
        IF OLD.name != NEW.name THEN
            PERFORM log_audit_change(
                'votum_tasks',
                NEW.id,
                'UPDATE',
                'name',
                to_jsonb(OLD.name),
                to_jsonb(NEW.name),
                'minor',
                'Task name changed from "' || OLD.name || '" to "' || NEW.name || '"',
                NEW.last_updated_by,
                NEW.workspace_id
            );
        END IF;

        -- Status change
        IF OLD.status != NEW.status THEN
            v_change_desc := 'Task status changed from ' ||
                            CASE OLD.status
                                WHEN 0 THEN 'Todo'
                                WHEN 1 THEN 'In Progress'
                                WHEN 2 THEN 'In Review'
                                WHEN 3 THEN 'Done'
                                ELSE 'Unknown'
                            END || ' to ' ||
                            CASE NEW.status
                                WHEN 0 THEN 'Todo'
                                WHEN 1 THEN 'In Progress'
                                WHEN 2 THEN 'In Review'
                                WHEN 3 THEN 'Done'
                                ELSE 'Unknown'
                            END;
            PERFORM log_audit_change(
                'votum_tasks',
                NEW.id,
                'UPDATE',
                'status',
                to_jsonb(OLD.status),
                to_jsonb(NEW.status),
                'important',
                v_change_desc,
                NEW.last_updated_by,
                NEW.workspace_id
            );
        END IF;

        -- Due date change
        IF OLD."dueDate" IS DISTINCT FROM NEW."dueDate" THEN
            PERFORM log_audit_change(
                'votum_tasks',
                NEW.id,
                'UPDATE',
                'dueDate',
                to_jsonb(OLD."dueDate"),
                to_jsonb(NEW."dueDate"),
                'important',
                'Due date changed from ' ||
                COALESCE(OLD."dueDate"::text, 'No due date') ||
                ' to ' ||
                COALESCE(NEW."dueDate"::text, 'No due date'),
                NEW.last_updated_by,
                NEW.workspace_id
            );
        END IF;

        -- Priority change
        IF OLD.priority != NEW.priority THEN
            PERFORM log_audit_change(
                'votum_tasks',
                NEW.id,
                'UPDATE',
                'priority',
                to_jsonb(OLD.priority),
                to_jsonb(NEW.priority),
                'minor',
                'Priority changed from ' || OLD.priority || ' to ' || NEW.priority,
                NEW.last_updated_by,
                NEW.workspace_id
            );
        END IF;

        -- Documents change
        IF OLD.documents IS DISTINCT FROM NEW.documents THEN
            PERFORM log_audit_change(
                'votum_tasks',
                NEW.id,
                'UPDATE',
                'documents',
                OLD.documents,
                NEW.documents,
                'minor',
                'Task documents updated',
                NEW.last_updated_by,
                NEW.workspace_id
            );
        END IF;

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_change(
            'votum_tasks',
            OLD.id,
            'DELETE',
            NULL,
            to_jsonb(OLD),
            NULL,
            'critical',
            'Task deleted: ' || OLD.name,
            OLD.last_updated_by,
            OLD.workspace_id
        );
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."audit_votum_tasks_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_create_address_approval_workflow"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only create workflow if address is not in draft status
    IF NEW.status != 'draft' THEN
        PERFORM create_address_approval_workflow(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_create_address_approval_workflow"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_create_case_timeframes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only create timeframes if inquiry_date is set
    IF NEW.inquiry_date IS NOT NULL THEN
        PERFORM initialize_case_timeframes(
            NEW.id,
            NEW.workspace_id,
            NEW.inquiry_date,
            NEW.created_by
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_create_case_timeframes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_generate_proposal_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If proposal_number is null or empty, generate it
    IF NEW.proposal_number IS NULL OR NEW.proposal_number = '' THEN
        NEW.proposal_number := generate_proposal_number(NEW.workspace_id);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_generate_proposal_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bm25"("tsvector", "tsquery") RETURNS double precision
    LANGUAGE "sql" STABLE
    AS $_$
      select ts_rank_cd($1, $2);
    $_$;


ALTER FUNCTION "public"."bm25"("tsvector", "tsquery") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_api_cost"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  input_cost_per_1k DECIMAL(10,6);
  output_cost_per_1k DECIMAL(10,6);
BEGIN
  -- Define pricing per 1K tokens for different models
  -- These rates should be updated based on actual provider pricing
  CASE NEW.model
    WHEN 'gemini-pro' THEN
      input_cost_per_1k := 0.0005;  -- $0.0005 per 1K input tokens
      output_cost_per_1k := 0.0015; -- $0.0015 per 1K output tokens
    WHEN 'gpt-4' THEN
      input_cost_per_1k := 0.03;    -- $0.03 per 1K input tokens
      output_cost_per_1k := 0.06;   -- $0.06 per 1K output tokens
    WHEN 'gpt-3.5-turbo' THEN
      input_cost_per_1k := 0.0015;  -- $0.0015 per 1K input tokens
      output_cost_per_1k := 0.002;  -- $0.002 per 1K output tokens
    WHEN 'mistral-small-latest' THEN
      input_cost_per_1k := 0.001;   -- $0.001 per 1K input tokens
      output_cost_per_1k := 0.003;  -- $0.003 per 1K output tokens
    ELSE
      input_cost_per_1k := 0.001;   -- Default rate
      output_cost_per_1k := 0.003;  -- Default rate
  END CASE;
  
  -- Calculate total cost
  NEW.cost_usd := 
    (NEW.input_tokens * input_cost_per_1k / 1000) + 
    (NEW.output_tokens * output_cost_per_1k / 1000);
    
  RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."calculate_api_cost"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_timeframe_deviance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only calculate if completion_date is being set
    IF NEW.completion_date IS NOT NULL AND (OLD.completion_date IS NULL OR OLD.completion_date != NEW.completion_date) THEN
        -- Calculate days taken
        NEW.days_taken := EXTRACT(EPOCH FROM (NEW.completion_date - NEW.start_date)) / 86400;
        
        -- Calculate deviance (positive = overdue, negative = early)
        NEW.deviance_days := NEW.days_taken - NEW.target_days;
        
        -- Calculate percentage deviance
        NEW.deviance_percentage := CASE 
            WHEN NEW.target_days > 0 THEN 
                ROUND((NEW.deviance_days::NUMERIC / NEW.target_days::NUMERIC) * 100, 2)
            ELSE 0
        END;
        
        -- Set completion status
        NEW.is_completed := TRUE;
        NEW.is_overdue := NEW.deviance_days > 0;
        
    -- If completion_date is removed, reset calculated fields
    ELSIF NEW.completion_date IS NULL AND OLD.completion_date IS NOT NULL THEN
        NEW.days_taken := NULL;
        NEW.deviance_days := NULL;
        NEW.deviance_percentage := NULL;
        NEW.is_completed := FALSE;
        NEW.is_overdue := FALSE;
    END IF;
    
    -- Update timestamp
    NEW.updated_at := now();
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_timeframe_deviance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_section_access"("section_name" character varying, "field_name" character varying, "user_designation" "public"."user_designation", "operation" character varying) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    access_granted BOOLEAN := false;
BEGIN
    SELECT 
        CASE 
            WHEN operation = 'read' THEN can_read
            WHEN operation = 'write' THEN can_write
            ELSE false
        END INTO access_granted
    FROM section_access_control 
    WHERE section_access_control.section_name = check_section_access.section_name 
    AND (section_access_control.field_name = check_section_access.field_name OR section_access_control.field_name = '*')
    AND designation = user_designation
    LIMIT 1;
    
    RETURN COALESCE(access_granted, false);
END;
$$;


ALTER FUNCTION "public"."check_section_access"("section_name" character varying, "field_name" character varying, "user_designation" "public"."user_designation", "operation" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_postings_workspace_consistency"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
    declare
      v_user_workspace uuid;
      v_designation_workspace uuid;
      v_org_unit_workspace uuid;
    begin
      select workspace_id
      into v_user_workspace
      from public.votum_users
      where id = new.user_id;

      if v_user_workspace is null then
        raise exception 'User % does not exist in votum_users', new.user_id;
      end if;

      if new.workspace_id <> v_user_workspace then
        raise exception 'user_postings.workspace_id must match votum_users.workspace_id';
      end if;

      if new.designation_id is not null then
        select workspace_id
        into v_designation_workspace
        from public.designations
        where id = new.designation_id;

        if v_designation_workspace is null or v_designation_workspace <> new.workspace_id then
          raise exception 'designation_id must belong to the same workspace';
        end if;
      end if;

      if new.org_unit_id is not null then
        select workspace_id
        into v_org_unit_workspace
        from public.org_units
        where id = new.org_unit_id;

        if v_org_unit_workspace is null or v_org_unit_workspace <> new.workspace_id then
          raise exception 'org_unit_id must belong to the same workspace';
        end if;
      end if;

      return new;
    end;
    $$;


ALTER FUNCTION "public"."check_user_postings_workspace_consistency"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."keyword_alert_task_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "run_id" "uuid" NOT NULL,
    "court_type" "text" NOT NULL,
    "state_code" "text",
    "dist_code" "text",
    "court_code" "text",
    "court_complex_code_full" "text",
    "bench_id" "text",
    "location" "text",
    "commission_type_id" "text",
    "commission_id" "text",
    "court_label" "text" NOT NULL,
    "keyword" "text" NOT NULL,
    "search_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "claimed_by" "text",
    "claimed_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "error_message" "text",
    "retry_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "year" "text",
    CONSTRAINT "keyword_alert_task_queue_court_type_check" CHECK (("court_type" = ANY (ARRAY['DC'::"text", 'HC'::"text", 'NCLT'::"text", 'NCLAT'::"text", 'DRT'::"text", 'DRAT'::"text", 'SCI'::"text", 'NCDRC'::"text", 'SCDRC'::"text", 'DCDRC'::"text"]))),
    CONSTRAINT "keyword_alert_task_queue_search_type_check" CHECK (("search_type" = 'party_name'::"text")),
    CONSTRAINT "keyword_alert_task_queue_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'claimed'::"text", 'done'::"text", 'failed'::"text", 'timeout'::"text"])))
);


ALTER TABLE "public"."keyword_alert_task_queue" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_keyword_tasks"("p_run_id" "uuid", "p_worker_id" "text", "p_batch_size" integer DEFAULT 10, "p_court_types" "text"[] DEFAULT ARRAY['DC'::"text", 'HC'::"text"]) RETURNS SETOF "public"."keyword_alert_task_queue"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH batch AS (
        SELECT id
        FROM keyword_alert_task_queue
        WHERE run_id = p_run_id
          AND status = 'pending'
          AND court_type = ANY(p_court_types)
        ORDER BY id
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    )
    UPDATE keyword_alert_task_queue t
    SET status = 'claimed',
        claimed_by = p_worker_id,
        claimed_at = now()
    FROM batch
    WHERE t.id = batch.id
    RETURNING t.*;
END;
$$;


ALTER FUNCTION "public"."claim_keyword_tasks"("p_run_id" "uuid", "p_worker_id" "text", "p_batch_size" integer, "p_court_types" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_delegation_on_entity_deletion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- This is handled by CASCADE constraints, but we can add logging here if needed
  -- Just return OLD for the trigger
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."cleanup_delegation_on_entity_deletion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_audit_logs"("retention_days" integer DEFAULT 365) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM votum_audit_logs 
    WHERE created_at < (CURRENT_DATE - INTERVAL '1 day' * retention_days)
    AND change_category NOT IN ('critical'); -- Keep critical logs longer
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup action
    PERFORM log_audit_change(
        'system',
        NULL,
        'DELETE',
        NULL,
        NULL,
        to_jsonb(deleted_count),
        'system',
        'Cleaned up ' || deleted_count || ' old audit logs (older than ' || retention_days || ' days)',
        auth.uid(),
        NULL,
        jsonb_build_object('retention_days', retention_days, 'deleted_count', deleted_count)
    );
    
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_audit_logs"("retention_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_milestone"("p_case_id" "uuid", "p_milestone_type" "public"."gst_milestone_type", "p_completion_date" timestamp with time zone DEFAULT "now"(), "p_notes" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    milestone_exists BOOLEAN;
BEGIN
    -- Check if milestone exists
    SELECT EXISTS(
        SELECT 1 FROM gst_case_timeframes 
        WHERE case_id = p_case_id AND milestone_type = p_milestone_type
    ) INTO milestone_exists;
    
    IF NOT milestone_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Update the milestone
    UPDATE gst_case_timeframes 
    SET 
        completion_date = p_completion_date,
        notes = COALESCE(p_notes, notes),
        updated_at = now()
    WHERE case_id = p_case_id AND milestone_type = p_milestone_type;
    
    -- Update dependent milestone start dates based on completion
    CASE p_milestone_type
        WHEN 'search_time' THEN
            -- Update interim report start date
            UPDATE gst_case_timeframes 
            SET 
                start_date = p_completion_date,
                target_date = p_completion_date + INTERVAL '7 days',
                updated_at = now()
            WHERE case_id = p_case_id AND milestone_type = 'interim_report';
            
        WHEN 'interim_report' THEN
            -- No immediate dependencies, but could trigger recovery process
            NULL;
            
        WHEN 'recovery' THEN
            -- No immediate dependencies
            NULL;
            
        ELSE
            NULL;
    END CASE;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."complete_milestone"("p_case_id" "uuid", "p_milestone_type" "public"."gst_milestone_type", "p_completion_date" timestamp with time zone, "p_notes" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."complete_milestone"("p_case_id" "uuid", "p_milestone_type" "public"."gst_milestone_type", "p_completion_date" timestamp with time zone, "p_notes" "text") IS 'Marks a milestone as completed and calculates deviance';



CREATE OR REPLACE FUNCTION "public"."consume_credits"("p_user_id" "uuid", "p_workspace_id" "text", "p_amount" integer, "p_feature" "text", "p_session_id" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_credit_type" "text" DEFAULT 'ai'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance     INTEGER;
  v_transaction_id  UUID;
BEGIN
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id      = p_user_id
    AND workspace_id = p_workspace_id
    AND credit_type  = p_credit_type
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    INSERT INTO user_credits (user_id, workspace_id, balance, credit_type)
    VALUES (p_user_id, p_workspace_id, 0, p_credit_type)
    ON CONFLICT (user_id, workspace_id, credit_type) DO NOTHING;
    v_current_balance := 0;
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success',  false,
      'error',    'Insufficient credits',
      'balance',  v_current_balance,
      'required', p_amount
    );
  END IF;

  v_new_balance := v_current_balance - p_amount;

  UPDATE user_credits
  SET balance        = v_new_balance,
      total_consumed = total_consumed + p_amount,
      updated_at     = NOW()
  WHERE user_id      = p_user_id
    AND workspace_id = p_workspace_id
    AND credit_type  = p_credit_type;

  INSERT INTO credit_transactions (
    user_id, workspace_id, type, amount,
    balance_before, balance_after, feature,
    feature_session_id, description, credit_type
  ) VALUES (
    p_user_id, p_workspace_id, 'consume', p_amount,
    v_current_balance, v_new_balance, p_feature,
    p_session_id, p_description, p_credit_type
  ) RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success',         true,
    'transaction_id',  v_transaction_id,
    'balance_before',  v_current_balance,
    'balance_after',   v_new_balance,
    'amount_consumed', p_amount
  );
END;
$$;


ALTER FUNCTION "public"."consume_credits"("p_user_id" "uuid", "p_workspace_id" "text", "p_amount" integer, "p_feature" "text", "p_session_id" "text", "p_description" "text", "p_credit_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_address_approval_workflow"("address_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Create the 4-step approval workflow for each address
    INSERT INTO gst_address_approvals (address_id, step_order, approver_designation, is_current_step)
    VALUES 
        (address_uuid, 1, 'assistant_commissioner_khangi', TRUE),
        (address_uuid, 2, 'deputy_commissioner_enforcement_coordination', FALSE),
        (address_uuid, 3, 'additional_commissioner_enforcement', FALSE),
        (address_uuid, 4, 'special_commissioner', FALSE);
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."create_address_approval_workflow"("address_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_gst_approval_workflow"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Create the approval workflow steps (bottom to top)
  INSERT INTO gst_enforcement_approvals (case_id, step_order, approver_designation, is_current_step)
  VALUES 
    (NEW.id, 1, 'assistant_commissioner', TRUE),
    (NEW.id, 2, 'deputy_commissioner_enforcement_coordination', FALSE),
    (NEW.id, 3, 'additional_commissioner_enforcement', FALSE),
    (NEW.id, 4, 'special_commissioner', FALSE);
  
  -- Create the implementation workflow steps (top to bottom) - initially inactive
  INSERT INTO gst_implementation_steps (case_id, step_order, implementer_designation, is_current_step, status)
  VALUES 
    (NEW.id, 1, 'special_commissioner', FALSE, 'pending'),
    (NEW.id, 2, 'additional_commissioner_enforcement', FALSE, 'pending'),
    (NEW.id, 3, 'deputy_commissioner_enforcement_coordination', FALSE, 'pending'),
    (NEW.id, 4, 'assistant_commissioner', FALSE, 'pending');
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_gst_approval_workflow"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_new_task"("p_name" "text", "p_priority" "text", "p_startdate" "date", "p_duedate" "date", "p_status" smallint, "p_workspace_id" "uuid", "p_last_updated_by" "uuid", "p_sub_tasks" "jsonb", "p_taskcontent" "text", "p_last_updated_time" timestamp without time zone) RETURNS TABLE("id" integer, "task_uuid" "uuid", "name" "text", "priority" "text", "startdate" "date", "duedate" "date", "status" smallint, "workspace_id" "uuid", "last_updated_by" "uuid", "sub_tasks" "jsonb", "taskcontent" "text", "created_at" timestamp with time zone, "last_updated_time" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO votum_tasks (
    id,
    task_uuid,
    name,
    priority,
    startDate,
    dueDate,
    status,
    workspace_id,
    -- assigned_to,
    last_updated_by,
    -- documents,
    sub_tasks,
    taskContent,
    -- approver_id,
    -- client_id,
    last_updated_time
  ) VALUES (
      (SELECT 
          CASE 
            WHEN MAX(id) IS NULL THEN 1
            ELSE MAX(id) + 1 
          END AS nextid 
       FROM votum_tasks
       WHERE workspace_id = p_workspace_id),
      gen_random_uuid(),
      p_name,
      p_priority,
      p_startDate,
      p_dueDate,
      p_status,
      p_workspace_id,
      -- p_assigned_to,
      p_last_updated_by,
      -- p_documents,
      p_sub_tasks,
      p_taskContent,
      -- p_approver_id,
      -- p_client_id,
      p_last_updated_time
  );

  RETURN QUERY
  SELECT     id,
    task_uuid,
    name,
    priority,
    startDate,
    dueDate,
    status,
    workspace_id,
    -- assigned_to,
    last_updated_by,
    -- documents,
    sub_tasks,
    taskContent,
    -- approver_id,
    -- client_id,
    last_updated_time FROM votum_tasks
  WHERE workspace_id = p_workspace_id
  ORDER BY created_at DESC
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."create_new_task"("p_name" "text", "p_priority" "text", "p_startdate" "date", "p_duedate" "date", "p_status" smallint, "p_workspace_id" "uuid", "p_last_updated_by" "uuid", "p_sub_tasks" "jsonb", "p_taskcontent" "text", "p_last_updated_time" timestamp without time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_proposal_approval_workflow"("p_proposal_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Create approval steps in order
    INSERT INTO gst_proposal_approvals (proposal_id, step_order, approver_designation, is_current_step)
    VALUES 
        (p_proposal_id, 1, 'assistant_commissioner_khangi', true),
        (p_proposal_id, 2, 'deputy_commissioner_enforcement_coordination', false),
        (p_proposal_id, 3, 'additional_commissioner_enforcement', false),
        (p_proposal_id, 4, 'special_commissioner_state', false);
END;
$$;


ALTER FUNCTION "public"."create_proposal_approval_workflow"("p_proposal_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_workflow_on_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If status changes from draft to something else, create workflow
    IF OLD.status = 'draft' AND NEW.status != 'draft' THEN
        -- Check if workflow already exists
        IF NOT EXISTS (SELECT 1 FROM gst_address_approvals WHERE address_id = NEW.id) THEN
            PERFORM create_address_approval_workflow(NEW.id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_workflow_on_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role FROM public.votum_users WHERE id = auth.uid() LIMIT 1;
$$;


ALTER FUNCTION "public"."current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_workspace_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT workspace_id FROM public.votum_users WHERE id = auth.uid() LIMIT 1;
$$;


ALTER FUNCTION "public"."current_user_workspace_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delegate_approval"("approval_id" "uuid", "delegator_id" "uuid", "delegatee_id" "uuid", "delegation_message" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    approval_record RECORD;
    delegator_designation user_designation;
    delegatee_designation user_designation;
    can_delegate_list user_designation[];
BEGIN
    -- Get approval record
    SELECT * INTO approval_record
    FROM workflow_approvals
    WHERE id = approval_id AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending approval not found';
    END IF;

    -- Verify delegator is the assigned approver
    IF approval_record.approver_id != delegator_id THEN
        RAISE EXCEPTION 'User not authorized to delegate this approval';
    END IF;

    -- Get designations
    SELECT designation INTO delegator_designation
    FROM gst_enforcement_users WHERE id = delegator_id;
    
    SELECT designation INTO delegatee_designation
    FROM gst_enforcement_users WHERE id = delegatee_id;

    -- Check delegation permissions
    SELECT can_delegate_to INTO can_delegate_list
    FROM workflow_config WHERE designation = delegator_designation;

    IF delegatee_designation != ANY(can_delegate_list) THEN
        RAISE EXCEPTION 'Cannot delegate to user with designation %', delegatee_designation;
    END IF;

    -- Update approval record
    UPDATE workflow_approvals
    SET approver_id = delegatee_id,
        delegated_to = delegatee_id,
        delegated_at = NOW(),
        comments = COALESCE(comments || E'\n\nDelegated: ', 'Delegated: ') || delegation_message
    WHERE id = approval_id;

    -- Update case current stage owner
    UPDATE enforcement_cases 
    SET current_stage_owner = delegatee_id
    WHERE id = approval_record.case_id;
END;
$$;


ALTER FUNCTION "public"."delegate_approval"("approval_id" "uuid", "delegator_id" "uuid", "delegatee_id" "uuid", "delegation_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_workflow_on_task_deletion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM votum_approval_workflows 
  WHERE task_id = OLD.id;
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."delete_workflow_on_task_deletion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_workspace_and_data"("p_workspace_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Optionally lock the workspace row (ensures consistent view)
  PERFORM 1 FROM public.votum_workspace WHERE id = p_workspace_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workspace % not found', p_workspace_id;
  END IF;

  -- Begin deletions from leaf tables upward (FK-safe order)

  -- Trust module
  DELETE FROM public.votum_trust_reconciliation_items
   WHERE reconciliation_id IN (
     SELECT id FROM public.votum_trust_reconciliations WHERE workspace_id = p_workspace_id
   );

  DELETE FROM public.votum_trust_reconciliations
   WHERE workspace_id = p_workspace_id;

  DELETE FROM public.votum_trust_transactions
   WHERE workspace_id = p_workspace_id;

  DELETE FROM public.votum_trust_fund_requests
   WHERE workspace_id = p_workspace_id;

  DELETE FROM public.votum_trust_accounts
   WHERE workspace_id = p_workspace_id;

  -- Invoices, time entries, reminders
  DELETE FROM public.votum_invoice_reminders
   WHERE workspace_id = p_workspace_id;

  -- Time entries referencing invoices/clients/users/workspace
  DELETE FROM public.votum_time_entries
   WHERE workspace_id = p_workspace_id;

  DELETE FROM public.votum_invoice
   WHERE workspace_id = p_workspace_id;

  -- Notes, docs, comments
  DELETE FROM public.votum_comments
   WHERE note_id IN (SELECT id FROM public.votum_notes WHERE workspace_id = p_workspace_id);

  DELETE FROM public.votum_docs
   WHERE note_id IN (SELECT id FROM public.votum_notes WHERE workspace_id = p_workspace_id);

  DELETE FROM public.votum_notes
   WHERE workspace_id = p_workspace_id;

  -- Cases and tasks (plus related artifacts)
  DELETE FROM public.votum_task_reviews
   WHERE task_id IN (SELECT id FROM public.votum_tasks WHERE workspace_id = p_workspace_id);

  DELETE FROM public.votum_task_ownership_periods
   WHERE workspace_id = p_workspace_id;

  DELETE FROM public.delegation_steps
   WHERE delegation_chain_id IN (
     SELECT id FROM public.delegation_chains WHERE workspace_id = p_workspace_id
   );

  DELETE FROM public.delegation_chains
   WHERE workspace_id = p_workspace_id;

  -- Approval workflows tied to drafts/tasks
  DELETE FROM public.votum_approval_workflow_steps
   WHERE workflow_id IN (
     SELECT id FROM public.votum_approval_workflows WHERE workspace_id = p_workspace_id
   );

  DELETE FROM public.votum_approval_workflows
   WHERE workspace_id = p_workspace_id;

  -- Drafts
  DELETE FROM public.drafts
   WHERE workspace_id = p_workspace_id;

  -- Teams and members
  DELETE FROM public.votum_team_members
   WHERE team_id IN (SELECT id FROM public.votum_teams WHERE workspace_id = p_workspace_id);

  DELETE FROM public.votum_teams
   WHERE workspace_id = p_workspace_id;

  -- Templates
  DELETE FROM public.votum_templates
   WHERE workspace_id = p_workspace_id;

  -- Events, transcripts, translations, summaries
  DELETE FROM public.votum_events
   WHERE user_id IN (SELECT id FROM public.votum_users WHERE workspace_id = p_workspace_id);

  DELETE FROM public.votum_transcripts
   WHERE workspace_id = p_workspace_id;

  DELETE FROM public.votum_translations
   WHERE workspace_id = p_workspace_id;

  DELETE FROM public.votum_summary
   WHERE workspace_id = p_workspace_id;

  -- OCR docs metadata
  DELETE FROM public.ocr_documents_metadata
   WHERE workspace_id = p_workspace_id;

  -- Notifications
  DELETE FROM public.votum_notifications
   WHERE workspace_id = p_workspace_id;

  -- Suggested tasks
  DELETE FROM public.votum_suggested_tasks
   WHERE workspace_id = p_workspace_id;

  -- API usage logs
  DELETE FROM public.api_usage_tracking
   WHERE workspace_id = p_workspace_id;

  -- Cases after dependent task links removed
  DELETE FROM public.votum_cases
   WHERE workspace_id = p_workspace_id;

  -- Clients last (referenced by many)
  DELETE FROM public.votum_clients
   WHERE workspace_id = p_workspace_id;

  -- Users belonging to the workspace (app-level users, not auth.users)
  -- If you want to retain users, comment this out.
  DELETE FROM public.votum_users
   WHERE workspace_id = p_workspace_id;

  -- Audit logs
  DELETE FROM public.votum_audit_logs
   WHERE workspace_id = p_workspace_id;

  -- Email accounts
  DELETE FROM public.votum_email_accounts
   WHERE workspace_id = p_workspace_id;

  -- Invoice reminders (double-check already above) – done

  -- Storage references (database rows only; files must be removed via Storage API)
  -- If you prefix storage objects by workspace in name/path, you can delete rows like:
  -- DELETE FROM storage.objects WHERE name LIKE (p_workspace_id::text || '/%');
  -- Note: actual file deletion requires Storage API; DB delete won’t remove files from object storage.

  -- Finally, remove the workspace itself
  DELETE FROM public.votum_workspace
   WHERE id = p_workspace_id;

END;
$$;


ALTER FUNCTION "public"."delete_workspace_and_data"("p_workspace_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."dispatch_notification_on_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://api.thevotum.com/notifications/dispatch',
    body    := jsonb_build_object(
      'id',             NEW.id,
      'target_user_id', NEW.target_user_id,
      'title',          NEW.title,
      'message',        NEW.message,
      'redirect_uri',   NEW.redirect_uri,
      'type',           NEW.type,
      'subtype',        NEW.subtype,
      'channels',       NEW.channels
    ),
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer 6e04aea343f1ca2be43704f0ceef38c42a630e5bc673700bdeee97febd0239c8'
    )
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."dispatch_notification_on_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."document_folders_set_path"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  parent_path ltree;
begin
  if NEW.slug is null or NEW.slug = '' then
    NEW.slug := regexp_replace(lower(NEW.name), '[^a-z0-9]+', '-', 'g');
    NEW.slug := trim(both '-' from NEW.slug);
  end if;

  if NEW.parent_id is not null then
    select path into parent_path from public.document_folders where id = NEW.parent_id;
    if parent_path is null then
      raise exception 'Parent folder % does not exist or has no path', NEW.parent_id;
    end if;
    NEW.path := parent_path || text2ltree(NEW.slug);
  else
    NEW.path := text2ltree(NEW.slug);
  end if;

  NEW.updated_at := now();
  return NEW;
end;
$$;


ALTER FUNCTION "public"."document_folders_set_path"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enqueue_document_on_upload"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.status = 'uploaded' THEN
    PERFORM pgmq.send('document_extraction', jsonb_build_object('document_id', NEW.id::text));
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enqueue_document_on_upload"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_proposal_number"("workspace_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    proposal_count INTEGER;
    year_suffix TEXT;
    proposal_number TEXT;
BEGIN
    -- Get current year suffix (last 2 digits)
    year_suffix := SUBSTRING(EXTRACT(YEAR FROM NOW())::TEXT FROM 3);
    
    -- Get count of proposals for this workspace this year
    SELECT COUNT(*) INTO proposal_count
    FROM gst_proposals 
    WHERE gst_proposals.workspace_id = generate_proposal_number.workspace_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
    
    -- Generate proposal number: PROP/YY/NNNN
    proposal_number := 'PROP/' || year_suffix || '/' || LPAD((proposal_count + 1)::TEXT, 4, '0');
    
    RETURN proposal_number;
END;
$$;


ALTER FUNCTION "public"."generate_proposal_number"("workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_approval_history"("case_id" "uuid") RETURNS TABLE("stage_name" character varying, "action_type" character varying, "status" character varying, "requested_by_name" character varying, "responded_by_name" character varying, "delegated_to_name" character varying, "requested_at" timestamp with time zone, "responded_at" timestamp with time zone, "comments" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wa.stage_name,
        wa.action_type,
        wa.status,
        requester.name as requested_by_name,
        responder.name as responded_by_name,
        delegatee.name as delegated_to_name,
        wa.requested_at,
        wa.responded_at,
        wa.comments
    FROM workflow_approvals wa
    LEFT JOIN gst_enforcement_users requester ON requester.id = wa.requested_by
    LEFT JOIN gst_enforcement_users responder ON responder.id = wa.responded_by
    LEFT JOIN gst_enforcement_users delegatee ON delegatee.id = wa.delegated_to
    WHERE wa.case_id = get_approval_history.case_id
    ORDER BY wa.created_at;
END;
$$;


ALTER FUNCTION "public"."get_approval_history"("case_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_delegation_hierarchy"("entity_type" "text", "entity_id" "uuid") RETURNS TABLE("step_order" integer, "delegated_by_id" "uuid", "delegated_by_name" "text", "delegated_to_id" "uuid", "delegated_to_name" "text", "status" "text", "delegated_at" timestamp with time zone, "completed_at" timestamp with time zone, "notes" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ds.step_order,
    ds.delegated_by,
    delegated_by_user.name,
    ds.delegated_to,
    delegated_to_user.name,
    ds.status,
    ds.delegated_at,
    ds.completed_at,
    ds.notes
  FROM 
    delegation_chains dc
  JOIN 
    delegation_steps ds ON dc.id = ds.delegation_chain_id
  JOIN 
    votum_users delegated_by_user ON ds.delegated_by = delegated_by_user.id
  JOIN 
    votum_users delegated_to_user ON ds.delegated_to = delegated_to_user.id
  WHERE 
    (entity_type = 'task' AND dc.task_id = entity_id) OR
    (entity_type = 'draft' AND dc.draft_id = entity_id)
  ORDER BY ds.step_order;
END;
$$;


ALTER FUNCTION "public"."get_delegation_hierarchy"("entity_type" "text", "entity_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_io_performance_metrics"("p_workspace_id" "uuid", "p_officer_id" "uuid" DEFAULT NULL::"uuid", "p_start_date" "date" DEFAULT NULL::"date", "p_end_date" "date" DEFAULT NULL::"date") RETURNS TABLE("officer_id" "uuid", "officer_name" "text", "total_cases" integer, "completed_milestones" integer, "overdue_milestones" integer, "avg_deviance_days" numeric, "avg_deviance_percentage" numeric, "search_time_avg_deviance" numeric, "interim_report_avg_deviance" numeric, "recovery_avg_deviance" numeric, "adjudication_avg_deviance" numeric, "performance_score" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(c.investigation_officer_id, c.monitoring_officer_id) as officer_id,
        COALESCE(io_user.name, mo_user.name, 'Unknown') as officer_name,
        COUNT(DISTINCT t.case_id)::INTEGER as total_cases,
        COUNT(CASE WHEN t.is_completed THEN 1 END)::INTEGER as completed_milestones,
        COUNT(CASE WHEN t.is_overdue THEN 1 END)::INTEGER as overdue_milestones,
        ROUND(AVG(CASE WHEN t.is_completed THEN t.deviance_days END), 2) as avg_deviance_days,
        ROUND(AVG(CASE WHEN t.is_completed THEN t.deviance_percentage END), 2) as avg_deviance_percentage,
        ROUND(AVG(CASE WHEN t.milestone_type = 'search_time' AND t.is_completed THEN t.deviance_days END), 2) as search_time_avg_deviance,
        ROUND(AVG(CASE WHEN t.milestone_type = 'interim_report' AND t.is_completed THEN t.deviance_days END), 2) as interim_report_avg_deviance,
        ROUND(AVG(CASE WHEN t.milestone_type = 'recovery' AND t.is_completed THEN t.deviance_days END), 2) as recovery_avg_deviance,
        ROUND(AVG(CASE WHEN t.milestone_type = 'adjudication_finished' AND t.is_completed THEN t.deviance_days END), 2) as adjudication_avg_deviance,
        -- Performance score: 100 - (average deviance percentage), minimum 0
        ROUND(GREATEST(0, 100 - ABS(COALESCE(AVG(CASE WHEN t.is_completed THEN t.deviance_percentage END), 0))), 2) as performance_score
    FROM gst_case_timeframes t
    JOIN gst_enforcement_cases c ON t.case_id = c.id
    LEFT JOIN gst_user_designations io_desg ON c.investigation_officer_id = io_desg.id
    LEFT JOIN votum_users io_user ON io_desg.user_id = io_user.id
    LEFT JOIN gst_user_designations mo_desg ON c.monitoring_officer_id = mo_desg.id
    LEFT JOIN votum_users mo_user ON mo_desg.user_id = mo_user.id
    WHERE 
        t.workspace_id = p_workspace_id
        AND (p_officer_id IS NULL OR COALESCE(c.investigation_officer_id, c.monitoring_officer_id) = p_officer_id)
        AND (p_start_date IS NULL OR c.inquiry_date::DATE >= p_start_date)
        AND (p_end_date IS NULL OR c.inquiry_date::DATE <= p_end_date)
    GROUP BY 
        COALESCE(c.investigation_officer_id, c.monitoring_officer_id),
        COALESCE(io_user.name, mo_user.name),
        io_user.name,
        mo_user.name
    HAVING COUNT(DISTINCT t.case_id) > 0
    ORDER BY performance_score DESC, total_cases DESC;
END;
$$;


ALTER FUNCTION "public"."get_io_performance_metrics"("p_workspace_id" "uuid", "p_officer_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_io_performance_metrics"("p_workspace_id" "uuid", "p_officer_id" "uuid", "p_start_date" "date", "p_end_date" "date") IS 'Returns performance metrics for Intelligence Officers based on timeframe adherence - Fixed GROUP BY clause';



CREATE OR REPLACE FUNCTION "public"."get_next_approval_level"("current_level" integer) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Return the next level in hierarchy (1->2->3->4)
    IF current_level >= 4 THEN
        RETURN NULL; -- Already at highest level
    ELSE
        RETURN current_level + 1;
    END IF;
END;
$$;


ALTER FUNCTION "public"."get_next_approval_level"("current_level" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pending_approvals"("user_id" "uuid") RETURNS TABLE("approval_id" "uuid", "case_id" "uuid", "trade_name" character varying, "stage_name" character varying, "requested_by_name" character varying, "requested_at" timestamp with time zone, "comments" "text", "can_delegate" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wa.id as approval_id,
        wa.case_id,
        ec.trade_name,
        wa.stage_name,
        requester.name as requested_by_name,
        wa.requested_at,
        wa.comments,
        (ARRAY_LENGTH((SELECT can_delegate_to FROM workflow_config wc JOIN gst_enforcement_users u ON u.designation = wc.designation WHERE u.id = user_id), 1) > 0) as can_delegate
    FROM workflow_approvals wa
    JOIN enforcement_cases ec ON ec.id = wa.case_id
    LEFT JOIN gst_enforcement_users requester ON requester.id = wa.requested_by
    WHERE wa.approver_id = user_id 
    AND wa.status = 'pending'
    ORDER BY wa.requested_at;
END;
$$;


ALTER FUNCTION "public"."get_pending_approvals"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_task_ownership_timeline"("p_task_id" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "user_name" "text", "user_email" "text", "started_at" timestamp with time zone, "ended_at" timestamp with time zone, "duration_seconds" integer, "duration_formatted" "text", "assignment_reason" "text", "task_status_at_start" integer, "task_status_at_end" integer, "is_current" boolean, "metadata" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.user_id,
        o.user_name,
        o.user_email,
        o.started_at,
        o.ended_at,
        o.duration_seconds,
        CASE 
            WHEN o.duration_seconds IS NULL THEN 'Ongoing'
            WHEN o.duration_seconds < 60 THEN o.duration_seconds || ' seconds'
            WHEN o.duration_seconds < 3600 THEN (o.duration_seconds / 60) || ' minutes'
            WHEN o.duration_seconds < 86400 THEN (o.duration_seconds / 3600) || ' hours'
            ELSE (o.duration_seconds / 86400) || ' days'
        END as duration_formatted,
        o.assignment_reason,
        o.task_status_at_start,
        o.task_status_at_end,
        (o.ended_at IS NULL) as is_current,
        o.metadata
    FROM votum_task_ownership_periods o
    WHERE o.task_id = p_task_id
    ORDER BY o.started_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_task_ownership_timeline"("p_task_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_task_queue_progress"("p_run_id" "uuid") RETURNS TABLE("status" "text", "task_count" bigint)
    LANGUAGE "sql" STABLE
    AS $$
    SELECT t.status, count(*) AS task_count
    FROM keyword_alert_task_queue t
    WHERE t.run_id = p_run_id
    GROUP BY t.status;
$$;


ALTER FUNCTION "public"."get_task_queue_progress"("p_run_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_trust_account_statistics"() RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_workspace_id uuid;
  v_total_accounts integer;
  v_total_balance numeric;
  v_accounts_below_threshold integer;
  v_pending_reconciliations integer;
  v_result json;
BEGIN
  -- Get the workspace_id for the current user
  SELECT workspace_id INTO v_workspace_id
  FROM public.votum_users
  WHERE id = auth.uid();

  -- Get total accounts and balance
  SELECT 
    COUNT(*),
    COALESCE(SUM(balance), 0)
  INTO 
    v_total_accounts,
    v_total_balance
  FROM public.votum_trust_accounts
  WHERE workspace_id = v_workspace_id
    AND status = 'active';

  -- Get accounts below threshold
  SELECT COUNT(*) INTO v_accounts_below_threshold
  FROM public.votum_trust_accounts
  WHERE workspace_id = v_workspace_id
    AND status = 'active'
    AND minimum_threshold IS NOT NULL
    AND balance < minimum_threshold;

  -- Get pending reconciliations
  SELECT COUNT(*) INTO v_pending_reconciliations
  FROM public.votum_trust_reconciliations
  WHERE workspace_id = v_workspace_id
    AND status = 'unreconciled';

  -- Build result
  v_result := json_build_object(
    'total_accounts', v_total_accounts,
    'total_balance', v_total_balance,
    'accounts_below_threshold', v_accounts_below_threshold,
    'pending_reconciliations', v_pending_reconciliations
  );

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_trust_account_statistics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_task_velocity"("p_user_id" "uuid", "p_days_back" integer DEFAULT 30) RETURNS TABLE("user_id" "uuid", "user_name" "text", "period_days" integer, "tasks_completed" integer, "avg_ownership_duration_seconds" numeric, "tasks_per_day" numeric, "efficiency_score" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.user_id,
        o.user_name,
        p_days_back,
        COUNT(*)::integer as tasks_completed,
        AVG(o.duration_seconds) as avg_ownership_duration_seconds,
        (COUNT(*)::numeric / p_days_back) as tasks_per_day,
        -- Efficiency score: more tasks completed faster = higher score
        CASE 
            WHEN AVG(o.duration_seconds) > 0 THEN 
                (COUNT(*)::numeric / p_days_back) / (AVG(o.duration_seconds) / 86400.0)
            ELSE 0
        END as efficiency_score
    FROM votum_task_ownership_periods o
    WHERE 
        o.user_id = p_user_id
        AND o.ended_at IS NOT NULL
        AND o.ended_at >= now() - make_interval(days => p_days_back)
    GROUP BY o.user_id, o.user_name;
END;
$$;


ALTER FUNCTION "public"."get_user_task_velocity"("p_user_id" "uuid", "p_days_back" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_usage_summary"("p_user_id" "uuid", "p_billing_period" character varying DEFAULT NULL::character varying) RETURNS TABLE("endpoint" character varying, "model" character varying, "total_requests" bigint, "total_input_tokens" bigint, "total_output_tokens" bigint, "total_tokens" bigint, "total_cost_usd" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    api.endpoint,
    api.model,
    COUNT(*)::BIGINT AS total_requests,
    SUM(api.input_tokens)::BIGINT AS total_input_tokens,
    SUM(api.output_tokens)::BIGINT AS total_output_tokens,
    SUM(api.total_tokens)::BIGINT AS total_tokens,
    SUM(api.cost_usd) AS total_cost_usd
  FROM api_usage_tracking api
  WHERE api.user_id = p_user_id
    AND (p_billing_period IS NULL OR api.billing_period = p_billing_period)
  GROUP BY api.endpoint, api.model
  ORDER BY total_cost_usd DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_usage_summary"("p_user_id" "uuid", "p_billing_period" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_workspace_storage_bytes"("p_workspace_id" "uuid") RETURNS bigint
    LANGUAGE "sql" STABLE
    AS $$
  SELECT COALESCE(
    (
      -- documents table: prefer source_size_bytes, fall back to metadata->file_size
      SELECT SUM(
        COALESCE(
          source_size_bytes,
          (metadata->>'file_size')::bigint
        )
      )
      FROM documents
      WHERE workspace_id = p_workspace_id
        AND COALESCE(source_size_bytes, (metadata->>'file_size')::bigint) IS NOT NULL
    ), 0
  ) + COALESCE(
    (
      -- case_repository table
      SELECT SUM(file_size)
      FROM case_repository
      WHERE workspace_id = p_workspace_id
        AND file_size IS NOT NULL
    ), 0
  );
$$;


ALTER FUNCTION "public"."get_workspace_storage_bytes"("p_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_workspace_usage_summary"("p_workspace_id" "uuid", "p_billing_period" character varying DEFAULT NULL::character varying) RETURNS TABLE("endpoint" character varying, "model" character varying, "total_requests" bigint, "unique_users" bigint, "total_input_tokens" bigint, "total_output_tokens" bigint, "total_tokens" bigint, "total_cost_usd" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    api.endpoint,
    api.model,
    COUNT(*)::BIGINT AS total_requests,
    COUNT(DISTINCT api.user_id)::BIGINT AS unique_users,
    SUM(api.input_tokens)::BIGINT AS total_input_tokens,
    SUM(api.output_tokens)::BIGINT AS total_output_tokens,
    SUM(api.total_tokens)::BIGINT AS total_tokens,
    SUM(api.cost_usd) AS total_cost_usd
  FROM api_usage_tracking api
  WHERE api.workspace_id = p_workspace_id
    AND (p_billing_period IS NULL OR api.billing_period = p_billing_period)
  GROUP BY api.endpoint, api.model
  ORDER BY total_cost_usd DESC;
END;
$$;


ALTER FUNCTION "public"."get_workspace_usage_summary"("p_workspace_id" "uuid", "p_billing_period" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_case_timeframes"("p_case_id" "uuid", "p_workspace_id" "uuid", "p_inquiry_date" timestamp with time zone, "p_created_by" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    inquiry_date_only DATE := p_inquiry_date::DATE;
BEGIN
    -- Basic details: 0 days (completed immediately)
    INSERT INTO gst_case_timeframes (
        case_id, workspace_id, milestone_type, target_days, 
        start_date, target_date, completion_date, created_by
    ) VALUES (
        p_case_id, p_workspace_id, 'basic_details', 0,
        inquiry_date_only, inquiry_date_only, inquiry_date_only, p_created_by
    )
    ON CONFLICT (case_id, milestone_type) DO NOTHING;
    
    -- Search time: 3 days from inquiry date
    INSERT INTO gst_case_timeframes (
        case_id, workspace_id, milestone_type, target_days, 
        start_date, target_date, created_by
    ) VALUES (
        p_case_id, p_workspace_id, 'search_time', 3,
        inquiry_date_only, inquiry_date_only + INTERVAL '3 days', p_created_by
    )
    ON CONFLICT (case_id, milestone_type) DO NOTHING;
    
    -- Interim report: 7 days from search completion (will be updated when search is completed)
    INSERT INTO gst_case_timeframes (
        case_id, workspace_id, milestone_type, target_days, 
        start_date, target_date, created_by
    ) VALUES (
        p_case_id, p_workspace_id, 'interim_report', 7,
        inquiry_date_only, inquiry_date_only + INTERVAL '10 days', p_created_by -- Estimated 3+7 days
    )
    ON CONFLICT (case_id, milestone_type) DO NOTHING;
    
    -- Recovery: 21 days from DRC-01A issuance (will be updated when DRC-01A is issued)
    INSERT INTO gst_case_timeframes (
        case_id, workspace_id, milestone_type, target_days, 
        start_date, target_date, created_by
    ) VALUES (
        p_case_id, p_workspace_id, 'recovery', 21,
        inquiry_date_only, inquiry_date_only + INTERVAL '31 days', p_created_by -- Estimated
    )
    ON CONFLICT (case_id, milestone_type) DO NOTHING;
    
    -- Adjudication finished: 6 months from DRC-07 issuance (will be updated when DRC-07 is issued)
    INSERT INTO gst_case_timeframes (
        case_id, workspace_id, milestone_type, target_days, 
        start_date, target_date, created_by
    ) VALUES (
        p_case_id, p_workspace_id, 'adjudication_finished', 180, -- 6 months = ~180 days
        inquiry_date_only, inquiry_date_only + INTERVAL '211 days', p_created_by -- Estimated
    )
    ON CONFLICT (case_id, milestone_type) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."initialize_case_timeframes"("p_case_id" "uuid", "p_workspace_id" "uuid", "p_inquiry_date" timestamp with time zone, "p_created_by" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."initialize_case_timeframes"("p_case_id" "uuid", "p_workspace_id" "uuid", "p_inquiry_date" timestamp with time zone, "p_created_by" "uuid") IS 'Initializes timeframe tracking for all milestones when a case is created';



CREATE OR REPLACE FUNCTION "public"."list_stack_clauses"("p_workspace_id" "uuid", "p_practice_area" "text" DEFAULT NULL::"text", "p_clause_type" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "stack_id" "uuid", "document_id" "uuid", "chunk_index" integer, "content" "text", "clause_type" "text", "practice_area" "text", "deal_type" "text", "outcome" "text", "created_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT
    id, stack_id, document_id, chunk_index, content,
    clause_type, practice_area, deal_type, outcome, created_at
  FROM stack_clauses
  WHERE workspace_id = p_workspace_id
    AND (p_practice_area IS NULL OR practice_area = p_practice_area)
    AND (p_clause_type   IS NULL OR clause_type   = p_clause_type)
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;


ALTER FUNCTION "public"."list_stack_clauses"("p_workspace_id" "uuid", "p_practice_area" "text", "p_clause_type" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_audit_change"("p_table_name" "text", "p_record_id" "uuid", "p_action" "public"."audit_action", "p_field_name" "text" DEFAULT NULL::"text", "p_old_value" "jsonb" DEFAULT NULL::"jsonb", "p_new_value" "jsonb" DEFAULT NULL::"jsonb", "p_change_category" "public"."audit_change_category" DEFAULT 'minor'::"public"."audit_change_category", "p_change_description" "text" DEFAULT NULL::"text", "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_workspace_id" "uuid" DEFAULT NULL::"uuid", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_log_id uuid;
    v_user_id uuid;
    v_workspace_id uuid;
BEGIN
    -- Get user_id and workspace_id if not provided
    IF p_user_id IS NULL THEN
        v_user_id := auth.uid();
    ELSE
        v_user_id := p_user_id;
    END IF;
    
    IF p_workspace_id IS NULL AND v_user_id IS NOT NULL THEN
        SELECT workspace_id INTO v_workspace_id 
        FROM votum_users 
        WHERE id = v_user_id;
    ELSE
        v_workspace_id := p_workspace_id;
    END IF;
    
    -- Insert audit log
    INSERT INTO votum_audit_logs (
        table_name,
        record_id,
        action,
        field_name,
        old_value,
        new_value,
        change_category,
        change_description,
        user_id,
        workspace_id,
        metadata
    ) VALUES (
        p_table_name,
        p_record_id,
        p_action,
        p_field_name,
        p_old_value,
        p_new_value,
        p_change_category,
        p_change_description,
        v_user_id,
        v_workspace_id,
        p_metadata
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;


ALTER FUNCTION "public"."log_audit_change"("p_table_name" "text", "p_record_id" "uuid", "p_action" "public"."audit_action", "p_field_name" "text", "p_old_value" "jsonb", "p_new_value" "jsonb", "p_change_category" "public"."audit_change_category", "p_change_description" "text", "p_user_id" "uuid", "p_workspace_id" "uuid", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."migrate_user_references_to_designations"("workspace_uuid" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    migration_log TEXT := '';
    affected_rows INTEGER;
BEGIN
    migration_log := migration_log || 'Starting migration for workspace: ' || workspace_uuid || E'\n';
    
    -- Note: This function assumes that gst_user_designations has been populated
    -- with entries for all users that have references in the GST tables
    
    migration_log := migration_log || 'Migration completed successfully' || E'\n';
    migration_log := migration_log || 'Important: Verify all foreign key references are valid' || E'\n';
    migration_log := migration_log || 'Important: Test all views and functions after migration' || E'\n';
    
    RETURN migration_log;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Migration failed: ' || SQLERRM;
END;
$$;


ALTER FUNCTION "public"."migrate_user_references_to_designations"("workspace_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_high_usage"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Notify if user has used more than 100K tokens in current month
  IF (
    SELECT SUM(total_tokens) 
    FROM api_usage_tracking 
    WHERE user_id = NEW.user_id 
      AND billing_period = NEW.billing_period
  ) > 100000 THEN
    -- Insert notification or send alert
    INSERT INTO votum_notifications (
      user_id, 
      workspace_id, 
      title, 
      message, 
      type
    ) VALUES (
      NEW.user_id,
      NEW.workspace_id,
      'High API Usage Alert',
      'You have exceeded 100K tokens this month. Please review your usage.',
      'warning'
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_high_usage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pgmq_archive_document_message"("msg_id" bigint) RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT pgmq.archive('document_extraction', msg_id);
$$;


ALTER FUNCTION "public"."pgmq_archive_document_message"("msg_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pgmq_delete_document_message"("msg_id" bigint) RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT pgmq.delete('document_extraction', msg_id);
$$;


ALTER FUNCTION "public"."pgmq_delete_document_message"("msg_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pgmq_read_documents"("batch_size" integer, "visibility_timeout_seconds" integer DEFAULT 300) RETURNS SETOF "pgmq"."message_record"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT * FROM pgmq.read('document_extraction', visibility_timeout_seconds, batch_size);
$$;


ALTER FUNCTION "public"."pgmq_read_documents"("batch_size" integer, "visibility_timeout_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pgmq_send_document"("doc_id" "uuid") RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT pgmq.send('document_extraction', jsonb_build_object('document_id', doc_id::text));
$$;


ALTER FUNCTION "public"."pgmq_send_document"("doc_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."playbook_clauses_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."playbook_clauses_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."playbooks_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."playbooks_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_proposal"("p_proposal_id" "uuid", "p_user_id" "uuid", "p_rejection_reason" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_status proposal_status;
    user_role gst_proposal_role;
BEGIN
    -- Get current proposal status
    SELECT status INTO current_status 
    FROM gst_proposals 
    WHERE id = p_proposal_id;
    
    IF current_status IS NULL THEN
        RAISE EXCEPTION 'Proposal not found';
    END IF;
    
    IF current_status IN ('rejected', 'approved', 'implemented', 'converted_to_case') THEN
        RAISE EXCEPTION 'Cannot reject proposal in current status: %', current_status;
    END IF;
    
    -- Get user's role
    SELECT ptr.role INTO user_role
    FROM gst_proposals p
    JOIN gst_proposal_team_roles ptr ON ptr.team_id = p.assigned_team_id
    WHERE p.id = p_proposal_id AND ptr.user_id = p_user_id AND ptr.is_active = TRUE
    LIMIT 1;
    
    IF user_role IS NULL THEN
        RAISE EXCEPTION 'User does not have permission to reject this proposal';
    END IF;
    
    -- Update proposal to rejected status
    UPDATE gst_proposals SET
        status = 'rejected',
        rejected_by = p_user_id,
        rejected_at = NOW(),
        rejection_reason = p_rejection_reason,
        rejection_stage = current_status,
        updated_at = NOW()
    WHERE id = p_proposal_id;
    
    -- Log workflow change
    INSERT INTO gst_proposal_workflow_log (proposal_id, from_status, to_status, changed_by, comments)
    VALUES (p_proposal_id, current_status, 'rejected', p_user_id, p_rejection_reason);
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."reject_proposal"("p_proposal_id" "uuid", "p_user_id" "uuid", "p_rejection_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_approval"("case_id" "uuid", "requested_by_id" "uuid", "request_message" "text" DEFAULT NULL::"text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    requester_level INTEGER;
    next_level INTEGER;
    next_approver_id UUID;
    approval_id UUID;
    stage_name TEXT;
BEGIN
    -- Get requester's level
    SELECT wc.level INTO requester_level
    FROM workflow_config wc
    JOIN gst_enforcement_users u ON u.designation = wc.designation
    WHERE u.id = requested_by_id;

    IF requester_level IS NULL THEN
        RAISE EXCEPTION 'User designation not found in workflow config';
    END IF;

    -- Get next level
    next_level := get_next_approval_level(requester_level);
    
    IF next_level IS NULL THEN
        RAISE EXCEPTION 'User is already at highest authority level';
    END IF;

    -- Find an approver at the next level (first active user)
    SELECT u.id, wc.stage_name INTO next_approver_id, stage_name
    FROM gst_enforcement_users u
    JOIN workflow_config wc ON wc.designation = u.designation
    WHERE wc.level = next_level 
    AND u.is_active = true
    ORDER BY u.name
    LIMIT 1;

    IF next_approver_id IS NULL THEN
        RAISE EXCEPTION 'No active approver found at level %', next_level;
    END IF;

    -- Create approval request
    INSERT INTO workflow_approvals (
        case_id, stage_level, stage_name, approver_id, action_type, status,
        requested_by, requested_at, comments
    ) VALUES (
        case_id, next_level, stage_name, next_approver_id, 'request', 'pending',
        requested_by_id, NOW(), request_message
    ) RETURNING id INTO approval_id;

    -- Update case current stage owner
    UPDATE enforcement_cases 
    SET current_stage_owner = next_approver_id, status = 'under_review'
    WHERE id = case_id;

    RETURN 'Approval request sent to ' || stage_name;
END;
$$;


ALTER FUNCTION "public"."request_approval"("case_id" "uuid", "requested_by_id" "uuid", "request_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."respond_to_approval"("approval_id" "uuid", "responder_id" "uuid", "response_action" "text", "response_message" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    approval_record RECORD;
    case_record RECORD;
    next_level INTEGER;
    next_approver_id UUID;
    stage_name TEXT;
BEGIN
    -- Get approval record
    SELECT * INTO approval_record
    FROM workflow_approvals
    WHERE id = approval_id AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending approval not found';
    END IF;

    -- Verify responder is the assigned approver
    IF approval_record.approver_id != responder_id THEN
        RAISE EXCEPTION 'User not authorized to respond to this approval';
    END IF;

    -- Update approval record
    UPDATE workflow_approvals
    SET status = response_action || 'd',  -- 'approved' or 'rejected'
        responded_by = responder_id,
        responded_at = NOW(),
        comments = COALESCE(comments || E'\n\nResponse: ', 'Response: ') || response_message
    WHERE id = approval_id;

    IF response_action = 'approve' THEN
        -- Check if we need to escalate further
        next_level := get_next_approval_level(approval_record.stage_level);
        
        IF next_level IS NULL THEN
            -- Final approval - case is approved
            UPDATE enforcement_cases 
            SET status = 'approved', current_stage_owner = approval_record.requested_by
            WHERE id = approval_record.case_id;
        ELSE
            -- Continue escalation automatically
            PERFORM request_approval(
                approval_record.case_id, 
                responder_id, 
                'Auto-escalated after approval at level ' || approval_record.stage_level
            );
        END IF;
    ELSE
        -- Rejection - return to requester
        UPDATE enforcement_cases 
        SET status = 'rejected', current_stage_owner = approval_record.requested_by
        WHERE id = approval_record.case_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."respond_to_approval"("approval_id" "uuid", "responder_id" "uuid", "response_action" "text", "response_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_case_repository"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "workspace_id" "uuid", "created_by" "uuid", "case_name" "text", "citation_value" "text", "source_database" "text", "source_url" "text", "case_text" "text", "original_filename" "text", "file_size" integer, "metadata" "jsonb", "tags" "text"[], "notes" "text", "legal_summary" "jsonb", "legal_summary_updated_at" timestamp with time zone, "legal_summary_error" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "rank" real, "highlighted_case_text" "text", "highlighted_case_name" "text", "highlighted_citation" "text")
    LANGUAGE "sql" STABLE
    AS $$
    SELECT
        cr.id,
        cr.workspace_id,
        cr.created_by,
        cr.case_name,
        cr.citation_value,
        cr.source_database,
        cr.source_url,
        cr.case_text,
        cr.original_filename,
        cr.file_size,
        cr.metadata,
        cr.tags,
        cr.notes,
        cr.legal_summary,
        cr.legal_summary_updated_at,
        cr.legal_summary_error,
        cr.created_at,
        cr.updated_at,
        ts_rank(cr.search_vector, websearch_to_tsquery('english', trim(p_query))) AS rank,
        -- Generate highlighted snippets from case_text (max 150 chars)
        ts_headline(
            cr.case_text,
            websearch_to_tsquery('english', trim(p_query)),
            'MaxWords=35, MinWords=15, ShortWord=3, StartSel=<mark>, StopSel=</mark>, HighlightAll=FALSE'
        ) AS highlighted_case_text,
        -- Highlight case name
        ts_headline(
            cr.case_name,
            websearch_to_tsquery('english', trim(p_query)),
            'MaxWords=50, MinWords=1, ShortWord=3, StartSel=<mark>, StopSel=</mark>, HighlightAll=TRUE'
        ) AS highlighted_case_name,
        -- Highlight citation
        ts_headline(
            cr.citation_value,
            websearch_to_tsquery('english', trim(p_query)),
            'MaxWords=50, MinWords=1, ShortWord=3, StartSel=<mark>, StopSel=</mark>, HighlightAll=TRUE'
        ) AS highlighted_citation
    FROM public.case_repository cr
    WHERE cr.workspace_id = p_workspace_id
      AND trim(coalesce(p_query, '')) <> ''
      AND cr.search_vector @@ websearch_to_tsquery('english', trim(p_query))
    ORDER BY rank DESC, cr.created_at DESC
    LIMIT GREATEST(coalesce(p_limit, 20), 1)
    OFFSET GREATEST(coalesce(p_offset, 0), 0);
$$;


ALTER FUNCTION "public"."search_case_repository"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_cases_by_party"("p_workspace_id" "uuid", "p_search" "text", "p_limit" integer DEFAULT 10) RETURNS TABLE("id" bigint, "manual_name" "text", "registration_no" "text", "petitioner" "text"[], "respondent" "text"[])
    LANGUAGE "sql" STABLE
    AS $$
    SELECT DISTINCT id, manual_name, registration_no, petitioner, respondent
    FROM votum_cases
    WHERE workspace_id = p_workspace_id
      AND (
            manual_name     ILIKE '%' || p_search || '%'
         OR registration_no ILIKE '%' || p_search || '%'
         OR EXISTS (SELECT 1 FROM unnest(petitioner) p WHERE p ILIKE '%' || p_search || '%')
         OR EXISTS (SELECT 1 FROM unnest(respondent) r WHERE r ILIKE '%' || p_search || '%')
      )
    LIMIT p_limit;
$$;


ALTER FUNCTION "public"."search_cases_by_party"("p_workspace_id" "uuid", "p_search" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_documents"("p_visible_case_ids" integer[], "p_visible_folder_ids" "uuid"[], "p_query" "text", "p_case_ids" integer[] DEFAULT NULL::integer[], "p_folder_id" "uuid" DEFAULT NULL::"uuid", "p_folder_id_is_null" boolean DEFAULT false, "p_tags" "text"[] DEFAULT NULL::"text"[], "p_status" "text"[] DEFAULT NULL::"text"[], "p_limit" integer DEFAULT 200, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "workspace_id" "uuid", "user_id" "uuid", "filename" "text", "pdf_url" "text", "storage_bucket" "text", "storage_path" "text", "document_type" "text", "language" "text", "status" "text", "processed_at" timestamp with time zone, "error_message" "text", "hash_sha256" "text", "page_count" integer, "metadata" "jsonb", "extracted_text" "text", "tags" "text"[], "annotations" "jsonb", "case_id" integer, "folder_id" "uuid", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "rank" real, "highlighted_filename" "text", "highlighted_text" "text")
    LANGUAGE "sql" STABLE
    AS $$
    SELECT
        d.id,
        d.workspace_id,
        d.user_id,
        d.filename,
        d.pdf_url,
        d.storage_bucket,
        d.storage_path,
        d.document_type,
        d.language,
        d.status,
        d.processed_at,
        d.error_message,
        d.hash_sha256,
        d.page_count,
        d.metadata,
        d.extracted_text,
        d.tags,
        d.annotations,
        d.case_id,
        d.folder_id,
        d.created_at,
        d.updated_at,
        -- ts_rank_cd with flag 32 (rank / (rank+1)) prevents long docs dominating
        ts_rank_cd(
            d.search_vector,
            websearch_to_tsquery('english', trim(p_query)),
            32
        ) AS rank,
        -- Full filename with matched terms wrapped in <mark>
        ts_headline(
            d.filename,
            websearch_to_tsquery('english', trim(p_query)),
            'MaxWords=50, MinWords=1, ShortWord=2, StartSel=<mark>, StopSel=</mark>, HighlightAll=TRUE'
        ) AS highlighted_filename,
        -- ~30-word snippet from document body centred on the best match
        ts_headline(
            coalesce(left(d.extracted_text, 100000), ''),
            websearch_to_tsquery('english', trim(p_query)),
            'MaxWords=35, MinWords=15, ShortWord=3, StartSel=<mark>, StopSel=</mark>, HighlightAll=FALSE, FragmentDelimiter= … '
        ) AS highlighted_text
    FROM public.documents d
    WHERE
        -- Access control: visible case OR no case association
        (d.case_id = ANY(p_visible_case_ids) OR d.case_id IS NULL)
        -- Folder must be visible (if the doc is in a folder)
        AND (d.folder_id IS NULL OR d.folder_id = ANY(p_visible_folder_ids))
        -- FTS match (uses GIN index)
        AND trim(coalesce(p_query, '')) <> ''
        AND d.search_vector @@ websearch_to_tsquery('english', trim(p_query))
        -- Optional: narrow to specific cases
        AND (p_case_ids IS NULL OR d.case_id = ANY(p_case_ids))
        -- Optional: folder filter (specific folder / no-folder / unrestricted)
        AND (
            (NOT p_folder_id_is_null AND p_folder_id IS NULL)
            OR (p_folder_id IS NOT NULL AND d.folder_id = p_folder_id)
            OR (p_folder_id_is_null AND d.folder_id IS NULL AND d.case_id IS NULL)
        )
        -- Optional: tag containment
        AND (p_tags IS NULL OR d.tags @> p_tags)
        -- Optional: status
        AND (p_status IS NULL OR d.status = ANY(p_status))
    ORDER BY rank DESC, d.created_at DESC
    LIMIT  GREATEST(coalesce(p_limit,  200), 1)
    OFFSET GREATEST(coalesce(p_offset, 0),   0);
$$;


ALTER FUNCTION "public"."search_documents"("p_visible_case_ids" integer[], "p_visible_folder_ids" "uuid"[], "p_query" "text", "p_case_ids" integer[], "p_folder_id" "uuid", "p_folder_id_is_null" boolean, "p_tags" "text"[], "p_status" "text"[], "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_stack_clauses_bm25"("p_stack_id" "uuid", "p_query" "text", "p_limit" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "stack_id" "uuid", "document_id" "uuid", "chunk_index" integer, "content" "text", "clause_type" "text", "page_number" integer, "rank" real)
    LANGUAGE "sql" STABLE
    AS $$
    SELECT
        sc.id,
        sc.stack_id,
        sc.document_id,
        sc.chunk_index,
        sc.content,
        sc.clause_type,
        sc.page_number,
        ts_rank_cd(sc.search_vector, websearch_to_tsquery('english', p_query)) AS rank
    FROM "public"."stack_clauses" sc
    WHERE
        sc.stack_id = p_stack_id
        AND sc.search_vector @@ websearch_to_tsquery('english', p_query)
    ORDER BY rank DESC
    LIMIT p_limit;
$$;


ALTER FUNCTION "public"."search_stack_clauses_bm25"("p_stack_id" "uuid", "p_query" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_stack_clauses_bm25_firm"("p_workspace_id" "uuid", "p_query" "text", "p_clause_type" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 20) RETURNS TABLE("id" "uuid", "stack_id" "uuid", "document_id" "uuid", "chunk_index" integer, "content" "text", "clause_type" "text", "practice_area" "text", "deal_type" "text", "outcome" "text", "rank" real)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT
    sc.id, sc.stack_id, sc.document_id, sc.chunk_index,
    sc.content, sc.clause_type, sc.practice_area, sc.deal_type, sc.outcome,
    ts_rank_cd(sc.search_vector, websearch_to_tsquery('english', p_query)) AS rank
  FROM stack_clauses sc
  WHERE sc.workspace_id = p_workspace_id
    AND (p_clause_type IS NULL OR sc.clause_type = p_clause_type)
    AND sc.search_vector @@ websearch_to_tsquery('english', p_query)
  ORDER BY rank DESC
  LIMIT p_limit;
$$;


ALTER FUNCTION "public"."search_stack_clauses_bm25_firm"("p_workspace_id" "uuid", "p_query" "text", "p_clause_type" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_votum_clauses_bm25"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) RETURNS TABLE("id" "uuid", "title" "text", "content" "text", "type" "text", "metadata" "jsonb", "created_at" timestamp with time zone, "created_by" "uuid", "created_by_user" "jsonb", "rank" double precision)
    LANGUAGE "sql" STABLE
    AS $$
  select
    vc.id,
    vc.title,
    vc.content,
    vc.type,
    vc.metadata,
    vc.created_at,
    vc.created_by,
    case
      when vu.id is null then null
      else jsonb_build_object('name', vu.name, 'email', vu.email)
    end as created_by_user,
    bm25(
      to_tsvector(
        'english',
        coalesce(vc.title, '') || ' ' ||
        coalesce(vc.content, '') || ' ' ||
        coalesce(vc.type, '') || ' ' ||
        coalesce(vc.metadata::text, '')
      ),
      websearch_to_tsquery('english', p_query)
    ) as rank
  from public.votum_clauses vc
  left join public.votum_users vu on vc.created_by = vu.id
  where vc.workspace_id = p_workspace_id
    and (
      vc.title ilike '%' || p_query || '%'
      or vc.content ilike '%' || p_query || '%'
      or vc.type ilike '%' || p_query || '%'
    )
  order by rank desc, vc.created_at desc
  limit p_limit offset p_offset;
$$;


ALTER FUNCTION "public"."search_votum_clauses_bm25"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_votum_clauses_ts_rank"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) RETURNS TABLE("id" "uuid", "title" "text", "content" "text", "type" "text", "metadata" "jsonb", "created_at" timestamp with time zone, "created_by" "uuid", "created_by_user" "jsonb", "rank" double precision)
    LANGUAGE "sql" STABLE
    AS $$
  select
    vc.id,
    vc.title,
    vc.content,
    vc.type,
    vc.metadata,
    vc.created_at,
    vc.created_by,
    case
      when vu.id is null then null
      else jsonb_build_object('name', vu.name, 'email', vu.email)
    end as created_by_user,
    ts_rank_cd(
      to_tsvector(
        'english',
        coalesce(vc.title, '') || ' ' ||
        coalesce(vc.content, '') || ' ' ||
        coalesce(vc.type, '') || ' ' ||
        coalesce(vc.metadata::text, '')
      ),
      websearch_to_tsquery('english', p_query)
    ) as rank
  from public.votum_clauses vc
  left join public.votum_users vu on vc.created_by = vu.id
  where vc.workspace_id = p_workspace_id
    and (
      vc.title ilike '%' || p_query || '%'
      or vc.content ilike '%' || p_query || '%'
      or vc.type ilike '%' || p_query || '%'
    )
  order by rank desc, vc.created_at desc
  limit p_limit offset p_offset;
$$;


ALTER FUNCTION "public"."search_votum_clauses_ts_rank"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_votum_templates_bm25"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) RETURNS TABLE("id" bigint, "name" "text", "content" "text", "created_at" timestamp with time zone, "rank" double precision)
    LANGUAGE "sql" STABLE
    AS $$
  select
    vt.id,
    vt.name,
    vt.content,
    vt.created_at,
    bm25(
      to_tsvector(
        'english',
        coalesce(vt.name, '') || ' ' || coalesce(vt.content, '')
      ),
      websearch_to_tsquery('english', p_query)
    ) as rank
  from public.votum_templates vt
  where vt.workspace_id = p_workspace_id
    and (
      vt.name ilike '%' || p_query || '%'
      or vt.content ilike '%' || p_query || '%'
    )
  order by rank desc, vt.created_at desc
  limit p_limit offset p_offset;
$$;


ALTER FUNCTION "public"."search_votum_templates_bm25"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_votum_templates_ts_rank"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) RETURNS TABLE("id" bigint, "name" "text", "content" "text", "created_at" timestamp with time zone, "rank" double precision)
    LANGUAGE "sql" STABLE
    AS $$
  select
    vt.id,
    vt.name,
    vt.content,
    vt.created_at,
    ts_rank_cd(
      to_tsvector(
        'english',
        coalesce(vt.name, '') || ' ' || coalesce(vt.content, '')
      ),
      websearch_to_tsquery('english', p_query)
    ) as rank
  from public.votum_templates vt
  where vt.workspace_id = p_workspace_id
    and (
      vt.name ilike '%' || p_query || '%'
      or vt.content ilike '%' || p_query || '%'
    )
  order by rank desc, vt.created_at desc
  limit p_limit offset p_offset;
$$;


ALTER FUNCTION "public"."search_votum_templates_ts_rank"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_billing_period"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.billing_period := TO_CHAR(NEW.created_at, 'YYYY-MM');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_billing_period"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_implementation_workflow"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if status changed to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Update case status to under_execution
    UPDATE gst_enforcement_cases 
    SET status = 'under_execution' 
    WHERE id = NEW.id;
    
    -- Start the implementation workflow from top (Special Commissioner)
    UPDATE gst_implementation_steps 
    SET is_current_step = TRUE 
    WHERE case_id = NEW.id AND step_order = 1;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."start_implementation_workflow"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_ownership_on_assignee_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM transfer_task_ownership(
            NEW.task_id,
            NEW.user_id,
            COALESCE(NEW.assigned_by, NEW.user_id),
            'Assignee added',
            NULL
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM transfer_task_ownership(
            OLD.task_id,
            NULL,
            NULL,
            NULL,
            OLD.user_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."sync_ownership_on_assignee_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_petitioner_respondent_text"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.petitioner_text := array_to_string(NEW.petitioner, ' ');
  NEW.respondent_text := array_to_string(NEW.respondent, ' ');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_petitioner_respondent_text"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_task_assignees_from_delegation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.task_id IS NOT NULL
     AND (OLD.current_assignee IS DISTINCT FROM NEW.current_assignee)
     AND NEW.current_assignee IS NOT NULL
  THEN
    DELETE FROM task_assignees WHERE task_id = NEW.task_id;
    INSERT INTO task_assignees (task_id, user_id, assigned_by, assigned_at)
    VALUES (NEW.task_id, NEW.current_assignee, NEW.initiated_by, now())
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_task_assignees_from_delegation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_task_status_from_delegation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    task_uuid uuid;
    new_task_status smallint;
BEGIN
    -- Only process if this is a task delegation (not draft)
    IF NEW.task_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    task_uuid := NEW.task_id;
    
    -- Map delegation status to task status
    CASE NEW.status
        WHEN 'delegating' THEN
            new_task_status := 1; -- IN PROGRESS
        WHEN 'working' THEN
            new_task_status := 1; -- IN PROGRESS
        WHEN 'completed' THEN
            new_task_status := 3; -- DONE
        ELSE
            -- Keep current status for unknown delegation statuses
            RETURN NEW;
    END CASE;
    
    -- Update task status
    UPDATE votum_tasks 
    SET 
        status = new_task_status,
        last_updated_time = NOW(),
        moved_to_done_at = CASE 
            WHEN new_task_status = 3 THEN NOW() 
            ELSE moved_to_done_at 
        END
    WHERE id = task_uuid
    AND status != new_task_status; -- Only update if status actually changed
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_task_status_from_delegation"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sync_task_status_from_delegation"() IS 'Automatically syncs task status when delegation chain status changes:
- delegating/working -> IN PROGRESS (1)
- completed -> DONE (3)';



CREATE OR REPLACE FUNCTION "public"."sync_task_status_from_delegation_step"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    task_uuid uuid;
    chain_record record;
    new_task_status smallint;
BEGIN
    -- Get the delegation chain info
    SELECT dc.task_id, dc.status as chain_status, dc.current_assignee
    INTO chain_record
    FROM delegation_chains dc 
    WHERE dc.id = NEW.delegation_chain_id;
    
    -- Only process if this is a task delegation (not draft)
    IF chain_record.task_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    task_uuid := chain_record.task_id;
    
    -- Map step status to task status, considering chain context
    IF chain_record.chain_status = 'working' THEN
        CASE NEW.status
            WHEN 'working' THEN
                new_task_status := 1; -- IN PROGRESS
            WHEN 'completed' THEN
                new_task_status := 2; -- IN VERIFY (awaiting review)
            WHEN 'done' THEN
                new_task_status := 1; -- IN PROGRESS (back to work after review)
            ELSE
                RETURN NEW;
        END CASE;
    ELSIF chain_record.chain_status = 'completed' THEN
        new_task_status := 3; -- DONE
    ELSE
        new_task_status := 1; -- IN PROGRESS (default)
    END IF;
    
    -- Update task status
    UPDATE votum_tasks 
    SET 
        status = new_task_status,
        last_updated_time = NOW(),
        moved_to_done_at = CASE 
            WHEN new_task_status = 3 THEN NOW() 
            ELSE moved_to_done_at 
        END
    WHERE id = task_uuid
    AND status != new_task_status; -- Only update if status actually changed
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_task_status_from_delegation_step"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sync_task_status_from_delegation_step"() IS 'Automatically syncs task status when delegation step status changes:
- working -> IN PROGRESS (1)
- completed -> IN VERIFY (2) when chain is working
- done -> depends on chain status';



CREATE OR REPLACE FUNCTION "public"."timeout_stale_tasks"("p_run_id" "uuid", "p_timeout_mins" integer DEFAULT 15) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    affected int;
BEGIN
    UPDATE keyword_alert_task_queue
    SET status = CASE
            WHEN retry_count < 2 THEN 'pending'
            ELSE 'timeout'
        END,
        claimed_by = NULL,
        claimed_at = NULL,
        retry_count = retry_count + 1,
        error_message = 'Timed out after ' || p_timeout_mins || ' minutes'
    WHERE run_id = p_run_id
      AND status = 'claimed'
      AND claimed_at < now() - (p_timeout_mins || ' minutes')::interval;

    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
END;
$$;


ALTER FUNCTION "public"."timeout_stale_tasks"("p_run_id" "uuid", "p_timeout_mins" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  NEW.updated_at := now();
  return NEW;
end;
$$;


ALTER FUNCTION "public"."touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_task_ownership_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- assigned_to column removed; ownership tracking is now based on task_assignees inserts.
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."track_task_ownership_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transfer_task_ownership"("p_task_id" "uuid", "p_new_user_id" "uuid", "p_assigned_by" "uuid", "p_assignment_reason" "text" DEFAULT 'Manual assignment'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_workspace_id uuid;
    v_task_status integer;
    v_task_priority text;
    v_user_name text;
    v_user_email text;
BEGIN
    -- Get task details
    SELECT workspace_id, status, priority INTO v_workspace_id, v_task_status, v_task_priority
    FROM votum_tasks WHERE id = p_task_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Task not found: %', p_task_id;
    END IF;
    
    -- End current ownership period(s)
    UPDATE votum_task_ownership_periods 
    SET 
        ended_at = now(),
        duration_seconds = EXTRACT(EPOCH FROM (now() - started_at))::integer,
        task_status_at_end = v_task_status,
        task_priority_at_end = v_task_priority
    WHERE task_id = p_task_id AND ended_at IS NULL;
    
    -- If new user is not null, start new ownership period
    IF p_new_user_id IS NOT NULL THEN
        -- Get user details
        SELECT name, email INTO v_user_name, v_user_email
        FROM votum_users WHERE id = p_new_user_id;
        
        INSERT INTO votum_task_ownership_periods (
            task_id,
            user_id,
            user_name,
            user_email,
            workspace_id,
            assigned_by,
            assignment_reason,
            task_status_at_start,
            task_priority_at_start
        ) VALUES (
            p_task_id,
            p_new_user_id,
            v_user_name,
            v_user_email,
            v_workspace_id,
            p_assigned_by,
            p_assignment_reason,
            v_task_status,
            v_task_priority
        );
    END IF;
END;
$$;


ALTER FUNCTION "public"."transfer_task_ownership"("p_task_id" "uuid", "p_new_user_id" "uuid", "p_assigned_by" "uuid", "p_assignment_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transfer_task_ownership"("p_task_id" "uuid", "p_new_user_id" "uuid", "p_assigned_by" "uuid", "p_assignment_reason" "text" DEFAULT 'Manual assignment'::"text", "p_removed_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_workspace_id      uuid;
    v_task_status       integer;
    v_task_priority     text;
    v_user_name         text;
    v_user_email        text;
BEGIN
    SELECT workspace_id, status, priority
      INTO v_workspace_id, v_task_status, v_task_priority
      FROM votum_tasks WHERE id = p_task_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Task not found: %', p_task_id;
    END IF;

    -- Close the ownership period for a specific removed user (if provided)
    IF p_removed_user_id IS NOT NULL THEN
        UPDATE votum_task_ownership_periods
           SET ended_at            = now(),
               duration_seconds    = EXTRACT(EPOCH FROM (now() - started_at))::integer,
               task_status_at_end  = v_task_status,
               task_priority_at_end = v_task_priority
         WHERE task_id = p_task_id
           AND user_id = p_removed_user_id
           AND ended_at IS NULL;
    END IF;

    -- Open a new ownership period for the added user (if provided)
    IF p_new_user_id IS NOT NULL THEN
        SELECT name, email INTO v_user_name, v_user_email
          FROM votum_users WHERE id = p_new_user_id;

        INSERT INTO votum_task_ownership_periods (
            task_id, user_id, user_name, user_email,
            workspace_id, assigned_by, assignment_reason,
            task_status_at_start, task_priority_at_start
        ) VALUES (
            p_task_id, p_new_user_id, v_user_name, v_user_email,
            v_workspace_id, p_assigned_by, p_assignment_reason,
            v_task_status, v_task_priority
        );
    END IF;
END;
$$;


ALTER FUNCTION "public"."transfer_task_ownership"("p_task_id" "uuid", "p_new_user_id" "uuid", "p_assigned_by" "uuid", "p_assignment_reason" "text", "p_removed_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_audit_search_vector"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.change_description, '') || ' ' ||
        COALESCE(NEW.table_name, '') || ' ' ||
        COALESCE(NEW.field_name, '') || ' ' ||
        COALESCE(NEW.old_value::text, '') || ' ' ||
        COALESCE(NEW.new_value::text, '')
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_audit_search_vector"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_case_repository_search_vector"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.search_vector := setweight(to_tsvector('english', coalesce(NEW.case_name, '')), 'A')
                      || setweight(to_tsvector('english', coalesce(NEW.citation_value, '')), 'B')
                      || setweight(to_tsvector('english', coalesce(NEW.case_text, '')), 'C')
                      || setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'D');
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_case_repository_search_vector"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_case_section"("case_id" "uuid", "section_name" character varying, "section_data" "jsonb", "updated_by" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    old_data JSONB;
    new_data JSONB;
    query_text TEXT;
BEGIN
    -- Get current section data
    query_text := format('SELECT %I FROM enforcement_cases WHERE id = $1', section_name);
    EXECUTE query_text INTO old_data USING case_id;
    
    -- Update the section
    query_text := format('UPDATE enforcement_cases SET %I = $1 WHERE id = $2 RETURNING %I', section_name, section_name);
    EXECUTE query_text INTO new_data USING section_data, case_id;
    
    -- Create audit trail entry
    INSERT INTO case_audit_trail (case_id, table_name, section_name, operation, old_values, new_values, changed_by)
    VALUES (case_id, 'enforcement_cases', section_name, 'UPDATE', old_data, new_data, updated_by);
    
    RETURN new_data;
END;
$_$;


ALTER FUNCTION "public"."update_case_section"("case_id" "uuid", "section_name" character varying, "section_data" "jsonb", "updated_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_documents_search_vector"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.filename, '')), 'A')
     || setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'B')
     || setweight(to_tsvector('english', coalesce(NEW.document_type, '')), 'C')
     || setweight(to_tsvector('english', coalesce(left(NEW.extracted_text, 500000), '')), 'D');
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_documents_search_vector"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_drafting_style_profiles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_drafting_style_profiles_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_email_accounts_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_email_accounts_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_entity_on_delegation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update draft assignment if it's a draft delegation
  IF NEW.draft_id IS NOT NULL THEN
    UPDATE drafts
    SET
      assigned_to = NEW.current_assignee,
      last_updated_by = NEW.current_assignee,
      last_updated_time = now()
    WHERE id = NEW.draft_id;
  END IF;
  -- Task assignment is now managed via task_assignees in application code.
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_entity_on_delegation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_gst_case_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_gst_case_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_gst_proposal_approvals_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_gst_proposal_approvals_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_gst_proposal_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_gst_proposal_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_ipr_watch_targets_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_ipr_watch_targets_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_milestone_start_date"("p_case_id" "uuid", "p_milestone_type" "public"."gst_milestone_type", "p_new_start_date" timestamp with time zone, "p_notes" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE gst_case_timeframes 
    SET 
        start_date = p_new_start_date,
        target_date = p_new_start_date + (target_days || ' days')::INTERVAL,
        notes = COALESCE(p_notes, notes),
        updated_at = now()
    WHERE case_id = p_case_id AND milestone_type = p_milestone_type;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."update_milestone_start_date"("p_case_id" "uuid", "p_milestone_type" "public"."gst_milestone_type", "p_new_start_date" timestamp with time zone, "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_proposal_status_from_addresses"("proposal_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    approved_count INTEGER;
    rejected_count INTEGER;
    total_count INTEGER;
    new_proposal_status TEXT;
BEGIN
    -- Count address statuses for this proposal
    SELECT 
        COUNT(CASE WHEN addr.status = 'approved_for_execution' THEN 1 END),
        COUNT(CASE WHEN addr.status = 'rejected' THEN 1 END),
        COUNT(*)
    INTO approved_count, rejected_count, total_count
    FROM gst_proposal_business_addresses addr
    JOIN gst_proposal_businesses bus ON addr.business_id = bus.id
    WHERE bus.proposal_id = proposal_uuid;
    
    -- Determine overall proposal status
    IF approved_count = total_count THEN
        new_proposal_status := 'fully_approved';
    ELSIF rejected_count = total_count THEN
        new_proposal_status := 'rejected';
    ELSIF approved_count > 0 OR rejected_count > 0 THEN
        new_proposal_status := 'mixed';
    ELSE
        new_proposal_status := 'submitted';
    END IF;
    
    -- Update proposal status
    UPDATE gst_proposals 
    SET status = new_proposal_status, updated_at = NOW()
    WHERE id = proposal_uuid;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."update_proposal_status_from_addresses"("proposal_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_task_custom_field_templates_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_task_custom_field_templates_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_task_status_on_workflow_completion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.signer_status = 'approved' AND 
     NOT EXISTS (
       SELECT 1 FROM votum_approval_workflow_steps 
       WHERE workflow_id = NEW.workflow_id 
       AND signer_status != 'approved'
     ) THEN
    UPDATE votum_tasks t
    SET status = 3
    FROM votum_approval_workflows w
    WHERE w.id = NEW.workflow_id
    AND w.task_id = t.id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_task_status_on_workflow_completion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_task_templates_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_task_templates_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_task_workflow_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE votum_tasks 
    SET has_active_workflow = TRUE
    WHERE id = NEW.task_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE votum_tasks 
    SET has_active_workflow = FALSE
    WHERE id = OLD.task_id
    AND NOT EXISTS (
      SELECT 1 FROM votum_approval_workflows 
      WHERE task_id = OLD.task_id
    );
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_task_workflow_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_time_entry_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_time_entry_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_trust_account_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_trust_account_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_votum_user_tokens_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_votum_user_tokens_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_whatsapp_messages_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_whatsapp_messages_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whatsapp_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "whatsapp_message_id" character varying(100) NOT NULL,
    "user_id" "uuid",
    "workspace_id" "uuid",
    "phone" character varying(20) NOT NULL,
    "metadata" "jsonb" DEFAULT '{"type": null, "media": {"url": null, "filename": null, "mime_type": null}, "content": null, "forward": {"is_forwarded": false, "original_sender": null}}'::"jsonb",
    "processing_state" "jsonb" DEFAULT '{"error": null, "status": "pending", "attempts": 0, "retry_after": null}'::"jsonb",
    "entity_links" "jsonb" DEFAULT '{"task_id": null, "document_id": null}'::"jsonb",
    "folder_selection_state" "jsonb",
    "received_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."whatsapp_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."whatsapp_messages" IS 'Tracks all incoming WhatsApp messages for document ingestion and task creation. Uses JSONB columns to prevent bloat.';



COMMENT ON COLUMN "public"."whatsapp_messages"."whatsapp_message_id" IS 'Unique message ID from WhatsApp (for deduplication)';



COMMENT ON COLUMN "public"."whatsapp_messages"."metadata" IS 'JSONB: {"type": "text|image|document|audio|video|interactive", "content": "...", "media": {...}, "forward": {...}}';



COMMENT ON COLUMN "public"."whatsapp_messages"."processing_state" IS 'JSONB: {"status": "pending|processing|completed|awaiting_user_input|failed", "error": "...", "attempts": 0, "retry_after": "..."}';



COMMENT ON COLUMN "public"."whatsapp_messages"."entity_links" IS 'JSONB: {"task_id": "uuid", "document_id": "uuid"}';



COMMENT ON COLUMN "public"."whatsapp_messages"."folder_selection_state" IS 'JSONB: {"status": "awaiting_selection|completed|skipped", "document_id": "uuid", "selected_folder": "uuid", "expires_at": "..."}';



CREATE OR REPLACE FUNCTION "public"."update_whatsapp_metadata"("msg_id" "uuid", "metadata_key" "text", "metadata_value" "jsonb") RETURNS "public"."whatsapp_messages"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result whatsapp_messages;
BEGIN
    UPDATE whatsapp_messages
    SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), ARRAY[metadata_key], metadata_value, true)
    WHERE id = msg_id
    RETURNING * INTO result;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."update_whatsapp_metadata"("msg_id" "uuid", "metadata_key" "text", "metadata_value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_whatsapp_processing_state"("msg_id" "uuid", "new_status" "text", "error_msg" "text" DEFAULT NULL::"text") RETURNS "public"."whatsapp_messages"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result whatsapp_messages;
BEGIN
    UPDATE whatsapp_messages
    SET
        processing_state = jsonb_set(
            jsonb_set(
                processing_state,
                ARRAY['status'],
                to_jsonb(new_status)
            ),
            ARRAY['error'],
            to_jsonb(error_msg),
            true
        ),
        processed_at = CASE WHEN new_status IN ('completed', 'failed') THEN NOW() ELSE NULL END
    WHERE id = msg_id
    RETURNING * INTO result;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."update_whatsapp_processing_state"("msg_id" "uuid", "new_status" "text", "error_msg" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_worker_proxy_ips_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;


ALTER FUNCTION "public"."update_worker_proxy_ips_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_task_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.status = 3 AND NEW.has_active_workflow = TRUE AND 
     NOT EXISTS (
       SELECT 1 FROM vw_task_workflow_status 
       WHERE task_id = NEW.id AND is_completed = TRUE
     ) THEN
    RAISE EXCEPTION 'Cannot mark task as complete while approval workflow is pending';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_task_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."votum_tasks_delete_fn"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  /*
    Move any row-propagation logic here. Important rules:
    - Do NOT UPDATE the row being deleted (OLD.*) — it no longer exists.
    - If you need to act on related rows, do it here safely.
    - Prefer FK ON DELETE CASCADE for child cleanup when possible.
  */

  -- Example: delete related records in another table (adjust as needed)
  -- DELETE FROM public.votum_subtasks WHERE task_id = OLD.id;

  RETURN NULL; -- AFTER DELETE trigger result is ignored
END;
$$;


ALTER FUNCTION "public"."votum_tasks_delete_fn"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ai"."agent_sessions" (
    "session_id" character varying NOT NULL,
    "user_id" character varying,
    "memory" "jsonb",
    "session_data" "jsonb",
    "extra_data" "jsonb",
    "created_at" bigint DEFAULT (EXTRACT(epoch FROM "now"()))::bigint,
    "updated_at" bigint,
    "agent_id" character varying,
    "team_session_id" character varying,
    "agent_data" "jsonb"
);


ALTER TABLE "ai"."agent_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_usage_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "endpoint" character varying(100) NOT NULL,
    "model" character varying(100) NOT NULL,
    "input_tokens" integer DEFAULT 0 NOT NULL,
    "output_tokens" integer DEFAULT 0 NOT NULL,
    "total_tokens" integer DEFAULT 0 NOT NULL,
    "request_data" "jsonb",
    "response_data" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "billed" boolean DEFAULT false,
    "billing_period" character varying(20),
    "cost_usd" numeric(10,4),
    CONSTRAINT "valid_token_counts" CHECK ((("input_tokens" >= 0) AND ("output_tokens" >= 0) AND ("total_tokens" >= 0) AND ("total_tokens" = ("input_tokens" + "output_tokens"))))
);


ALTER TABLE "public"."api_usage_tracking" OWNER TO "postgres";


COMMENT ON TABLE "public"."api_usage_tracking" IS 'Tracks API usage for billing and monitoring purposes';



COMMENT ON COLUMN "public"."api_usage_tracking"."endpoint" IS 'API endpoint used (e.g., whatsapp-roleplay, fir-assistant)';



COMMENT ON COLUMN "public"."api_usage_tracking"."model" IS 'AI model used for the request';



COMMENT ON COLUMN "public"."api_usage_tracking"."input_tokens" IS 'Number of input/prompt tokens consumed';



COMMENT ON COLUMN "public"."api_usage_tracking"."output_tokens" IS 'Number of output/completion tokens generated';



COMMENT ON COLUMN "public"."api_usage_tracking"."total_tokens" IS 'Total tokens used (input + output)';



COMMENT ON COLUMN "public"."api_usage_tracking"."billed" IS 'Whether this usage has been included in billing';



COMMENT ON COLUMN "public"."api_usage_tracking"."billing_period" IS 'Billing period in YYYY-MM format for monthly aggregation';



COMMENT ON COLUMN "public"."api_usage_tracking"."cost_usd" IS 'Calculated cost in USD for this request';



CREATE TABLE IF NOT EXISTS "public"."arbitration_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "collection" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "messages" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "timeline" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."arbitration_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_presets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_updated_time" timestamp with time zone,
    "last_updated_by" "uuid" NOT NULL,
    "name" "text" DEFAULT ''::"text",
    "description" "text",
    "has_deadlines" boolean DEFAULT false
);


ALTER TABLE "public"."automation_presets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_presets_hierarchy" (
    "preset_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "hierarchy_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rank" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_updated_time" timestamp with time zone,
    "last_updated_by" "uuid" NOT NULL,
    "deadline_days" integer
);


ALTER TABLE "public"."automation_presets_hierarchy" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calendar_event_mappings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "app_event_id" "uuid" NOT NULL,
    "google_event_id" "text" NOT NULL,
    "last_synced" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."calendar_event_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."case_activity_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "case_id" integer NOT NULL,
    "event_type" "text" NOT NULL,
    "event_key" "text" NOT NULL,
    "event_date" "date",
    "payload" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."case_activity_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."case_activity_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "contact_type" "text" NOT NULL,
    "contact_value" "text" NOT NULL,
    "channel" "text" NOT NULL,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "sent_at" timestamp with time zone,
    "error" "text",
    "payload" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."case_activity_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."case_repository" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "case_name" "text" NOT NULL,
    "citation_value" "text",
    "source_database" "text",
    "source_url" "text",
    "case_text" "text",
    "original_filename" "text",
    "file_size" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "search_vector" "tsvector",
    "legal_summary" "jsonb",
    "legal_summary_updated_at" timestamp with time zone,
    "legal_summary_error" "text",
    "file_path" "text",
    "extraction_status" "text" DEFAULT 'pending'::"text",
    "extraction_error" "text",
    "extraction_started_at" timestamp with time zone,
    "extraction_completed_at" timestamp with time zone,
    "act" "text",
    "section" "text",
    CONSTRAINT "case_repository_extraction_status_check" CHECK (("extraction_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'ready'::"text", 'failed'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."case_repository" OWNER TO "postgres";


COMMENT ON COLUMN "public"."case_repository"."file_path" IS 'Storage path of the uploaded PDF file in Supabase Storage (e.g., case-repository/workspace-id/file.pdf)';



COMMENT ON COLUMN "public"."case_repository"."extraction_status" IS '
Extraction status for PDF uploads:
- pending: File uploaded, awaiting extraction
- processing: Extraction in progress
- ready: Text successfully extracted
- failed: Extraction failed (see extraction_error)
- manual: Text entered manually (no file)
';



CREATE TABLE IF NOT EXISTS "public"."votum_cases" (
    "id" integer NOT NULL,
    "cin_no" "text",
    "registration_no" "text",
    "filing_no" "text",
    "case_no" "text",
    "registration_date" "date",
    "filing_date" "date",
    "first_listing_date" "date",
    "next_listing_date" "date",
    "last_listing_date" "date",
    "decision_date" "date",
    "court_no" "text",
    "disposal_nature" "text",
    "purpose_next" "text",
    "case_type" "text",
    "judges" "text",
    "acts" "jsonb",
    "history" "jsonb",
    "orders" "jsonb",
    "additional_info" "jsonb",
    "original_json" "jsonb",
    "workspace_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "client_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "case_documents" "jsonb" DEFAULT '[]'::"jsonb",
    "upload_tokens" "jsonb" DEFAULT '{}'::"jsonb",
    "reminder_contacts" "jsonb" DEFAULT '[]'::"jsonb",
    "case_notes" "jsonb" DEFAULT '[]'::"jsonb",
    "assigned_user_ids" "uuid"[],
    "client_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "petitioner" "text"[],
    "respondent" "text"[],
    "status" "text",
    "bookmarks" "jsonb",
    "created_by" "uuid",
    "cause_list_entries" "jsonb" DEFAULT '[]'::"jsonb",
    "guest_user_ids" "uuid"[],
    "connected_matters" "jsonb",
    "ia_details" "jsonb",
    "application_appeal_matters" "jsonb",
    "court_code" "text",
    "court_query_params" "jsonb" DEFAULT '{}'::"jsonb",
    "court_display" "jsonb" DEFAULT '{}'::"jsonb",
    "advocates" "text",
    "manual_name" "text",
    "is_stale" boolean DEFAULT false,
    "petitioner_text" "text",
    "respondent_text" "text",
    "tags" "text"[]
);


ALTER TABLE "public"."votum_cases" OWNER TO "postgres";


COMMENT ON COLUMN "public"."votum_cases"."filing_no" IS 'Filing number of the case';



COMMENT ON COLUMN "public"."votum_cases"."case_documents" IS 'JSON array containing case documents metadata. Each document includes: id, file_name, file_path, file_size, file_type, uploaded_by_name, uploaded_by_id, created_at';



COMMENT ON COLUMN "public"."votum_cases"."upload_tokens" IS 'JSON object containing upload token data. Structure: {
  "upload_token": "uuid",
  "upload_limit": number,
  "upload_token_expires": "ISO timestamp",
  "download_token": "uuid",
  "download_token_expires": "ISO timestamp"
}';



COMMENT ON COLUMN "public"."votum_cases"."reminder_contacts" IS 'Array of reminder contact objects ({ id, type, value, added_by_id, added_by_name, created_at }) for case activity notifications.';



COMMENT ON COLUMN "public"."votum_cases"."is_stale" IS '
True if the case data (next_listing_date) has not changed after a hearing date.
Stale entries show "not yet available" on reports until fresh data is available.
';



CREATE SEQUENCE IF NOT EXISTS "public"."cases_case_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."cases_case_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."cases_case_id_seq" OWNED BY "public"."votum_cases"."id";



CREATE TABLE IF NOT EXISTS "public"."cause_list_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "case_id" integer NOT NULL,
    "workspace_id" "uuid",
    "listing_date" "date" NOT NULL,
    "court_name" "text",
    "item_no" "text" DEFAULT ''::"text" NOT NULL,
    "page_no" integer DEFAULT 0 NOT NULL,
    "text" "text" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."cause_list_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "external_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chat_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text", 'tool'::"text"])))
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "title" "text" DEFAULT 'New chat'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chat_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clm_approval_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "step_id" "uuid" NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clm_approval_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clm_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clm_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clm_contract_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "version_id" "uuid",
    "storage_provider" "text" NOT NULL,
    "storage_key" "text" NOT NULL,
    "mime_type" "text",
    "size_bytes" bigint,
    "checksum" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clm_contract_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clm_contract_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "version_number" integer NOT NULL,
    "content" "text",
    "content_hash" "text",
    "source" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_current" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."clm_contract_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clm_contracts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."clm_contracts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clm_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'unread'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clm_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clm_signature_envelopes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "provider_envelope_id" "text",
    "status" "text" DEFAULT 'created'::"text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clm_signature_envelopes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clm_signature_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "envelope_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "event_payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clm_signature_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clm_sla_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "step_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "scheduled_for" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clm_sla_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clm_wopi_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "file_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "lock_id" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clm_wopi_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clm_workflow_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "conditions" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "steps" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clm_workflow_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clm_workflow_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "assignee_id" "uuid" NOT NULL,
    "rank" integer NOT NULL,
    "status" "text" DEFAULT 'not_assigned'::"text" NOT NULL,
    "deadline_at" timestamp with time zone,
    "actioned_at" timestamp with time zone,
    "actioned_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clm_workflow_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clm_workflows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "version_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "started_by" "uuid" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "rule_set_id" "uuid"
);


ALTER TABLE "public"."clm_workflows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compliance_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "updated_by" "uuid",
    "title" "text" NOT NULL,
    "reference_number" "text",
    "compliance_module" "text" NOT NULL,
    "category" "text",
    "sub_category" "text",
    "authority" "text",
    "jurisdiction" "text",
    "site_entity" "text",
    "status" "text" DEFAULT 'Active'::"text" NOT NULL,
    "risk_level" "text" DEFAULT 'Low'::"text" NOT NULL,
    "periodicity" "text" DEFAULT 'Annual'::"text" NOT NULL,
    "effective_date" "date",
    "expiry_date" "date",
    "next_due_date" "date",
    "due_date_label" "text",
    "owner_id" "uuid",
    "assignee_id" "uuid",
    "notes" "text",
    "milestones" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "checklist" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "compliance_records_compliance_module_check" CHECK (("compliance_module" = ANY (ARRAY['pharma'::"text", 'gst'::"text", 'income_tax'::"text", 'corporate'::"text", 'labour'::"text", 'environment'::"text", 'fema'::"text", 'custom'::"text"]))),
    CONSTRAINT "compliance_records_periodicity_check" CHECK (("periodicity" = ANY (ARRAY['One-time'::"text", 'Monthly'::"text", 'Quarterly'::"text", 'Half-yearly'::"text", 'Annual'::"text", 'Biennial'::"text", 'On Renewal'::"text"]))),
    CONSTRAINT "compliance_records_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['Low'::"text", 'Medium'::"text", 'High'::"text", 'Critical'::"text"]))),
    CONSTRAINT "compliance_records_status_check" CHECK (("status" = ANY (ARRAY['Active'::"text", 'Due Soon'::"text", 'Overdue'::"text", 'Filed'::"text", 'Pending Review'::"text", 'Exempted'::"text", 'Closed'::"text"])))
);


ALTER TABLE "public"."compliance_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_assignees" (
    "task_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "assigned_by" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."task_assignees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "serial" integer NOT NULL,
    "name" "text" DEFAULT 'Untitled'::"text" NOT NULL,
    "priority" "text" DEFAULT 'Low'::"text" NOT NULL,
    "startDate" "date" DEFAULT CURRENT_DATE,
    "dueDate" "date",
    "status" smallint DEFAULT '0'::smallint,
    "workspace_id" "uuid" NOT NULL,
    "last_updated_by" "uuid",
    "documents" "jsonb",
    "sub_tasks" "jsonb",
    "taskContent" "text",
    "approver_id" "uuid",
    "client_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_updated_time" timestamp with time zone,
    "assigned_by" "uuid",
    "assigned_team" "uuid",
    "moved_to_done_at" timestamp with time zone,
    "email_message_id" "text",
    "has_active_workflow" boolean DEFAULT false,
    "cc_users" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_by" "uuid",
    "case_id" integer,
    "source" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "custom_fields" "jsonb" DEFAULT '{}'::"jsonb",
    "ipr_matter_id" "uuid",
    "compliance_record_id" "uuid",
    "applied_template_id" integer,
    "applied_template_name" "text",
    "auto_destruct" boolean DEFAULT false NOT NULL,
    "auto_destruct_days" integer DEFAULT 0 NOT NULL,
    "priority_rank" smallint GENERATED ALWAYS AS (
CASE "lower"("priority")
    WHEN 'high'::"text" THEN 0
    WHEN 'medium'::"text" THEN 1
    ELSE 2
END) STORED
);


ALTER TABLE "public"."votum_tasks" OWNER TO "postgres";


COMMENT ON COLUMN "public"."votum_tasks"."created_by" IS 'UUID of the user who originally created this task';



COMMENT ON COLUMN "public"."votum_tasks"."ipr_matter_id" IS 'Links task to an IPR matter (replaces filings/checklist arrays)';



COMMENT ON COLUMN "public"."votum_tasks"."applied_template_id" IS 'The ID of the template applied to this task. Once set, templates cannot be changed.';



COMMENT ON COLUMN "public"."votum_tasks"."applied_template_name" IS 'The name of the applied template at the time of application (for reference if template is deleted).';



CREATE OR REPLACE VIEW "public"."comprehensive_task_report" AS
 SELECT "ta"."user_id" AS "assigned_to",
    "count"(*) AS "total_tasks",
    "sum"(
        CASE
            WHEN ("t"."status" = 3) THEN 1
            ELSE 0
        END) AS "completed_tasks",
    "round"(((("sum"(
        CASE
            WHEN ("t"."status" = 3) THEN 1
            ELSE 0
        END))::numeric * 100.0) / ("count"(*))::numeric), 2) AS "completion_rate",
    "sum"(
        CASE
            WHEN (("t"."status" = 3) AND ("t"."dueDate" < "t"."last_updated_time")) THEN 1
            ELSE 0
        END) AS "late_submissions",
    "max"("t"."last_updated_time") AS "last_activity",
    "min"("t"."startDate") AS "first_task_start_date",
    "max"("t"."dueDate") AS "latest_due_date"
   FROM ("public"."votum_tasks" "t"
     JOIN "public"."task_assignees" "ta" ON (("ta"."task_id" = "t"."id")))
  WHERE ("t"."workspace_id" = 'b5c2e07a-e952-44c4-a0eb-e44bc01a8a89'::"uuid")
  GROUP BY "ta"."user_id";


ALTER TABLE "public"."comprehensive_task_report" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_requests" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone_number" "text" NOT NULL,
    "number_of_lawyers" "text" NOT NULL,
    "specialisation" "text" NOT NULL,
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "status" smallint DEFAULT '0'::smallint NOT NULL
);


ALTER TABLE "public"."contact_requests" OWNER TO "postgres";


COMMENT ON COLUMN "public"."contact_requests"."status" IS '0: for pending , 1: for in progress , 2: resolved, 3: for cancelled';



CREATE SEQUENCE IF NOT EXISTS "public"."contact_requests_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."contact_requests_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."contact_requests_id_seq" OWNED BY "public"."contact_requests"."id";



CREATE TABLE IF NOT EXISTS "public"."credit_costs" (
    "id" "uuid" DEFAULT "gen_random_uuid"(),
    "feature" "text" NOT NULL,
    "cost" integer NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    CONSTRAINT "credit_costs_cost_check" CHECK (("cost" > 0))
);


ALTER TABLE "public"."credit_costs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_packages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "credits" integer NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "is_active" boolean DEFAULT true,
    "is_popular" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "stripe_price_id" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    CONSTRAINT "credit_packages_credits_check" CHECK (("credits" > 0)),
    CONSTRAINT "credit_packages_price_check" CHECK (("price" >= (0)::numeric))
);


ALTER TABLE "public"."credit_packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "workspace_id" "text" NOT NULL,
    "type" "text" NOT NULL,
    "amount" integer NOT NULL,
    "balance_before" integer NOT NULL,
    "balance_after" integer NOT NULL,
    "feature" "text",
    "feature_session_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "credit_type" "text" DEFAULT 'ai'::"text" NOT NULL,
    CONSTRAINT "credit_transactions_type_check" CHECK (("type" = ANY (ARRAY['purchase'::"text", 'consume'::"text", 'refund'::"text", 'bonus'::"text", 'grant'::"text"])))
);


ALTER TABLE "public"."credit_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cron_job_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_name" "text" NOT NULL,
    "status" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "finished_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "summary" "jsonb",
    "error" "text",
    CONSTRAINT "cron_job_runs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'running'::"text", 'success'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."cron_job_runs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."daily_api_usage_trends" AS
 SELECT "date"("api"."created_at") AS "usage_date",
    "api"."endpoint",
    "api"."model",
    "count"(*) AS "total_requests",
    "count"(DISTINCT "api"."user_id") AS "unique_users",
    "count"(DISTINCT "api"."workspace_id") AS "unique_workspaces",
    "sum"("api"."input_tokens") AS "total_input_tokens",
    "sum"("api"."output_tokens") AS "total_output_tokens",
    "sum"("api"."total_tokens") AS "total_tokens",
    "sum"("api"."cost_usd") AS "total_cost_usd",
    "avg"("api"."total_tokens") AS "avg_tokens_per_request"
   FROM "public"."api_usage_tracking" "api"
  GROUP BY ("date"("api"."created_at")), "api"."endpoint", "api"."model"
  ORDER BY ("date"("api"."created_at")) DESC, ("count"(*)) DESC;


ALTER TABLE "public"."daily_api_usage_trends" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delegation_chains" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid",
    "draft_id" "uuid",
    "workspace_id" "uuid" NOT NULL,
    "initiated_by" "uuid" NOT NULL,
    "current_assignee" "uuid" NOT NULL,
    "status" "text" DEFAULT 'delegating'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    CONSTRAINT "delegation_chains_status_check" CHECK (("status" = ANY (ARRAY['delegating'::"text", 'working'::"text", 'completed'::"text"]))),
    CONSTRAINT "delegation_entity_check" CHECK (((("task_id" IS NOT NULL) AND ("draft_id" IS NULL)) OR (("task_id" IS NULL) AND ("draft_id" IS NOT NULL))))
);


ALTER TABLE "public"."delegation_chains" OWNER TO "postgres";


COMMENT ON COLUMN "public"."delegation_chains"."status" IS 'Simplified status: delegating (setting up), working (active work), completed (all done)';



CREATE TABLE IF NOT EXISTS "public"."delegation_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "delegation_chain_id" "uuid" NOT NULL,
    "delegated_by" "uuid" NOT NULL,
    "delegated_to" "uuid" NOT NULL,
    "step_order" integer NOT NULL,
    "status" "text" DEFAULT 'working'::"text" NOT NULL,
    "delegated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "notes" "text",
    CONSTRAINT "delegation_steps_status_check" CHECK (("status" = ANY (ARRAY['working'::"text", 'completed'::"text", 'done'::"text"])))
);


ALTER TABLE "public"."delegation_steps" OWNER TO "postgres";


COMMENT ON COLUMN "public"."delegation_steps"."status" IS 'Simplified status: working (doing work or delegating), completed (awaiting review), done (reviewed and approved)';



CREATE TABLE IF NOT EXISTS "public"."designations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "level" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."designations" OWNER TO "postgres";


COMMENT ON TABLE "public"."designations" IS 'Designation master for each workspace/organization.';



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
    "sio_name" "text"
);


ALTER TABLE "public"."dggi_alert_circular_records" OWNER TO "postgres";


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
    "prosecution_filed" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."dggi_arrest_records" OWNER TO "postgres";


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
    "transferred_to" "text"
);


ALTER TABLE "public"."dggi_closure_records" OWNER TO "postgres";


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
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."dggi_computed_deadlines" OWNER TO "postgres";


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
    "sio" "uuid",
    "sio_name" "text",
    "handling_officer_name" "text"
);


ALTER TABLE "public"."dggi_cpgram_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dggi_deadline_alerts_sent" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "rule_id" "text" NOT NULL,
    "record_id" "text" NOT NULL,
    "reminder_bucket" integer NOT NULL,
    "last_sent_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."dggi_deadline_alerts_sent" OWNER TO "postgres";


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
    "sio" "uuid",
    "sio_name" "text"
);


ALTER TABLE "public"."dggi_dfl_records" OWNER TO "postgres";


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
    "seized_by" "uuid",
    "sio_name" "text",
    "seized_by_name" "text"
);


ALTER TABLE "public"."dggi_evidence_room_records" OWNER TO "postgres";


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
    "sio_name" "text"
);


ALTER TABLE "public"."dggi_incident_report_records" OWNER TO "postgres";


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
    "sio" "uuid",
    "sio_name" "text"
);


ALTER TABLE "public"."dggi_informer_reward_records" OWNER TO "postgres";


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


ALTER TABLE "public"."dggi_intel_closure_records" OWNER TO "postgres";


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
    "e_office_ref_no" "text"
);


ALTER TABLE "public"."dggi_intel_other_source_records" OWNER TO "postgres";


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
    "sio_name" "text"
);


ALTER TABLE "public"."dggi_intel_rapid_records" OWNER TO "postgres";


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
    "sio_name" "text"
);


ALTER TABLE "public"."dggi_modus_operandi_records" OWNER TO "postgres";


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
    "sio_name" "text"
);


ALTER TABLE "public"."dggi_non_ir_case_records" OWNER TO "postgres";


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


ALTER TABLE "public"."dggi_notifications" OWNER TO "postgres";


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
    "linked_arrest_id" "uuid"
);


ALTER TABLE "public"."dggi_prosecution_arrest_records" OWNER TO "postgres";


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
    "reasons_not_filed" "text"
);


ALTER TABLE "public"."dggi_prosecution_non_arrest_records" OWNER TO "postgres";


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
    "sio" "uuid",
    "sio_name" "text",
    "attachment_batch_id" "text"
);


ALTER TABLE "public"."dggi_provisional_attachment_records" OWNER TO "postgres";


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
    CONSTRAINT "dggi_records_group_check" CHECK (("group" = ANY (ARRAY['Group A'::"text", 'Group B'::"text", 'Group C'::"text", 'Group D'::"text", 'Group E'::"text"]))),
    CONSTRAINT "dggi_records_mode_of_initiation_check" CHECK (("mode_of_initiation" = ANY (ARRAY['Letter'::"text", 'Email'::"text", 'Summons'::"text", 'Inspection'::"text", 'Search'::"text"])))
);


ALTER TABLE "public"."dggi_records" OWNER TO "postgres";


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
    "submitted_by_name" "text"
);


ALTER TABLE "public"."dggi_report_compliance_records" OWNER TO "postgres";


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
    "common_adjudicating_authority" "text"
);


ALTER TABLE "public"."dggi_scn_records" OWNER TO "postgres";


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
    "seized_by_name" "text"
);


ALTER TABLE "public"."dggi_seizure_records" OWNER TO "postgres";


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
    "sio_name" "text"
);


ALTER TABLE "public"."dggi_str_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dggi_user_group_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "group_name" "text" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "dggi_user_group_valid_group" CHECK (("group_name" = ANY (ARRAY['Group A'::"text", 'Group B'::"text", 'Group C'::"text", 'Group D'::"text", 'Group E'::"text"])))
);


ALTER TABLE "public"."dggi_user_group_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_annotations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "storage_path" "text" NOT NULL,
    "storage_bucket" "text" NOT NULL,
    "highlights" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "outline" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."document_annotations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_folders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "parent_id" "uuid",
    "path" "public"."ltree",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "case_id" integer,
    "metadata" "jsonb"
);


ALTER TABLE "public"."document_folders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "pdf_url" "text" NOT NULL,
    "filename" "text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "annotations" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "folder_id" "uuid",
    "document_type" "text",
    "language" "text",
    "status" "text" DEFAULT 'uploaded'::"text" NOT NULL,
    "processed_at" timestamp with time zone,
    "error_message" "text",
    "hash_sha256" "text",
    "page_count" integer,
    "metadata" "jsonb",
    "extracted_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "case_id" integer,
    "source_provider" "text",
    "source_file_id" "text",
    "source_path" "text",
    "source_web_url" "text",
    "source_etag" "text",
    "source_mime_type" "text",
    "source_size_bytes" bigint,
    "source_modified_at" timestamp with time zone,
    "storage_bucket" "text",
    "storage_path" "text",
    "search_vector" "tsvector",
    CONSTRAINT "documents_status_check" CHECK (("status" = ANY (ARRAY['uploaded'::"text", 'processing'::"text", 'ready'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drafting_style_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "instructions" "text" NOT NULL,
    "sample_document_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "is_default" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."drafting_style_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."drafting_style_profiles" IS 'Stores drafting style profiles for AI-powered document generation using natural language instructions';



COMMENT ON COLUMN "public"."drafting_style_profiles"."instructions" IS 'Natural language instructions for AI, either user-provided or generated by LLM analysis of sample documents';



COMMENT ON COLUMN "public"."drafting_style_profiles"."sample_document_ids" IS 'Array of document IDs used as few-shot examples for style reference';



COMMENT ON COLUMN "public"."drafting_style_profiles"."is_default" IS 'Whether this is the default style profile for the workspace';



CREATE TABLE IF NOT EXISTS "public"."drafts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "serial" integer NOT NULL,
    "name" "text" NOT NULL,
    "priority" "text",
    "startDate" "date",
    "dueDate" "date",
    "status" smallint,
    "workspace_id" "uuid" NOT NULL,
    "last_updated_by" "uuid",
    "taskContent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_updated_time" timestamp with time zone,
    "placeholder_descriptions" "jsonb",
    "ai_session_id" "uuid",
    "created_by" "uuid",
    "clm_contract_id" "uuid",
    "clm_version_id" "uuid",
    "clm_workflow_id" "uuid",
    "clm_last_synced_at" timestamp with time zone,
    "wopi_storage_path" "text",
    "wopi_last_synced_at" timestamp with time zone
);


ALTER TABLE "public"."drafts" OWNER TO "postgres";


ALTER TABLE "public"."drafts" ALTER COLUMN "serial" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."drafts_serial_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."drive_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "connected_email" "text",
    "connected_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."drive_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drive_import_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "source_file_id" "text" NOT NULL,
    "source_path" "text",
    "source_name" "text",
    "source_web_url" "text",
    "source_mime_type" "text",
    "source_size_bytes" bigint,
    "source_modified_at" timestamp with time zone,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "error_message" "text",
    "document_id" "uuid",
    "import_metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "started_at" timestamp with time zone,
    "finished_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "drive_import_jobs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'running'::"text", 'done'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."drive_import_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."egazette_compliance_obligations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "gazette_id" "text" NOT NULL,
    "obligation_summary" "text" NOT NULL,
    "obligation_type" "text" NOT NULL,
    "target_entity_types" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "affected_industries" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "deadline_date" "date",
    "deadline_description" "text",
    "penalty_summary" "text",
    "issuing_authority" "text",
    "tags" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "processed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."egazette_compliance_obligations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."egazette_records" (
    "gazette_id" "text" NOT NULL,
    "ministry" "text",
    "department" "text",
    "office" "text",
    "subject" "text",
    "category" "text",
    "part_section" "text",
    "issue_date" "date",
    "publish_date" "date",
    "pdf_url" "text",
    "content" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "compliance_processed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."egazette_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."intake_forms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "title" "text" DEFAULT 'Untitled Form'::"text" NOT NULL,
    "description" "text",
    "fields" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "share_token" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(18), 'hex'::"text") NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."intake_forms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."intake_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_id" "uuid" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."intake_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ipr_clearance_searches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "mark_name" "text" NOT NULL,
    "classes" integer[] DEFAULT '{}'::integer[] NOT NULL,
    "jurisdiction" "text" DEFAULT 'IN'::"text" NOT NULL,
    "include_phonetic" boolean DEFAULT true NOT NULL,
    "include_permutation" boolean DEFAULT true NOT NULL,
    "include_proprietor" boolean DEFAULT false NOT NULL,
    "proprietor_name" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "error_message" "text",
    "results" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "result_count" integer DEFAULT 0 NOT NULL,
    "started_at" timestamp with time zone,
    "finished_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ipr_clearance_searches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ipr_matters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "updated_by" "uuid",
    "title" "text" NOT NULL,
    "client_name" "text" NOT NULL,
    "matter_type" "text" NOT NULL,
    "status" "text" NOT NULL,
    "stage" "text" NOT NULL,
    "risk_level" "text" DEFAULT 'Medium'::"text" NOT NULL,
    "jurisdiction" "text",
    "matter_ref" "text",
    "registration_number" "text",
    "owner_id" "uuid",
    "assignee_id" "uuid",
    "next_deadline" "date",
    "deadline_label" "text",
    "notes" "text",
    "filings" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "checklist" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "matter_notes" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "ipr_matters_matter_type_check" CHECK (("matter_type" = ANY (ARRAY['Trademark'::"text", 'Patent'::"text", 'Copyright'::"text", 'Design'::"text", 'Trade Secret'::"text", 'IP Dispute'::"text"]))),
    CONSTRAINT "ipr_matters_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['Low'::"text", 'Medium'::"text", 'High'::"text"]))),
    CONSTRAINT "ipr_matters_stage_check" CHECK (("stage" = ANY (ARRAY['Clearance'::"text", 'Drafting'::"text", 'Filed'::"text", 'Examination'::"text", 'Hearing'::"text", 'Renewal'::"text", 'Enforcement'::"text"]))),
    CONSTRAINT "ipr_matters_status_check" CHECK (("status" = ANY (ARRAY['Active'::"text", 'Registered'::"text", 'Under Review'::"text", 'Opposed'::"text", 'Renewal Due'::"text", 'Closed'::"text"])))
);


ALTER TABLE "public"."ipr_matters" OWNER TO "postgres";


COMMENT ON TABLE "public"."ipr_matters" IS 'Workspace-scoped IPR management matters with JSONB-backed filings and checklist data.';



COMMENT ON COLUMN "public"."ipr_matters"."filings" IS 'JSONB array of filing milestones, offices, dates, and statuses.';



COMMENT ON COLUMN "public"."ipr_matters"."checklist" IS 'JSONB array of next actions for the matter.';



COMMENT ON COLUMN "public"."ipr_matters"."metadata" IS 'Flexible extra data such as classes, goods/services, opposing parties, or strategy details.';



COMMENT ON COLUMN "public"."ipr_matters"."matter_notes" IS 'Structured notes array with author, timestamp, and edit history';



CREATE TABLE IF NOT EXISTS "public"."ipr_watch_hits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "application_number" "text" NOT NULL,
    "mark_name" "text",
    "proprietor" "text",
    "class_number" integer,
    "status" "text",
    "filing_date" "date",
    "journal_number" "text",
    "journal_date" "date",
    "similarity_type" "text" NOT NULL,
    "similarity_score" numeric(4,3),
    "match_detail" "text",
    "source" "text" DEFAULT 'journal'::"text" NOT NULL,
    "dismissed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "matter_id" "uuid"
);


ALTER TABLE "public"."ipr_watch_hits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."keyword_alert_matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "case_key" "text" NOT NULL,
    "court_identifier" "text" NOT NULL,
    "case_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "first_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "run_id" "uuid"
);


ALTER TABLE "public"."keyword_alert_matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."keyword_alert_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "finished_at" timestamp with time zone,
    "status" "text" DEFAULT 'running'::"text" NOT NULL,
    "subscriptions_scanned" integer DEFAULT 0 NOT NULL,
    "new_matches_found" integer DEFAULT 0 NOT NULL,
    "notifications_sent" integer DEFAULT 0 NOT NULL,
    "errors" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "summary" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "total_tasks" integer DEFAULT 0,
    "tasks_completed" integer DEFAULT 0,
    "tasks_failed" integer DEFAULT 0,
    "tasks_timed_out" integer DEFAULT 0,
    "mode" "text" DEFAULT 'legacy'::"text",
    CONSTRAINT "keyword_alert_runs_status_check" CHECK (("status" = ANY (ARRAY['running'::"text", 'success'::"text", 'failed'::"text", 'partial'::"text"])))
);


ALTER TABLE "public"."keyword_alert_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."keyword_alert_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "keyword" "text" NOT NULL,
    "search_type" "text" NOT NULL,
    "court_scope" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "notify_user_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "notify_channels" "text"[] DEFAULT ARRAY['in_app'::"text", 'email'::"text"] NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "matches_last_viewed_at" timestamp with time zone,
    CONSTRAINT "keyword_alert_subscriptions_search_type_check" CHECK (("search_type" = ANY (ARRAY['party_name'::"text", 'advocate_name'::"text"])))
);


ALTER TABLE "public"."keyword_alert_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."keyword_alert_task_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "run_id" "uuid" NOT NULL,
    "court_label" "text" NOT NULL,
    "court_type" "text" NOT NULL,
    "case_key" "text" NOT NULL,
    "case_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."keyword_alert_task_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."keyword_alert_task_subs" (
    "task_id" "uuid" NOT NULL,
    "subscription_id" "uuid" NOT NULL
);


ALTER TABLE "public"."keyword_alert_task_subs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."legal_review" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "workspace_id" "uuid",
    "file_name" "text",
    "extracted_text" "text",
    "response_markdown" "text",
    "feedback" "text",
    "rating" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "storage_bucket" "text",
    "storage_path" "text",
    "chat_history" "jsonb" DEFAULT '[]'::"jsonb",
    "status" "text" DEFAULT 'pending'::"text",
    "structured_data" "jsonb",
    "conversation_messages" "jsonb",
    "applicable_rules" "jsonb",
    CONSTRAINT "legal_review_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "legal_review_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."legal_review" OWNER TO "postgres";


COMMENT ON COLUMN "public"."legal_review"."extracted_text" IS 'Extracted text from PDF (null until processing completes)';



COMMENT ON COLUMN "public"."legal_review"."response_markdown" IS 'AI-generated legal review analysis (null until processing completes)';



COMMENT ON COLUMN "public"."legal_review"."storage_bucket" IS 'Supabase Storage bucket name where the PDF is stored';



COMMENT ON COLUMN "public"."legal_review"."storage_path" IS 'Path within the storage bucket where the PDF is stored';



COMMENT ON COLUMN "public"."legal_review"."chat_history" IS 'Conversation history including tool calls and responses from the legal review AI agent';



COMMENT ON COLUMN "public"."legal_review"."status" IS 'Processing status: pending=queued, processing=being analyzed, completed=analysis done, failed=error occurred';



CREATE TABLE IF NOT EXISTS "public"."legal_summary_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cache_key" "text" NOT NULL,
    "url" "text",
    "case_number" "text",
    "input_text_hash" "text" NOT NULL,
    "input_text_length" integer NOT NULL,
    "summary" "jsonb" NOT NULL,
    "case_snapshot" "jsonb",
    "pipeline_version" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."legal_summary_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."legal_summary_sessions" (
    "session_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "progress" integer DEFAULT 0 NOT NULL,
    "url" "text",
    "case_number" "text",
    "cache_key" "text",
    "input_text_hash" "text" NOT NULL,
    "input_text_length" integer NOT NULL,
    "input_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "summary" "jsonb",
    "case_snapshot" "jsonb",
    "error_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."legal_summary_sessions" OWNER TO "postgres";


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


ALTER TABLE "public"."votum_users" OWNER TO "postgres";


COMMENT ON COLUMN "public"."votum_users"."name" IS 'Te name of  The User';



COMMENT ON COLUMN "public"."votum_users"."email" IS 'The email ID of user';



COMMENT ON COLUMN "public"."votum_users"."cal_config" IS 'JSON structure containing Cal.com user configuration: { username, user_id, integrated, access_token, refresh_token, event_types, last_synced }';



COMMENT ON COLUMN "public"."votum_users"."invite_code" IS 'Unique invite code for adding user as external collaborator across workspaces';



COMMENT ON COLUMN "public"."votum_users"."phone" IS 'WhatsApp phone number in E.164 format for receiving document forwards and task messages';



COMMENT ON COLUMN "public"."votum_users"."whatsapp_phone_verified" IS 'Whether the WhatsApp phone number has been verified via WhatsApp Business API OTP template';



COMMENT ON COLUMN "public"."votum_users"."whatsapp_otp" IS 'Temporary 6-digit OTP used for WhatsApp phone verification';



COMMENT ON COLUMN "public"."votum_users"."whatsapp_otp_expires_at" IS 'Expiry timestamp for the WhatsApp phone verification OTP';



COMMENT ON COLUMN "public"."votum_users"."checklist_state" IS 'Stores user progress on supplementary tools checklist (Chrome extension, mobile apps, WhatsApp)';



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
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "translation_base_price" numeric(10,2) DEFAULT NULL::numeric,
    "auto_destruct" boolean DEFAULT false NOT NULL,
    "auto_destruct_days" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."votum_workspace" OWNER TO "postgres";


COMMENT ON COLUMN "public"."votum_workspace"."cal_team_config" IS 'JSON structure containing Cal.com team configuration: { team_id, team_slug, team_name, integrated, booking_options: { allow_random_assignment, require_approval } }';



COMMENT ON COLUMN "public"."votum_workspace"."quota" IS 'Available translation quota for the workspace (1 quota = 1 page)';



COMMENT ON COLUMN "public"."votum_workspace"."enabled_modules" IS 'List of module keys enabled for this workspace (e.g. cases, drafts, clm, translate). Controlled by superadmins.';



COMMENT ON COLUMN "public"."votum_workspace"."transcription_quota_seconds" IS 'Monthly transcription allowance in seconds (default 7200 = 2 hours)';



COMMENT ON COLUMN "public"."votum_workspace"."transcription_quota_used_seconds" IS 'Seconds of audio transcribed in the current quota period';



COMMENT ON COLUMN "public"."votum_workspace"."transcription_quota_reset_at" IS 'Start of the current quota period; reset when a new month begins';



CREATE OR REPLACE VIEW "public"."monthly_user_api_usage" AS
 SELECT "u"."id" AS "user_id",
    "u"."name" AS "user_name",
    "u"."email" AS "user_email",
    "w"."id" AS "workspace_id",
    "w"."name" AS "workspace_name",
    "api"."billing_period",
    "api"."endpoint",
    "api"."model",
    "count"(*) AS "total_requests",
    "sum"("api"."input_tokens") AS "total_input_tokens",
    "sum"("api"."output_tokens") AS "total_output_tokens",
    "sum"("api"."total_tokens") AS "total_tokens",
    "sum"("api"."cost_usd") AS "total_cost_usd",
    "avg"("api"."total_tokens") AS "avg_tokens_per_request",
    "max"("api"."created_at") AS "last_request_at",
    "min"("api"."created_at") AS "first_request_at"
   FROM (("public"."api_usage_tracking" "api"
     JOIN "public"."votum_users" "u" ON (("api"."user_id" = "u"."id")))
     JOIN "public"."votum_workspace" "w" ON (("api"."workspace_id" = "w"."id")))
  GROUP BY "u"."id", "u"."name", "u"."email", "w"."id", "w"."name", "api"."billing_period", "api"."endpoint", "api"."model"
  ORDER BY "api"."billing_period" DESC, ("sum"("api"."cost_usd")) DESC;


ALTER TABLE "public"."monthly_user_api_usage" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."monthly_workspace_api_usage" AS
 SELECT "w"."id" AS "workspace_id",
    "w"."name" AS "workspace_name",
    "api"."billing_period",
    "api"."endpoint",
    "api"."model",
    "count"(*) AS "total_requests",
    "count"(DISTINCT "api"."user_id") AS "unique_users",
    "sum"("api"."input_tokens") AS "total_input_tokens",
    "sum"("api"."output_tokens") AS "total_output_tokens",
    "sum"("api"."total_tokens") AS "total_tokens",
    "sum"("api"."cost_usd") AS "total_cost_usd",
    "avg"("api"."total_tokens") AS "avg_tokens_per_request",
    "max"("api"."created_at") AS "last_request_at",
    "min"("api"."created_at") AS "first_request_at"
   FROM ("public"."api_usage_tracking" "api"
     JOIN "public"."votum_workspace" "w" ON (("api"."workspace_id" = "w"."id")))
  GROUP BY "w"."id", "w"."name", "api"."billing_period", "api"."endpoint", "api"."model"
  ORDER BY "api"."billing_period" DESC, ("sum"("api"."cost_usd")) DESC;


ALTER TABLE "public"."monthly_workspace_api_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_documents" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "pdf_url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "document_type" "text",
    "language" "text",
    "filename" "text",
    "tags" "text"[],
    "extracted_text" "text",
    "client_id" "uuid",
    "workspace_id" "uuid",
    "metaData" "jsonb"
);


ALTER TABLE "public"."task_documents" OWNER TO "postgres";


ALTER TABLE "public"."task_documents" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."ocr_documents_metadata_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."org_units" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "unit_type" "public"."org_unit_type" NOT NULL,
    "name" "text" NOT NULL,
    "code" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."org_units" OWNER TO "postgres";


COMMENT ON TABLE "public"."org_units" IS 'Generic hierarchy tree for government, law firms, and other organizations.';



CREATE TABLE IF NOT EXISTS "public"."outlook_calendar_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "app_event_id" "uuid" NOT NULL,
    "outlook_event_id" character varying(255) NOT NULL,
    "outlook_change_key" character varying(255),
    "last_synced" timestamp with time zone DEFAULT "now"(),
    "sync_direction" character varying(20),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "outlook_calendar_mappings_sync_direction_check" CHECK ((("sync_direction")::"text" = ANY ((ARRAY['app_to_outlook'::character varying, 'outlook_to_app'::character varying, 'bidirectional'::character varying])::"text"[])))
);


ALTER TABLE "public"."outlook_calendar_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."outreach_leads" (
    "id" integer NOT NULL,
    "entity_name" "text" NOT NULL,
    "entity_type" "text",
    "parent_dept" "text",
    "url" "text",
    "priority" "text",
    "justification" "text",
    "to_email" "text",
    "salutation" "text" DEFAULT 'Sir/Ma''am'::"text",
    "domain_ref" "text",
    "active" integer DEFAULT 1,
    "url_status" "text",
    "campaign" "text",
    "notes" "text",
    "sales_owner" "text",
    "lead_stage" "text" DEFAULT 'Cold'::"text",
    "follow_up_date" "text",
    "phone" "text",
    "designation" "text"
);


ALTER TABLE "public"."outreach_leads" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."outreach_leads_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."outreach_leads_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."outreach_leads_id_seq" OWNED BY "public"."outreach_leads"."id";



CREATE TABLE IF NOT EXISTS "public"."outreach_sequence_log" (
    "id" integer NOT NULL,
    "lead_id" integer NOT NULL,
    "stage" integer NOT NULL,
    "scheduled_date" "text" NOT NULL,
    "sent_at" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "ses_message_id" "text"
);


ALTER TABLE "public"."outreach_sequence_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."outreach_sequence_log_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."outreach_sequence_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."outreach_sequence_log_id_seq" OWNED BY "public"."outreach_sequence_log"."id";



CREATE TABLE IF NOT EXISTS "public"."votum_task_ownership_periods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "user_name" "text",
    "user_email" "text",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "duration_seconds" integer,
    "workspace_id" "uuid" NOT NULL,
    "assigned_by" "uuid",
    "assignment_reason" "text",
    "task_status_at_start" integer,
    "task_status_at_end" integer,
    "task_priority_at_start" "text",
    "task_priority_at_end" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_ownership_period" CHECK ((("ended_at" IS NULL) OR ("ended_at" >= "started_at")))
);


ALTER TABLE "public"."votum_task_ownership_periods" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."ownership_performance_analysis" AS
 WITH "ownership_periods" AS (
         SELECT "op"."id" AS "ownership_period_id",
            "op"."task_id",
            "op"."user_id",
            "op"."user_name",
            "op"."workspace_id",
            "op"."started_at",
            "op"."ended_at",
            "op"."duration_seconds",
            "op"."task_status_at_start",
            "op"."task_status_at_end",
            "t"."name" AS "task_name",
            "t"."status" AS "current_task_status",
            "t"."priority",
            "t"."dueDate" AS "due_date",
            "t"."moved_to_done_at",
            "t"."created_at" AS "task_created_at",
                CASE
                    WHEN ("op"."task_status_at_end" = 3) THEN true
                    ELSE false
                END AS "completed_during_ownership",
                CASE
                    WHEN (("op"."ended_at" IS NOT NULL) AND ("t"."dueDate" IS NOT NULL) AND ("op"."ended_at" > "t"."dueDate") AND ("op"."task_status_at_end" <> 3)) THEN true
                    WHEN (("op"."ended_at" IS NOT NULL) AND ("t"."dueDate" IS NOT NULL) AND ("op"."ended_at" > "t"."dueDate") AND ("op"."task_status_at_end" = 3) AND (("op"."ended_at" - ("t"."dueDate")::timestamp with time zone) > '00:00:00'::interval)) THEN true
                    ELSE false
                END AS "was_overdue_at_end",
                CASE
                    WHEN (("op"."task_status_at_end" = 3) AND ("t"."dueDate" IS NOT NULL)) THEN
                    CASE
                        WHEN ("op"."ended_at" <= "t"."dueDate") THEN 'on_time'::"text"
                        ELSE 'late'::"text"
                    END
                    WHEN ("op"."task_status_at_end" = 3) THEN 'on_time'::"text"
                    ELSE NULL::"text"
                END AS "completion_timing"
           FROM ("public"."votum_task_ownership_periods" "op"
             JOIN "public"."votum_tasks" "t" ON (("op"."task_id" = "t"."id")))
          WHERE ("op"."workspace_id" IS NOT NULL)
        ), "user_performance" AS (
         SELECT "ownership_periods"."user_id",
            "ownership_periods"."user_name",
            "ownership_periods"."workspace_id",
            "count"(*) AS "total_tasks_owned",
            "count"(*) FILTER (WHERE ("ownership_periods"."completed_during_ownership" = true)) AS "tasks_completed",
            "count"(*) FILTER (WHERE (("ownership_periods"."completed_during_ownership" = true) AND ("ownership_periods"."completion_timing" = 'on_time'::"text"))) AS "completed_on_time",
            "count"(*) FILTER (WHERE (("ownership_periods"."completed_during_ownership" = true) AND ("ownership_periods"."completion_timing" = 'late'::"text"))) AS "completed_late",
            "count"(*) FILTER (WHERE (("ownership_periods"."ended_at" IS NOT NULL) AND ("ownership_periods"."completed_during_ownership" = false))) AS "delegated_away",
            "count"(*) FILTER (WHERE ("ownership_periods"."ended_at" IS NULL)) AS "current_tasks_owned",
            "count"(*) FILTER (WHERE (("ownership_periods"."ended_at" IS NULL) AND ("ownership_periods"."current_task_status" <> 3) AND ("ownership_periods"."due_date" IS NOT NULL) AND ("ownership_periods"."due_date" < "now"()))) AS "current_overdue",
            "count"(*) FILTER (WHERE (("ownership_periods"."ended_at" IS NULL) AND ("ownership_periods"."current_task_status" <> 3) AND (("ownership_periods"."due_date" IS NULL) OR ("ownership_periods"."due_date" >= "now"())))) AS "current_on_track",
            "avg"("ownership_periods"."duration_seconds") FILTER (WHERE ("ownership_periods"."duration_seconds" IS NOT NULL)) AS "avg_ownership_duration_seconds",
            "sum"("ownership_periods"."duration_seconds") FILTER (WHERE ("ownership_periods"."duration_seconds" IS NOT NULL)) AS "total_ownership_duration_seconds"
           FROM "ownership_periods"
          GROUP BY "ownership_periods"."user_id", "ownership_periods"."user_name", "ownership_periods"."workspace_id"
        )
 SELECT "up"."user_id",
    "up"."user_name",
    "up"."workspace_id",
    "up"."total_tasks_owned",
    "up"."tasks_completed",
    "up"."completed_on_time",
    "up"."completed_late",
    "up"."delegated_away",
    "up"."current_tasks_owned",
    "up"."current_overdue",
    "up"."current_on_track",
    "up"."current_tasks_owned" AS "pending_tasks",
        CASE
            WHEN ("up"."total_tasks_owned" > 0) THEN "round"(((("up"."tasks_completed")::numeric / ("up"."total_tasks_owned")::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS "completion_percentage",
        CASE
            WHEN ("up"."avg_ownership_duration_seconds" IS NOT NULL) THEN "round"(("up"."avg_ownership_duration_seconds" / 86400.0), 2)
            ELSE NULL::numeric
        END AS "avg_ownership_days",
        CASE
            WHEN ("up"."total_ownership_duration_seconds" IS NOT NULL) THEN "round"((("up"."total_ownership_duration_seconds")::numeric / 86400.0), 2)
            ELSE NULL::numeric
        END AS "total_ownership_days"
   FROM "user_performance" "up";


ALTER TABLE "public"."ownership_performance_analysis" OWNER TO "postgres";


COMMENT ON VIEW "public"."ownership_performance_analysis" IS '
Aggregates task performance metrics based on ownership periods rather than current assignment.
This ensures that all officers who contributed to a task are credited for their work,
even if the task was delegated to another officer.

Key differences from assignment-based metrics:
- Tasks Owned: Count of all ownership periods (may be > task count if tasks were delegated)
- Tasks Completed: Count of tasks completed during the officer''s ownership
- Current Tasks: Tasks currently owned (not yet delegated)
- Pending Overdue: Current tasks that are past due date

This view is used by the Worker Analysis report for fair performance attribution.
';



CREATE TABLE IF NOT EXISTS "public"."pdf_delivery_logs" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "run_date" "date" NOT NULL,
    "listing_date" "date" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "variant" "text" NOT NULL,
    "pdf_generated" boolean DEFAULT false NOT NULL,
    "case_count" integer DEFAULT 0 NOT NULL,
    "pdf_path" "text",
    "email_sent" integer DEFAULT 0 NOT NULL,
    "email_recipients" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "email_failed" boolean DEFAULT false NOT NULL,
    "whatsapp_sent" integer DEFAULT 0 NOT NULL,
    "whatsapp_recipients" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "whatsapp_errors" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "issues" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "status" "text" NOT NULL,
    "error" "text",
    CONSTRAINT "pdf_delivery_logs_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'partial'::"text", 'failed'::"text"]))),
    CONSTRAINT "pdf_delivery_logs_variant_check" CHECK (("variant" = ANY (ARRAY['pdf1'::"text", 'pdf2'::"text"])))
);


ALTER TABLE "public"."pdf_delivery_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."pdf_delivery_logs" IS 'One row per PDF delivery attempt (workspace or user-scoped). Drives ops alerting and delivery audits.';



COMMENT ON COLUMN "public"."pdf_delivery_logs"."issues" IS 'Structured array of detected problems: missing columns, unsent emails, zero-case runs, etc.';



CREATE SEQUENCE IF NOT EXISTS "public"."pdf_delivery_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."pdf_delivery_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."pdf_delivery_logs_id_seq" OWNED BY "public"."pdf_delivery_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."pdf_ink_strokes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "storage_path" "text" NOT NULL,
    "storage_bucket" "text",
    "page" integer NOT NULL,
    "color" "text" DEFAULT '#111827'::"text" NOT NULL,
    "width" double precision NOT NULL,
    "points" "jsonb" NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."pdf_ink_strokes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."playbook_clauses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "playbook_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "clause_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "position" "text" NOT NULL,
    "notes" "text",
    "outcome" "text",
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."playbook_clauses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."playbooks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "practice_area" "text",
    "deal_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."playbooks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."police_fir_co_remarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fir_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "author_name" "text" NOT NULL,
    "remark" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."police_fir_co_remarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."police_firs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "fir_no" "text" NOT NULL,
    "registration_date" "date",
    "police_station" "text",
    "circle" "text",
    "act_section" "jsonb",
    "crime_category" "text",
    "io_name" "text",
    "accused_party_name" "text",
    "custody" "text" DEFAULT 'bail'::"text",
    "blocker" "text",
    "time_limit" "text" DEFAULT '60 Days'::"text",
    "status" "text" DEFAULT 'Pending'::"text",
    "remarks" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "io_user_id" "uuid",
    "station_unit_id" "uuid"
);


ALTER TABLE "public"."police_firs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."police_firs_with_urgency" AS
 SELECT "police_firs"."id",
    "police_firs"."workspace_id",
    "police_firs"."fir_no",
    "police_firs"."registration_date",
    "police_firs"."police_station",
    "police_firs"."circle",
    "police_firs"."act_section",
    "police_firs"."crime_category",
    "police_firs"."io_name",
    "police_firs"."accused_party_name",
    "police_firs"."custody",
    "police_firs"."blocker",
    "police_firs"."time_limit",
    "police_firs"."status",
    "police_firs"."remarks",
    "police_firs"."created_by",
    "police_firs"."created_at",
    "police_firs"."io_user_id",
    "police_firs"."station_unit_id",
    COALESCE("police_firs"."registration_date", ("police_firs"."created_at")::"date") AS "fir_date_computed",
        CASE
            WHEN ("police_firs"."time_limit" = '90 Days'::"text") THEN 90
            ELSE 60
        END AS "track_days",
    ((COALESCE("police_firs"."registration_date", ("police_firs"."created_at")::"date") + ((
        CASE
            WHEN ("police_firs"."time_limit" = '90 Days'::"text") THEN 90
            ELSE 60
        END)::double precision * '1 day'::interval)))::"date" AS "deadline_date_computed",
    (((COALESCE("police_firs"."registration_date", ("police_firs"."created_at")::"date") + ((
        CASE
            WHEN ("police_firs"."time_limit" = '90 Days'::"text") THEN 90
            ELSE 60
        END)::double precision * '1 day'::interval)))::"date" - CURRENT_DATE) AS "days_remaining_computed",
        CASE
            WHEN ((((COALESCE("police_firs"."registration_date", ("police_firs"."created_at")::"date") + ((
            CASE
                WHEN ("police_firs"."time_limit" = '90 Days'::"text") THEN 90
                ELSE 60
            END)::double precision * '1 day'::interval)))::"date" - CURRENT_DATE) < 0) THEN 'breached'::"text"
            WHEN ((((COALESCE("police_firs"."registration_date", ("police_firs"."created_at")::"date") + ((
            CASE
                WHEN ("police_firs"."time_limit" = '90 Days'::"text") THEN 90
                ELSE 60
            END)::double precision * '1 day'::interval)))::"date" - CURRENT_DATE) <= 7) THEN 'critical'::"text"
            WHEN ((((COALESCE("police_firs"."registration_date", ("police_firs"."created_at")::"date") + ((
            CASE
                WHEN ("police_firs"."time_limit" = '90 Days'::"text") THEN 90
                ELSE 60
            END)::double precision * '1 day'::interval)))::"date" - CURRENT_DATE) <= 15) THEN 'warning'::"text"
            ELSE 'safe'::"text"
        END AS "urgency_level"
   FROM "public"."police_firs";


ALTER TABLE "public"."police_firs_with_urgency" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."police_office_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "file_type_code" "text" NOT NULL,
    "file_number" "text",
    "applicant_name" "text" NOT NULL,
    "applicant_designation" "text",
    "applicant_posting" "text",
    "applicant_user_id" "uuid",
    "current_stage" "text" DEFAULT 'submitted'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "stage_history" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "current_assignee_id" "uuid",
    "current_assignee_designation" "text",
    "amount" numeric(12,2),
    "token_number" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "target_completion" timestamp with time zone,
    "time_bar_date" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "remarks" "text",
    "applicant_pno" "text",
    "applicant_mobile" "text"
);


ALTER TABLE "public"."police_office_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pst_jobs" (
    "id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "error_message" "text",
    "result_data" "jsonb",
    "progress" "jsonb",
    CONSTRAINT "pst_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."pst_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."razorpay_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "razorpay_order_id" "text" NOT NULL,
    "razorpay_payment_id" "text" NOT NULL,
    "amount" integer NOT NULL,
    "currency" "text" DEFAULT 'INR'::"text" NOT NULL,
    "feature" "text",
    "status" "text" DEFAULT 'paid'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."razorpay_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid",
    "action" "public"."audit_action" NOT NULL,
    "field_name" "text",
    "old_value" "jsonb",
    "new_value" "jsonb",
    "change_category" "public"."audit_change_category" DEFAULT 'minor'::"public"."audit_change_category",
    "change_description" "text",
    "user_id" "uuid",
    "workspace_id" "uuid",
    "ip_address" "inet",
    "user_agent" "text",
    "session_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "batch_id" "uuid",
    "search_vector" "tsvector"
);


ALTER TABLE "public"."votum_audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_clients" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "gstin" "text",
    "address" "text",
    "custom_fields" "jsonb",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "workspace_id" "uuid",
    "last_updated_by" "uuid",
    "last_updated_time" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."votum_clients" OWNER TO "postgres";


COMMENT ON TABLE "public"."votum_clients" IS 'Master client table (organizations/companies)';



CREATE OR REPLACE VIEW "public"."recent_activity" AS
 SELECT "al"."id",
    "al"."table_name",
    "al"."record_id",
    "al"."action",
    "al"."field_name",
    "al"."old_value",
    "al"."new_value",
    "al"."change_category",
    "al"."change_description",
    "al"."user_id",
    "al"."workspace_id",
    "al"."ip_address",
    "al"."user_agent",
    "al"."session_id",
    "al"."created_at",
    "al"."metadata",
    "al"."batch_id",
    "al"."search_vector",
    "u"."name" AS "user_name",
    "u"."avatar_url" AS "user_avatar",
        CASE "al"."table_name"
            WHEN 'votum_tasks'::"text" THEN ( SELECT "votum_tasks"."name"
               FROM "public"."votum_tasks"
              WHERE ("votum_tasks"."id" = "al"."record_id"))
            WHEN 'votum_clients'::"text" THEN ( SELECT "votum_clients"."name" AS "Name"
               FROM "public"."votum_clients"
              WHERE ("votum_clients"."id" = "al"."record_id"))
            ELSE 'Unknown'::"text"
        END AS "record_name"
   FROM ("public"."votum_audit_logs" "al"
     LEFT JOIN "public"."votum_users" "u" ON (("al"."user_id" = "u"."id")))
  ORDER BY "al"."created_at" DESC;


ALTER TABLE "public"."recent_activity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scraper_health_states" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scraper_name" "text" NOT NULL,
    "status" "text" NOT NULL,
    "last_checked" timestamp with time zone DEFAULT "now"() NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "scraper_health_states_status_check" CHECK (("status" = ANY (ARRAY['up'::"text", 'down'::"text"])))
);


ALTER TABLE "public"."scraper_health_states" OWNER TO "postgres";


COMMENT ON TABLE "public"."scraper_health_states" IS 'Stores the last known health state of each court website scraper for alerting purposes';



COMMENT ON COLUMN "public"."scraper_health_states"."scraper_name" IS 'Name of the scraper (e.g., CESTAT, NCLT, SCI)';



COMMENT ON COLUMN "public"."scraper_health_states"."status" IS 'Current status: "up" or "down"';



COMMENT ON COLUMN "public"."scraper_health_states"."last_checked" IS 'Timestamp of last health check';



COMMENT ON COLUMN "public"."scraper_health_states"."details" IS 'JSON object with additional details (error message, response time, etc.)';



CREATE TABLE IF NOT EXISTS "public"."scraper_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scraper_name" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "status" "text" NOT NULL,
    "records_scraped" integer DEFAULT 0,
    "records_inserted" integer DEFAULT 0,
    "error_message" "text",
    "debug_artifact_url" "text",
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "scraper_runs_status_check" CHECK (("status" = ANY (ARRAY['in_progress'::"text", 'success'::"text", 'failed'::"text", 'partial'::"text"])))
);


ALTER TABLE "public"."scraper_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stack_clauses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stack_id" "uuid" NOT NULL,
    "document_id" "uuid" NOT NULL,
    "chunk_index" integer NOT NULL,
    "content" "text" NOT NULL,
    "clause_type" "text",
    "page_number" integer,
    "search_vector" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"english"'::"regconfig", "content")) STORED,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "workspace_id" "uuid",
    "practice_area" "text",
    "deal_type" "text",
    "outcome" "text"
);


ALTER TABLE "public"."stack_clauses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stack_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stack_id" "uuid" NOT NULL,
    "document_id" "uuid" NOT NULL,
    "added_by" "uuid",
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."stack_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stacks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "topic" "text",
    "practice_area" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."stacks" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."task_ownership_summary" AS
 SELECT "t"."id" AS "task_id",
    "t"."name" AS "task_name",
    "t"."status",
    "t"."priority",
    "t"."workspace_id",
    "current_owner"."user_id" AS "current_owner_id",
    "current_owner"."user_name" AS "current_owner_name",
    "current_owner"."started_at" AS "current_ownership_started",
    (EXTRACT(epoch FROM ("now"() - "current_owner"."started_at")))::integer AS "current_ownership_duration_seconds",
    "count"("ownership"."id") AS "total_ownership_changes",
    "avg"("ownership"."duration_seconds") AS "avg_ownership_duration_seconds",
    "max"("ownership"."duration_seconds") AS "max_ownership_duration_seconds",
    "min"("ownership"."duration_seconds") AS "min_ownership_duration_seconds",
    "sum"("ownership"."duration_seconds") AS "total_completed_ownership_seconds",
    "min"("ownership"."started_at") AS "first_ownership_started",
    "max"(COALESCE("ownership"."ended_at", "now"())) AS "last_ownership_activity",
        CASE
            WHEN (("max"("ownership"."duration_seconds"))::numeric > ("avg"("ownership"."duration_seconds") * (3)::numeric)) THEN true
            ELSE false
        END AS "has_bottleneck_periods",
        CASE
            WHEN ("current_owner"."started_at" < ("now"() - '7 days'::interval)) THEN true
            ELSE false
        END AS "current_ownership_stale"
   FROM (("public"."votum_tasks" "t"
     LEFT JOIN "public"."votum_task_ownership_periods" "current_owner" ON ((("t"."id" = "current_owner"."task_id") AND ("current_owner"."ended_at" IS NULL))))
     LEFT JOIN "public"."votum_task_ownership_periods" "ownership" ON (("t"."id" = "ownership"."task_id")))
  GROUP BY "t"."id", "t"."name", "t"."status", "t"."priority", "t"."workspace_id", "current_owner"."user_id", "current_owner"."user_name", "current_owner"."started_at";


ALTER TABLE "public"."task_ownership_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_sessions" (
    "session_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "task_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" NOT NULL,
    "progress" integer DEFAULT 0 NOT NULL,
    "metadata" "jsonb",
    "input_data" "jsonb",
    "output_data" "jsonb",
    "error_data" "jsonb",
    "chat_history" "jsonb"[] DEFAULT ARRAY[]::"jsonb"[],
    CONSTRAINT "task_sessions_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100))),
    CONSTRAINT "task_sessions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "valid_progress" CHECK (((("status" = 'pending'::"text") AND ("progress" = 0)) OR (("status" = 'completed'::"text") AND ("progress" = 100)) OR ("status" = ANY (ARRAY['in_progress'::"text", 'failed'::"text", 'cancelled'::"text"]))))
);


ALTER TABLE "public"."task_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_templates" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "name" "text" NOT NULL,
    "description" "text",
    "content" "text" DEFAULT ''::"text" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."task_templates" OWNER TO "postgres";


ALTER TABLE "public"."task_templates" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."task_templates_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."timeline_extractions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "workspace_id" "uuid",
    "file_name" "text",
    "events" "jsonb" DEFAULT '[]'::"jsonb",
    "summary" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "storage_bucket" "text",
    "storage_path" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "timeline_extractions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."timeline_extractions" OWNER TO "postgres";


COMMENT ON TABLE "public"."timeline_extractions" IS 'Stores timeline events extracted from legal documents including annexures';



COMMENT ON COLUMN "public"."timeline_extractions"."id" IS 'Unique identifier for each timeline extraction';



COMMENT ON COLUMN "public"."timeline_extractions"."user_id" IS 'User who requested the extraction';



COMMENT ON COLUMN "public"."timeline_extractions"."workspace_id" IS 'Workspace associated with the extraction';



COMMENT ON COLUMN "public"."timeline_extractions"."file_name" IS 'Name of the source document';



COMMENT ON COLUMN "public"."timeline_extractions"."events" IS 'Array of extracted timeline events with dates, participants, and metadata';



COMMENT ON COLUMN "public"."timeline_extractions"."summary" IS 'AI-generated summary of the timeline';



COMMENT ON COLUMN "public"."timeline_extractions"."metadata" IS 'Additional metadata including case details, processing info, and annexure data';



COMMENT ON COLUMN "public"."timeline_extractions"."storage_bucket" IS 'Supabase Storage bucket name where the document is stored';



COMMENT ON COLUMN "public"."timeline_extractions"."storage_path" IS 'Path within the storage bucket where the document is stored';



COMMENT ON COLUMN "public"."timeline_extractions"."status" IS 'Processing status: pending, processing, completed, or failed';



CREATE TABLE IF NOT EXISTS "public"."user_credits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "workspace_id" "text" NOT NULL,
    "balance" integer DEFAULT 0 NOT NULL,
    "total_purchased" integer DEFAULT 0,
    "total_consumed" integer DEFAULT 0,
    "total_bonus" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "credit_type" "text" DEFAULT 'ai'::"text" NOT NULL,
    CONSTRAINT "user_credits_balance_check" CHECK (("balance" >= 0)),
    CONSTRAINT "user_credits_total_bonus_check" CHECK (("total_bonus" >= 0)),
    CONSTRAINT "user_credits_total_consumed_check" CHECK (("total_consumed" >= 0)),
    CONSTRAINT "user_credits_total_purchased_check" CHECK (("total_purchased" >= 0))
);


ALTER TABLE "public"."user_credits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_postings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "designation_id" "uuid",
    "org_unit_id" "uuid",
    "is_primary" boolean DEFAULT true NOT NULL,
    "effective_from" "date" DEFAULT CURRENT_DATE NOT NULL,
    "effective_to" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_postings_check" CHECK ((("effective_to" IS NULL) OR ("effective_to" >= "effective_from")))
);


ALTER TABLE "public"."user_postings" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_postings" IS 'User designation and org-unit assignments with history support.';



CREATE TABLE IF NOT EXISTS "public"."votum_approval_workflow_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "signer_id" "uuid",
    "signer_email" "text" NOT NULL,
    "signer_name" "text" NOT NULL,
    "rank" integer NOT NULL,
    "signer_status" "text" DEFAULT 'not-assigned'::"text" NOT NULL,
    "opened_on" timestamp with time zone,
    "signed_on" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "last_updated_by" "uuid" NOT NULL,
    "deadline_days" integer,
    "deadline_date" timestamp with time zone
);


ALTER TABLE "public"."votum_approval_workflow_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_approval_workflows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "draft_id" "uuid",
    "document_record_id" "uuid",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "access_type" "text" DEFAULT 'workspace-required'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "last_updated_by" "uuid" NOT NULL,
    "workspace_id" "uuid",
    "start_date" timestamp with time zone,
    "use_deadlines" boolean DEFAULT false,
    "draft_title" "text",
    "draft_content" "text",
    "version_number" bigint,
    "original_draft_updated_at" timestamp with time zone,
    "task_id" "uuid",
    CONSTRAINT "valid_workflow_type" CHECK (("type" = ANY (ARRAY['draft'::"text", 'task'::"text"]))),
    CONSTRAINT "workflow_entity_check" CHECK (((("draft_id" IS NOT NULL) AND ("task_id" IS NULL)) OR (("draft_id" IS NULL) AND ("task_id" IS NOT NULL))))
);


ALTER TABLE "public"."votum_approval_workflows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_case_custom_fields" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "fields" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."votum_case_custom_fields" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_clauses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "content" "text" DEFAULT ''::"text" NOT NULL,
    "type" "text" DEFAULT 'General'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "outcome" "text",
    "notes" "text"
);


ALTER TABLE "public"."votum_clauses" OWNER TO "postgres";


COMMENT ON COLUMN "public"."votum_clauses"."outcome" IS 'Clause outcome classification: favourable, neutral, or onerous';



COMMENT ON COLUMN "public"."votum_clauses"."notes" IS 'Guidance for lawyers on when and how to use this clause';



CREATE TABLE IF NOT EXISTS "public"."votum_client_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "company" "text",
    "email" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_id" "uuid",
    "designation" character varying,
    "is_primary" boolean DEFAULT false
);


ALTER TABLE "public"."votum_client_contacts" OWNER TO "postgres";


COMMENT ON TABLE "public"."votum_client_contacts" IS 'Contact persons linked to clients (one-to-many)';



COMMENT ON COLUMN "public"."votum_client_contacts"."client_id" IS 'Foreign key to votum_clients';



COMMENT ON COLUMN "public"."votum_client_contacts"."designation" IS 'Role: Accountant, Legal Manager, etc.';



COMMENT ON COLUMN "public"."votum_client_contacts"."is_primary" IS 'Primary contact for communications';



CREATE OR REPLACE VIEW "public"."votum_clients_with_contacts" AS
 SELECT "vc"."created_at",
    "vc"."name",
    "vc"."gstin",
    "vc"."address",
    "vc"."custom_fields",
    "vc"."id",
    "vc"."tags",
    "vc"."workspace_id",
    "vc"."last_updated_by",
    "vc"."last_updated_time",
    "vcc"."id" AS "primary_contact_id",
    "vcc"."name" AS "primary_contact_name",
    "vcc"."email" AS "primary_contact_email",
    "vcc"."phone" AS "primary_contact_phone",
    "vcc"."designation" AS "primary_contact_designation"
   FROM ("public"."votum_clients" "vc"
     LEFT JOIN "public"."votum_client_contacts" "vcc" ON ((("vc"."id" = "vcc"."client_id") AND ("vcc"."is_primary" = true))));


ALTER TABLE "public"."votum_clients_with_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_comments" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "note_id" "uuid",
    "quote" "text",
    "selection" "json",
    "comment_id" "uuid",
    "parent" "uuid",
    "comment" "json",
    "added_by" "uuid",
    "task_id" "uuid"
);


ALTER TABLE "public"."votum_comments" OWNER TO "postgres";


ALTER TABLE "public"."votum_comments" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."votum_comments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."votum_email_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "email" "text" NOT NULL,
    "password" "text",
    "meta_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."votum_email_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_emails" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text",
    "msg_id" "text",
    "response" "jsonb"
);


ALTER TABLE "public"."votum_emails" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "startDate" timestamp with time zone,
    "endDate" timestamp with time zone,
    "user_id" "uuid"
);


ALTER TABLE "public"."votum_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."votum_events" IS 'This is a duplicate of votum_user_events';



CREATE TABLE IF NOT EXISTS "public"."votum_fcm_tokens" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "token" "text" NOT NULL,
    "email" "text" NOT NULL,
    "device_id" "text" NOT NULL,
    "platform" "text"
);


ALTER TABLE "public"."votum_fcm_tokens" OWNER TO "postgres";


ALTER TABLE "public"."votum_fcm_tokens" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."votum_fcm_tokens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."votum_invoice" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "invoice_number" bigint,
    "resource_type" "text",
    "resource_name" "text",
    "client_id" "uuid" DEFAULT "gen_random_uuid"(),
    "due_date" "date",
    "invoice_date" "date",
    "total_amount" double precision,
    "additional_notes" "text",
    "payment_terms" "text",
    "pdf_template" "text",
    "sender_name" "text",
    "sender_email" "text",
    "sender_contact" "text",
    "sender_address" "text",
    "avatar_url" "text",
    "saved_date" "date",
    "particulars" "text",
    "workspace_id" "uuid",
    "pdf_url" "text",
    "pdf_path" "text",
    "billed" boolean DEFAULT false
);


ALTER TABLE "public"."votum_invoice" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_invoice_reminders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "reminder_type" "text" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" NOT NULL,
    "error_message" "text",
    "message_id" "text",
    "recipient" "text",
    "workspace_id" "uuid"
);


ALTER TABLE "public"."votum_invoice_reminders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_notes" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "note" "jsonb",
    "workspace_id" "uuid",
    "last_updated_by" "uuid",
    "last_updated_time" timestamp with time zone DEFAULT "now"(),
    "client_id" "uuid",
    "notes" "jsonb"[],
    "summary" "text",
    "documents" "jsonb"
);


ALTER TABLE "public"."votum_notes" OWNER TO "postgres";


COMMENT ON TABLE "public"."votum_notes" IS 'This is a duplicate of votum_user_notes';



COMMENT ON COLUMN "public"."votum_notes"."client_id" IS 'reference of client';



CREATE TABLE IF NOT EXISTS "public"."votum_notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" character varying NOT NULL,
    "subtype" character varying NOT NULL,
    "module" character varying NOT NULL,
    "redirect_uri" character varying,
    "title" character varying NOT NULL,
    "message" "text" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "target_user_id" "uuid" NOT NULL,
    "created_by_id" "uuid",
    "related_entity_id" "uuid",
    "related_entity_type" character varying,
    "status" character varying DEFAULT 'unread'::character varying,
    "is_sent" boolean DEFAULT false,
    "is_read" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "is_obsolete" boolean DEFAULT false,
    "is_archived" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "metadata" "jsonb",
    "related_notification_id" "uuid",
    "read_at" timestamp with time zone,
    "channels" "text"[] DEFAULT '{fcm}'::"text"[] NOT NULL
);


ALTER TABLE "public"."votum_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_passkey_challenges" (
    "serial_number" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "challenge" "text" NOT NULL,
    "challenge_type" character varying NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."votum_passkey_challenges" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."votum_passkey_challenges_serial_number_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."votum_passkey_challenges_serial_number_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."votum_passkey_challenges_serial_number_seq" OWNED BY "public"."votum_passkey_challenges"."serial_number";



CREATE TABLE IF NOT EXISTS "public"."votum_passkeys" (
    "cred_id" character varying NOT NULL,
    "cred_name" character varying NOT NULL,
    "cred_public_key" integer[] NOT NULL,
    "internal_user_id" "uuid" NOT NULL,
    "webauthn_user_id" character varying,
    "counter" integer,
    "backup_eligible" boolean,
    "backup_status" boolean,
    "transports" character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_used" timestamp with time zone
);


ALTER TABLE "public"."votum_passkeys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_suggested_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "task_details" "jsonb",
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    "email_id" "text",
    "workspace_id" "uuid",
    "attachments" "jsonb",
    "source" "text"
);


ALTER TABLE "public"."votum_suggested_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_summary" (
    "id" bigint NOT NULL,
    "workspace_id" "uuid",
    "text" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."votum_summary" OWNER TO "postgres";


ALTER TABLE "public"."votum_summary" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."votum_summary_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."votum_task_custom_field_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "name" "text" NOT NULL,
    "fields" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."votum_task_custom_field_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_task_followups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "sent_by" "uuid" NOT NULL,
    "sent_by_name" "text" NOT NULL,
    "message" "text" NOT NULL,
    "ask_for_justification" boolean DEFAULT false NOT NULL,
    "justification" "text",
    "task_status_at_send" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."votum_task_followups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_task_reviews" (
    "id" integer NOT NULL,
    "task_id" "uuid" NOT NULL,
    "assigned_by_id" "uuid" NOT NULL,
    "assigned_to_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_updated_time" timestamp with time zone
);


ALTER TABLE "public"."votum_task_reviews" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."votum_task_reviews_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."votum_task_reviews_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."votum_task_reviews_id_seq" OWNED BY "public"."votum_task_reviews"."id";



CREATE TABLE IF NOT EXISTS "public"."votum_team_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "added_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."votum_team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "workspace_id" "uuid",
    "description" "text"
);


ALTER TABLE "public"."votum_teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_templates" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "content" "text",
    "placeholder_descriptions" "jsonb",
    "workspace_id" "uuid" DEFAULT "gen_random_uuid"(),
    "created_by" "uuid" DEFAULT "gen_random_uuid"(),
    "visibility" "public"."template_visibility" DEFAULT 'private'::"public"."template_visibility",
    "shared_with_user_ids" "uuid"[] DEFAULT '{}'::"uuid"[]
);


ALTER TABLE "public"."votum_templates" OWNER TO "postgres";


ALTER TABLE "public"."votum_templates" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."votum_templates_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."votum_time_entries" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "description" "text" NOT NULL,
    "duration" integer NOT NULL,
    "date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "billable" boolean,
    "invoice_id" "uuid",
    "billed" boolean DEFAULT false
);


ALTER TABLE "public"."votum_time_entries" OWNER TO "postgres";


COMMENT ON TABLE "public"."votum_time_entries" IS 'Time entries for tasks, used for client billing and time tracking';



COMMENT ON COLUMN "public"."votum_time_entries"."duration" IS 'Duration in seconds';



CREATE TABLE IF NOT EXISTS "public"."votum_transcripts" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "text" "text",
    "audio_uuid" "uuid",
    "Language" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "Length" bigint,
    "Name" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "summary" "text",
    "summary_with_meeting_notes" "jsonb",
    "original_text" "text",
    "last_modified" timestamp with time zone,
    "tasks" "jsonb",
    "diarized_text" "jsonb",
    "workspace_id" "uuid",
    "timestamp_notes" "jsonb" DEFAULT '[]'::"jsonb",
    "case_id" integer,
    "format_instructions" "text"
);


ALTER TABLE "public"."votum_transcripts" OWNER TO "postgres";


COMMENT ON TABLE "public"."votum_transcripts" IS 'This is a duplicate of transcripts';



COMMENT ON COLUMN "public"."votum_transcripts"."text" IS 'The output text ';



COMMENT ON COLUMN "public"."votum_transcripts"."diarized_text" IS 'column to store the diarized text';



COMMENT ON COLUMN "public"."votum_transcripts"."timestamp_notes" IS 'Stores timestamped notes for post-processing of audio transcriptions. Each note contains: id, timestamp, noteType (redact, strikethrough, change, custom), content, and optional replacementText for change notes.';



CREATE TABLE IF NOT EXISTS "public"."votum_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "original_text" "text" NOT NULL,
    "translated_text" "text",
    "source_language" "text" NOT NULL,
    "target_language" "text" NOT NULL,
    "translation_type" "public"."translation_type" NOT NULL,
    "status" "public"."translation_status" DEFAULT 'pending'::"public"."translation_status" NOT NULL,
    "translator_id" "uuid",
    "estimated_completion" timestamp with time zone,
    "original_file_name" "text",
    "original_file_url" "text",
    "metadata" "jsonb"
);


ALTER TABLE "public"."votum_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_translators" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "languages" "text"[],
    "active_assignments" smallint,
    "availability" "jsonb"
);


ALTER TABLE "public"."votum_translators" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_user_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "startDate" timestamp with time zone,
    "endDate" timestamp with time zone,
    "user_id" bigint
);


ALTER TABLE "public"."votum_user_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votum_user_tokens" (
    "user_id" "uuid" NOT NULL,
    "token" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "email" "text",
    "outlook_access_token" "text",
    "outlook_expires_on" timestamp with time zone,
    "outlook_created_at" timestamp with time zone DEFAULT "now"(),
    "outlook_updated_at" timestamp with time zone DEFAULT "now"(),
    "outlook_refresh_token" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "google_access_token" "text",
    "google_refresh_token" "text",
    "google_token_expiry" timestamp with time zone,
    "last_email_sync_timestamp" timestamp with time zone DEFAULT "now"(),
    "auth_required_at" timestamp with time zone,
    "authentication_required" boolean,
    "outlook_scope" "text"
);


ALTER TABLE "public"."votum_user_tokens" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_task_delegation_sync_status" AS
 SELECT "t"."id" AS "task_id",
    "t"."name" AS "task_name",
    "t"."status" AS "task_status",
        CASE "t"."status"
            WHEN 0 THEN 'TO DO'::"text"
            WHEN 1 THEN 'IN PROGRESS'::"text"
            WHEN 2 THEN 'IN VERIFY'::"text"
            WHEN 3 THEN 'DONE'::"text"
            ELSE 'UNKNOWN'::"text"
        END AS "task_status_name",
    "dc"."id" AS "delegation_chain_id",
    "dc"."status" AS "delegation_status",
    "dc"."current_assignee",
    "cu"."name" AS "current_assignee_name",
    "count"("ds"."id") AS "total_steps",
    "count"(
        CASE
            WHEN ("ds"."status" = 'completed'::"text") THEN 1
            ELSE NULL::integer
        END) AS "completed_steps",
    "count"(
        CASE
            WHEN ("ds"."status" = 'done'::"text") THEN 1
            ELSE NULL::integer
        END) AS "approved_steps",
        CASE
            WHEN (("dc"."status" = 'completed'::"text") AND ("t"."status" <> 3)) THEN 'NEEDS_SYNC'::"text"
            WHEN (("dc"."status" = 'working'::"text") AND ("t"."status" = 3)) THEN 'NEEDS_SYNC'::"text"
            WHEN (("dc"."status" = 'delegating'::"text") AND ("t"."status" <> ALL (ARRAY[1, 2]))) THEN 'NEEDS_SYNC'::"text"
            ELSE 'SYNCED'::"text"
        END AS "sync_status"
   FROM ((("public"."votum_tasks" "t"
     LEFT JOIN "public"."delegation_chains" "dc" ON (("t"."id" = "dc"."task_id")))
     LEFT JOIN "public"."votum_users" "cu" ON (("dc"."current_assignee" = "cu"."id")))
     LEFT JOIN "public"."delegation_steps" "ds" ON (("dc"."id" = "ds"."delegation_chain_id")))
  WHERE ("dc"."id" IS NOT NULL)
  GROUP BY "t"."id", "t"."name", "t"."status", "dc"."id", "dc"."status", "dc"."current_assignee", "cu"."name";


ALTER TABLE "public"."vw_task_delegation_sync_status" OWNER TO "postgres";


COMMENT ON VIEW "public"."vw_task_delegation_sync_status" IS 'Monitor synchronization status between tasks and their delegation chains. 
Use sync_status = ''NEEDS_SYNC'' to identify tasks that may need manual sync.';



CREATE OR REPLACE VIEW "public"."vw_task_workflow_status" AS
 SELECT "w"."id" AS "workflow_id",
    "w"."task_id",
    "w"."workspace_id",
    "w"."created_at",
    "w"."created_by",
    "w"."status" AS "workflow_status",
    "count"("s"."id") AS "total_steps",
    "sum"(
        CASE
            WHEN ("s"."signer_status" = 'approved'::"text") THEN 1
            ELSE 0
        END) AS "completed_steps",
        CASE
            WHEN ("count"("s"."id") = "sum"(
            CASE
                WHEN ("s"."signer_status" = 'approved'::"text") THEN 1
                ELSE 0
            END)) THEN true
            ELSE false
        END AS "is_completed",
    "min"(
        CASE
            WHEN ("s"."signer_status" = 'pending'::"text") THEN "s"."rank"
            ELSE NULL::integer
        END) AS "current_step"
   FROM ("public"."votum_approval_workflows" "w"
     JOIN "public"."votum_approval_workflow_steps" "s" ON (("w"."id" = "s"."workflow_id")))
  WHERE ("w"."type" = 'task'::"text")
  GROUP BY "w"."id", "w"."task_id", "w"."workspace_id", "w"."created_at", "w"."created_by", "w"."status";


ALTER TABLE "public"."vw_task_workflow_status" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_user_delegations" AS
 SELECT "dc"."id" AS "chain_id",
    "dc"."task_id",
    "dc"."draft_id",
    "dc"."workspace_id",
    "dc"."status" AS "chain_status",
    "dc"."initiated_by",
    "dc"."current_assignee",
    "dc"."created_at" AS "chain_created_at",
    "ds"."id" AS "step_id",
    "ds"."delegated_by",
    "ds"."delegated_to",
    "ds"."step_order",
    "ds"."status" AS "step_status",
    "ds"."delegated_at",
    "ds"."completed_at",
    "ds"."notes",
    "delegated_by_user"."name" AS "delegated_by_name",
    "delegated_by_user"."email" AS "delegated_by_email",
    "delegated_to_user"."name" AS "delegated_to_name",
    "delegated_to_user"."email" AS "delegated_to_email",
        CASE
            WHEN ("dc"."task_id" IS NOT NULL) THEN 'task'::"text"
            WHEN ("dc"."draft_id" IS NOT NULL) THEN 'draft'::"text"
            ELSE NULL::"text"
        END AS "entity_type",
    COALESCE("vt"."name", "d"."name") AS "entity_name"
   FROM ((((("public"."delegation_chains" "dc"
     JOIN "public"."delegation_steps" "ds" ON (("dc"."id" = "ds"."delegation_chain_id")))
     JOIN "public"."votum_users" "delegated_by_user" ON (("ds"."delegated_by" = "delegated_by_user"."id")))
     JOIN "public"."votum_users" "delegated_to_user" ON (("ds"."delegated_to" = "delegated_to_user"."id")))
     LEFT JOIN "public"."votum_tasks" "vt" ON (("dc"."task_id" = "vt"."id")))
     LEFT JOIN "public"."drafts" "d" ON (("dc"."draft_id" = "d"."id")))
  WHERE ("dc"."status" <> 'completed'::"text");


ALTER TABLE "public"."vw_user_delegations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wopi_locks" (
    "file_id" "text" NOT NULL,
    "lock_id" "text" NOT NULL,
    "locked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."wopi_locks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."worker_proxy_ips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proxy" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "blocked_until" timestamp with time zone,
    "consecutive_fails" integer DEFAULT 0 NOT NULL,
    "total_blocks" integer DEFAULT 0 NOT NULL,
    "last_blocked_at" timestamp with time zone,
    "last_success_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "worker_proxy_ips_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'blocked'::"text", 'retired'::"text"])))
);


ALTER TABLE "public"."worker_proxy_ips" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."workspace_bottleneck_analysis" AS
 SELECT "votum_task_ownership_periods"."workspace_id",
    "votum_task_ownership_periods"."user_id",
    "votum_task_ownership_periods"."user_name",
    "votum_task_ownership_periods"."user_email",
    "count"(*) AS "total_ownerships",
    "avg"("votum_task_ownership_periods"."duration_seconds") AS "avg_duration_seconds",
    "percentile_cont"((0.5)::double precision) WITHIN GROUP (ORDER BY (("votum_task_ownership_periods"."duration_seconds")::double precision)) AS "median_duration_seconds",
    "max"("votum_task_ownership_periods"."duration_seconds") AS "max_duration_seconds",
    "min"("votum_task_ownership_periods"."duration_seconds") AS "min_duration_seconds",
    "stddev"("votum_task_ownership_periods"."duration_seconds") AS "duration_stddev",
    "count"(*) FILTER (WHERE ("votum_task_ownership_periods"."duration_seconds" > (86400 * 7))) AS "ownerships_over_week",
    "count"(*) FILTER (WHERE ("votum_task_ownership_periods"."duration_seconds" > (86400 * 3))) AS "ownerships_over_3days",
    "count"(*) FILTER (WHERE ("votum_task_ownership_periods"."duration_seconds" > 86400)) AS "ownerships_over_day",
        CASE
            WHEN ("avg"("votum_task_ownership_periods"."duration_seconds") > ((86400 * 7))::numeric) THEN 'High bottleneck risk'::"text"
            WHEN ("avg"("votum_task_ownership_periods"."duration_seconds") > ((86400 * 3))::numeric) THEN 'Medium bottleneck risk'::"text"
            WHEN ("avg"("votum_task_ownership_periods"."duration_seconds") > (86400)::numeric) THEN 'Low bottleneck risk'::"text"
            ELSE 'Efficient'::"text"
        END AS "bottleneck_risk_level",
    "max"("votum_task_ownership_periods"."ended_at") AS "last_ownership_ended",
    "count"(*) FILTER (WHERE ("votum_task_ownership_periods"."started_at" >= ("now"() - '30 days'::interval))) AS "recent_ownerships_30d"
   FROM "public"."votum_task_ownership_periods"
  WHERE ("votum_task_ownership_periods"."ended_at" IS NOT NULL)
  GROUP BY "votum_task_ownership_periods"."workspace_id", "votum_task_ownership_periods"."user_id", "votum_task_ownership_periods"."user_name", "votum_task_ownership_periods"."user_email";


ALTER TABLE "public"."workspace_bottleneck_analysis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_credit_config" (
    "workspace_id" "text" NOT NULL,
    "credit_type" "text" NOT NULL,
    "package_amount" integer DEFAULT 0 NOT NULL,
    "reset_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "workspace_credit_config_credit_type_check" CHECK (("credit_type" = ANY (ARRAY['ai'::"text", 'transcription'::"text"])))
);


ALTER TABLE "public"."workspace_credit_config" OWNER TO "postgres";


ALTER TABLE ONLY "public"."contact_requests" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."contact_requests_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."outreach_leads" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."outreach_leads_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."outreach_sequence_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."outreach_sequence_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."pdf_delivery_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pdf_delivery_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."votum_cases" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."cases_case_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."votum_passkey_challenges" ALTER COLUMN "serial_number" SET DEFAULT "nextval"('"public"."votum_passkey_challenges_serial_number_seq"'::"regclass");



ALTER TABLE ONLY "public"."votum_task_reviews" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."votum_task_reviews_id_seq"'::"regclass");



ALTER TABLE ONLY "ai"."agent_sessions"
    ADD CONSTRAINT "agent_sessions_pkey" PRIMARY KEY ("session_id");



ALTER TABLE ONLY "public"."api_usage_tracking"
    ADD CONSTRAINT "api_usage_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_presets_hierarchy"
    ADD CONSTRAINT "automation_presets_hierarchy_pkey" PRIMARY KEY ("preset_id", "user_id");



ALTER TABLE ONLY "public"."calendar_event_mappings"
    ADD CONSTRAINT "calendar_event_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."case_activity_events"
    ADD CONSTRAINT "case_activity_events_case_id_event_type_event_key_key" UNIQUE ("case_id", "event_type", "event_key");



ALTER TABLE ONLY "public"."case_activity_events"
    ADD CONSTRAINT "case_activity_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."case_activity_notifications"
    ADD CONSTRAINT "case_activity_notifications_event_id_contact_type_contact_v_key" UNIQUE ("event_id", "contact_type", "contact_value", "channel");



ALTER TABLE ONLY "public"."case_activity_notifications"
    ADD CONSTRAINT "case_activity_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."case_repository"
    ADD CONSTRAINT "case_repository_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_cases"
    ADD CONSTRAINT "cases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cause_list_entries"
    ADD CONSTRAINT "cause_list_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_passkey_challenges"
    ADD CONSTRAINT "challenges_pkey" PRIMARY KEY ("serial_number");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_sessions"
    ADD CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clm_approval_actions"
    ADD CONSTRAINT "clm_approval_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clm_audit_log"
    ADD CONSTRAINT "clm_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clm_contract_files"
    ADD CONSTRAINT "clm_contract_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clm_contract_versions"
    ADD CONSTRAINT "clm_contract_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clm_contracts"
    ADD CONSTRAINT "clm_contracts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clm_notifications"
    ADD CONSTRAINT "clm_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clm_signature_envelopes"
    ADD CONSTRAINT "clm_signature_envelopes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clm_signature_events"
    ADD CONSTRAINT "clm_signature_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clm_sla_events"
    ADD CONSTRAINT "clm_sla_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clm_wopi_sessions"
    ADD CONSTRAINT "clm_wopi_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clm_workflow_rules"
    ADD CONSTRAINT "clm_workflow_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clm_workflow_steps"
    ADD CONSTRAINT "clm_workflow_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clm_workflows"
    ADD CONSTRAINT "clm_workflows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_records"
    ADD CONSTRAINT "compliance_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_requests"
    ADD CONSTRAINT "contact_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_costs"
    ADD CONSTRAINT "credit_costs_pkey" PRIMARY KEY ("feature");



ALTER TABLE ONLY "public"."credit_packages"
    ADD CONSTRAINT "credit_packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cron_job_runs"
    ADD CONSTRAINT "cron_job_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delegation_chains"
    ADD CONSTRAINT "delegation_chains_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delegation_steps"
    ADD CONSTRAINT "delegation_steps_delegation_chain_id_step_order_key" UNIQUE ("delegation_chain_id", "step_order");



ALTER TABLE ONLY "public"."delegation_steps"
    ADD CONSTRAINT "delegation_steps_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."dggi_cpgram_records"
    ADD CONSTRAINT "dggi_cpgram_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dggi_deadline_alerts_sent"
    ADD CONSTRAINT "dggi_deadline_alerts_sent_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dggi_deadline_alerts_sent"
    ADD CONSTRAINT "dggi_deadline_alerts_sent_workspace_id_rule_id_record_id_re_key" UNIQUE ("workspace_id", "rule_id", "record_id", "reminder_bucket");



ALTER TABLE ONLY "public"."dggi_dfl_records"
    ADD CONSTRAINT "dggi_dfl_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dggi_evidence_room_records"
    ADD CONSTRAINT "dggi_evidence_room_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dggi_incident_report_records"
    ADD CONSTRAINT "dggi_incident_report_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dggi_informer_reward_records"
    ADD CONSTRAINT "dggi_informer_reward_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dggi_intel_closure_records"
    ADD CONSTRAINT "dggi_intel_closure_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dggi_intel_other_source_records"
    ADD CONSTRAINT "dggi_intel_other_source_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dggi_intel_rapid_records"
    ADD CONSTRAINT "dggi_intel_rapid_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dggi_modus_operandi_records"
    ADD CONSTRAINT "dggi_modus_operandi_records_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."document_annotations"
    ADD CONSTRAINT "document_annotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_annotations"
    ADD CONSTRAINT "document_annotations_storage_bucket_storage_path_key" UNIQUE ("storage_bucket", "storage_path");



ALTER TABLE ONLY "public"."document_folders"
    ADD CONSTRAINT "document_folders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drafting_style_profiles"
    ADD CONSTRAINT "drafting_style_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drafts"
    ADD CONSTRAINT "drafts_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."drafts"
    ADD CONSTRAINT "drafts_pkey" PRIMARY KEY ("serial", "workspace_id");



ALTER TABLE ONLY "public"."drive_import_jobs"
    ADD CONSTRAINT "drive_import_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."egazette_compliance_obligations"
    ADD CONSTRAINT "egazette_compliance_obligations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."egazette_records"
    ADD CONSTRAINT "egazette_records_pkey" PRIMARY KEY ("gazette_id");



ALTER TABLE ONLY "public"."intake_forms"
    ADD CONSTRAINT "intake_forms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."intake_forms"
    ADD CONSTRAINT "intake_forms_share_token_key" UNIQUE ("share_token");



ALTER TABLE ONLY "public"."intake_submissions"
    ADD CONSTRAINT "intake_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ipr_clearance_searches"
    ADD CONSTRAINT "ipr_clearance_searches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ipr_matters"
    ADD CONSTRAINT "ipr_matters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ipr_watch_hits"
    ADD CONSTRAINT "ipr_watch_hits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."keyword_alert_matches"
    ADD CONSTRAINT "keyword_alert_matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."keyword_alert_matches"
    ADD CONSTRAINT "keyword_alert_matches_subscription_id_court_identifier_case_key" UNIQUE ("subscription_id", "court_identifier", "case_key");



ALTER TABLE ONLY "public"."keyword_alert_runs"
    ADD CONSTRAINT "keyword_alert_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."keyword_alert_subscriptions"
    ADD CONSTRAINT "keyword_alert_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."keyword_alert_task_queue"
    ADD CONSTRAINT "keyword_alert_task_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."keyword_alert_task_queue"
    ADD CONSTRAINT "keyword_alert_task_queue_run_id_court_label_keyword_search_year" UNIQUE ("run_id", "court_label", "keyword", "search_type", "year");



ALTER TABLE ONLY "public"."keyword_alert_task_results"
    ADD CONSTRAINT "keyword_alert_task_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."keyword_alert_task_results"
    ADD CONSTRAINT "keyword_alert_task_results_task_id_case_key_key" UNIQUE ("task_id", "case_key");



ALTER TABLE ONLY "public"."keyword_alert_task_subs"
    ADD CONSTRAINT "keyword_alert_task_subs_pkey" PRIMARY KEY ("task_id", "subscription_id");



ALTER TABLE ONLY "public"."legal_review"
    ADD CONSTRAINT "legal_review_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legal_summary_cache"
    ADD CONSTRAINT "legal_summary_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legal_summary_sessions"
    ADD CONSTRAINT "legal_summary_sessions_pkey" PRIMARY KEY ("session_id");



ALTER TABLE ONLY "public"."org_units"
    ADD CONSTRAINT "org_units_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."outlook_calendar_mappings"
    ADD CONSTRAINT "outlook_calendar_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."outlook_calendar_mappings"
    ADD CONSTRAINT "outlook_calendar_mappings_user_id_app_event_id_key" UNIQUE ("user_id", "app_event_id");



ALTER TABLE ONLY "public"."outlook_calendar_mappings"
    ADD CONSTRAINT "outlook_calendar_mappings_user_id_outlook_event_id_key" UNIQUE ("user_id", "outlook_event_id");



ALTER TABLE ONLY "public"."outreach_leads"
    ADD CONSTRAINT "outreach_leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."outreach_sequence_log"
    ADD CONSTRAINT "outreach_sequence_log_lead_id_stage_key" UNIQUE ("lead_id", "stage");



ALTER TABLE ONLY "public"."outreach_sequence_log"
    ADD CONSTRAINT "outreach_sequence_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_passkeys"
    ADD CONSTRAINT "passkeys_pkey" PRIMARY KEY ("cred_id");



ALTER TABLE ONLY "public"."pdf_delivery_logs"
    ADD CONSTRAINT "pdf_delivery_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pdf_ink_strokes"
    ADD CONSTRAINT "pdf_ink_strokes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."playbook_clauses"
    ADD CONSTRAINT "playbook_clauses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."playbooks"
    ADD CONSTRAINT "playbooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."police_fir_co_remarks"
    ADD CONSTRAINT "police_fir_co_remarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."police_firs"
    ADD CONSTRAINT "police_firs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."police_office_files"
    ADD CONSTRAINT "police_office_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pst_jobs"
    ADD CONSTRAINT "pst_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."razorpay_transactions"
    ADD CONSTRAINT "razorpay_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."razorpay_transactions"
    ADD CONSTRAINT "razorpay_transactions_razorpay_order_id_key" UNIQUE ("razorpay_order_id");



ALTER TABLE ONLY "public"."scraper_health_states"
    ADD CONSTRAINT "scraper_health_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scraper_health_states"
    ADD CONSTRAINT "scraper_health_states_scraper_name_key" UNIQUE ("scraper_name");



ALTER TABLE ONLY "public"."scraper_runs"
    ADD CONSTRAINT "scraper_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stack_clauses"
    ADD CONSTRAINT "stack_clauses_document_chunk_unique" UNIQUE ("document_id", "chunk_index");



ALTER TABLE ONLY "public"."stack_clauses"
    ADD CONSTRAINT "stack_clauses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stack_documents"
    ADD CONSTRAINT "stack_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stack_documents"
    ADD CONSTRAINT "stack_documents_unique" UNIQUE ("stack_id", "document_id");



ALTER TABLE ONLY "public"."stacks"
    ADD CONSTRAINT "stacks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_assignees"
    ADD CONSTRAINT "task_assignees_pkey" PRIMARY KEY ("task_id", "user_id");



ALTER TABLE ONLY "public"."task_documents"
    ADD CONSTRAINT "task_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_sessions"
    ADD CONSTRAINT "task_sessions_pkey" PRIMARY KEY ("session_id");



ALTER TABLE ONLY "public"."task_templates"
    ADD CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."timeline_extractions"
    ADD CONSTRAINT "timeline_extractions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendar_event_mappings"
    ADD CONSTRAINT "unique_app_google_event_mapping" UNIQUE ("user_id", "app_event_id", "google_event_id");



ALTER TABLE ONLY "public"."votum_fcm_tokens"
    ADD CONSTRAINT "unique_id" UNIQUE ("token");



ALTER TABLE ONLY "public"."votum_email_accounts"
    ADD CONSTRAINT "unique_user_provider_email" UNIQUE ("user_id", "provider", "email");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_user_workspace_type_key" UNIQUE ("user_id", "workspace_id", "credit_type");



ALTER TABLE ONLY "public"."user_postings"
    ADD CONSTRAINT "user_postings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_emails"
    ADD CONSTRAINT "votum_ai_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_audit_logs"
    ADD CONSTRAINT "votum_audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_clauses"
    ADD CONSTRAINT "votum_clauses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_client_contacts"
    ADD CONSTRAINT "votum_client_contacts_unique_email" UNIQUE ("client_id", "email");



ALTER TABLE ONLY "public"."votum_clients"
    ADD CONSTRAINT "votum_clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_comments"
    ADD CONSTRAINT "votum_comments_comment_id_key" UNIQUE ("comment_id");



ALTER TABLE ONLY "public"."votum_comments"
    ADD CONSTRAINT "votum_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_email_accounts"
    ADD CONSTRAINT "votum_email_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_events"
    ADD CONSTRAINT "votum_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_fcm_tokens"
    ADD CONSTRAINT "votum_fcm_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_fcm_tokens"
    ADD CONSTRAINT "votum_fcm_tokens_user_id_device_id_key" UNIQUE ("user_id", "device_id");



ALTER TABLE ONLY "public"."votum_invoice"
    ADD CONSTRAINT "votum_invoice_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_invoice_reminders"
    ADD CONSTRAINT "votum_invoice_reminders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_notes"
    ADD CONSTRAINT "votum_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_notifications"
    ADD CONSTRAINT "votum_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_approval_workflows"
    ADD CONSTRAINT "votum_signing_workflow_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_approval_workflow_steps"
    ADD CONSTRAINT "votum_signing_workflow_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_suggested_tasks"
    ADD CONSTRAINT "votum_suggested_tasks_email_id_key" UNIQUE ("email_id");



ALTER TABLE ONLY "public"."votum_suggested_tasks"
    ADD CONSTRAINT "votum_suggested_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_summary"
    ADD CONSTRAINT "votum_summary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_task_custom_field_templates"
    ADD CONSTRAINT "votum_task_custom_field_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_task_followups"
    ADD CONSTRAINT "votum_task_followups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_task_ownership_periods"
    ADD CONSTRAINT "votum_task_ownership_periods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_task_reviews"
    ADD CONSTRAINT "votum_task_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_tasks"
    ADD CONSTRAINT "votum_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_tasks"
    ADD CONSTRAINT "votum_tasks_task_uuid_unique" UNIQUE ("id");



ALTER TABLE ONLY "public"."votum_team_members"
    ADD CONSTRAINT "votum_team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_team_members"
    ADD CONSTRAINT "votum_team_members_team_id_user_id_key" UNIQUE ("team_id", "user_id");



ALTER TABLE ONLY "public"."votum_teams"
    ADD CONSTRAINT "votum_teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_templates"
    ADD CONSTRAINT "votum_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_time_entries"
    ADD CONSTRAINT "votum_time_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_transcripts"
    ADD CONSTRAINT "votum_transcripts_audio_uuid_key" UNIQUE ("audio_uuid");



ALTER TABLE ONLY "public"."votum_transcripts"
    ADD CONSTRAINT "votum_transcripts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_translations"
    ADD CONSTRAINT "votum_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_translators"
    ADD CONSTRAINT "votum_translators_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_user_events"
    ADD CONSTRAINT "votum_user_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_presets"
    ADD CONSTRAINT "votum_user_hierarchy_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votum_user_tokens"
    ADD CONSTRAINT "votum_user_tokens_pkey" PRIMARY KEY ("user_id");



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



ALTER TABLE ONLY "public"."whatsapp_messages"
    ADD CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_messages"
    ADD CONSTRAINT "whatsapp_messages_whatsapp_message_id_key" UNIQUE ("whatsapp_message_id");



ALTER TABLE ONLY "public"."wopi_locks"
    ADD CONSTRAINT "wopi_locks_pkey" PRIMARY KEY ("file_id");



ALTER TABLE ONLY "public"."worker_proxy_ips"
    ADD CONSTRAINT "worker_proxy_ips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worker_proxy_ips"
    ADD CONSTRAINT "worker_proxy_ips_proxy_key" UNIQUE ("proxy");



ALTER TABLE ONLY "public"."workspace_credit_config"
    ADD CONSTRAINT "workspace_credit_config_pkey" PRIMARY KEY ("workspace_id", "credit_type");



CREATE INDEX "ix_ai_agent_sessions_agent_id" ON "ai"."agent_sessions" USING "btree" ("agent_id");



CREATE INDEX "ix_ai_agent_sessions_team_session_id" ON "ai"."agent_sessions" USING "btree" ("team_session_id");



CREATE INDEX "ix_ai_agent_sessions_user_id" ON "ai"."agent_sessions" USING "btree" ("user_id");



CREATE INDEX "arbitration_sessions_created_by_idx" ON "public"."arbitration_sessions" USING "btree" ("created_by");



CREATE INDEX "arbitration_sessions_workspace_idx" ON "public"."arbitration_sessions" USING "btree" ("workspace_id");



CREATE INDEX "case_repository_citation_idx" ON "public"."case_repository" USING "btree" ("citation_value");



CREATE INDEX "case_repository_created_by_idx" ON "public"."case_repository" USING "btree" ("created_by");



CREATE INDEX "case_repository_extraction_status_idx" ON "public"."case_repository" USING "btree" ("extraction_status") WHERE ("extraction_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'failed'::"text"]));



CREATE INDEX "case_repository_file_path_idx" ON "public"."case_repository" USING "btree" ("file_path");



CREATE INDEX "case_repository_legal_summary_idx" ON "public"."case_repository" USING "gin" ("legal_summary");



CREATE INDEX "case_repository_search_idx" ON "public"."case_repository" USING "gin" ("search_vector");



CREATE INDEX "case_repository_tags_idx" ON "public"."case_repository" USING "gin" ("tags");



CREATE INDEX "case_repository_workspace_idx" ON "public"."case_repository" USING "btree" ("workspace_id");



CREATE UNIQUE INDEX "cause_list_entries_dedupe_key" ON "public"."cause_list_entries" USING "btree" ("case_id", "listing_date", "item_no", "page_no");



CREATE UNIQUE INDEX "chat_messages_session_external_id_idx" ON "public"."chat_messages" USING "btree" ("session_id", "external_id");



CREATE INDEX "clm_approval_actions_workflow_id_idx" ON "public"."clm_approval_actions" USING "btree" ("workflow_id");



CREATE INDEX "clm_approval_actions_workspace_id_idx" ON "public"."clm_approval_actions" USING "btree" ("workspace_id");



CREATE INDEX "clm_audit_log_workspace_id_idx" ON "public"."clm_audit_log" USING "btree" ("workspace_id");



CREATE INDEX "clm_contract_files_contract_id_idx" ON "public"."clm_contract_files" USING "btree" ("contract_id");



CREATE INDEX "clm_contract_files_workspace_id_idx" ON "public"."clm_contract_files" USING "btree" ("workspace_id");



CREATE INDEX "clm_contract_versions_contract_id_idx" ON "public"."clm_contract_versions" USING "btree" ("contract_id");



CREATE UNIQUE INDEX "clm_contract_versions_contract_number_idx" ON "public"."clm_contract_versions" USING "btree" ("contract_id", "version_number");



CREATE UNIQUE INDEX "clm_contract_versions_current_idx" ON "public"."clm_contract_versions" USING "btree" ("contract_id") WHERE "is_current";



CREATE INDEX "clm_contract_versions_workspace_id_idx" ON "public"."clm_contract_versions" USING "btree" ("workspace_id");



CREATE INDEX "clm_contracts_workspace_id_idx" ON "public"."clm_contracts" USING "btree" ("workspace_id");



CREATE INDEX "clm_notifications_user_id_idx" ON "public"."clm_notifications" USING "btree" ("user_id");



CREATE INDEX "clm_notifications_workspace_id_idx" ON "public"."clm_notifications" USING "btree" ("workspace_id");



CREATE INDEX "clm_signature_envelopes_workflow_id_idx" ON "public"."clm_signature_envelopes" USING "btree" ("workflow_id");



CREATE INDEX "clm_signature_envelopes_workspace_id_idx" ON "public"."clm_signature_envelopes" USING "btree" ("workspace_id");



CREATE INDEX "clm_signature_events_envelope_id_idx" ON "public"."clm_signature_events" USING "btree" ("envelope_id");



CREATE INDEX "clm_signature_events_workspace_id_idx" ON "public"."clm_signature_events" USING "btree" ("workspace_id");



CREATE INDEX "clm_sla_events_workflow_id_idx" ON "public"."clm_sla_events" USING "btree" ("workflow_id");



CREATE INDEX "clm_sla_events_workspace_id_idx" ON "public"."clm_sla_events" USING "btree" ("workspace_id");



CREATE INDEX "clm_wopi_sessions_file_id_idx" ON "public"."clm_wopi_sessions" USING "btree" ("file_id");



CREATE INDEX "clm_wopi_sessions_workspace_id_idx" ON "public"."clm_wopi_sessions" USING "btree" ("workspace_id");



CREATE INDEX "clm_workflow_rules_workspace_id_idx" ON "public"."clm_workflow_rules" USING "btree" ("workspace_id");



CREATE INDEX "clm_workflow_steps_assignee_id_idx" ON "public"."clm_workflow_steps" USING "btree" ("assignee_id");



CREATE INDEX "clm_workflow_steps_workflow_id_idx" ON "public"."clm_workflow_steps" USING "btree" ("workflow_id");



CREATE INDEX "clm_workflow_steps_workspace_id_idx" ON "public"."clm_workflow_steps" USING "btree" ("workspace_id");



CREATE INDEX "clm_workflows_contract_id_idx" ON "public"."clm_workflows" USING "btree" ("contract_id");



CREATE INDEX "clm_workflows_workspace_id_idx" ON "public"."clm_workflows" USING "btree" ("workspace_id");



CREATE INDEX "compliance_records_module_idx" ON "public"."compliance_records" USING "btree" ("compliance_module");



CREATE INDEX "compliance_records_next_due_date_idx" ON "public"."compliance_records" USING "btree" ("next_due_date");



CREATE INDEX "compliance_records_status_idx" ON "public"."compliance_records" USING "btree" ("status");



CREATE INDEX "compliance_records_workspace_id_idx" ON "public"."compliance_records" USING "btree" ("workspace_id");



CREATE UNIQUE INDEX "designations_workspace_name_key" ON "public"."designations" USING "btree" ("workspace_id", "lower"("name"));



CREATE INDEX "dggi_alert_circular_workspace_idx" ON "public"."dggi_alert_circular_records" USING "btree" ("workspace_id");



CREATE INDEX "dggi_arrest_records_workspace_idx" ON "public"."dggi_arrest_records" USING "btree" ("workspace_id");



CREATE INDEX "dggi_closure_records_is_ir_idx" ON "public"."dggi_closure_records" USING "btree" ("is_ir");



CREATE INDEX "dggi_closure_records_source_record_idx" ON "public"."dggi_closure_records" USING "btree" ("source_record_id");



CREATE INDEX "dggi_closure_records_workspace_idx" ON "public"."dggi_closure_records" USING "btree" ("workspace_id");



CREATE INDEX "dggi_cpgram_workspace_idx" ON "public"."dggi_cpgram_records" USING "btree" ("workspace_id");



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



CREATE INDEX "dggi_report_compliance_workspace_idx" ON "public"."dggi_report_compliance_records" USING "btree" ("workspace_id");



CREATE INDEX "dggi_scn_records_workspace_idx" ON "public"."dggi_scn_records" USING "btree" ("workspace_id");



CREATE INDEX "dggi_seizure_records_workspace_idx" ON "public"."dggi_seizure_records" USING "btree" ("workspace_id");



CREATE INDEX "dggi_str_workspace_idx" ON "public"."dggi_str_records" USING "btree" ("workspace_id");



CREATE INDEX "document_folders_case_id_idx" ON "public"."document_folders" USING "btree" ("case_id");



CREATE INDEX "document_folders_path_idx" ON "public"."document_folders" USING "gist" ("path");



CREATE UNIQUE INDEX "document_folders_unique_name_per_parent" ON "public"."document_folders" USING "btree" ("workspace_id", "parent_id", "name");



CREATE INDEX "document_folders_workspace_idx" ON "public"."document_folders" USING "btree" ("workspace_id");



CREATE INDEX "documents_annotations_gin" ON "public"."documents" USING "gin" ("annotations" "jsonb_path_ops");



CREATE INDEX "documents_folder_idx" ON "public"."documents" USING "btree" ("folder_id");



CREATE UNIQUE INDEX "documents_hash_workspace_unique" ON "public"."documents" USING "btree" ("workspace_id", "hash_sha256") WHERE ("hash_sha256" IS NOT NULL);



CREATE INDEX "documents_search_vector_idx" ON "public"."documents" USING "gin" ("search_vector");



CREATE INDEX "documents_source_provider_idx" ON "public"."documents" USING "btree" ("source_provider");



CREATE UNIQUE INDEX "documents_source_unique_idx" ON "public"."documents" USING "btree" ("workspace_id", "source_provider", "source_file_id") WHERE ("source_file_id" IS NOT NULL);



CREATE INDEX "documents_tags_gin" ON "public"."documents" USING "gin" ("tags");



CREATE INDEX "documents_workspace_idx" ON "public"."documents" USING "btree" ("workspace_id");



CREATE INDEX "drafting_style_profiles_created_by_idx" ON "public"."drafting_style_profiles" USING "btree" ("created_by") WHERE ("deleted_at" IS NULL);



CREATE INDEX "drafting_style_profiles_default_idx" ON "public"."drafting_style_profiles" USING "btree" ("workspace_id", "is_default") WHERE (("deleted_at" IS NULL) AND ("is_default" = true));



CREATE INDEX "drafting_style_profiles_sample_docs_idx" ON "public"."drafting_style_profiles" USING "gin" ("sample_document_ids") WHERE (("deleted_at" IS NULL) AND ("sample_document_ids" IS NOT NULL));



CREATE INDEX "drafting_style_profiles_workspace_idx" ON "public"."drafting_style_profiles" USING "btree" ("workspace_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "drafts_clm_contract_id_idx" ON "public"."drafts" USING "btree" ("clm_contract_id");



CREATE UNIQUE INDEX "drive_connections_user_provider_idx" ON "public"."drive_connections" USING "btree" ("user_id", "provider");



CREATE INDEX "drive_import_jobs_user_status_idx" ON "public"."drive_import_jobs" USING "btree" ("user_id", "status");



CREATE INDEX "drive_import_jobs_workspace_provider_idx" ON "public"."drive_import_jobs" USING "btree" ("workspace_id", "provider");



CREATE INDEX "idx_api_usage_billed" ON "public"."api_usage_tracking" USING "btree" ("billed");



CREATE INDEX "idx_api_usage_billing_period" ON "public"."api_usage_tracking" USING "btree" ("billing_period");



CREATE INDEX "idx_api_usage_created_at" ON "public"."api_usage_tracking" USING "btree" ("created_at");



CREATE INDEX "idx_api_usage_endpoint" ON "public"."api_usage_tracking" USING "btree" ("endpoint");



CREATE INDEX "idx_api_usage_endpoint_period" ON "public"."api_usage_tracking" USING "btree" ("endpoint", "billing_period");



CREATE INDEX "idx_api_usage_model" ON "public"."api_usage_tracking" USING "btree" ("model");



CREATE INDEX "idx_api_usage_user_billing" ON "public"."api_usage_tracking" USING "btree" ("user_id", "billing_period", "billed");



CREATE INDEX "idx_api_usage_user_id" ON "public"."api_usage_tracking" USING "btree" ("user_id");



CREATE INDEX "idx_api_usage_workspace_billing" ON "public"."api_usage_tracking" USING "btree" ("workspace_id", "billing_period", "billed");



CREATE INDEX "idx_api_usage_workspace_id" ON "public"."api_usage_tracking" USING "btree" ("workspace_id");



CREATE INDEX "idx_app_event_id" ON "public"."calendar_event_mappings" USING "btree" ("app_event_id");



CREATE INDEX "idx_approval_workflow_steps_signer_id" ON "public"."votum_approval_workflow_steps" USING "btree" ("signer_id");



CREATE INDEX "idx_approval_workflow_steps_workflow_id" ON "public"."votum_approval_workflow_steps" USING "btree" ("workflow_id");



CREATE INDEX "idx_approval_workflows_task_id" ON "public"."votum_approval_workflows" USING "btree" ("task_id");



CREATE INDEX "idx_audit_logs_action" ON "public"."votum_audit_logs" USING "btree" ("action");



CREATE INDEX "idx_audit_logs_category" ON "public"."votum_audit_logs" USING "btree" ("change_category");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."votum_audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_search" ON "public"."votum_audit_logs" USING "gin" ("search_vector");



CREATE INDEX "idx_audit_logs_table_record" ON "public"."votum_audit_logs" USING "btree" ("table_name", "record_id");



CREATE INDEX "idx_audit_logs_user_id" ON "public"."votum_audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_audit_logs_workspace_id" ON "public"."votum_audit_logs" USING "btree" ("workspace_id");



CREATE INDEX "idx_cause_list_entries_case_id" ON "public"."cause_list_entries" USING "btree" ("case_id");



CREATE INDEX "idx_cause_list_entries_listing_date" ON "public"."cause_list_entries" USING "btree" ("listing_date");



CREATE INDEX "idx_credit_transactions_recent" ON "public"."credit_transactions" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_credit_transactions_type" ON "public"."credit_transactions" USING "btree" ("user_id", "workspace_id", "credit_type", "created_at" DESC);



CREATE INDEX "idx_delegation_chains_task_status" ON "public"."delegation_chains" USING "btree" ("task_id", "status") WHERE ("task_id" IS NOT NULL);



CREATE INDEX "idx_delegation_steps_chain_status" ON "public"."delegation_steps" USING "btree" ("delegation_chain_id", "status");



CREATE INDEX "idx_dggi_computed_deadlines_lookup" ON "public"."dggi_computed_deadlines" USING "btree" ("workspace_id", "deadline_date", "skipped");



CREATE INDEX "idx_dggi_deadline_alerts_sent_lookup" ON "public"."dggi_deadline_alerts_sent" USING "btree" ("workspace_id", "rule_id", "record_id", "reminder_bucket");



CREATE INDEX "idx_dggi_notifications_user" ON "public"."dggi_notifications" USING "btree" ("workspace_id", "user_id", "read", "created_at" DESC);



CREATE INDEX "idx_dggi_records_assigned_user" ON "public"."dggi_records" USING "btree" ("assigned_user_id");



CREATE INDEX "idx_dggi_uga_group" ON "public"."dggi_user_group_assignments" USING "btree" ("group_name");



CREATE INDEX "idx_dggi_uga_user" ON "public"."dggi_user_group_assignments" USING "btree" ("user_id");



CREATE INDEX "idx_dggi_uga_workspace" ON "public"."dggi_user_group_assignments" USING "btree" ("workspace_id");



CREATE INDEX "idx_eco_deadline" ON "public"."egazette_compliance_obligations" USING "btree" ("deadline_date") WHERE ("deadline_date" IS NOT NULL);



CREATE INDEX "idx_eco_gazette_id" ON "public"."egazette_compliance_obligations" USING "btree" ("gazette_id");



CREATE INDEX "idx_egazette_records_category" ON "public"."egazette_records" USING "btree" ("category");



CREATE INDEX "idx_egazette_records_compliance" ON "public"."egazette_records" USING "btree" ("compliance_processed") WHERE ("compliance_processed" = false);



CREATE INDEX "idx_email_accounts_provider" ON "public"."votum_email_accounts" USING "btree" ("provider");



CREATE INDEX "idx_email_accounts_user_id" ON "public"."votum_email_accounts" USING "btree" ("user_id");



CREATE INDEX "idx_email_accounts_workspace_id" ON "public"."votum_email_accounts" USING "btree" ("workspace_id");



CREATE INDEX "idx_google_event_id" ON "public"."calendar_event_mappings" USING "btree" ("google_event_id");



CREATE INDEX "idx_kam_run" ON "public"."keyword_alert_matches" USING "btree" ("run_id");



CREATE INDEX "idx_kam_sub" ON "public"."keyword_alert_matches" USING "btree" ("subscription_id");



CREATE INDEX "idx_kas_active" ON "public"."keyword_alert_subscriptions" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_kas_workspace" ON "public"."keyword_alert_subscriptions" USING "btree" ("workspace_id");



CREATE INDEX "idx_katq_claim" ON "public"."keyword_alert_task_queue" USING "btree" ("run_id", "status") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_katq_court_type" ON "public"."keyword_alert_task_queue" USING "btree" ("court_type");



CREATE INDEX "idx_katq_run_status" ON "public"."keyword_alert_task_queue" USING "btree" ("run_id", "status");



CREATE INDEX "idx_katr_run" ON "public"."keyword_alert_task_results" USING "btree" ("run_id");



CREATE INDEX "idx_katr_task" ON "public"."keyword_alert_task_results" USING "btree" ("task_id");



CREATE INDEX "idx_kats_sub" ON "public"."keyword_alert_task_subs" USING "btree" ("subscription_id");



CREATE INDEX "idx_kats_task" ON "public"."keyword_alert_task_subs" USING "btree" ("task_id");



CREATE INDEX "idx_legal_review_status" ON "public"."legal_review" USING "btree" ("status");



CREATE INDEX "idx_legal_review_storage_path" ON "public"."legal_review" USING "btree" ("storage_path");



CREATE INDEX "idx_legal_review_structured_data" ON "public"."legal_review" USING "gin" ("structured_data");



CREATE INDEX "idx_legal_review_user_id" ON "public"."legal_review" USING "btree" ("user_id");



CREATE INDEX "idx_legal_review_workspace_id" ON "public"."legal_review" USING "btree" ("workspace_id");



CREATE INDEX "idx_notifications_is_active" ON "public"."votum_notifications" USING "btree" ("is_active");



CREATE INDEX "idx_notifications_related_entity" ON "public"."votum_notifications" USING "btree" ("related_entity_id", "related_entity_type");



CREATE INDEX "idx_notifications_status" ON "public"."votum_notifications" USING "btree" ("status");



CREATE INDEX "idx_notifications_target_user_id" ON "public"."votum_notifications" USING "btree" ("target_user_id");



CREATE INDEX "idx_playbook_clauses_clause_type" ON "public"."playbook_clauses" USING "btree" ("clause_type");



CREATE INDEX "idx_playbook_clauses_playbook_id" ON "public"."playbook_clauses" USING "btree" ("playbook_id");



CREATE INDEX "idx_playbook_clauses_workspace_id" ON "public"."playbook_clauses" USING "btree" ("workspace_id");



CREATE INDEX "idx_playbooks_practice_area" ON "public"."playbooks" USING "btree" ("practice_area");



CREATE INDEX "idx_playbooks_workspace_id" ON "public"."playbooks" USING "btree" ("workspace_id");



CREATE INDEX "idx_police_fir_co_remarks_fir_id" ON "public"."police_fir_co_remarks" USING "btree" ("fir_id");



CREATE INDEX "idx_pst_jobs_created_at" ON "public"."pst_jobs" USING "btree" ("created_at");



CREATE INDEX "idx_pst_jobs_status" ON "public"."pst_jobs" USING "btree" ("status");



CREATE INDEX "idx_pst_jobs_updated_at" ON "public"."pst_jobs" USING "btree" ("updated_at");



CREATE INDEX "idx_scraper_health_states_last_checked" ON "public"."scraper_health_states" USING "btree" ("last_checked");



CREATE INDEX "idx_scraper_health_states_name" ON "public"."scraper_health_states" USING "btree" ("scraper_name");



CREATE INDEX "idx_scraper_health_states_status" ON "public"."scraper_health_states" USING "btree" ("status");



CREATE INDEX "idx_scraper_runs_name_status" ON "public"."scraper_runs" USING "btree" ("scraper_name", "status");



CREATE INDEX "idx_stack_clauses_document_id" ON "public"."stack_clauses" USING "btree" ("document_id");



CREATE INDEX "idx_stack_clauses_practice_area" ON "public"."stack_clauses" USING "btree" ("practice_area");



CREATE INDEX "idx_stack_clauses_search" ON "public"."stack_clauses" USING "gin" ("search_vector");



CREATE INDEX "idx_stack_clauses_stack_id" ON "public"."stack_clauses" USING "btree" ("stack_id");



CREATE INDEX "idx_stack_clauses_workspace_id" ON "public"."stack_clauses" USING "btree" ("workspace_id");



CREATE INDEX "idx_stack_documents_document_id" ON "public"."stack_documents" USING "btree" ("document_id");



CREATE INDEX "idx_stack_documents_stack_id" ON "public"."stack_documents" USING "btree" ("stack_id");



CREATE INDEX "idx_stacks_workspace_id" ON "public"."stacks" USING "btree" ("workspace_id");



CREATE INDEX "idx_task_custom_field_templates_workspace" ON "public"."votum_task_custom_field_templates" USING "btree" ("workspace_id");



CREATE INDEX "idx_task_ownership_current" ON "public"."votum_task_ownership_periods" USING "btree" ("task_id", "ended_at") WHERE ("ended_at" IS NULL);



CREATE INDEX "idx_task_ownership_duration" ON "public"."votum_task_ownership_periods" USING "btree" ("duration_seconds") WHERE ("duration_seconds" IS NOT NULL);



CREATE INDEX "idx_task_ownership_started_at" ON "public"."votum_task_ownership_periods" USING "btree" ("started_at");



CREATE INDEX "idx_task_ownership_task_id" ON "public"."votum_task_ownership_periods" USING "btree" ("task_id");



CREATE INDEX "idx_task_ownership_user_id" ON "public"."votum_task_ownership_periods" USING "btree" ("user_id");



CREATE INDEX "idx_task_ownership_workspace_id" ON "public"."votum_task_ownership_periods" USING "btree" ("workspace_id");



CREATE INDEX "idx_task_templates_workspace" ON "public"."task_templates" USING "btree" ("workspace_id");



CREATE INDEX "idx_team_members_team_id" ON "public"."votum_team_members" USING "btree" ("team_id");



CREATE INDEX "idx_team_members_user_id" ON "public"."votum_team_members" USING "btree" ("user_id");



CREATE INDEX "idx_user_credits_lookup" ON "public"."user_credits" USING "btree" ("user_id", "workspace_id");



CREATE INDEX "idx_user_credits_type" ON "public"."user_credits" USING "btree" ("user_id", "workspace_id", "credit_type");



CREATE INDEX "idx_votum_cases_reminder_contacts_gin" ON "public"."votum_cases" USING "gin" ("reminder_contacts");



CREATE INDEX "idx_votum_cases_tags" ON "public"."votum_cases" USING "gin" ("tags");



CREATE INDEX "idx_votum_clauses_created_at" ON "public"."votum_clauses" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_votum_clauses_outcome" ON "public"."votum_clauses" USING "btree" ("outcome") WHERE ("outcome" IS NOT NULL);



CREATE INDEX "idx_votum_clauses_workspace" ON "public"."votum_clauses" USING "btree" ("workspace_id");



CREATE INDEX "idx_votum_client_contacts_client_id" ON "public"."votum_client_contacts" USING "btree" ("client_id");



CREATE INDEX "idx_votum_client_contacts_is_primary" ON "public"."votum_client_contacts" USING "btree" ("is_primary") WHERE ("is_primary" = true);



CREATE INDEX "idx_votum_client_contacts_workspace" ON "public"."votum_client_contacts" USING "btree" ("workspace_id");



CREATE INDEX "idx_votum_tasks_cc_users" ON "public"."votum_tasks" USING "gin" ("cc_users");



CREATE INDEX "idx_votum_tasks_compliance_record_id" ON "public"."votum_tasks" USING "btree" ("compliance_record_id") WHERE ("compliance_record_id" IS NOT NULL);



CREATE INDEX "idx_votum_tasks_created_by" ON "public"."votum_tasks" USING "btree" ("created_by");



CREATE INDEX "idx_votum_tasks_ipr_matter_id" ON "public"."votum_tasks" USING "btree" ("ipr_matter_id") WHERE ("ipr_matter_id" IS NOT NULL);



CREATE INDEX "idx_votum_tasks_priority_rank_due" ON "public"."votum_tasks" USING "btree" ("priority_rank", "dueDate");



CREATE INDEX "idx_votum_tasks_tags" ON "public"."votum_tasks" USING "gin" ("tags");



CREATE INDEX "idx_votum_transcripts_case_id" ON "public"."votum_transcripts" USING "btree" ("case_id");



CREATE INDEX "idx_votum_user_tokens_user_id" ON "public"."votum_fcm_tokens" USING "btree" ("token");



CREATE INDEX "idx_votum_users_checklist_state" ON "public"."votum_users" USING "gin" ("checklist_state");



CREATE INDEX "idx_votum_users_dggi_role" ON "public"."votum_users" USING "btree" ("dggi_role");



CREATE INDEX "idx_votum_users_invite_code" ON "public"."votum_users" USING "btree" ("invite_code");



CREATE INDEX "idx_votum_users_whatsapp_phone" ON "public"."votum_users" USING "btree" ("phone");



CREATE INDEX "idx_votum_users_whatsapp_verified" ON "public"."votum_users" USING "btree" ("phone") WHERE ("whatsapp_phone_verified" = true);



CREATE INDEX "idx_whatsapp_messages_entity_links" ON "public"."whatsapp_messages" USING "gin" ("entity_links");



CREATE INDEX "idx_whatsapp_messages_folder_selection_state" ON "public"."whatsapp_messages" USING "gin" ("folder_selection_state");



CREATE INDEX "idx_whatsapp_messages_metadata" ON "public"."whatsapp_messages" USING "gin" ("metadata");



CREATE INDEX "idx_whatsapp_messages_pending" ON "public"."whatsapp_messages" USING "btree" ("phone", "received_at" DESC) WHERE (("processing_state" ->> 'status'::"text") = ANY (ARRAY['pending'::"text", 'processing'::"text", 'awaiting_user_input'::"text"]));



CREATE INDEX "idx_whatsapp_messages_processing_state" ON "public"."whatsapp_messages" USING "gin" ("processing_state");



CREATE INDEX "idx_whatsapp_messages_received_at" ON "public"."whatsapp_messages" USING "btree" ("received_at" DESC);



CREATE INDEX "idx_whatsapp_messages_user_id" ON "public"."whatsapp_messages" USING "btree" ("user_id");



CREATE INDEX "idx_whatsapp_messages_whatsapp_phone" ON "public"."whatsapp_messages" USING "btree" ("phone");



CREATE INDEX "idx_whatsapp_messages_workspace_id" ON "public"."whatsapp_messages" USING "btree" ("workspace_id");



CREATE INDEX "ipr_clearance_status_idx" ON "public"."ipr_clearance_searches" USING "btree" ("workspace_id", "status");



CREATE INDEX "ipr_clearance_workspace_idx" ON "public"."ipr_clearance_searches" USING "btree" ("workspace_id");



CREATE INDEX "ipr_matters_metadata_idx" ON "public"."ipr_matters" USING "gin" ("metadata");



CREATE INDEX "ipr_matters_next_deadline_idx" ON "public"."ipr_matters" USING "btree" ("next_deadline");



CREATE INDEX "ipr_matters_status_idx" ON "public"."ipr_matters" USING "btree" ("status");



CREATE INDEX "ipr_matters_type_idx" ON "public"."ipr_matters" USING "btree" ("matter_type");



CREATE INDEX "ipr_matters_workspace_idx" ON "public"."ipr_matters" USING "btree" ("workspace_id");



CREATE INDEX "ipr_watch_hits_active_idx" ON "public"."ipr_watch_hits" USING "btree" ("workspace_id", "dismissed");



CREATE INDEX "ipr_watch_hits_workspace_idx" ON "public"."ipr_watch_hits" USING "btree" ("workspace_id");



CREATE UNIQUE INDEX "legal_summary_cache_cache_key_unique" ON "public"."legal_summary_cache" USING "btree" ("cache_key");



CREATE INDEX "legal_summary_cache_case_number_idx" ON "public"."legal_summary_cache" USING "btree" ("case_number");



CREATE INDEX "legal_summary_cache_input_text_hash_idx" ON "public"."legal_summary_cache" USING "btree" ("input_text_hash");



CREATE INDEX "legal_summary_cache_url_idx" ON "public"."legal_summary_cache" USING "btree" ("url");



CREATE INDEX "legal_summary_sessions_cache_key_idx" ON "public"."legal_summary_sessions" USING "btree" ("cache_key");



CREATE INDEX "legal_summary_sessions_case_number_idx" ON "public"."legal_summary_sessions" USING "btree" ("case_number");



CREATE INDEX "legal_summary_sessions_created_at_idx" ON "public"."legal_summary_sessions" USING "btree" ("created_at");



CREATE INDEX "legal_summary_sessions_user_id_idx" ON "public"."legal_summary_sessions" USING "btree" ("user_id");



CREATE UNIQUE INDEX "org_units_workspace_parent_type_name_key" ON "public"."org_units" USING "btree" ("workspace_id", COALESCE("parent_id", '00000000-0000-0000-0000-000000000000'::"uuid"), "unit_type", "lower"("name"));



CREATE INDEX "pdf_delivery_logs_run_date_idx" ON "public"."pdf_delivery_logs" USING "btree" ("run_date" DESC);



CREATE INDEX "pdf_delivery_logs_status_idx" ON "public"."pdf_delivery_logs" USING "btree" ("status") WHERE ("status" <> 'success'::"text");



CREATE UNIQUE INDEX "pdf_delivery_logs_unique_idx" ON "public"."pdf_delivery_logs" USING "btree" ("run_date", "listing_date", "workspace_id", "variant", COALESCE("user_id", '00000000-0000-0000-0000-000000000000'::"uuid"));



CREATE INDEX "pdf_delivery_logs_workspace_date_idx" ON "public"."pdf_delivery_logs" USING "btree" ("workspace_id", "run_date" DESC);



CREATE INDEX "pdf_ink_strokes_storage_page_idx" ON "public"."pdf_ink_strokes" USING "btree" ("storage_path", "page");



CREATE INDEX "pdf_ink_strokes_storage_path_idx" ON "public"."pdf_ink_strokes" USING "btree" ("storage_path");



CREATE UNIQUE INDEX "unique_user_token" ON "public"."votum_fcm_tokens" USING "btree" ("user_id", "token");



CREATE UNIQUE INDEX "user_postings_single_primary_active_idx" ON "public"."user_postings" USING "btree" ("user_id", "workspace_id") WHERE (("is_primary" = true) AND ("effective_to" IS NULL));



CREATE INDEX "votum_case_custom_fields_workspace_idx" ON "public"."votum_case_custom_fields" USING "btree" ("workspace_id");



CREATE INDEX "votum_client_contacts_workspace_idx" ON "public"."votum_client_contacts" USING "btree" ("workspace_id");



CREATE INDEX "votum_task_followups_task_id_idx" ON "public"."votum_task_followups" USING "btree" ("task_id");



CREATE INDEX "votum_task_followups_workspace_id_idx" ON "public"."votum_task_followups" USING "btree" ("workspace_id");



CREATE UNIQUE INDEX "votum_users_pno_idx" ON "public"."votum_users" USING "btree" ("pno") WHERE ("pno" IS NOT NULL);



CREATE INDEX "worker_proxy_ips_status_idx" ON "public"."worker_proxy_ips" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "audit_cases_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."votum_cases" FOR EACH ROW EXECUTE FUNCTION "public"."audit_cases_changes"();



CREATE OR REPLACE TRIGGER "audit_invoice_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."votum_invoice" FOR EACH ROW EXECUTE FUNCTION "public"."audit_invoice_changes"();



CREATE OR REPLACE TRIGGER "audit_notes_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."votum_notes" FOR EACH ROW EXECUTE FUNCTION "public"."audit_notes_changes"();



CREATE OR REPLACE TRIGGER "audit_time_entries_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."votum_time_entries" FOR EACH ROW EXECUTE FUNCTION "public"."audit_time_entries_changes"();



CREATE OR REPLACE TRIGGER "audit_users_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."votum_users" FOR EACH ROW EXECUTE FUNCTION "public"."audit_users_changes"();



CREATE OR REPLACE TRIGGER "audit_votum_tasks_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."votum_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."audit_votum_tasks_changes"();



CREATE OR REPLACE TRIGGER "calculate_api_cost_trigger" BEFORE INSERT OR UPDATE ON "public"."api_usage_tracking" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_api_cost"();



CREATE OR REPLACE TRIGGER "delegation_chain_status_sync_trigger" AFTER UPDATE OF "status" ON "public"."delegation_chains" FOR EACH ROW WHEN (("old"."status" IS DISTINCT FROM "new"."status")) EXECUTE FUNCTION "public"."sync_task_status_from_delegation"();



CREATE OR REPLACE TRIGGER "delegation_chain_update_trigger" AFTER UPDATE OF "current_assignee" ON "public"."delegation_chains" FOR EACH ROW WHEN (("old"."current_assignee" IS DISTINCT FROM "new"."current_assignee")) EXECUTE FUNCTION "public"."update_entity_on_delegation"();



CREATE OR REPLACE TRIGGER "delegation_step_status_sync_trigger" AFTER UPDATE OF "status" ON "public"."delegation_steps" FOR EACH ROW WHEN (("old"."status" IS DISTINCT FROM "new"."status")) EXECUTE FUNCTION "public"."sync_task_status_from_delegation_step"();



CREATE OR REPLACE TRIGGER "document_folders_set_path_trigger" BEFORE INSERT OR UPDATE OF "name", "slug", "parent_id" ON "public"."document_folders" FOR EACH ROW EXECUTE FUNCTION "public"."document_folders_set_path"();



CREATE OR REPLACE TRIGGER "document_folders_touch_updated_at" BEFORE UPDATE ON "public"."document_folders" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "documents_touch_updated_at" BEFORE UPDATE ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."votum_cases" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "notify_dispatch_trigger" AFTER INSERT ON "public"."votum_notifications" FOR EACH ROW EXECUTE FUNCTION "public"."dispatch_notification_on_insert"();



CREATE OR REPLACE TRIGGER "notify_high_usage_trigger" AFTER INSERT ON "public"."api_usage_tracking" FOR EACH ROW EXECUTE FUNCTION "public"."notify_high_usage"();



CREATE OR REPLACE TRIGGER "playbook_clauses_updated_at" BEFORE UPDATE ON "public"."playbook_clauses" FOR EACH ROW EXECUTE FUNCTION "public"."playbook_clauses_updated_at"();



CREATE OR REPLACE TRIGGER "playbooks_updated_at" BEFORE UPDATE ON "public"."playbooks" FOR EACH ROW EXECUTE FUNCTION "public"."playbooks_updated_at"();



CREATE OR REPLACE TRIGGER "set_billing_period_trigger" BEFORE INSERT ON "public"."api_usage_tracking" FOR EACH ROW EXECUTE FUNCTION "public"."set_billing_period"();



CREATE OR REPLACE TRIGGER "set_drafting_style_profiles_updated_at" BEFORE UPDATE ON "public"."drafting_style_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_drafting_style_profiles_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."votum_user_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."update_votum_user_tokens_updated_at"();



CREATE OR REPLACE TRIGGER "sync_ownership_on_assignee_change_trigger" AFTER INSERT OR DELETE ON "public"."task_assignees" FOR EACH ROW EXECUTE FUNCTION "public"."sync_ownership_on_assignee_change"();



CREATE OR REPLACE TRIGGER "task_deletion_trigger" BEFORE DELETE ON "public"."votum_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."delete_workflow_on_task_deletion"();



CREATE OR REPLACE TRIGGER "task_status_change_trigger" BEFORE UPDATE ON "public"."votum_tasks" FOR EACH ROW WHEN (("old"."status" <> "new"."status")) EXECUTE FUNCTION "public"."validate_task_status_change"();



CREATE OR REPLACE TRIGGER "task_workflow_completion_trigger" AFTER UPDATE ON "public"."votum_approval_workflow_steps" FOR EACH ROW EXECUTE FUNCTION "public"."update_task_status_on_workflow_completion"();



CREATE OR REPLACE TRIGGER "trg_audit_task_assignees_delete" AFTER DELETE ON "public"."task_assignees" FOR EACH ROW EXECUTE FUNCTION "public"."audit_task_assignees_delete"();



CREATE OR REPLACE TRIGGER "trg_audit_task_assignees_insert" AFTER INSERT ON "public"."task_assignees" FOR EACH ROW EXECUTE FUNCTION "public"."audit_task_assignees_insert"();



CREATE OR REPLACE TRIGGER "trg_enqueue_document_on_upload" AFTER INSERT ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."enqueue_document_on_upload"();



CREATE OR REPLACE TRIGGER "trg_sync_petitioner_respondent_text" BEFORE INSERT OR UPDATE ON "public"."votum_cases" FOR EACH ROW EXECUTE FUNCTION "public"."sync_petitioner_respondent_text"();



CREATE OR REPLACE TRIGGER "trg_sync_task_assignees_delegation" AFTER UPDATE OF "current_assignee" ON "public"."delegation_chains" FOR EACH ROW EXECUTE FUNCTION "public"."sync_task_assignees_from_delegation"();



CREATE OR REPLACE TRIGGER "trg_task_custom_field_templates_updated_at" BEFORE UPDATE ON "public"."votum_task_custom_field_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_task_custom_field_templates_updated_at"();



CREATE OR REPLACE TRIGGER "trg_task_templates_updated_at" BEFORE UPDATE ON "public"."task_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_task_templates_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_whatsapp_messages_updated_at" BEFORE UPDATE ON "public"."whatsapp_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_whatsapp_messages_updated_at"();



CREATE OR REPLACE TRIGGER "update_audit_search_vector_trigger" BEFORE INSERT OR UPDATE ON "public"."votum_audit_logs" FOR EACH ROW EXECUTE FUNCTION "public"."update_audit_search_vector"();



CREATE OR REPLACE TRIGGER "update_case_repository_search_vector_trigger" BEFORE INSERT OR UPDATE ON "public"."case_repository" FOR EACH ROW EXECUTE FUNCTION "public"."update_case_repository_search_vector"();



CREATE OR REPLACE TRIGGER "update_credit_costs_updated_at" BEFORE UPDATE ON "public"."credit_costs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_credit_packages_updated_at" BEFORE UPDATE ON "public"."credit_packages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_documents_search_vector_trigger" BEFORE INSERT OR UPDATE OF "filename", "tags", "document_type", "extracted_text" ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_documents_search_vector"();



CREATE OR REPLACE TRIGGER "update_email_accounts_timestamp" BEFORE UPDATE ON "public"."votum_email_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."update_email_accounts_updated_at"();



CREATE OR REPLACE TRIGGER "update_ipr_matters_updated_at" BEFORE UPDATE ON "public"."ipr_matters" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_legal_review_updated_at" BEFORE UPDATE ON "public"."legal_review" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_time_entry_updated_at" BEFORE UPDATE ON "public"."votum_time_entries" FOR EACH ROW EXECUTE FUNCTION "public"."update_time_entry_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_credits_updated_at" BEFORE UPDATE ON "public"."user_credits" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "validate_user_postings_workspace" BEFORE INSERT OR UPDATE ON "public"."user_postings" FOR EACH ROW EXECUTE FUNCTION "public"."check_user_postings_workspace_consistency"();



CREATE OR REPLACE TRIGGER "votum_tasks_after_delete_trg" AFTER DELETE ON "public"."votum_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."votum_tasks_delete_fn"();



CREATE OR REPLACE TRIGGER "worker_proxy_ips_updated_at" BEFORE UPDATE ON "public"."worker_proxy_ips" FOR EACH ROW EXECUTE FUNCTION "public"."update_worker_proxy_ips_updated_at"();



CREATE OR REPLACE TRIGGER "workflow_task_status_trigger" AFTER INSERT OR DELETE ON "public"."votum_approval_workflows" FOR EACH ROW EXECUTE FUNCTION "public"."update_task_workflow_status"();



ALTER TABLE ONLY "public"."api_usage_tracking"
    ADD CONSTRAINT "api_usage_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."api_usage_tracking"
    ADD CONSTRAINT "api_usage_tracking_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."arbitration_sessions"
    ADD CONSTRAINT "arbitration_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."arbitration_sessions"
    ADD CONSTRAINT "arbitration_sessions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."case_activity_events"
    ADD CONSTRAINT "case_activity_events_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."votum_cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."case_activity_notifications"
    ADD CONSTRAINT "case_activity_notifications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."case_activity_events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."case_repository"
    ADD CONSTRAINT "case_repository_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."case_repository"
    ADD CONSTRAINT "case_repository_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cause_list_entries"
    ADD CONSTRAINT "cause_list_entries_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."votum_cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cause_list_entries"
    ADD CONSTRAINT "cause_list_entries_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_passkey_challenges"
    ADD CONSTRAINT "challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_sessions"
    ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_records"
    ADD CONSTRAINT "compliance_records_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."compliance_records"
    ADD CONSTRAINT "compliance_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."compliance_records"
    ADD CONSTRAINT "compliance_records_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."compliance_records"
    ADD CONSTRAINT "compliance_records_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."compliance_records"
    ADD CONSTRAINT "compliance_records_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."delegation_chains"
    ADD CONSTRAINT "delegation_chains_current_assignee_fkey" FOREIGN KEY ("current_assignee") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."delegation_chains"
    ADD CONSTRAINT "delegation_chains_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."delegation_chains"
    ADD CONSTRAINT "delegation_chains_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."delegation_chains"
    ADD CONSTRAINT "delegation_chains_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."votum_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."delegation_chains"
    ADD CONSTRAINT "delegation_chains_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."delegation_steps"
    ADD CONSTRAINT "delegation_steps_delegated_by_fkey" FOREIGN KEY ("delegated_by") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."delegation_steps"
    ADD CONSTRAINT "delegation_steps_delegated_to_fkey" FOREIGN KEY ("delegated_to") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."delegation_steps"
    ADD CONSTRAINT "delegation_steps_delegation_chain_id_fkey" FOREIGN KEY ("delegation_chain_id") REFERENCES "public"."delegation_chains"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."designations"
    ADD CONSTRAINT "designations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dggi_alert_circular_records"
    ADD CONSTRAINT "dggi_alert_circular_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_arrest_records"
    ADD CONSTRAINT "dggi_arrest_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_closure_records"
    ADD CONSTRAINT "dggi_closure_records_handling_io_sio_fkey" FOREIGN KEY ("handling_io_sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_cpgram_records"
    ADD CONSTRAINT "dggi_cpgram_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_dfl_records"
    ADD CONSTRAINT "dggi_dfl_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_evidence_room_records"
    ADD CONSTRAINT "dggi_evidence_room_records_seized_by_fkey" FOREIGN KEY ("seized_by") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_evidence_room_records"
    ADD CONSTRAINT "dggi_evidence_room_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_incident_report_records"
    ADD CONSTRAINT "dggi_incident_report_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_informer_reward_records"
    ADD CONSTRAINT "dggi_informer_reward_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_intel_other_source_records"
    ADD CONSTRAINT "dggi_intel_other_source_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_intel_rapid_records"
    ADD CONSTRAINT "dggi_intel_rapid_records_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_intel_rapid_records"
    ADD CONSTRAINT "dggi_intel_rapid_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_modus_operandi_records"
    ADD CONSTRAINT "dggi_modus_operandi_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_non_ir_case_records"
    ADD CONSTRAINT "dggi_non_ir_case_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_prosecution_arrest_records"
    ADD CONSTRAINT "dggi_prosecution_arrest_records_linked_arrest_id_fkey" FOREIGN KEY ("linked_arrest_id") REFERENCES "public"."dggi_arrest_records"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_prosecution_arrest_records"
    ADD CONSTRAINT "dggi_prosecution_arrest_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_prosecution_non_arrest_records"
    ADD CONSTRAINT "dggi_prosecution_non_arrest_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_provisional_attachment_records"
    ADD CONSTRAINT "dggi_provisional_attachment_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_records"
    ADD CONSTRAINT "dggi_records_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_records"
    ADD CONSTRAINT "dggi_records_handling_io_sio_fkey" FOREIGN KEY ("handling_io_sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_report_compliance_records"
    ADD CONSTRAINT "dggi_report_compliance_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_scn_records"
    ADD CONSTRAINT "dggi_scn_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_seizure_records"
    ADD CONSTRAINT "dggi_seizure_records_seized_by_fkey" FOREIGN KEY ("seized_by") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_seizure_records"
    ADD CONSTRAINT "dggi_seizure_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_str_records"
    ADD CONSTRAINT "dggi_str_records_sio_fkey" FOREIGN KEY ("sio") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dggi_user_group_assignments"
    ADD CONSTRAINT "dggi_user_group_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_folders"
    ADD CONSTRAINT "document_folders_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."votum_cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_folders"
    ADD CONSTRAINT "document_folders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."document_folders"
    ADD CONSTRAINT "document_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."document_folders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_folders"
    ADD CONSTRAINT "document_folders_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."votum_cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."document_folders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."drafts"
    ADD CONSTRAINT "drafts_ai_session_id_fkey" FOREIGN KEY ("ai_session_id") REFERENCES "public"."task_sessions"("session_id");



ALTER TABLE ONLY "public"."drafts"
    ADD CONSTRAINT "drafts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."drafts"
    ADD CONSTRAINT "drafts_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."drafts"
    ADD CONSTRAINT "drafts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id");



ALTER TABLE ONLY "public"."drive_connections"
    ADD CONSTRAINT "drive_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."drive_import_jobs"
    ADD CONSTRAINT "drive_import_jobs_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."drive_import_jobs"
    ADD CONSTRAINT "drive_import_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."drive_import_jobs"
    ADD CONSTRAINT "drive_import_jobs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."egazette_compliance_obligations"
    ADD CONSTRAINT "egazette_compliance_obligations_gazette_id_fkey" FOREIGN KEY ("gazette_id") REFERENCES "public"."egazette_records"("gazette_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_fcm_tokens"
    ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."calendar_event_mappings"
    ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_email_accounts"
    ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_email_accounts"
    ADD CONSTRAINT "fk_workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."intake_forms"
    ADD CONSTRAINT "intake_forms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."intake_forms"
    ADD CONSTRAINT "intake_forms_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."intake_submissions"
    ADD CONSTRAINT "intake_submissions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "public"."intake_forms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_passkeys"
    ADD CONSTRAINT "internal_user_id_fkey" FOREIGN KEY ("internal_user_id") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ipr_matters"
    ADD CONSTRAINT "ipr_matters_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ipr_matters"
    ADD CONSTRAINT "ipr_matters_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ipr_matters"
    ADD CONSTRAINT "ipr_matters_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ipr_matters"
    ADD CONSTRAINT "ipr_matters_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ipr_matters"
    ADD CONSTRAINT "ipr_matters_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ipr_watch_hits"
    ADD CONSTRAINT "ipr_watch_hits_matter_id_fkey" FOREIGN KEY ("matter_id") REFERENCES "public"."ipr_matters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_alert_matches"
    ADD CONSTRAINT "keyword_alert_matches_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."keyword_alert_subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_alert_subscriptions"
    ADD CONSTRAINT "keyword_alert_subscriptions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."keyword_alert_subscriptions"
    ADD CONSTRAINT "keyword_alert_subscriptions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_alert_task_queue"
    ADD CONSTRAINT "keyword_alert_task_queue_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "public"."keyword_alert_runs"("id");



ALTER TABLE ONLY "public"."keyword_alert_task_results"
    ADD CONSTRAINT "keyword_alert_task_results_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."keyword_alert_task_queue"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_alert_task_subs"
    ADD CONSTRAINT "keyword_alert_task_subs_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."keyword_alert_subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_alert_task_subs"
    ADD CONSTRAINT "keyword_alert_task_subs_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."keyword_alert_task_queue"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_units"
    ADD CONSTRAINT "org_units_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."org_units"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_units"
    ADD CONSTRAINT "org_units_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."outlook_calendar_mappings"
    ADD CONSTRAINT "outlook_calendar_mappings_app_event_id_fkey" FOREIGN KEY ("app_event_id") REFERENCES "public"."votum_events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."outlook_calendar_mappings"
    ADD CONSTRAINT "outlook_calendar_mappings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."outreach_sequence_log"
    ADD CONSTRAINT "outreach_sequence_log_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."outreach_leads"("id");



ALTER TABLE ONLY "public"."playbook_clauses"
    ADD CONSTRAINT "playbook_clauses_playbook_id_fkey" FOREIGN KEY ("playbook_id") REFERENCES "public"."playbooks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."police_fir_co_remarks"
    ADD CONSTRAINT "police_fir_co_remarks_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."police_fir_co_remarks"
    ADD CONSTRAINT "police_fir_co_remarks_fir_id_fkey" FOREIGN KEY ("fir_id") REFERENCES "public"."police_firs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."police_firs"
    ADD CONSTRAINT "police_firs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."police_firs"
    ADD CONSTRAINT "police_firs_io_user_id_fkey" FOREIGN KEY ("io_user_id") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."police_firs"
    ADD CONSTRAINT "police_firs_station_unit_id_fkey" FOREIGN KEY ("station_unit_id") REFERENCES "public"."org_units"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."police_firs"
    ADD CONSTRAINT "police_firs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."police_office_files"
    ADD CONSTRAINT "police_office_files_applicant_user_id_fkey" FOREIGN KEY ("applicant_user_id") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."police_office_files"
    ADD CONSTRAINT "police_office_files_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."police_office_files"
    ADD CONSTRAINT "police_office_files_current_assignee_id_fkey" FOREIGN KEY ("current_assignee_id") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."police_office_files"
    ADD CONSTRAINT "police_office_files_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_clients"
    ADD CONSTRAINT "public_votum_clients_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id");



ALTER TABLE ONLY "public"."votum_events"
    ADD CONSTRAINT "public_votum_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."votum_notes"
    ADD CONSTRAINT "public_votum_notes_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."votum_notes"
    ADD CONSTRAINT "public_votum_notes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id");



ALTER TABLE ONLY "public"."votum_transcripts"
    ADD CONSTRAINT "public_votum_transcripts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."votum_users"
    ADD CONSTRAINT "public_votum_users_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id");



ALTER TABLE ONLY "public"."razorpay_transactions"
    ADD CONSTRAINT "razorpay_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stack_clauses"
    ADD CONSTRAINT "stack_clauses_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stack_clauses"
    ADD CONSTRAINT "stack_clauses_stack_id_fkey" FOREIGN KEY ("stack_id") REFERENCES "public"."stacks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stack_documents"
    ADD CONSTRAINT "stack_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stack_documents"
    ADD CONSTRAINT "stack_documents_stack_id_fkey" FOREIGN KEY ("stack_id") REFERENCES "public"."stacks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_assignees"
    ADD CONSTRAINT "task_assignees_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."task_assignees"
    ADD CONSTRAINT "task_assignees_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."votum_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_assignees"
    ADD CONSTRAINT "task_assignees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_documents"
    ADD CONSTRAINT "task_documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."votum_clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_documents"
    ADD CONSTRAINT "task_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_documents"
    ADD CONSTRAINT "task_documents_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_postings"
    ADD CONSTRAINT "user_postings_designation_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "public"."designations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_postings"
    ADD CONSTRAINT "user_postings_org_unit_id_fkey" FOREIGN KEY ("org_unit_id") REFERENCES "public"."org_units"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_postings"
    ADD CONSTRAINT "user_postings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_postings"
    ADD CONSTRAINT "user_postings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_approval_workflows"
    ADD CONSTRAINT "votum_approval_workflows_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."votum_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_audit_logs"
    ADD CONSTRAINT "votum_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."votum_audit_logs"
    ADD CONSTRAINT "votum_audit_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id");



ALTER TABLE ONLY "public"."votum_case_custom_fields"
    ADD CONSTRAINT "votum_case_custom_fields_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_cases"
    ADD CONSTRAINT "votum_cases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."votum_cases"
    ADD CONSTRAINT "votum_cases_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_clauses"
    ADD CONSTRAINT "votum_clauses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."votum_clauses"
    ADD CONSTRAINT "votum_clauses_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_client_contacts"
    ADD CONSTRAINT "votum_client_contacts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."votum_clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_client_contacts"
    ADD CONSTRAINT "votum_client_contacts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_comments"
    ADD CONSTRAINT "votum_comments_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."votum_comments"
    ADD CONSTRAINT "votum_comments_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."votum_notes"("id");



ALTER TABLE ONLY "public"."votum_comments"
    ADD CONSTRAINT "votum_comments_parent_fkey" FOREIGN KEY ("parent") REFERENCES "public"."votum_comments"("comment_id");



ALTER TABLE ONLY "public"."votum_comments"
    ADD CONSTRAINT "votum_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."votum_tasks"("id");



ALTER TABLE ONLY "public"."automation_presets_hierarchy"
    ADD CONSTRAINT "votum_hierarchy_user_mapping_hierarchy_id_fkey" FOREIGN KEY ("hierarchy_id") REFERENCES "public"."automation_presets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_presets_hierarchy"
    ADD CONSTRAINT "votum_hierarchy_user_mapping_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_invoice"
    ADD CONSTRAINT "votum_invoice_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."votum_clients"("id");



ALTER TABLE ONLY "public"."votum_invoice_reminders"
    ADD CONSTRAINT "votum_invoice_reminders_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."votum_invoice"("id");



ALTER TABLE ONLY "public"."votum_invoice_reminders"
    ADD CONSTRAINT "votum_invoice_reminders_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id");



ALTER TABLE ONLY "public"."votum_invoice"
    ADD CONSTRAINT "votum_invoice_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id");



ALTER TABLE ONLY "public"."votum_notifications"
    ADD CONSTRAINT "votum_notifications_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."votum_notifications"
    ADD CONSTRAINT "votum_notifications_related_notification_id_fkey" FOREIGN KEY ("related_notification_id") REFERENCES "public"."votum_notifications"("id");



ALTER TABLE ONLY "public"."votum_notifications"
    ADD CONSTRAINT "votum_notifications_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."votum_notifications"
    ADD CONSTRAINT "votum_notifications_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id");



ALTER TABLE ONLY "public"."votum_approval_workflows"
    ADD CONSTRAINT "votum_signing_workflow_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."votum_approval_workflows"
    ADD CONSTRAINT "votum_signing_workflow_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."votum_approval_workflows"
    ADD CONSTRAINT "votum_signing_workflow_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."votum_approval_workflow_steps"
    ADD CONSTRAINT "votum_signing_workflow_progress_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."votum_approval_workflow_steps"
    ADD CONSTRAINT "votum_signing_workflow_progress_signer_id_fkey" FOREIGN KEY ("signer_id") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."votum_approval_workflow_steps"
    ADD CONSTRAINT "votum_signing_workflow_progress_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."votum_approval_workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_approval_workflows"
    ADD CONSTRAINT "votum_signing_workflow_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_suggested_tasks"
    ADD CONSTRAINT "votum_suggested_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."votum_suggested_tasks"
    ADD CONSTRAINT "votum_suggested_tasks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id");



ALTER TABLE ONLY "public"."votum_summary"
    ADD CONSTRAINT "votum_summary_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id");



ALTER TABLE ONLY "public"."votum_task_ownership_periods"
    ADD CONSTRAINT "votum_task_ownership_periods_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."votum_task_ownership_periods"
    ADD CONSTRAINT "votum_task_ownership_periods_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."votum_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_task_ownership_periods"
    ADD CONSTRAINT "votum_task_ownership_periods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."votum_task_reviews"
    ADD CONSTRAINT "votum_task_reviews_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."votum_tasks"("id");



ALTER TABLE ONLY "public"."votum_tasks"
    ADD CONSTRAINT "votum_tasks_applied_template_id_fkey" FOREIGN KEY ("applied_template_id") REFERENCES "public"."task_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."votum_tasks"
    ADD CONSTRAINT "votum_tasks_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."votum_tasks"
    ADD CONSTRAINT "votum_tasks_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."votum_tasks"
    ADD CONSTRAINT "votum_tasks_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."votum_cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_tasks"
    ADD CONSTRAINT "votum_tasks_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."votum_clients"("id");



ALTER TABLE ONLY "public"."votum_tasks"
    ADD CONSTRAINT "votum_tasks_compliance_record_id_fkey" FOREIGN KEY ("compliance_record_id") REFERENCES "public"."compliance_records"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_tasks"
    ADD CONSTRAINT "votum_tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."votum_tasks"
    ADD CONSTRAINT "votum_tasks_ipr_matter_id_fkey" FOREIGN KEY ("ipr_matter_id") REFERENCES "public"."ipr_matters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_tasks"
    ADD CONSTRAINT "votum_tasks_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."votum_task_reviews"
    ADD CONSTRAINT "votum_tasks_reviews_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."votum_task_reviews"
    ADD CONSTRAINT "votum_tasks_reviews_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."votum_tasks"
    ADD CONSTRAINT "votum_tasks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id");



ALTER TABLE ONLY "public"."votum_team_members"
    ADD CONSTRAINT "votum_team_members_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_team_members"
    ADD CONSTRAINT "votum_team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."votum_teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_team_members"
    ADD CONSTRAINT "votum_team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_teams"
    ADD CONSTRAINT "votum_teams_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id");



ALTER TABLE ONLY "public"."votum_templates"
    ADD CONSTRAINT "votum_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."votum_templates"
    ADD CONSTRAINT "votum_templates_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id");



ALTER TABLE ONLY "public"."votum_time_entries"
    ADD CONSTRAINT "votum_time_entries_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."votum_clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."votum_time_entries"
    ADD CONSTRAINT "votum_time_entries_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."votum_invoice"("id");



ALTER TABLE ONLY "public"."votum_time_entries"
    ADD CONSTRAINT "votum_time_entries_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."votum_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_time_entries"
    ADD CONSTRAINT "votum_time_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id");



ALTER TABLE ONLY "public"."votum_time_entries"
    ADD CONSTRAINT "votum_time_entries_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id");



ALTER TABLE ONLY "public"."votum_transcripts"
    ADD CONSTRAINT "votum_transcripts_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."votum_cases"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."votum_transcripts"
    ADD CONSTRAINT "votum_transcripts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_translations"
    ADD CONSTRAINT "votum_translations_translator_id_fkey" FOREIGN KEY ("translator_id") REFERENCES "public"."votum_translators"("id");



ALTER TABLE ONLY "public"."votum_translations"
    ADD CONSTRAINT "votum_translations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_translations"
    ADD CONSTRAINT "votum_translations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_presets"
    ADD CONSTRAINT "votum_user_hierarchy_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_presets"
    ADD CONSTRAINT "votum_user_hierarchy_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_user_tokens"
    ADD CONSTRAINT "votum_user_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votum_users"
    ADD CONSTRAINT "votum_users_cc_fkey" FOREIGN KEY ("cc") REFERENCES "public"."votum_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."whatsapp_messages"
    ADD CONSTRAINT "whatsapp_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."votum_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."whatsapp_messages"
    ADD CONSTRAINT "whatsapp_messages_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."votum_workspace"("id") ON DELETE SET NULL;



CREATE POLICY "Anyone can view active credit packages" ON "public"."credit_packages" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view credit costs" ON "public"."credit_costs" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Enable insert for all users" ON "public"."votum_invoice_reminders" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."votum_invoice_reminders" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable select for all users" ON "public"."votum_invoice_reminders" FOR SELECT USING (true);



CREATE POLICY "Users can insert ownership periods in their workspace" ON "public"."votum_task_ownership_periods" FOR INSERT WITH CHECK (("workspace_id" IN ( SELECT "votum_users"."workspace_id"
   FROM "public"."votum_users"
  WHERE ("votum_users"."id" = "auth"."uid"()))));



CREATE POLICY "Users can insert their own credits" ON "public"."user_credits" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own transactions" ON "public"."credit_transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own tokens" ON "public"."votum_user_tokens" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update ownership periods in their workspace" ON "public"."votum_task_ownership_periods" FOR UPDATE USING (("workspace_id" IN ( SELECT "votum_users"."workspace_id"
   FROM "public"."votum_users"
  WHERE ("votum_users"."id" = "auth"."uid"()))));



CREATE POLICY "Users can update their own credits" ON "public"."user_credits" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view ownership periods in their workspace" ON "public"."votum_task_ownership_periods" FOR SELECT USING (("workspace_id" IN ( SELECT "votum_users"."workspace_id"
   FROM "public"."votum_users"
  WHERE ("votum_users"."id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own credits" ON "public"."user_credits" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own transactions" ON "public"."credit_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "calendar_event_mappings_user_isolation" ON "public"."calendar_event_mappings" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."case_repository" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "case_repository_delete_policy" ON "public"."case_repository" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "case_repository_insert_policy" ON "public"."case_repository" FOR INSERT WITH CHECK ((("workspace_id" IN ( SELECT "votum_users"."workspace_id"
   FROM "public"."votum_users"
  WHERE ("votum_users"."id" = "auth"."uid"()))) AND ("created_by" = "auth"."uid"())));



CREATE POLICY "case_repository_select_policy" ON "public"."case_repository" FOR SELECT USING (("workspace_id" IN ( SELECT "votum_users"."workspace_id"
   FROM "public"."votum_users"
  WHERE ("votum_users"."id" = "auth"."uid"()))));



CREATE POLICY "case_repository_update_policy" ON "public"."case_repository" FOR UPDATE USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



ALTER TABLE "public"."compliance_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_costs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dggi_computed_deadlines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dggi_notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "email_accounts_user_isolation" ON "public"."votum_email_accounts" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."intake_forms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."intake_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ipr_matters" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ipr_matters_delete_policy" ON "public"."ipr_matters" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "ipr_matters_insert_policy" ON "public"."ipr_matters" FOR INSERT WITH CHECK ((("workspace_id" IN ( SELECT "votum_users"."workspace_id"
   FROM "public"."votum_users"
  WHERE ("votum_users"."id" = "auth"."uid"()))) AND ("created_by" = "auth"."uid"())));



CREATE POLICY "ipr_matters_select_policy" ON "public"."ipr_matters" FOR SELECT USING (("workspace_id" IN ( SELECT "votum_users"."workspace_id"
   FROM "public"."votum_users"
  WHERE ("votum_users"."id" = "auth"."uid"()))));



CREATE POLICY "ipr_matters_update_policy" ON "public"."ipr_matters" FOR UPDATE USING (("workspace_id" IN ( SELECT "votum_users"."workspace_id"
   FROM "public"."votum_users"
  WHERE ("votum_users"."id" = "auth"."uid"())))) WITH CHECK ((("workspace_id" IN ( SELECT "votum_users"."workspace_id"
   FROM "public"."votum_users"
  WHERE ("votum_users"."id" = "auth"."uid"()))) AND ("updated_by" = "auth"."uid"())));



ALTER TABLE "public"."playbook_clauses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."playbooks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public insert intake_submissions" ON "public"."intake_submissions" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "public read active intake_forms" ON "public"."intake_forms" FOR SELECT TO "anon" USING (("is_active" = true));



ALTER TABLE "public"."razorpay_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_credits" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users can view own transactions" ON "public"."razorpay_transactions" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."votum_task_ownership_periods" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workspace members can delete compliance records" ON "public"."compliance_records" FOR DELETE USING (("workspace_id" IN ( SELECT "votum_users"."workspace_id"
   FROM "public"."votum_users"
  WHERE ("votum_users"."id" = "auth"."uid"()))));



CREATE POLICY "workspace members can insert compliance records" ON "public"."compliance_records" FOR INSERT WITH CHECK (("workspace_id" IN ( SELECT "votum_users"."workspace_id"
   FROM "public"."votum_users"
  WHERE ("votum_users"."id" = "auth"."uid"()))));



CREATE POLICY "workspace members can mark notifications read" ON "public"."dggi_notifications" FOR UPDATE USING (true);



CREATE POLICY "workspace members can read compliance records" ON "public"."compliance_records" FOR SELECT USING (("workspace_id" IN ( SELECT "votum_users"."workspace_id"
   FROM "public"."votum_users"
  WHERE ("votum_users"."id" = "auth"."uid"()))));



CREATE POLICY "workspace members can read computed deadlines" ON "public"."dggi_computed_deadlines" FOR SELECT USING (true);



CREATE POLICY "workspace members can read their notifications" ON "public"."dggi_notifications" FOR SELECT USING (true);



CREATE POLICY "workspace members can update compliance records" ON "public"."compliance_records" FOR UPDATE USING (("workspace_id" IN ( SELECT "votum_users"."workspace_id"
   FROM "public"."votum_users"
  WHERE ("votum_users"."id" = "auth"."uid"()))));



CREATE POLICY "workspace members manage intake_forms" ON "public"."intake_forms" USING (("workspace_id" IN ( SELECT "votum_users"."workspace_id"
   FROM "public"."votum_users"
  WHERE ("votum_users"."id" = "auth"."uid"()))));



CREATE POLICY "workspace members read submissions" ON "public"."intake_submissions" FOR SELECT USING (("form_id" IN ( SELECT "intake_forms"."id"
   FROM "public"."intake_forms"
  WHERE ("intake_forms"."workspace_id" IN ( SELECT "votum_users"."workspace_id"
           FROM "public"."votum_users"
          WHERE ("votum_users"."id" = "auth"."uid"()))))));



CREATE POLICY "workspace_members_can_access_playbook_clauses" ON "public"."playbook_clauses" USING (("workspace_id" IN ( SELECT "playbook_clauses"."workspace_id"
   FROM "public"."votum_team_members"
  WHERE ("votum_team_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "workspace_members_can_access_playbooks" ON "public"."playbooks" USING (("workspace_id" IN ( SELECT "playbooks"."workspace_id"
   FROM "public"."votum_team_members"
  WHERE ("votum_team_members"."user_id" = "auth"."uid"()))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."legal_review";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."legal_summary_sessions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."task_sessions";









REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





















































































































































































































GRANT ALL ON TABLE "public"."keyword_alert_task_queue" TO "anon";
GRANT ALL ON TABLE "public"."keyword_alert_task_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."keyword_alert_task_queue" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."keyword_alert_task_queue" TO PUBLIC;



GRANT ALL ON FUNCTION "public"."claim_keyword_tasks"("p_run_id" "uuid", "p_worker_id" "text", "p_batch_size" integer, "p_court_types" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."claim_keyword_tasks"("p_run_id" "uuid", "p_worker_id" "text", "p_batch_size" integer, "p_court_types" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_keyword_tasks"("p_run_id" "uuid", "p_worker_id" "text", "p_batch_size" integer, "p_court_types" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_task_queue_progress"("p_run_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_task_queue_progress"("p_run_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_task_queue_progress"("p_run_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_votum_clauses_bm25"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_votum_clauses_bm25"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_votum_clauses_bm25"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_votum_clauses_ts_rank"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_votum_clauses_ts_rank"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_votum_clauses_ts_rank"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_votum_templates_bm25"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_votum_templates_bm25"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_votum_templates_bm25"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_votum_templates_ts_rank"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_votum_templates_ts_rank"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_votum_templates_ts_rank"("p_workspace_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."timeout_stale_tasks"("p_run_id" "uuid", "p_timeout_mins" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."timeout_stale_tasks"("p_run_id" "uuid", "p_timeout_mins" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."timeout_stale_tasks"("p_run_id" "uuid", "p_timeout_mins" integer) TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_messages" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."whatsapp_messages" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."whatsapp_messages" TO "service_role";



REVOKE ALL ON FUNCTION "public"."votum_tasks_delete_fn"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."votum_tasks_delete_fn"() TO "supabase_admin";

































GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."api_usage_tracking" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."api_usage_tracking" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."api_usage_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."arbitration_sessions" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."arbitration_sessions" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."arbitration_sessions" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."automation_presets" TO PUBLIC;
GRANT ALL ON TABLE "public"."automation_presets" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."automation_presets" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."automation_presets_hierarchy" TO PUBLIC;
GRANT ALL ON TABLE "public"."automation_presets_hierarchy" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."automation_presets_hierarchy" TO "authenticated";



GRANT ALL ON TABLE "public"."calendar_event_mappings" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."calendar_event_mappings" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."calendar_event_mappings" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."case_activity_events" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."case_activity_events" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."case_activity_events" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."case_activity_notifications" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."case_activity_notifications" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."case_activity_notifications" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."case_repository" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."case_repository" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."case_repository" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_cases" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_cases" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_cases" TO "authenticated";



GRANT USAGE,UPDATE ON SEQUENCE "public"."cases_case_id_seq" TO PUBLIC;



GRANT ALL ON TABLE "public"."cause_list_entries" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."cause_list_entries" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."cause_list_entries" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."chat_messages" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."chat_sessions" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."chat_sessions" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."chat_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."clm_approval_actions" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_approval_actions" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_approval_actions" TO "service_role";



GRANT ALL ON TABLE "public"."clm_audit_log" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_audit_log" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."clm_contract_files" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_contract_files" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_contract_files" TO "service_role";



GRANT ALL ON TABLE "public"."clm_contract_versions" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_contract_versions" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_contract_versions" TO "service_role";



GRANT ALL ON TABLE "public"."clm_contracts" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_contracts" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_contracts" TO "service_role";



GRANT ALL ON TABLE "public"."clm_notifications" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_notifications" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."clm_signature_envelopes" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_signature_envelopes" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_signature_envelopes" TO "service_role";



GRANT ALL ON TABLE "public"."clm_signature_events" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_signature_events" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_signature_events" TO "service_role";



GRANT ALL ON TABLE "public"."clm_sla_events" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_sla_events" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_sla_events" TO "service_role";



GRANT ALL ON TABLE "public"."clm_wopi_sessions" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_wopi_sessions" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_wopi_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."clm_workflow_rules" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_workflow_rules" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_workflow_rules" TO "service_role";



GRANT ALL ON TABLE "public"."clm_workflow_steps" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_workflow_steps" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_workflow_steps" TO "service_role";



GRANT ALL ON TABLE "public"."clm_workflows" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_workflows" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clm_workflows" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_records" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."compliance_records" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."compliance_records" TO "service_role";



GRANT ALL ON TABLE "public"."task_assignees" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."task_assignees" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."task_assignees" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_tasks" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_tasks" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_tasks" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."comprehensive_task_report" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."comprehensive_task_report" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."comprehensive_task_report" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."contact_requests" TO PUBLIC;
GRANT ALL ON TABLE "public"."contact_requests" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."contact_requests" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."contact_requests_id_seq" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."credit_costs" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."credit_costs" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."credit_costs" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."credit_packages" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."credit_packages" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."credit_packages" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."credit_transactions" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."credit_transactions" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."credit_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."cron_job_runs" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."cron_job_runs" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."cron_job_runs" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."daily_api_usage_trends" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."daily_api_usage_trends" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."daily_api_usage_trends" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."delegation_chains" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."delegation_chains" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."delegation_chains" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."delegation_steps" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."delegation_steps" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."delegation_steps" TO "service_role";



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



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_cpgram_records" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_cpgram_records" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_cpgram_records" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_deadline_alerts_sent" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_deadline_alerts_sent" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_deadline_alerts_sent" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_dfl_records" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_dfl_records" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_dfl_records" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_evidence_room_records" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_evidence_room_records" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_evidence_room_records" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_incident_report_records" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_incident_report_records" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_incident_report_records" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_informer_reward_records" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_informer_reward_records" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dggi_informer_reward_records" TO "service_role";



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



GRANT ALL ON TABLE "public"."document_annotations" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."document_annotations" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."document_annotations" TO "service_role";



GRANT ALL ON TABLE "public"."document_folders" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."document_folders" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."document_folders" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."documents" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."drafting_style_profiles" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."drafting_style_profiles" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."drafting_style_profiles" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."drafts" TO PUBLIC;
GRANT ALL ON TABLE "public"."drafts" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."drafts" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."drafts_serial_seq" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."drive_connections" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."drive_connections" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."drive_connections" TO "service_role";



GRANT ALL ON TABLE "public"."drive_import_jobs" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."drive_import_jobs" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."drive_import_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."egazette_compliance_obligations" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."egazette_compliance_obligations" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."egazette_compliance_obligations" TO "service_role";



GRANT ALL ON TABLE "public"."egazette_records" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."egazette_records" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."egazette_records" TO "service_role";



GRANT SELECT ON TABLE "public"."intake_forms" TO "anon";
GRANT ALL ON TABLE "public"."intake_forms" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."intake_forms" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."intake_forms" TO "service_role";



GRANT INSERT ON TABLE "public"."intake_submissions" TO "anon";
GRANT ALL ON TABLE "public"."intake_submissions" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."intake_submissions" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."intake_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."ipr_clearance_searches" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ipr_clearance_searches" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ipr_clearance_searches" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ipr_matters" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ipr_matters" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ipr_matters" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ipr_watch_hits" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ipr_watch_hits" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ipr_watch_hits" TO "service_role";



GRANT ALL ON TABLE "public"."keyword_alert_matches" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."keyword_alert_matches" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."keyword_alert_matches" TO "service_role";



GRANT ALL ON TABLE "public"."keyword_alert_runs" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."keyword_alert_runs" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."keyword_alert_runs" TO "service_role";



GRANT ALL ON TABLE "public"."keyword_alert_subscriptions" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."keyword_alert_subscriptions" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."keyword_alert_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."keyword_alert_task_results" TO "anon";
GRANT ALL ON TABLE "public"."keyword_alert_task_results" TO "authenticated";
GRANT ALL ON TABLE "public"."keyword_alert_task_results" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."keyword_alert_task_results" TO PUBLIC;



GRANT ALL ON TABLE "public"."keyword_alert_task_subs" TO "anon";
GRANT ALL ON TABLE "public"."keyword_alert_task_subs" TO "authenticated";
GRANT ALL ON TABLE "public"."keyword_alert_task_subs" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."keyword_alert_task_subs" TO PUBLIC;



GRANT ALL ON TABLE "public"."legal_review" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."legal_review" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."legal_review" TO "service_role";



GRANT ALL ON TABLE "public"."legal_summary_cache" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."legal_summary_cache" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."legal_summary_cache" TO "service_role";



GRANT ALL ON TABLE "public"."legal_summary_sessions" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."legal_summary_sessions" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."legal_summary_sessions" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_users" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_users" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_users" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_workspace" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_workspace" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_workspace" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."monthly_user_api_usage" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."monthly_user_api_usage" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."monthly_user_api_usage" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."monthly_workspace_api_usage" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."monthly_workspace_api_usage" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."monthly_workspace_api_usage" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."task_documents" TO PUBLIC;
GRANT ALL ON TABLE "public"."task_documents" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."task_documents" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."ocr_documents_metadata_id_seq" TO PUBLIC;



GRANT ALL ON TABLE "public"."org_units" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."org_units" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."org_units" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."outlook_calendar_mappings" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."outlook_calendar_mappings" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."outlook_calendar_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."outreach_leads" TO "anon";
GRANT ALL ON TABLE "public"."outreach_leads" TO "authenticated";
GRANT ALL ON TABLE "public"."outreach_leads" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."outreach_leads" TO PUBLIC;



GRANT SELECT,USAGE ON SEQUENCE "public"."outreach_leads_id_seq" TO "anon";
GRANT SELECT,USAGE ON SEQUENCE "public"."outreach_leads_id_seq" TO "authenticated";
GRANT SELECT,USAGE ON SEQUENCE "public"."outreach_leads_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."outreach_sequence_log" TO "anon";
GRANT ALL ON TABLE "public"."outreach_sequence_log" TO "authenticated";
GRANT ALL ON TABLE "public"."outreach_sequence_log" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."outreach_sequence_log" TO PUBLIC;



GRANT SELECT,USAGE ON SEQUENCE "public"."outreach_sequence_log_id_seq" TO "anon";
GRANT SELECT,USAGE ON SEQUENCE "public"."outreach_sequence_log_id_seq" TO "authenticated";
GRANT SELECT,USAGE ON SEQUENCE "public"."outreach_sequence_log_id_seq" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_task_ownership_periods" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_task_ownership_periods" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_task_ownership_periods" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ownership_performance_analysis" TO "authenticated";
GRANT SELECT ON TABLE "public"."ownership_performance_analysis" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ownership_performance_analysis" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ownership_performance_analysis" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."pdf_delivery_logs" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."pdf_delivery_logs" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."pdf_delivery_logs" TO "service_role";



GRANT ALL ON TABLE "public"."pdf_ink_strokes" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."pdf_ink_strokes" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."pdf_ink_strokes" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."playbook_clauses" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."playbook_clauses" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."playbook_clauses" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."playbooks" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."playbooks" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."playbooks" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."police_fir_co_remarks" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."police_fir_co_remarks" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."police_fir_co_remarks" TO "service_role";



GRANT ALL ON TABLE "public"."police_firs" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."police_firs" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."police_firs" TO "service_role";



GRANT ALL ON TABLE "public"."police_firs_with_urgency" TO PUBLIC;



GRANT ALL ON TABLE "public"."police_office_files" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."police_office_files" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."police_office_files" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."pst_jobs" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."pst_jobs" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."pst_jobs" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."razorpay_transactions" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."razorpay_transactions" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."razorpay_transactions" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_audit_logs" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_audit_logs" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_audit_logs" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_clients" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_clients" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_clients" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."recent_activity" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."recent_activity" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."recent_activity" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."scraper_health_states" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."scraper_health_states" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."scraper_health_states" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."scraper_runs" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."scraper_runs" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."scraper_runs" TO PUBLIC;



GRANT ALL ON TABLE "public"."stack_clauses" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."stack_clauses" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."stack_clauses" TO "service_role";



GRANT ALL ON TABLE "public"."stack_documents" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."stack_documents" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."stack_documents" TO "service_role";



GRANT ALL ON TABLE "public"."stacks" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."stacks" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."stacks" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."task_ownership_summary" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."task_ownership_summary" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."task_ownership_summary" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."task_sessions" TO PUBLIC;
GRANT ALL ON TABLE "public"."task_sessions" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."task_sessions" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."task_templates" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."task_templates" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."task_templates" TO "service_role";



GRANT ALL ON TABLE "public"."timeline_extractions" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."timeline_extractions" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."timeline_extractions" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_credits" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_credits" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_credits" TO "service_role";



GRANT ALL ON TABLE "public"."user_postings" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_postings" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_postings" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_approval_workflow_steps" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_approval_workflow_steps" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_approval_workflow_steps" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_approval_workflows" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_approval_workflows" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_approval_workflows" TO "authenticated";



GRANT ALL ON TABLE "public"."votum_case_custom_fields" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_case_custom_fields" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_case_custom_fields" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_clauses" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_clauses" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_clauses" TO "service_role";



GRANT ALL ON TABLE "public"."votum_client_contacts" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_client_contacts" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_client_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."votum_clients_with_contacts" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_clients_with_contacts" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_clients_with_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."votum_comments" TO "anon";
GRANT ALL ON TABLE "public"."votum_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."votum_comments" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_comments" TO PUBLIC;



GRANT USAGE ON SEQUENCE "public"."votum_comments_id_seq" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_email_accounts" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_email_accounts" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_email_accounts" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_emails" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_emails" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_emails" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_events" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_events" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_events" TO "authenticated";



GRANT INSERT,UPDATE ON TABLE "public"."votum_fcm_tokens" TO "anon";
GRANT ALL ON TABLE "public"."votum_fcm_tokens" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_fcm_tokens" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_fcm_tokens" TO "service_role";



GRANT ALL ON SEQUENCE "public"."votum_fcm_tokens_id_seq" TO "authenticated";
GRANT USAGE ON SEQUENCE "public"."votum_fcm_tokens_id_seq" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_invoice" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_invoice" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_invoice" TO "authenticated";



GRANT ALL ON TABLE "public"."votum_invoice_reminders" TO "authenticated";
GRANT ALL ON TABLE "public"."votum_invoice_reminders" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_invoice_reminders" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_notes" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_notes" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_notes" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_notifications" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_notifications" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_notifications" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_passkey_challenges" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_passkey_challenges" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_passkey_challenges" TO "authenticated";



GRANT SELECT,USAGE ON SEQUENCE "public"."votum_passkey_challenges_serial_number_seq" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_passkeys" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_passkeys" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_passkeys" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_suggested_tasks" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_suggested_tasks" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_suggested_tasks" TO "authenticated";



GRANT ALL ON TABLE "public"."votum_summary" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_summary" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_summary" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."votum_summary_id_seq" TO PUBLIC;



GRANT ALL ON TABLE "public"."votum_task_custom_field_templates" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_task_custom_field_templates" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_task_custom_field_templates" TO "service_role";



GRANT ALL ON TABLE "public"."votum_task_followups" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_task_followups" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_task_followups" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_task_reviews" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_task_reviews" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_task_reviews" TO "authenticated";



GRANT SELECT,USAGE ON SEQUENCE "public"."votum_task_reviews_id_seq" TO "anon";
GRANT USAGE ON SEQUENCE "public"."votum_task_reviews_id_seq" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_team_members" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_team_members" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_team_members" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_teams" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_teams" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_teams" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_templates" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_templates" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_templates" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."votum_templates_id_seq" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_time_entries" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_time_entries" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_time_entries" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_transcripts" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_transcripts" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_transcripts" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_translations" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_translations" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_translations" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_translators" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_translators" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_translators" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_user_events" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_user_events" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."votum_user_events" TO "authenticated";



GRANT ALL ON TABLE "public"."votum_user_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."votum_user_tokens" TO PUBLIC;
GRANT ALL ON TABLE "public"."votum_user_tokens" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_task_delegation_sync_status" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_task_delegation_sync_status" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_task_delegation_sync_status" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_task_workflow_status" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_task_workflow_status" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_task_workflow_status" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_user_delegations" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_user_delegations" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_user_delegations" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."wopi_locks" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."wopi_locks" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."wopi_locks" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."worker_proxy_ips" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."worker_proxy_ips" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."worker_proxy_ips" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_bottleneck_analysis" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."workspace_bottleneck_analysis" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."workspace_bottleneck_analysis" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."workspace_credit_config" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."workspace_credit_config" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."workspace_credit_config" TO "service_role";


































