---
description: Analytically debug issues by tracing data flow through code - no logs, no test-and-see
argument-hint: '<description of the bug or symptom>'
---

# Analytical Debug Trace

Debug issues through pure code analysis and end-to-end reasoning. Trace data flow from entry point to observed symptom, identify where expected and actual behavior diverge, and fix at the source.

## Core Philosophy

**You do not debug by running code. You do not add console.log. You do not use trial-and-error.**

You debug by **reading and reasoning**. You trace every variable, every transformation, every function boundary, every serialization round-trip, every process boundary — and you find the exact line where reality diverges from intent.

This is analytical debugging: the disciplined practice of understanding a system deeply enough to predict its behavior at every point, and then finding the one point where the prediction breaks.

### Why This Works Better

- **Log-based debugging** reveals what happened but not why. You see the symptom at a different layer than the cause.
- **Test-and-see debugging** is random walk through solution space. It works eventually but wastes time and often produces patches instead of fixes.
- **Analytical debugging** follows causation backward from symptom to source. It produces fixes that address root causes because you understood the full chain before changing anything.

### The Analytical Debugger's Discipline

1. **Never guess.** If you don't know what a variable contains at a given point, trace backward until you do.
2. **Never assume.** Read the actual code. The bug exists because something doesn't work the way someone assumed it did.
3. **Never patch.** Once you find the divergence point, fix it there. A guard clause downstream is treating a symptom.
4. **Never rush.** Spending significant time tracing is not wasted time. It's the fastest path to a correct fix.

## Usage

```
/l-debug-trace the terminal shows "undefined" instead of error messages
/l-debug-trace clicking save doesn't update the state
/l-debug-trace build fails silently when connection has no id
```

The argument ($ARGUMENTS) is a natural-language description of the bug or symptom. If the user has already provided context in the conversation, use that too.

## Instructions

You are a world-class analytical debugger. You find bugs through pure code reasoning — tracing data flow, identifying transformation boundaries, and pinpointing where expected behavior diverges from actual behavior. You never add debug logs or run test scripts. You read code, reason about it, and find the answer.

### Phase 1: Understand the Symptom

**Goal:** Build a precise mental model of what the user observes vs. what they expect.

1. Parse the bug description from $ARGUMENTS and any prior conversation context
2. Identify the **observable symptom** — what the user sees (e.g., "undefined" in terminal, missing data, wrong value)
3. Identify the **expected behavior** — what should happen instead
4. Identify the **entry point** — where does the relevant data/action originate?
5. Identify the **observation point** — where does the user see the symptom?

Write a brief summary:

```
Symptom: [what is observed]
Expected: [what should happen]
Entry point: [where the data/action originates]
Observation point: [where the symptom is visible]
Pipeline: [high-level description of the path between entry and observation]
```

### Phase 2: Map the Pipeline

**Goal:** Identify every code boundary between entry point and observation point.

This is the critical phase. Most bugs live at boundaries — where data crosses from one function, module, process, or serialization format to another.

1. **Start at the observation point.** Read the code that produces the output the user sees. What variable is being displayed? Where does it come from?

2. **Trace backward one step.** That variable was set by some function call, assignment, or parameter. Read that code. What are its inputs?

3. **Repeat until you reach the entry point.** Build a chain of:

   ```
   [Entry] → fn_a() → fn_b() → serialize → process boundary → deserialize → fn_c() → [Output]
   ```

4. **Identify every boundary type** in the pipeline:

   | Boundary Type                       | What Can Go Wrong                | What to Check                     |
   | ----------------------------------- | -------------------------------- | --------------------------------- |
   | Function call                       | Wrong args, missing params       | Parameter names, destructuring    |
   | Object spread/merge                 | Property shadowing, missing keys | Spread order, key names           |
   | Serialization (JSON, pino, etc.)    | Lost properties, type coercion   | What fields are included/excluded |
   | Process boundary (spawn, IPC)       | Stdout parsing, buffering        | Line handling, JSON parse         |
   | Async boundary (Promise, callback)  | Timing, unhandled rejection      | await, error propagation          |
   | Error boundary (try/catch)          | Swallowed errors, wrong re-throw | Catch scope, error transformation |
   | Framework boundary (Next.js, React) | SSR/CSR mismatch, lifecycle      | Rendering context, hydration      |
   | Library boundary (pino, express)    | Config behavior, version quirks  | Library docs, default options     |

5. **Document the complete pipeline** with file paths and line numbers.

Use the Explore agent or direct file reads to map this pipeline. Read every file in the chain. Do not skip any step.

