#!/usr/bin/env python3
"""
One-shot fix: reopen NIR-052-26-27.

What happened:
  The record was edited via NonIRRegisterComponent's plain register-edit
  dialog (saveEdit in NonIRRegisterComponent.tsx), which writes closure_by
  directly to dggi_records. That component has no "Convert to IR" flow —
  only DGGIComponent does (it opens a linked IR form and only closes the
  source after the new IR record is saved, see saveEdit in
  DGGIComponent.tsx). So the NIR got closure_by = "Convert to IR" with no
  actual IR record ever created (no dggi_records row with
  converted_from_non_ir = 'NIR-052-26-27', no dggi_closure_records row for
  it either) — closed by mistake, conversion never happened.

Fix: clear closure_by on the source row. Nothing else was written (no
closure_records entry, no converted IR record), so nothing else to revert.

Usage:
    python3 scripts/fix_nir052_reopen.py [--dry-run]
"""
import os
import sys

from supabase import create_client

RECORD_ID = "NIR-052-26-27"


def load_env():
    env = {}
    for fname in (".env.local", ".env"):
        path = os.path.join(os.path.dirname(__file__), "..", fname)
        if not os.path.exists(path):
            continue
        with open(path) as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                env.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    return env


def main():
    dry_run = "--dry-run" in sys.argv
    if dry_run:
        print("*** DRY RUN — no changes will be written ***\n")

    env = load_env()
    sb = create_client(
        env["NEXT_PUBLIC_SUPABASE_URL"],
        env.get("SUPABASE_SERVICE_ROLE_KEY") or env["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    )

    rows = (
        sb.table("dggi_records")
        .select("id,record_id,is_ir,closure_by,due_date,converted_from_non_ir,deleted_at")
        .eq("record_id", RECORD_ID)
        .execute()
        .data
    )
    if not rows:
        print(f"No row found for record_id={RECORD_ID!r} — nothing to fix.")
        return
    record = rows[0]
    print("Before:", record)

    if record["closure_by"] != "Convert to IR":
        print(f"closure_by is {record['closure_by']!r}, not 'Convert to IR' — refusing to touch, check manually.")
        return

    # Safety check: bail if an IR record actually references this NIR as its
    # source, or a closure_records entry exists — then this isn't a clean
    # "closed but never converted" case and needs manual handling instead.
    linked_ir = (
        sb.table("dggi_records")
        .select("id,record_id")
        .eq("converted_from_non_ir", RECORD_ID)
        .execute()
        .data
    )
    closure_entry = (
        sb.table("dggi_closure_records")
        .select("id,record_id")
        .eq("source_record_id", RECORD_ID)
        .execute()
        .data
    )
    if linked_ir or closure_entry:
        print(f"Found linked IR record(s) {linked_ir} and/or closure entry {closure_entry} — this NIR WAS converted. Not touching it.")
        return

    if dry_run:
        print(f"\nWould set closure_by = NULL on {RECORD_ID} (id={record['id']})")
    else:
        sb.table("dggi_records").update({"closure_by": None}).eq("id", record["id"]).execute()
        after = (
            sb.table("dggi_records")
            .select("id,record_id,is_ir,closure_by,due_date")
            .eq("id", record["id"])
            .execute()
            .data
        )
        print("After: ", after[0])

    print("\nDry run complete — no data written." if dry_run else "\nDone.")


if __name__ == "__main__":
    main()
