# Joku — Claude Code Job Application Agent

Joku is a Claude Code plugin that applies to jobs on your behalf. Point it at a job URL, and it will:

1. Navigate to the posting and detect the ATS (Greenhouse, Lever, Ashby, Workday, LinkedIn)
2. Read your profile, pre-answered questions, and preferences
3. Fill every field it can
4. Pause and ask you for anything it can't answer (salary, CAPTCHAs, legal attestations)
5. Show you a full review before submitting
6. Wait for your explicit "go ahead" before clicking Submit

No server. No deployment. No browser extension. Just open the folder in Claude Code and talk to it.

---

## Quick Start

```bash
git clone https://github.com/wbohanw/joku.git
cd joku
claude
```

Then in Claude Code, type:

```
setup
```

The setup wizard will install the browser, copy the config templates, and walk you through entering your profile and resume. Takes about 2 minutes.

Once setup is done:

```
apply to https://boards.greenhouse.io/acme/jobs/12345
```

---

---

## Supported ATS

| ATS | Detection signal |
|---|---|
| Greenhouse | `boards.greenhouse.io` in URL |
| Lever | `jobs.lever.co` in URL |
| Ashby | `ashby.com` or `app.ashbyhq.com` in URL |
| Workday | `myworkdayjobs.com` in URL |
| LinkedIn Easy Apply | `linkedin.com/jobs` + "Easy Apply" button visible |
| Unknown | Generic conservative flow |

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| [Claude Code](https://claude.ai/code) | Latest | `brew install claude` |
| [Bun](https://bun.sh) | 1.x | `curl -fsSL https://bun.sh/install \| bash` |
| Node.js | 18+ | `brew install node` |

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/wbohanw/joku.git
cd joku
```

### 2. Install Playwright browser

```bash
npx @playwright/mcp@latest install-browser chrome-for-testing
```

### 3. Set up your profile

Joku reads your full profile from `data/profile.json`. There are two ways to create it:

**Option A — Lumee (recommended)**

Lumee is a companion AI agent that stores and maintains your structured resume profile in the cloud. If you use it:

```bash
cp .env.example .env
```

Edit `.env` with your Botpress/Lumee credentials:
```
LUMEE_BOTPRESS_PAT=bp_pat_xxxxx
LUMEE_BOT_ID=bot_xxxxx
LUMEE_USER_ID=usr_xxxxx
```

Then pull your profile:
```bash
bun run sync
```

This writes `data/profile.json` automatically from Lumee's database.

**Option B — Manual**

Copy the example and fill it in:

```bash
cp data/profile.example.json data/profile.json
```

Edit `data/profile.json` with your name, email, phone, work history, education, skills, etc. See `data/profile.example.json` for the full schema.

### 4. Add your resume

Drop your PDF into `resumes/`:

```
resumes/
└── resume.pdf
```

### 5. Set your preferences

```bash
cp data/preferences.example.json data/preferences.json
```

Edit `data/preferences.json` — at minimum, update `resumeFileDefault` to point to your resume:

```json
{
  "resumeFileDefault": "./resumes/resume.pdf"
}
```

### 6. Fill in your ATS answers

```bash
cp data/answers.example.json data/answers.json
```

Edit `data/answers.json` with your personal answers to common screening questions (work authorization, salary expectations, availability, etc.).

### 7. Open Claude Code

```bash
claude
```

Playwright MCP loads automatically from `.mcp.json`. Verify it's active with `/mcp`.

---

## Usage

### Apply to a single job

```
apply to https://boards.greenhouse.io/acme/jobs/12345
```

### Apply with a specific resume

```
apply to https://jobs.lever.co/shopify/abc — use resumes/senior-resume.pdf
```

### Add jobs to the queue

```
add these to the queue:
https://boards.greenhouse.io/affirm/jobs/123
https://jobs.lever.co/stripe/abc
https://app.ashbyhq.com/openai/jobs/xyz
```

### Run the full queue

```
apply to queue
```

Joku processes every `pending` row in `data/queue.csv`, updates statuses in real time, and prints a summary table at the end.

### Sync profile from Lumee

```bash
bun run sync        # pull latest profile
bun run sync:dry    # preview without writing
```

---

## What Joku Always Does Before Submitting

Joku **never submits without asking you**. Before every submission it:

1. Takes an accessibility snapshot of the review page
2. Takes a full-page screenshot (`screenshot-review.png`)
3. Prints a summary table of every field it filled
4. Waits for your explicit "go ahead"

After submission it takes a confirmation screenshot and logs the result.

---

## What Joku Will Never Do

- Submit without your explicit confirmation
- Fabricate any information not in `profile.json` or `answers.json`
- Bypass a CAPTCHA or OTP (it stops and asks you to solve it)
- Answer salary questions without asking you first
- Continue past an unexpected page (login wall, 404, error) without flagging it

---

## Artifacts

Each application run writes to `artifacts/{company}-{role}-{YYYY-MM-DD}/`:

```
artifacts/
└── acme-corp-software-engineer-2026-04-15/
    ├── screenshot-start.png       # beginning of the form
    ├── screenshot-review.png      # final review before submit
    ├── screenshot-submitted.png   # confirmation page
    └── summary.json               # metadata: status, ATS, fields filled, resume used
```

`artifacts/` is gitignored — screenshots and session data stay local.

---

## File Structure

```
joku/
├── .env.example                # Credential template (copy to .env)
├── .mcp.json                   # Playwright MCP config (auto-loads in Claude Code)
├── CLAUDE.md                   # Agent operating procedure (read by Claude)
├── package.json
│
├── scripts/
│   └── sync-profile.ts         # Pull profile from Lumee
│
├── data/
│   ├── profile.json            # Your profile — GITIGNORED (personal)
│   ├── profile.example.json    # Schema template
│   ├── answers.json            # ATS screening answers — GITIGNORED (personal)
│   ├── answers.example.json    # Template
│   ├── preferences.json        # Behavior settings — GITIGNORED (personal paths)
│   ├── preferences.example.json
│   ├── queue.csv               # Job queue — GITIGNORED (application history)
│   └── queue.example.csv       # Sample format
│
├── resumes/                    # Your PDF resume files — GITIGNORED
│   └── .gitkeep
│
├── ats/                        # Step-by-step ATS guides (read by Claude)
│   ├── greenhouse.md
│   ├── lever.md
│   ├── ashby.md
│   └── workday.md
│
├── artifacts/                  # Per-run output (screenshots + summary.json) — GITIGNORED
└── browser-profile/            # Playwright Chromium session storage — GITIGNORED
```

---

## Global `/joku` Command (Optional)

To use Joku from **any directory** in Claude Code:

**Step 1 — register Playwright MCP globally:**

```bash
claude mcp add playwright -- npx @playwright/mcp@latest \
  --user-data-dir /absolute/path/to/joku/browser-profile \
  --output-dir /absolute/path/to/joku/artifacts \
  --browser chromium \
  --save-session
```

**Step 2 — create the slash command:**

```bash
mkdir -p ~/.claude/commands
```

Create `~/.claude/commands/joku.md`:

```markdown
You are Joku, the job application agent. Your full operating procedure is defined in:
/absolute/path/to/joku/CLAUDE.md

Read that file first, then carry out the following request:

$ARGUMENTS

Key paths (always use absolute):
- Profile data: /absolute/path/to/joku/data/
- Resumes: /absolute/path/to/joku/resumes/
- ATS guides: /absolute/path/to/joku/ats/
- Artifacts output: /absolute/path/to/joku/artifacts/
```

Replace `/absolute/path/to/joku` with the real path (e.g. `/Users/yourname/Desktop/joku`).

**Now from anywhere:**

```
/joku apply https://boards.greenhouse.io/lyft/jobs/123
```

---

## Queue CSV Format

`data/queue.csv` tracks every job you've processed. See `data/queue.example.csv` for the format.

| Column | Description |
|---|---|
| `url` | Job posting URL |
| `company` | Auto-filled after navigating |
| `role` | Auto-filled after navigating |
| `ats` | Auto-detected ATS system |
| `status` | `pending` \| `in-progress` \| `submitted` \| `paused` \| `failed` \| `skipped` |
| `added_date` | Date URL was added (YYYY-MM-DD) |
| `applied_date` | Date successfully submitted |
| `pause_reason` | Why it got stuck (`captcha`, `salary`, `cover_letter`, `login_required`, etc.) |
| `missing_info` | Semicolon-separated list of fields not found in profile/answers |
| `artifacts_dir` | Path to the run artifacts |
| `notes` | Freeform notes |

---

## Privacy & Security

**None of your personal data is in this repo.** The following files are gitignored and stay local:

- `data/profile.json` — your full resume profile
- `data/answers.json` — your ATS screening answers (includes phone, email, salary)
- `data/preferences.json` — your settings (includes resume file paths)
- `data/queue.csv` — your job application history
- `resumes/` — your resume PDFs
- `artifacts/` — screenshots and session recordings
- `browser-profile/` — Playwright Chromium session (cookies, local storage)
- `.env` — your API keys

Use the `.example` files as setup templates.

---

## Troubleshooting

**Playwright MCP not loading**
Run `/mcp` in Claude Code to check status. If it shows an error:
```bash
npx @playwright/mcp@latest --help
npx @playwright/mcp@latest install-browser chrome-for-testing
```

**"No profile found" from sync**
Check your `.env` has the correct `LUMEE_USER_ID`. You can find it in your Lumee profile page URL or by asking Lumee: *"what is my userId?"*

**Location field keeps resetting (Greenhouse)**
Known Greenhouse quirk — the city typeahead loses its value when other dropdowns change. Joku fills location last to minimize this. If it happens, tell Joku to re-fill it.

**Workday requires login**
Workday uses per-employer accounts. Joku pauses and asks you to log in. Once logged in, the session is saved in `browser-profile/` and reused next time.
