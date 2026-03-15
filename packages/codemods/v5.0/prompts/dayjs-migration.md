# Dayjs Migration Codemod

Migrate a Lowdefy app from the `_moment` operator (Lowdefy v4) to the `_dayjs` operator (Lowdefy v5).

## Usage

Run this in the root of your Lowdefy app directory.

## Workflow

### Step 1: Pre-flight Check

Verify the app is a Lowdefy project:

```bash
ls lowdefy.yaml 2>/dev/null || ls lowdefy.yml 2>/dev/null
```

If not found: "This doesn't appear to be a Lowdefy app directory. Run from the root of your Lowdefy project."

Check for uncommitted changes:

```bash
git status --porcelain
```

If changes exist, warn: "Uncommitted changes detected. Commit or stash before running migration."

### Step 2: Rename `_moment` → `_dayjs` (Automated)

Run the rename script:

```bash
node v5.0/scripts/17-rename-moment-to-dayjs.mjs --apply .
```

This finds all YAML files containing `_moment` operator keys and renames them to `_dayjs`. Handles all patterns:

- `_moment:` → `_dayjs:`
- `_moment.format:` → `_dayjs.format:`
- `_moment.humanizeDuration:` → `_dayjs.humanizeDuration:`

Backups are saved to `.codemod-backup/`. Report the number of files and occurrences changed.

### Step 3: Report `thresholds` Usage (Review)

Run the thresholds report:

```bash
node v5.0/scripts/18-report-thresholds-usage.mjs .
```

If the script reports findings:

Present the "REVIEW NEEDED" output to the user. Explain:

- In Lowdefy v5, the `thresholds` parameter on `_dayjs.humanizeDuration` is accepted but **ignored**
- Dayjs only supports global thresholds (same as moment defaults)
- If the app doesn't depend on custom threshold behavior (changing when durations switch units like "show weeks after 7 days"), no action is needed
- If the app does depend on custom thresholds, the `thresholds` property can be removed from the YAML config since it has no effect

For each flagged file, check the context and advise the user.

If no findings: "No thresholds usage found. No review needed."

### Step 4: Migration Report

After all steps, generate a summary:

- Total YAML files scanned
- `_moment` → `_dayjs` renames applied (count of files and occurrences)
- `thresholds` usages found (count, if any)
- Backup location (`.codemod-backup/`)

Remind the user:

- Review changes with `git diff`
- The `thresholds` parameter is now a no-op — remove it from configs for clarity
- Locale names are auto-normalized to lowercase in `_dayjs` operator, but must be lowercase in nunjucks templates (`{{ date | date("locale", "ar-eg") }}`)
- 22 common locales are bundled; uncommon locales silently fall back to English

"Migration complete. Test your app to verify date formatting works as expected."
