# Greenhouse Application Flow

## Detection
- URL contains `boards.greenhouse.io/{company}/jobs/{id}`
- Or page footer/header contains "Powered by Greenhouse"

## Field Map (from profile.json)
| ATS Label | Profile Field |
|---|---|
| First Name | `name.split(" ")[0]` |
| Last Name | `name.split(" ").slice(1).join(" ")` |
| Email | `email` |
| Phone | `phone` |
| Location / City | `location` |
| LinkedIn Profile | `linkedin` |
| GitHub | `github` |
| Website / Portfolio | `website` |

## Step-by-Step Flow

### Step 1 — Personal Information
Fill the standard fields above from profile.json.

### Step 2 — Resume Upload
Use `browser_file_upload` with the absolute path to the resume PDF.
Wait for the upload confirmation indicator (spinner disappears, filename appears) before proceeding.
If the upload triggers auto-parsing and populates fields, verify them against profile.json and correct any errors.

### Step 3 — Custom Questions
Greenhouse embeds custom questions after the standard block. For each question:
1. Read the label carefully
2. Check answers.json for a matching key (fuzzy match on keywords)
3. If found: fill it
4. If not found and answerable from profile.json (e.g. "current employer"): fill it
5. If ambiguous or sensitive: PAUSE and ask the user

### Step 4 — Equal Employment / Voluntary Disclosures
Greenhouse sometimes shows an EEO section. All fields are optional.
Use answers.json values for gender, ethnicity, veteran_status, disability_status.
If a field isn't in answers.json, select "Prefer not to say" or "Decline to answer".

### Step 5 — Review
- Take an accessibility_snapshot to confirm the form state
- Take a full-page screenshot (screenshot-review.png)
- Output a markdown table of every field you filled: Field | Value | Source
- Say: "Ready to submit [Company] — [Role] — shall I go ahead?"
- Wait for explicit user confirmation before proceeding

### Step 6 — Submit
After confirmation:
- Click the Submit button
- Wait for the confirmation page ("Your application has been submitted" or similar)
- Take screenshot-submitted.png immediately
- Write summary.json to the artifacts folder

## Common Pitfalls
- A hidden EEO section sometimes appears AFTER clicking the Submit button — if it does, treat it as optional questions and fill from answers.json, then re-submit
- File upload may take 2–4 seconds; wait for the filename to appear before clicking Next
- Some Greenhouse jobs have multi-page flows (Next → Next → Submit) — treat each page as a step and screenshot between pages
- "Current company" field: use workExperience[0].company if present
