-- Migration: fix missing service_role grant on dggi_seizure_records
-- (original creation migration only granted to authenticated)

GRANT ALL ON TABLE "public"."dggi_seizure_records" TO PUBLIC;
GRANT SELECT, INSERT, DELETE, UPDATE ON TABLE "public"."dggi_seizure_records" TO "service_role";
