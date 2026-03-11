---
name: l-new-issue
description: Create a GitHub issue for the lowdefy repo. Auto-detects bug vs feature, drafts with appropriate template, and creates with labels. Use when filing bugs, feature requests, or enhancements.
argument-hint: '<description>'
---

# Create GitHub Issue

Create a well-structured GitHub issue. Auto-detects bug vs feature from the description.

## Arguments

- Description of the bug or feature request
- (none) — Will ask what the issue is about

## Instructions

### 1. Understand the Request

If `$ARGUMENTS` is empty, ask:

```
Question: "What's the issue about?"
Header: "Issue"
Options:
  - label: "Bug"
    description: "Something is broken or not working correctly"
  - label: "Feature"
    description: "New functionality or enhancement"
```

If arguments are provided, auto-detect bug vs feature from the description. Bug indicators: "crash", "error", "broken", "fails", "wrong", "doesn't work", "fix". Feature indicators: "add", "support", "new", "improve", "allow", "enable".

### 2. Check for Related Issues

Search for potentially related or duplicate issues:

```bash
gh issue list --limit 20 --state open --json number,title | python3 -c "
import json, sys
issues = json.load(sys.stdin)
for i in issues:
    print(f'#{i[\"number\"]}: {i[\"title\"]}')
"
```

If there are clearly related issues, mention them when drafting. If there's a likely duplicate, warn the user before proceeding.

### 3. Clarify (Only If Needed)

**Skip this step if the request is clear and unambiguous.**

If genuinely ambiguous, ask 1-2 questions using `AskUserQuestion`. Examples of when to ask:

- Scope is unclear: "Should this apply to all block types or just input blocks?"
- Multiple possible approaches: "Should this be a new operator or extend an existing one?"

Do NOT ask if the request is specific enough to draft from.

### 4. Draft the Issue

**For bugs:**

```markdown
### Bug

{What's happening and why it's wrong. 2-3 sentences.}

### Expected Behavior

{What should happen instead.}

### Related

{Links to related issues, if any. Omit section if none.}
```

**For features:**

```markdown
### Problem

{What's missing or could be better, and why it matters. 2-3 sentences.}

### Proposal

{What the feature should do. Can be a few sentences or bullet points.}

### Related

{Links to related issues, if any. Omit section if none.}
```

**Title:** Concise, descriptive. For bugs start with the symptom. For features start with the capability.

**Labels:** Auto-detect from the repo's available labels. Always include `type:bug` or `type:feature`. Add other relevant labels if they exist (e.g., package-specific labels).

### 5. Confirm

Present the draft:

```
Question: "Create this issue?"
Header: "Issue"
Options:
  - label: "Looks good"
    description: "{type:label} — {title}"
  - label: "Skip"
    description: "Don't create"
```

If the user provides feedback via "Other", incorporate it and proceed (don't re-prompt).

### 6. Create

```bash
gh issue create --title "<title>" --label "<labels>" --body "$(cat <<'EOF'
<body>
EOF
)"
```

Show the issue URL.
