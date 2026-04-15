/**
 * sync-profile.ts
 * Pulls the user's profile from Lumee's Botpress Tables API
 * and writes it to data/profile.json.
 *
 * Usage:
 *   bun run scripts/sync-profile.ts
 *   bun run scripts/sync-profile.ts --dry-run
 *
 * Requires .env:
 *   LUMEE_BOTPRESS_PAT=bp_pat_xxxxx
 *   LUMEE_BOT_ID=bot_xxxxx
 *   LUMEE_USER_ID=usr_xxxxx   (your userId in Lumee's ResumeProfilesTable)
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Load .env ────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(ROOT, ".env");
  if (!existsSync(envPath)) {
    console.error("Error: .env file not found at", envPath);
    console.error(
      "Create it with LUMEE_BOTPRESS_PAT, LUMEE_BOT_ID, LUMEE_USER_ID"
    );
    process.exit(1);
  }
  const raw = readFileSync(envPath, "utf-8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (key && val) process.env[key] = val;
  }
}

loadEnv();

const PAT = process.env.LUMEE_BOTPRESS_PAT;
const BOT_ID = process.env.LUMEE_BOT_ID;
const USER_ID = process.env.LUMEE_USER_ID;
const DRY_RUN = process.argv.includes("--dry-run");

if (!PAT || !BOT_ID || !USER_ID) {
  console.error(
    "Missing required env vars: LUMEE_BOTPRESS_PAT, LUMEE_BOT_ID, LUMEE_USER_ID"
  );
  process.exit(1);
}

// ── Fetch from Botpress Tables API ───────────────────────────────────────────

const API_BASE = "https://api.botpress.cloud/v1";
const TABLE = "ResumeProfilesTable";

async function fetchProfile() {
  const url = `${API_BASE}/tables/${TABLE}/rows/find`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "x-bot-id": BOT_ID!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filter: { userId: USER_ID },
      limit: 1,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Botpress API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { rows: Record<string, unknown>[] };

  if (!data.rows || data.rows.length === 0) {
    throw new Error(
      `No profile found for userId "${USER_ID}" in ${TABLE}. ` +
        "Make sure you've set up your profile in Lumee first."
    );
  }

  return data.rows[0];
}

// ── Strip system columns, add _meta ─────────────────────────────────────────

const SYSTEM_COLUMNS = new Set(["id", "createdAt", "updatedAt"]);

function cleanProfile(row: Record<string, unknown>) {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (!SYSTEM_COLUMNS.has(k)) clean[k] = v;
  }
  clean._meta = {
    syncedAt: new Date().toISOString(),
    lumeeUserId: USER_ID,
  };
  return clean;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Syncing profile for userId: ${USER_ID}`);
  console.log(`Bot ID: ${BOT_ID}`);

  const row = await fetchProfile();
  const profile = cleanProfile(row);

  // Summary of populated sections
  const sections = [
    "name", "email", "phone", "linkedin", "github", "website", "location",
    "summary", "workExperience", "education", "projects", "skills",
    "certifications", "awards", "languages",
  ];

  console.log("\nProfile sections:");
  for (const s of sections) {
    const val = profile[s];
    if (Array.isArray(val)) {
      console.log(`  ${s}: ${val.length} item(s)`);
    } else if (val) {
      const preview = String(val).slice(0, 60);
      console.log(`  ${s}: ${preview}${String(val).length > 60 ? "..." : ""}`);
    } else {
      console.log(`  ${s}: (empty)`);
    }
  }

  if (DRY_RUN) {
    console.log("\n[dry-run] Would write to data/profile.json — skipping.");
    console.log("\nPreview:");
    console.log(JSON.stringify(profile, null, 2).slice(0, 500) + "\n...");
    return;
  }

  const outPath = resolve(ROOT, "data", "profile.json");
  writeFileSync(outPath, JSON.stringify(profile, null, 2) + "\n");
  console.log(`\nWritten to: ${outPath}`);
}

main().catch((err) => {
  console.error("\nSync failed:", err.message);
  process.exit(1);
});
