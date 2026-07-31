-- Rename date_of_arrest to date_of_prosecution_sanction_order in non-arrest prosecution records
ALTER TABLE "public"."dggi_prosecution_non_arrest_records"
  RENAME COLUMN "date_of_arrest" TO "date_of_prosecution_sanction_order";
