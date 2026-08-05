"""
One-shot fix for the rogue IR sequence row.

What happened:
  - record_id_sequences has TWO IR rows for the same workspace:
      prefix='IR', fy='2026-27'  next_val=93  ← correct (matches app's currentFYFull)
      prefix='IR', fy='26-27'    next_val=2   ← rogue (app hit this once, issued seq 1)
  - The rogue row issued exactly one record_id: '001/GST/2026-27'
    (seq=1, formatted as padStart(3,'0') + '/GST/' + fy used by the caller)
    BUT the caller passed fy='26-27' to next_seq_val, while the record_id
    was built with currentFYFull()='2026-27', so the stored record_id is
    still '001/GST/2026-27' — the correct format, just the wrong sequence slot.

This script:
  1. Finds the record with record_id = '001/GST/2026-27'
  2. Calls next_seq_val(IR, 2026-27) to get the correct next number from the
     proper sequence row (currently at 93, will return 93 and bump to 94)
  3. Updates that record's record_id to '093/GST/2026-27'
  4. Deletes the rogue fy='26-27' IR row from record_id_sequences

Usage:
    python3 scripts/fix_ir_rogue_sequence.py [--dry-run]
"""

import os
import sys

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_ROLE_KEY = os.environ["SERVICE_ROLE_KEY"]

WORKSPACE_OWNER_EMAIL = "ajinkya.k1@gov.in"
ROGUE_RECORD_ID = "001/GST/2026-27"


def main():
    dry_run = "--dry-run" in sys.argv
    if dry_run:
        print("*** DRY RUN — no changes will be written ***\n")

    sb = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    # Resolve workspace
    res = sb.table("votum_users").select("workspace_id").eq("email", WORKSPACE_OWNER_EMAIL).limit(1).execute()
    if not res.data:
        raise SystemExit(f"No user found for {WORKSPACE_OWNER_EMAIL}")
    workspace_id = res.data[0]["workspace_id"]
    print(f"Workspace: {workspace_id}\n")

    # 1. Find the rogue record
    res = (
        sb.table("dggi_records")
        .select("id, record_id, taxpayer_name, created_at")
        .eq("workspace_id", workspace_id)
        .eq("record_id", ROGUE_RECORD_ID)
        .execute()
    )
    if not res.data:
        print(f"No record found with record_id={ROGUE_RECORD_ID!r} — nothing to fix.")
    else:
        record = res.data[0]
        print(f"Found rogue record:")
        print(f"  id            : {record['id']}")
        print(f"  record_id     : {record['record_id']}")
        print(f"  taxpayer_name : {record['taxpayer_name']}")
        print(f"  created_at    : {record['created_at']}")

        # 2. Consume next seq from the correct row (IR / 2026-27)
        if dry_run:
            # Peek without consuming — just read current next_val
            seq_res = (
                sb.table("record_id_sequences")
                .select("next_val")
                .eq("workspace_id", workspace_id)
                .eq("prefix", "IR")
                .eq("fy", "2026-27")
                .limit(1)
                .execute()
            )
            next_num = seq_res.data[0]["next_val"] if seq_res.data else "?"
            new_record_id = f"{str(next_num).zfill(3)}/GST/2026-27"
            print(f"\n  Would reassign record_id: {ROGUE_RECORD_ID!r} → {new_record_id!r}")
        else:
            rpc_res = sb.rpc("next_seq_val", {
                "p_workspace_id": workspace_id,
                "p_prefix": "IR",
                "p_fy": "2026-27",
            }).execute()
            next_num = rpc_res.data
            new_record_id = f"{str(next_num).zfill(3)}/GST/2026-27"
            sb.table("dggi_records").update({"record_id": new_record_id}).eq("id", record["id"]).execute()
            print(f"\n  Reassigned record_id: {ROGUE_RECORD_ID!r} → {new_record_id!r}")

    # 3. Delete the rogue sequence row
    rogue_seq_res = (
        sb.table("record_id_sequences")
        .select("prefix, fy, next_val")
        .eq("workspace_id", workspace_id)
        .eq("prefix", "IR")
        .eq("fy", "26-27")
        .execute()
    )
    if not rogue_seq_res.data:
        print("\nRogue sequence row (IR / 26-27) not found — already cleaned up.")
    else:
        row = rogue_seq_res.data[0]
        print(f"\nRogue sequence row: prefix={row['prefix']!r}, fy={row['fy']!r}, next_val={row['next_val']}")
        if dry_run:
            print("  Would DELETE this row.")
        else:
            sb.table("record_id_sequences").delete() \
                .eq("workspace_id", workspace_id) \
                .eq("prefix", "IR") \
                .eq("fy", "26-27") \
                .execute()
            print("  DELETED rogue sequence row.")

    print("\nDry run complete — no data written." if dry_run else "\nDone.")


if __name__ == "__main__":
    main()
