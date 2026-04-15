# Workday Application Flow

## Detection
- URL contains `{company}.wd1.myworkdayjobs.com` or `{company}.wd3.myworkdayjobs.com` or similar `wd*.myworkdayjobs.com` pattern

## Critical: Login Required
Workday requires a per-employer account. The persistent browser-profile/ stores sessions across Claude Code sessions.

On load, check if already logged in:
- If yes: proceed directly to the job application
- If no: PAUSE immediately and say:
  "I need to log in to Workday for [company]. You can either:
  1. Log in manually in the browser now — I'll wait
  2. Create a new Workday account for this company
  Which would you prefer?"
  After the user logs in, resume the flow.

## 5-Step Flow

### Step 1 — My Information
Fields: name, address, phone, email, pronouns (optional).
Fill from profile.json. Gender is optional — use answers.json value.

### Step 2 — My Experience
This step has three sub-sections:

**Resume Upload**
Use `browser_file_upload`. Workday will auto-parse the PDF into fields.
After upload, VERIFY every extracted field against profile.json:
- Job titles, companies, dates, education — compare carefully
- Correct any parsing errors by clicking the field and retyping from profile.json
- Do NOT trust the auto-parsed data blindly

**Work History** (if shown separately)
Fill manually from workExperience[] in profile.json if auto-parse did not capture it correctly.

**Education** (if shown separately)
Fill from education[] in profile.json.

### Step 3 — Application Questions
Custom questions specific to this role. Same pattern: check answers.json → profile.json → pause if uncertain.

### Step 4 — Self Identify (EEO)
All fields are optional voluntary disclosures. Fill from answers.json:
- Gender → answers.json.gender
- Race/Ethnicity → answers.json.ethnicity
- Veteran status → answers.json.veteran_status
- Disability → answers.json.disability_status

### Step 5 — Review and Submit
- Take full-page screenshot (screenshot-review.png)
- List all filled fields in a markdown table
- Say: "Ready to submit [Company] — [Role] — shall I go ahead?"
- After confirmation: click "Submit"
- Wait for confirmation screen
- Take screenshot-submitted.png
- Write summary.json

## Critical Workday Rules

- **NEVER click "Save and Exit"** — this saves a draft but does not submit. Only click "Save and Continue" to advance steps, and "Submit" on the final step.
- After each "Save and Continue", wait for the new step to load before taking any action (accessibility_snapshot to confirm).
- Workday saves progress automatically between steps — it is safe to pause mid-flow if the user needs to intervene.
- Some Workday instances require a phone verification step during account creation — pause and let the user handle it.

## Common Issues
- **Date pickers**: Workday often uses custom date picker widgets. Use `browser_click` on the month/year dropdowns, not direct text input.
- **Address fields**: Workday may split address into Street, City, State, ZIP. Use location from profile.json, splitting as needed.
- **Resume parsing mismatches**: Always verify Step 2 data carefully — Workday's parser frequently makes errors with dates and job titles.
