# Update Documentation from Session Insights

Analyze the current session transcript, referenced GitHub issues/PRs, and extract patterns and decisions to improve documentation. Posts a summary comment to the PR.

## Usage

- `/l-docs-update` - Update docs based on current session (requires active PR on current branch)
- `/l-docs-update 123` - Update docs for a specific PR number

## Instructions

You are a senior software engineer maintaining the Lowdefy open source repository. Your task is to extract valuable insights from the current development session and codify them into documentation improvements.

### Prerequisites

This skill assumes:
1. You are on a branch with an open PR (or a PR number is provided)
2. The session contains meaningful technical work (bug fixes, features, refactoring, investigations)
3. You have context from the conversation that reveals patterns, decisions, or architectural insights

### Step 1: Identify the PR Context

**If a PR number is provided ($ARGUMENTS):**
```bash
gh pr view $ARGUMENTS --json number,title,body,headRefName,baseRefName,url,comments,reviews
```

**If no PR number (use current branch):**
```bash
gh pr view --json number,title,body,headRefName,baseRefName,url,comments,reviews
```

If no PR exists, inform the user:
> "No open PR found for the current branch. Please open a PR first or provide a PR number."

### Step 2: Fetch Linked Issues and PR Comments

Extract issue references from the PR body (patterns: `#123`, `fixes #123`, `closes #123`, `resolves #123`).

For each linked issue:
```bash
gh issue view {ISSUE_NUMBER} --json number,title,body,comments
```

Also fetch PR review comments for additional context:
```bash
gh api repos/{owner}/{repo}/pulls/{PR_NUMBER}/comments
```

### Step 3: Analyze Session Context for Documentation Opportunities

Review the current conversation and identify:

#### 3a. Architectural Decisions
- Why was a particular approach chosen over alternatives?
- What trade-offs were considered?
- What constraints influenced the design?

#### 3b. Code Patterns
- New patterns introduced that others should follow
- Anti-patterns discovered that should be avoided
- Helper utilities or techniques used repeatedly

#### 3c. Debugging Insights
- Non-obvious root causes discovered
- Diagnostic approaches that worked well
- Common pitfalls and how to avoid them

#### 3d. Integration Knowledge
- How components interact
- Data flow through the system
- External dependencies and their quirks

#### 3e. User-Facing Changes
- New features that need user documentation
- Changed behaviors users need to know about
- New operators, blocks, actions, or connections

### Step 4: Categorize Documentation Updates

Determine which documentation should be updated:

| Insight Type | Target Location | When to Update |
|--------------|-----------------|----------------|
| Architecture decisions | `cc-docs/architecture/` | New patterns, system design changes |
| Package internals | `cc-docs/packages/{package}/` | How a package works internally |
| Plugin details | `cc-docs/plugins/{type}/{name}/` | Plugin implementation details |
| Philosophy/principles | `cc-docs/Philosophy.md` | Core design principles discovered |
| User features | `packages/docs/` (YAML) | New user-facing functionality |
| API changes | `packages/docs/concepts/` | New concepts users need to understand |

### Step 5: Create or Update Documentation

#### For cc-docs (Internal/Claude Code Documentation)

Create the directory structure if it doesn't exist:
```bash
mkdir -p cc-docs/architecture cc-docs/packages cc-docs/plugins
```

**File format for cc-docs:** Markdown with clear structure:

```markdown
# {Topic Title}

## Context

Brief explanation of what problem this addresses or what component this documents.

## Key Insights

- Bullet points of important learnings
- Include the "why" behind decisions

## Implementation Details

Technical details that help understand the code.

## Decision Trace

If this documents a decision:
- **Problem**: What problem was being solved?
- **Options Considered**: What alternatives existed?
- **Decision**: What was chosen and why?
- **Trade-offs**: What was gained/lost?

## Related

- Links to related docs, code files, or issues
```

#### For packages/docs (User-Facing Documentation)

User docs use YAML format with `_ref` system. For new features:

1. **Operators**: Create/update `packages/docs/operators/{_operatorName}.yaml`
2. **Blocks**: Create/update `packages/docs/blocks/{category}/{BlockName}.yaml`
3. **Actions**: Create/update `packages/docs/actions/{ActionName}.yaml`
4. **Connections**: Create/update `packages/docs/connections/{ConnectionName}.yaml`
5. **Concepts**: Create/update `packages/docs/concepts/{concept}.yaml`

Reference existing YAML files in the same directory for format patterns.

### Step 6: Generate Documentation Content

When writing documentation, follow these principles:

1. **Clarity over brevity** - Match the codebase philosophy
2. **Include the "why"** - Don't just document what, explain why
3. **Real examples** - Use actual code/config from the PR when possible
4. **Link to source** - Reference file paths like `packages/build/src/buildPages.js:45`
5. **Avoid speculation** - Only document what was actually discovered/implemented

### Step 7: Post PR Comment Summary

After updating documentation, post a summary comment to the PR:

```bash
gh pr comment {PR_NUMBER} --body "$(cat <<'EOF'
## Documentation Updates

This PR triggered documentation improvements based on session insights.

### What was updated

{List of files created or modified}

### Why these updates

{Brief explanation of what insights led to these docs}

### Decision Traces Captured

{If any architectural decisions were documented, summarize them}

### Insights Extracted

- {Key insight 1}
- {Key insight 2}
- {etc.}

---
*Documentation generated by `/l-docs-update` skill*
EOF
)"
```

### Step 8: Summary Output

Provide a summary to the user:

```
## Documentation Update Summary

**PR**: #{number} - {title}
**Branch**: {branch}

### Files Updated

**cc-docs (internal):**
- {list of cc-docs files created/modified}

**packages/docs (user-facing):**
- {list of user doc files created/modified}

### Insights Captured

1. {insight summary}
2. {insight summary}

### Decision Traces

- {decision title}: {brief summary}

### PR Comment

Posted summary comment to PR #{number}
```

## Important Constraints

1. **Don't invent insights** - Only document things that actually came up in the session
2. **Preserve existing docs** - Read files before editing, add to them don't replace
3. **Follow CLAUDE.md standards** - All code examples must follow the coding patterns
4. **No speculation** - If something is uncertain, note it as "needs investigation"
5. **Attribution** - Reference the PR/issue that prompted the documentation
6. **Keep cc-docs technical** - This is for Claude Code, not end users
7. **Keep packages/docs user-friendly** - This is for Lowdefy users, not contributors

## When NOT to Create Documentation

Skip documentation if:
- The session was purely exploratory with no conclusions
- Changes are trivial (typos, formatting)
- The work is incomplete and patterns aren't clear yet
- Documentation already exists and is accurate

In these cases, inform the user:
> "No documentation updates needed for this session. {reason}"

## cc-docs Directory Structure Reference

```
cc-docs/
├── Overview.md              # High-level architecture overview
├── Philosophy.md            # Design principles and philosophy
├── packages/
│   ├── api.md               # @lowdefy/api internals
│   ├── build.md             # @lowdefy/build internals
│   ├── client.md            # @lowdefy/client internals
│   ├── engine.md            # @lowdefy/engine internals
│   └── ...
├── plugins/
│   ├── blocks/              # Block plugin details
│   ├── connections/         # Connection plugin details
│   ├── operators/           # Operator plugin details
│   └── actions/             # Action plugin details
└── architecture/
    ├── build-pipeline.md    # How the build system works
    ├── request-flow.md      # How requests are processed
    ├── state-management.md  # How state works in the engine
    └── ...
```
