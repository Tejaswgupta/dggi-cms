-- Migration: add date_of_scn_issuance to dggi_seizure_records

ALTER TABLE "public"."dggi_seizure_records"
    ADD COLUMN "date_of_scn_issuance" date;
