"""
Backfill record_id for dggi_records that have NULL record_id.

Naming conventions:
  IR cases    → "{seq}/GST/{YYYY-YYYY+1}"  e.g. "001/GST/2026-27"
  NON-IR cases → "NIR-{seq}-{YY-YY}"       e.g. "NIR-001-26-27"

Assigns IDs based on creation order within each workspace + is_ir type.

Usage:
    python3 scripts/backfill_record_ids.py [--dry-run]
"""

import sys
from datetime import datetime
from supabase import create_client

SUPABASE_URL = "https://zrkvvedwycdcjjheewef.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpya3Z2ZWR3eWNkY2pqaGVld2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMzAxNjg1NCwiZXhwIjoyMDE4NTkyODU0fQ.ZYgzzv6E--3v2un2uN0jXwHnBvCf0EjPJlGoCQwiqKE"

WORKSPACE_OWNER_EMAIL = "ajinkya@gov.in"


def current_fy_short() -> str:
    now = datetime.now()
    start = now.year if now.month >= 4 else now.year - 1
    return f"{str(start)[2:]}-{str(start + 1)[2:]}"


def current_fy_full() -> str:
    now = datetime.now()
    start = now.year if now.month >= 4 else now.year - 1
    return f"{start}-{str(start + 1)[2:]}"


def make_record_id(is_ir: bool, seq: int) -> str:
    if is_ir:
        return f"{seq:03d}/GST/{current_fy_full()}"
    return f"NIR-{seq:03d}-{current_fy_short()}"


def parse_seq(rid: str, is_ir: bool) -> int | None:
    """Extract the sequence number from an existing record_id."""
    try:
        if is_ir:
            # Format: "001/GST/2026-27"
            return int(rid.split("/")[0])
        else:
            # Format: "NIR-001-26-27"
            return int(rid.split("-")[1])
    except (IndexError, ValueError):
        return None


def main():
    dry_run = "--dry-run" in sys.argv
    if dry_run:
        print("*** DRY RUN — no changes will be written ***\n")

    sb = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    res = sb.table("votum_users").select("workspace_id").eq("email", WORKSPACE_OWNER_EMAIL).limit(1).execute()
    if not res.data:
        raise SystemExit(f"No user found for {WORKSPACE_OWNER_EMAIL}")
    workspace_id = res.data[0]["workspace_id"]
    print(f"Workspace: {workspace_id}\n")

    for is_ir, label in [(True, "IR"), (False, "NON-IR")]:
        print(f"── {label} records ──")

        # Find highest existing sequence number across all records with a record_id
        existing = (
            sb.table("dggi_records")
            .select("record_id")
            .eq("workspace_id", workspace_id)
            .eq("is_ir", is_ir)
            .execute()
        )
        max_seq = 0
        for rec in existing.data:
            rid = rec.get("record_id")
            if rid:
                seq = parse_seq(rid, is_ir)
                if seq:
                    max_seq = max(max_seq, seq)
        print(f"  Highest existing sequence: {max_seq}")

        # Fetch all NULL record_id records, ordered by created_at
        null_records = (
            sb.table("dggi_records")
            .select("id,taxpayer_name,file_no,created_at")
            .eq("workspace_id", workspace_id)
            .eq("is_ir", is_ir)
            .is_("record_id", None)
            .order("created_at")
            .execute()
        )

        if not null_records.data:
            print(f"  No NULL record_id rows found.\n")
            continue

        first = make_record_id(is_ir, max_seq + 1)
        last = make_record_id(is_ir, max_seq + len(null_records.data))
        print(f"  Found {len(null_records.data)} rows — assigning {first} through {last}\n")

        for i, rec in enumerate(null_records.data, start=1):
            new_record_id = make_record_id(is_ir, max_seq + i)
            taxpayer = (rec.get("taxpayer_name") or "")[:35]
            file_no = (rec.get("file_no") or "")[:20]
            if dry_run:
                print(f"    [DRY] {file_no:20s} | {taxpayer:35s} → {new_record_id}")
            else:
                sb.table("dggi_records").update({"record_id": new_record_id}).eq("id", rec["id"]).execute()
                print(f"    ✓ {new_record_id} | {taxpayer}")

        print()

    print("Dry run complete — no data written." if dry_run else "Done.")


if __name__ == "__main__":
    main()
