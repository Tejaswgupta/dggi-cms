#!/usr/bin/env python3
"""
Extract dggi_* tables and their FK-linked tables from dump.sql into dggi_extract.sql.

Linked tables (referenced via FK from dggi_* tables):
  - public.votum_users
  - public.designations
  - public.votum_workspace  (referenced by workspace_id columns in dggi_ tables)

For each included table this script extracts:
  - CREATE TABLE statement
  - Primary key / unique constraints (ALTER TABLE ... ADD CONSTRAINT)
  - Foreign key constraints (ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY)
  - Indexes (CREATE INDEX / CREATE UNIQUE INDEX)
  - Triggers (CREATE TRIGGER)
  - Functions / procedures used only by dggi (CREATE OR REPLACE FUNCTION dggi_*)
  - RLS enable statements (ALTER TABLE ... ENABLE ROW LEVEL SECURITY)
  - Policies (CREATE POLICY)
  - GRANT statements for these tables
"""

import re
import sys
from pathlib import Path

DUMP = Path(__file__).parent / "dump.sql"
OUT  = Path(__file__).parent / "dggi_extract.sql"

# Tables to include: all dggi_* plus FK-linked tables
DGGI_PREFIX  = "dggi_"
LINKED_TABLES = {"votum_users", "designations", "votum_workspace"}


def table_names_from_dump(text: str) -> list[str]:
    """Collect all table names that start with dggi_ from the dump."""
    pattern = re.compile(
        r'CREATE TABLE IF NOT EXISTS "public"\."(dggi_[^"]+)"', re.IGNORECASE
    )
    return pattern.findall(text)


def block_for_create_table(text: str, table: str) -> str:
    """Extract the full CREATE TABLE ... ; block for a given table name."""
    # Match from CREATE TABLE to the closing semicolon
    pattern = re.compile(
        rf'(CREATE TABLE IF NOT EXISTS "public"\."{re.escape(table)}".*?;)',
        re.DOTALL | re.IGNORECASE,
    )
    m = pattern.search(text)
    return m.group(1).strip() if m else ""


def blocks_matching(text: str, pattern: re.Pattern) -> list[str]:
    return [m.group(0).strip() for m in pattern.finditer(text)]


def main() -> None:
    raw = DUMP.read_text(encoding="utf-8")

    dggi_tables = table_names_from_dump(raw)
    all_tables  = sorted(set(dggi_tables) | LINKED_TABLES)

    print(f"Found {len(dggi_tables)} dggi_* tables + {len(LINKED_TABLES)} linked tables")

    sections: list[str] = []

    # ── Header ────────────────────────────────────────────────────────────────
    sections.append(
        "-- ================================================================\n"
        "-- DGGI extract: dggi_* tables + FK-linked tables\n"
        "-- Generated from dump.sql\n"
        "-- ================================================================\n"
        "\n"
        "SET statement_timeout = 0;\n"
        "SET lock_timeout = 0;\n"
        "SET client_encoding = 'UTF8';\n"
        "SET standard_conforming_strings = on;\n"
        "SELECT pg_catalog.set_config('search_path', '', false);\n"
        "SET check_function_bodies = false;\n"
        "SET row_security = off;\n"
    )

    # ── dggi_* functions ───────────────────────────────────────────────────────
    fn_pattern = re.compile(
        r'(CREATE OR REPLACE FUNCTION "public"\."dggi_[^"]*".*?'
        r'ALTER FUNCTION "public"\."dggi_[^"]*".*?;)',
        re.DOTALL,
    )
    fn_blocks = blocks_matching(raw, fn_pattern)
    if fn_blocks:
        sections.append("\n-- ── DGGI functions ──────────────────────────────────────────────────────")
        sections.extend(fn_blocks)

    # ── CREATE TABLE ──────────────────────────────────────────────────────────
    sections.append("\n-- ── Table definitions ───────────────────────────────────────────────────")
    for table in all_tables:
        block = block_for_create_table(raw, table)
        if block:
            sections.append(f"\n-- Table: {table}")
            sections.append(block)
        else:
            print(f"  WARNING: no CREATE TABLE found for {table}", file=sys.stderr)

    # ── Constraints (PK, unique, FK) ─────────────────────────────────────────
    sections.append("\n-- ── Constraints ─────────────────────────────────────────────────────────")
    for table in all_tables:
        # ALTER TABLE "public"."<table>" ADD CONSTRAINT ...;
        constraint_pattern = re.compile(
            rf'(ALTER TABLE ONLY "public"\."{re.escape(table)}"'
            rf'\s+ADD CONSTRAINT\s+.*?;)',
            re.DOTALL | re.IGNORECASE,
        )
        for block in blocks_matching(raw, constraint_pattern):
            sections.append(block)

    # ── Indexes ───────────────────────────────────────────────────────────────
    sections.append("\n-- ── Indexes ─────────────────────────────────────────────────────────────")
    for table in all_tables:
        idx_pattern = re.compile(
            rf'(CREATE (?:UNIQUE )?INDEX\s+"[^"]*"\s+ON\s+"public"\."{re.escape(table)}"[^;]+;)',
            re.DOTALL | re.IGNORECASE,
        )
        for block in blocks_matching(raw, idx_pattern):
            sections.append(block)

    # ── Triggers ──────────────────────────────────────────────────────────────
    sections.append("\n-- ── Triggers ────────────────────────────────────────────────────────────")
    for table in all_tables:
        trig_pattern = re.compile(
            rf'(CREATE (?:OR REPLACE )?TRIGGER\s+"[^"]*"\s+[^;]+ON\s+"public"\."{re.escape(table)}"[^;]+;)',
            re.DOTALL | re.IGNORECASE,
        )
        for block in blocks_matching(raw, trig_pattern):
            sections.append(block)

    # ── RLS ───────────────────────────────────────────────────────────────────
    sections.append("\n-- ── Row Level Security ──────────────────────────────────────────────────")
    for table in all_tables:
        rls_pattern = re.compile(
            rf'(ALTER TABLE "public"\."{re.escape(table)}"\s+ENABLE ROW LEVEL SECURITY;)',
            re.IGNORECASE,
        )
        for block in blocks_matching(raw, rls_pattern):
            sections.append(block)

        policy_pattern = re.compile(
            rf'(CREATE POLICY\s+"[^"]*"\s+ON\s+"public"\."{re.escape(table)}"[^;]+;)',
            re.DOTALL | re.IGNORECASE,
        )
        for block in blocks_matching(raw, policy_pattern):
            sections.append(block)

    # ── Grants ────────────────────────────────────────────────────────────────
    sections.append("\n-- ── Grants ──────────────────────────────────────────────────────────────")
    for table in all_tables:
        grant_pattern = re.compile(
            rf'(GRANT\s+[^;]+ON\s+(?:TABLE\s+)?"public"\."{re.escape(table)}"\s+TO\s+[^;]+;)',
            re.DOTALL | re.IGNORECASE,
        )
        for block in blocks_matching(raw, grant_pattern):
            sections.append(block)

    output = "\n\n".join(s for s in sections if s.strip()) + "\n"
    OUT.write_text(output, encoding="utf-8")

    line_count = output.count("\n")
    print(f"Written {OUT.name}  ({line_count} lines)")


if __name__ == "__main__":
    main()
