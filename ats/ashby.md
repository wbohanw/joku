# Ashby Application Flow

## Detection
- URL contains `jobs.ashbyhq.com/{company}` or `app.ashbyhq.com`

## Structure
Ashby uses a multi-step modal or full-page flow. Always take an accessibility_snapshot after each navigation to understand the current step.

## Field Map (from profile.json)
Same as Greenhouse/Lever. Key fields: name (split), email, phone, location, linkedin, github, website.

## Step-by-Step Flow

### Step 1 — Basic Information
Fill name, email, phone, location from profile.json.

### Step 2 — Resume Upload
Use `browser_file_upload` with the absolute resume PDF path.

### Step 3 — Links / Portfolio
Fill linkedin, github, website from profile.json.

### Step 4 — Custom Questions
Same pattern: check answers.json → fill from profile.json → pause if uncertain.

### Step 5 — Optional: Demographics / Pronouns
All optional. Fill from answers.json or skip.

### Step 6 — Review and Submit
- Take screenshot-review.png
- List every filled field
- Say: "Ready to submit [Company] — [Role] — shall I go ahead?"
- After confirmation: submit
- Take screenshot-submitted.png
- Write summary.json

## Important Ashby-Specific Notes

### Dropdowns
Ashby uses custom React dropdown components — do NOT use `browser_select_option`.
Instead:
1. Use `browser_click` on the dropdown trigger element
2. Wait for the options list to appear (accessibility_snapshot to confirm)
3. Use `browser_click` on the correct option

### Location Typeahead
The location field is a typeahead autocomplete:
1. Type the city name
2. Wait 1–2 seconds for suggestions to appear
3. Use accessibility_snapshot to see the options
4. Click the correct suggestion

### Multi-step Navigation
Each step is a separate screen. After clicking "Next" or "Continue":
- Wait for the new step to load
- Take accessibility_snapshot to confirm new content
- Then proceed

### File Upload Confirmation
Ashby may show a processing spinner after upload. Wait for it to resolve before continuing.
