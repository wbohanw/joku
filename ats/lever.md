# Lever Application Flow

## Detection
- URL contains `jobs.lever.co/{company}/{uuid}`

## Structure
Lever forms are typically single-page: personal info + resume + custom questions + optional cover letter + submit.

## Field Map (from profile.json)
| ATS Label | Profile Field |
|---|---|
| Full Name | `name` |
| Email | `email` |
| Phone | `phone` (optional on most forms) |
| Current Company / Employer | `workExperience[0].company` |
| Current Title | `workExperience[0].title` |
| LinkedIn | `linkedin` |
| GitHub | `github` |
| Twitter | leave blank |
| Portfolio / Website | `website` |
| Location | `location` |

## Step-by-Step Flow

### Step 1 — Personal Information
Fill standard fields from profile.json.

### Step 2 — Resume Upload
Use `browser_file_upload` with the absolute resume PDF path.
Wait for filename confirmation before proceeding.

### Step 3 — Cover Letter
Check `preferences.json.coverLetterDefault`:
- `"skip"`: Leave blank if optional. If required, ask the user.
- `"generate"`: Compose a 3-paragraph cover letter from profile.json + the job description visible on page.
- `"use-template"`: Ask the user to paste their template text.

### Step 4 — Custom Questions
Same pattern as Greenhouse: check answers.json → fill from profile.json → pause if uncertain.

### Step 5 — Review and Submit
- Take screenshot-review.png
- List every filled field in a markdown table
- Say: "Ready to submit [Company] — [Role] — shall I go ahead?"
- After confirmation: click Apply / Submit
- Take screenshot-submitted.png
- Write summary.json

## Notes
- Lever shows the job description on the right side of the page — use it to tailor any open-text answers
- Some Lever forms have a "Add a note" free-text field at the bottom — skip it unless the user asks you to fill it
