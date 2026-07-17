import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zrkvvedwycdcjjheewef.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpya3Z2ZWR3eWNkY2pqaGVld2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMzAxNjg1NCwiZXhwIjoyMDE4NTkyODU0fQ.ZYgzzv6E--3v2un2uN0jXwHnBvCf0EjPJlGoCQwiqKE";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── Helpers ──────────────────────────────────────────────────────────────────

function pass(msg) { console.log("  ✓", msg); }
function fail(msg) { console.error("  ✗", msg); process.exitCode = 1; }
function section(title) { console.log(`\n${"─".repeat(60)}\n${title}\n${"─".repeat(60)}`); }

// ── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  section("1 · Fetch open cases with a handling_io_sio assigned");
  const { data: cases, error: casesErr } = await supabase
    .from("dggi_records")
    .select("id, record_id, taxpayer_name, handling_io_sio, handling_io_sio_name, group, closure_by")
    .is("closure_by", null)
    .not("handling_io_sio", "is", null)
    .order("created_at", { ascending: false })
    .limit(10);

  if (casesErr) { fail("Fetch cases: " + casesErr.message); return; }
  if (!cases?.length) { fail("No open cases with an SIO assigned found — nothing to test"); return; }
  pass(`Found ${cases.length} open case(s)`);
  console.log("  Sample:", cases.slice(0, 3).map(c => `${c.record_id} → ${c.handling_io_sio_name}`).join(" | "));

  section("2 · Fetch SIO users");
  const { data: users, error: usersErr } = await supabase
    .from("votum_users")
    .select("id, name, email, dggi_role")
    .eq("dggi_role", "SIO");

  if (usersErr) { fail("Fetch users: " + usersErr.message); return; }
  if (!users?.length) { fail("No SIO users found"); return; }
  pass(`Found ${users.length} SIO user(s): ${users.map(u => u.name || u.email).join(", ")}`);

  // Pick a test case and a "to" user that is different from the current SIO
  const testCase = cases[0];
  const toUser = users.find((u) => u.id !== testCase.handling_io_sio);
  if (!toUser) { fail("Need at least 2 SIO users to test transfer"); return; }

  const originalSioId = testCase.handling_io_sio;
  const originalSioName = testCase.handling_io_sio_name;
  const toId = toUser.id;
  const toName = toUser.name || toUser.email;
  const caseRecordId = testCase.record_id;

  console.log(`\n  Test case : ${caseRecordId} (${testCase.taxpayer_name})`);
  console.log(`  From SIO  : ${originalSioName} (${originalSioId})`);
  console.log(`  To SIO    : ${toName} (${toId})`);

  // ── Check what linked records exist for this case ─────────────────────────
  section("3 · Audit linked registers before transfer");

  const [scnBefore, arrestBefore, provBefore, prosArrestBefore, prosNonArrestBefore] =
    await Promise.all([
      supabase.from("dggi_scn_records").select("id, record_id, sio").eq("linked_case_id", caseRecordId),
      supabase.from("dggi_arrest_records").select("id, record_id, sio").eq("linked_case_id", caseRecordId),
      supabase.from("dggi_provisional_attachment_records").select("id, record_id, sio").eq("linked_case_id", caseRecordId),
      supabase.from("dggi_prosecution_arrest_records").select("id, record_id, sio").eq("linked_case_id", caseRecordId),
      supabase.from("dggi_prosecution_non_arrest_records").select("id, record_id, sio").eq("linked_case_id", caseRecordId),
    ]);

  console.log(`  SCN records              : ${scnBefore.data?.length ?? 0}`);
  console.log(`  Arrest records           : ${arrestBefore.data?.length ?? 0}`);
  console.log(`  Provisional attachments  : ${provBefore.data?.length ?? 0}`);
  console.log(`  Prosecution (arrest)     : ${prosArrestBefore.data?.length ?? 0}`);
  console.log(`  Prosecution (non-arrest) : ${prosNonArrestBefore.data?.length ?? 0}`);

  // ── Execute the transfer (same logic as singleTransfer() in component) ────
  section("4 · Execute transfer");

  const [caseRes, scnRes, arrestRes, provRes, prosArrestRes, prosNonArrestRes] =
    await Promise.all([
      supabase
        .from("dggi_records")
        .update({ handling_io_sio: toId, handling_io_sio_name: toName })
        .eq("id", testCase.id),
      supabase
        .from("dggi_scn_records")
        .update({ sio: toId, sio_name: toName })
        .eq("linked_case_id", caseRecordId),
      supabase
        .from("dggi_arrest_records")
        .update({ sio: toId, sio_name: toName })
        .eq("linked_case_id", caseRecordId),
      supabase
        .from("dggi_provisional_attachment_records")
        .update({ sio: toId })
        .eq("linked_case_id", caseRecordId),
      supabase
        .from("dggi_prosecution_arrest_records")
        .update({ sio: toId, sio_name: toName })
        .eq("linked_case_id", caseRecordId),
      supabase
        .from("dggi_prosecution_non_arrest_records")
        .update({ sio: toId, sio_name: toName })
        .eq("linked_case_id", caseRecordId),
    ]);

  const errors = [
    caseRes.error && "dggi_records: " + caseRes.error.message,
    scnRes.error && "dggi_scn_records: " + scnRes.error.message,
    arrestRes.error && "dggi_arrest_records: " + arrestRes.error.message,
    provRes.error && "dggi_provisional_attachment_records: " + provRes.error.message,
    prosArrestRes.error && "dggi_prosecution_arrest_records: " + prosArrestRes.error.message,
    prosNonArrestRes.error && "dggi_prosecution_non_arrest_records: " + prosNonArrestRes.error.message,
  ].filter(Boolean);

  if (errors.length) {
    errors.forEach((e) => fail(e));
    return;
  }
  pass("All 6 update calls succeeded without errors");

  // ── Verify the main record was updated ────────────────────────────────────
  section("5 · Verify dggi_records updated");

  const { data: updated, error: verifyErr } = await supabase
    .from("dggi_records")
    .select("handling_io_sio, handling_io_sio_name")
    .eq("id", testCase.id)
    .single();

  if (verifyErr) { fail("Verify fetch: " + verifyErr.message); }
  else if (updated.handling_io_sio !== toId) {
    fail(`handling_io_sio mismatch: expected ${toId}, got ${updated.handling_io_sio}`);
  } else if (updated.handling_io_sio_name !== toName) {
    fail(`handling_io_sio_name mismatch: expected "${toName}", got "${updated.handling_io_sio_name}"`);
  } else {
    pass(`handling_io_sio  = ${updated.handling_io_sio} ✓`);
    pass(`handling_io_sio_name = "${updated.handling_io_sio_name}" ✓`);
  }

  // ── Verify linked SCN records were updated (if any existed) ──────────────
  section("6 · Verify linked register updates");

  const tables = [
    { label: "dggi_scn_records", before: scnBefore.data },
    { label: "dggi_arrest_records", before: arrestBefore.data },
    { label: "dggi_provisional_attachment_records", before: provBefore.data },
    { label: "dggi_prosecution_arrest_records", before: prosArrestBefore.data },
    { label: "dggi_prosecution_non_arrest_records", before: prosNonArrestBefore.data },
  ];

  for (const { label, before } of tables) {
    if (!before?.length) {
      pass(`${label}: 0 rows — skip (no linked records)`);
      continue;
    }
    const { data: after } = await supabase
      .from(label)
      .select("id, sio")
      .eq("linked_case_id", caseRecordId);
    const allUpdated = after?.every((r) => r.sio === toId);
    if (allUpdated) {
      pass(`${label}: ${after.length} row(s) sio = ${toId} ✓`);
    } else {
      const wrong = after?.filter((r) => r.sio !== toId) ?? [];
      fail(`${label}: ${wrong.length} row(s) still have old sio`);
    }
  }

  // ── Revert ────────────────────────────────────────────────────────────────
  section("7 · Revert (restore original SIO)");

  const [revertCase, revertScn, revertArrest, revertProv, revertProsArrest, revertProsNonArrest] =
    await Promise.all([
      supabase
        .from("dggi_records")
        .update({ handling_io_sio: originalSioId, handling_io_sio_name: originalSioName })
        .eq("id", testCase.id),
      supabase
        .from("dggi_scn_records")
        .update({ sio: originalSioId, sio_name: originalSioName })
        .eq("linked_case_id", caseRecordId),
      supabase
        .from("dggi_arrest_records")
        .update({ sio: originalSioId, sio_name: originalSioName })
        .eq("linked_case_id", caseRecordId),
      supabase
        .from("dggi_provisional_attachment_records")
        .update({ sio: originalSioId })
        .eq("linked_case_id", caseRecordId),
      supabase
        .from("dggi_prosecution_arrest_records")
        .update({ sio: originalSioId, sio_name: originalSioName })
        .eq("linked_case_id", caseRecordId),
      supabase
        .from("dggi_prosecution_non_arrest_records")
        .update({ sio: originalSioId, sio_name: originalSioName })
        .eq("linked_case_id", caseRecordId),
    ]);

  const revertErrors = [
    revertCase.error,
    revertScn.error,
    revertArrest.error,
    revertProv.error,
    revertProsArrest.error,
    revertProsNonArrest.error,
  ].filter(Boolean);

  if (revertErrors.length) {
    revertErrors.forEach((e) => fail("Revert error: " + e.message));
  } else {
    pass(`Reverted ${caseRecordId} back to ${originalSioName}`);
  }

  section("Done");
  if (process.exitCode === 1) {
    console.error("\nSome tests FAILED — see ✗ lines above.");
  } else {
    console.log("\nAll checks PASSED.");
  }
})();