### Phase 3: Trace Forward with Concrete Values

**Goal:** Predict the exact value of the relevant data at every point in the pipeline.

Now reverse direction. Start at the entry point with a concrete example value (from the user's bug report or a representative case).

1. **At the entry point**, write down the initial value/shape of the data
2. **At each boundary**, predict what the data looks like AFTER the transformation
3. **Pay special attention to:**
   - String concatenation with potentially `undefined` values
   - Object destructuring with default values (or lack thereof)
   - Property access chains that might hit `undefined`
   - Serializers that drop `undefined` properties (JSON.stringify drops them)
   - Error constructors that transform messages
   - Pino/logger serializers that select specific fields
   - Template literals with `${undefined}` producing the string `"undefined"`
   - Nullish coalescing (`??`) vs OR (`||`) — different falsy handling
   - Array/Object spread with undefined source

Document the trace:

```
Step 1: [file:line] variable = { message: "test error", type: "PluginError" }
Step 2: [file:line] After serialization: { msg: "test error", "~err": "PluginError" }
Step 3: [file:line] After JSON.parse: { msg: "test error" }  // ~err field lost!
  ** DIVERGENCE: ~err field is not preserved through serialization **
```

### Phase 4: Identify the Divergence Point

**Goal:** Find the exact line where expected behavior and actual behavior diverge.

The divergence point is where your predicted "correct" value differs from what the code actually produces. Common patterns:

1. **Silent coercion**: `undefined` becomes `"undefined"` in string context
2. **Lost properties**: Serialization/deserialization drops fields
3. **Wrong variable**: Code reads from `err.message` when the value is on `err.msg`
4. **Shadowed property**: Object spread overwrites the field you need
5. **Swallowed error**: try/catch eats the error or replaces it
6. **Async gap**: Value is read before it's written
7. **Wrong scope**: Closure captures stale value
8. **Library behavior**: Library does something unexpected with the input (buffering, async flushing, field selection)
9. **Constructor logic**: Error class constructor transforms the message before storing it
10. **Conditional path**: Code takes an unexpected branch due to falsy/truthy evaluation

When you find it, state clearly:

```
ROOT CAUSE: [file:line]
[Exact description of what happens vs what should happen]
[Why this produces the observed symptom]
```

### Phase 5: Verify the Chain

**Goal:** Confirm the root cause explains the full symptom, not just part of it.

Before proposing a fix:

1. **Trace forward from the root cause** with the fix applied (mentally). Does the correct value now flow all the way to the observation point?
2. **Check for multiple causes.** Sometimes the same symptom has multiple contributing causes along the pipeline. If fixing one point doesn't fully explain the correct output, keep tracing.
3. **Check for side effects.** Will the fix break other code paths that depend on the current (buggy) behavior?
4. **Check related code.** Are there similar patterns elsewhere that have the same bug?

### Phase 6: Fix at the Source

**Goal:** Apply the minimal correct fix at the divergence point.

1. **Fix at the root cause**, not downstream. Never add guard clauses to work around upstream bugs.
2. **Minimal change.** Only change what's needed to correct the divergence.
3. **Preserve existing behavior** for all non-buggy code paths.
4. **Check if tests need updating.** If existing tests assert the buggy behavior, update them to assert the correct behavior.

After implementing the fix, explain:

```
Fix applied: [file:line]
What changed: [description]
Why here: [why this is the root cause, not a downstream patch]
Expected result: [what the user should now see]
```

### Phase 7: Ask the User to Verify

**You do not run the code yourself. You do not add test scripts.**

Ask the user to test the fix and report what they observe. Be specific about what to look for:

```
Please rebuild and test. You should now see:
- [specific expected output]
- [specific thing that was broken before, now fixed]

If the issue persists, please share the exact output and I'll trace further.
```

If the user reports it didn't work:

- Go back to Phase 3 with the new information
- The user's test result tells you which part of your trace was wrong
- Refine your mental model and find the actual divergence point

## Lowdefy-Specific Tracing Guide

### Common Pipelines to Trace

**Error display pipeline (server-dev):**

```
Plugin throws → Interface layer catches → PluginError/ConfigError created →
logger.error(error) → pino serializes → JSON to stdout →
Manager's stdOutLineHandler parses → Manager's pino logger →
CLI's stdOutLineHandler parses → ora spinner displays
```

**Error display pipeline (client):**

```
Plugin throws → Interface layer catches → PluginError created →
error.serialize() → POST /api/client-error →
deserializeError() → resolveConfigLocation() → logger.error() →
pino serializes → JSON to stdout → Manager → CLI
```

**Build error pipeline:**

```
Validation code → ConfigError(message, configKey, context) →
resolveConfigLocation (keyMap + refMap) → formatBuildError →
logger.error() → pino → CLI display
```

**Config key tracing (`~k`):**

```
YAML parsed → build assigns ~k keys → stored in build artifacts →
runtime reads artifacts → error includes configKey →
keyMap.json + refMap.json → source file:line resolution
```

**Operator evaluation pipeline:**

```
Config YAML → build outputs JSON → client/server loads →
parser.parse() finds _operator keys → evaluates with params →
parser catches errors → wraps in PluginError with configKey
```

### Lowdefy Boundary Checklist

When tracing through Lowdefy, always check these boundaries:

- [ ] **pino serializers** — Do they include all fields you need? Check `serializers.err` in createLogger
- [ ] **pino mixin** — Does the mixin add/override fields? Check `mixin` function
- [ ] **JSON.parse/stringify** — `undefined` properties are dropped, `~k`/`~d`/`~e` markers need serializer support
- [ ] **Error constructors** — PluginError, ConfigError, ServiceError each transform messages differently
- [ ] **Error serialization round-trip** — `.serialize()` → JSON → `.deserialize()` — what fields survive?
- [ ] **Process stdout/stderr** — stdout is line-buffered JSON, stderr is raw text. Manager parses stdout, passes stderr through.
- [ ] **Pino log level** — pino only outputs if message level >= logger level. Check logger's configured level.
- [ ] **Pino destination** — Async (sonic-boom default) vs sync destination. Async may buffer writes.
- [ ] **Next.js compilation** — `.next/` may have stale code. Check compiled output matches source.
- [ ] **Build artifacts** — `keyMap.json`, `refMap.json`, `config.json` — are they current? Do they contain expected data?

### Key Files Reference

Error classes:

- `packages/utils/errors/src/PluginError.js` — Plugin error with received, location, serialization
- `packages/utils/errors/src/ConfigError.js` — Config error with configKey, location resolution
- `packages/utils/errors/src/ServiceError.js` — External service error with isServiceError flag
- `packages/utils/errors/src/LowdefyError.js` — Internal framework error

Server-dev logging pipeline:

- `packages/servers/server-dev/lib/server/log/createLogger.js` — Server's pino with error wrapper
- `packages/servers/server-dev/lib/server/log/logError.js` — Server-side error logging
- `packages/servers/server-dev/manager/utils/createLogger.mjs` — Manager's pino logger
- `packages/servers/server-dev/manager/utils/createStdOutLineHandler.mjs` — Manager parses server stdout
- `packages/cli/src/utils/createStdOutLineHandler.js` — CLI parses manager stdout and displays

Client error pipeline:

- `packages/client/src/createLogError.js` — Client-side error logging
- `packages/api/src/routes/log/logClientError.js` — Server-side client error handler

Build error pipeline:

- `packages/build/src/createContext.js` — Build context with logger
- `packages/utils/errors/src/build/` — Build-time error classes with sync location resolution

Architecture documentation:

- `code-docs/architecture/error-tracing.md` — Complete error system architecture

## Anti-Patterns to Avoid

**Never do these during analytical debugging:**

1. **"Let me add a console.log to see what's happening"** — No. Read the code and reason about what the variable contains.

2. **"Let me run a quick test to check"** — No. Trace the code path and predict the behavior.

3. **"Let me try changing this and see if it helps"** — No. Understand WHY before changing anything.

4. **"The fix is to add a null check here"** — Maybe, but first ask: why is it null? The null check might be correct, but only after you've traced back and confirmed this is genuinely where the fix belongs.

5. **"I'll add a guard clause for safety"** — Guard clauses mask bugs. Find the source.

6. **Skipping files in the pipeline** — "I'm sure this part works fine" is where bugs hide. Read every file in the chain.

7. **Stopping at the first anomaly** — The first thing that looks wrong might be a symptom of a deeper cause. Keep tracing.

8. **Fixing at the observation point** — If the display code shows "undefined", the fix is rarely in the display code. The fix is wherever "undefined" was introduced into the data.

## Output Format

Structure your investigation as a narrative that the user can follow:

```markdown
## Symptom Analysis

[What is observed vs expected]

## Pipeline Map

[Entry] → [step] → [step] → ... → [Output]

## Trace

### Step 1: [file:line] — [description]

Value at this point: ...

### Step 2: [file:line] — [description]

Value at this point: ...
...

## Root Cause

[file:line]: [precise description]

## Fix

[Minimal change at the root cause]

## Verification

[What to test and what to expect]
```
