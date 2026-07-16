-- Migration: Convert pr_adg_comments from text to jsonb in dggi_records and dggi_closure_records safely, and drop pr_adg_comments_updated_at

-- 1. Convert dggi_records
ALTER TABLE "public"."dggi_records" 
  ALTER COLUMN "pr_adg_comments" TYPE jsonb 
  USING (
    CASE 
      WHEN pr_adg_comments IS NULL THEN NULL
      WHEN trim(pr_adg_comments) = '' THEN '[]'::jsonb
      WHEN trim(pr_adg_comments) LIKE '[%' THEN pr_adg_comments::jsonb
      ELSE jsonb_build_array(jsonb_build_object('text', pr_adg_comments, 'timestamp', COALESCE(pr_adg_comments_updated_at, now())::text))
    END
  );

-- 2. Convert dggi_closure_records (does not have pr_adg_comments_updated_at)
ALTER TABLE "public"."dggi_closure_records" 
  ALTER COLUMN "pr_adg_comments" TYPE jsonb 
  USING (
    CASE 
      WHEN pr_adg_comments IS NULL THEN NULL
      WHEN trim(pr_adg_comments) = '' THEN '[]'::jsonb
      WHEN trim(pr_adg_comments) LIKE '[%' THEN pr_adg_comments::jsonb
      ELSE jsonb_build_array(jsonb_build_object('text', pr_adg_comments, 'timestamp', now()::text))
    END
  );

-- 3. Drop pr_adg_comments_updated_at from dggi_records
ALTER TABLE "public"."dggi_records" DROP COLUMN IF EXISTS "pr_adg_comments_updated_at";
