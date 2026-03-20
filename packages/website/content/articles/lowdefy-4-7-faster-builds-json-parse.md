---
title: 'Lowdefy v4.7: Faster Builds, and a Story About JSON.parse'
subtitle: 'How we replaced five JSON round-trips per ref with a single async walker — and unlocked JIT page builds along the way'
authorId: 'sam'
publishedAt: '2026-03-13'
readTimeMinutes: 10
tags:
  - 'Release'
  - 'Performance'
  - 'Architecture'
draft: false
---

`JSON.parse` has a second argument most developers never use. We built our entire build system on it. That worked for five years, until our users wrote apps that resolve 23,000 file references per build.

We found the bottleneck, replaced the core algorithm, and got more back than we expected.

## A trick with JSON.parse

When we wrote the build system, we needed a way to walk an object tree, run a function at every node, and return a fresh copy. `structuredClone` didn't exist yet, and even if it had, we needed the "run a function at every node" part.

That second argument is a *reviver* function. It gets called bottom-up on every value during parsing. Pair it with `JSON.stringify` and you get a deep clone that calls your function at every node:

```javascript
function walkAndCopy(obj, visitor) {
  return JSON.parse(JSON.stringify(obj), function (key, value) {
    return visitor(key, value);
  });
}
```

Leaf nodes are visited before their parents, so by the time you see a parent object, its children are already processed. It was fast, correct, handled nested structures naturally, and V8's native JSON implementation made it hard to beat with hand-rolled recursion. We wrapped it in a utility and used it everywhere.

## Once you have a hammer

The build system's main job is resolving `_ref`, Lowdefy's mechanism for composing YAML files:

```yaml
# lowdefy.yaml
pages:
  - _ref: pages/dashboard.yaml
  - _ref: pages/settings.yaml
```

Each referenced file can itself contain `_ref`s, forming a tree. The build walks this tree, loading and inlining files until everything resolves into one big config object.

There's a catch: the JSON reviver is synchronous. It can't `await` a file read mid-walk. So we split it into two passes: one walk to *find* all the `_ref` markers in a file, then async loading of each referenced file, then another walk to *substitute* the resolved content back into the parent. Two full JSON round-trips per file to work around the sync constraint.

Then we added `_var`. Variables let refs pass values to their children, like props in a component:

```yaml
pages:
  - _ref:
      path: templates/crud-page.yaml
      vars:
        title: Users
        resource: user_api
```

Vars need to resolve before the file content does, since the template uses them. That meant another walk pass.

Then we added build-time operators: `_build.env` for environment variables, `_build.array` for constructing arrays from config, `_build.if` for conditional inclusion:

```yaml
pages:
  _build.array:
    concat:
      - _ref: pages/always-visible.yaml
      - _build.if:
          test:
            _build.env: SHOW_ADMIN
          then:
            - _ref: pages/admin.yaml
```

Another full walk per file. Then error tracking: stamp a source-file ID on every object so errors trace back to their origin. Another walk.

Each feature was reasonable on its own. Each added another `JSON.stringify` + `JSON.parse` cycle. Per ref, the pipeline became:

| Step | What it does | Mechanism |
|---|---|---|
| `getRefsFromFile` | Find `_ref` markers | `jsonWalk` (round-trip #1) |
| `populateRefs` (1st) | Resolve var/ref definitions | `jsonWalk` (round-trip #2) |
| `populateRefs` (2nd) | Substitute resolved content | `jsonWalk` (round-trip #3) |
| `evaluateBuildOperators` | Evaluate `_build.*` operators | `jsonWalk` (round-trip #4) |
| `tagRefProvenance` | Tag every object with source file | `jsonWalk` (round-trip #5) |

Five full JSON round-trips per ref. For a small app with 200 refs, that's 1,000 round-trips. Fast enough that nobody noticed.

## Apps got bigger

Lowdefy is designed for building real business applications. Our users did exactly that.

They started generating pages from configuration: survey pages with dozens of question types, workflow steps with approval chains, CRUD pages for every database table. Ref trees grew from dozens of files to thousands.

Our largest production app hit 23,000+ refs. At five JSON round-trips per ref, that's over 115,000 `JSON.stringify` + `JSON.parse` calls. The full build took 67 seconds.

We profiled the ref-resolution phase and found the time split roughly between file I/O with YAML parsing and serialization overhead. Build operator evaluation was the worst offender: it ran a full walk on every file's content, even when the file had zero `_build.*` operators. The work compounded with nesting depth. Since refs resolve bottom-up, by the time a parent ref runs its operator pass, its content already includes all resolved children. The walker re-serializes that entire subtree. A grandparent re-serializes it again.

But the speed wasn't the real problem.

## The architecture was the bottleneck

The five-pass pipeline had a deeper flaw: it was indivisible. You couldn't resolve a single page without running the entire build, because each pass operated on the full tree.

**Shallow builds were broken.** Our dev server uses a shallow build that skips page content (blocks, events, layout), resolving only the page-level metadata needed for routing. This should be fast, since it skips most of the tree. But the stop-path logic used a regex to detect when the walker had entered page content: `^pages\.[^.]+\.blocks(\.|$)`. That regex assumed pages were simple array items. When users built their pages array with `_build.array` operators, the path became something like `pages._build.array.concat.0.blocks`. The regex missed it. The shallow build resolved the entire tree, giving no speedup at all.

We could have fixed the regex. But the underlying problem was that stop-path detection was bolted onto a walker that had no understanding of what it was walking. The walker saw JSON nodes, not refs and operators and page boundaries.

## The fix: one walker, one pass

The JSON reviver was never the right tool for async tree resolution. It was a convenient trick that became load-bearing. The fix was a single recursive function that handles everything in one traversal:

```javascript
async function resolve(node, ctx) {
  if (!isObject(node) && !isArray(node)) return node;

  // _ref: load file, resolve its content (top-down detection)
  if (isObject(node) && node._ref !== undefined) {
    return resolveRef(node, ctx);
  }

  // _var: look up in current context's variables
  if (isObject(node) && node._var !== undefined) {
    return resolveVar(node, ctx);
  }

  // Walk children first (bottom-up for operators)
  if (isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      node[i] = await resolve(node[i], ctx.child(`${i}`));
    }
  } else {
    for (const key of Object.keys(node)) {
      node[key] = await resolve(node[key], ctx.child(key));
    }
  }

  // _build.* operator: evaluate after children resolve
  if (isObject(node) && isBuildOperator(node)) {
    return evaluateBuildOperator(node, ctx);
  }

  return node;
}
```

One function, one pass. It detects `_ref` and `_var` top-down (before descending into children), evaluates `_build.*` operators bottom-up (after children resolve), and tags source-file provenance in-place. Since we control the traversal, we can `await` file reads directly. The two-pass find-then-substitute pattern that existed to work around the sync reviver disappears.

A context object carries everything the walker needs: current file path, variable scope, circular reference detection, operator implementations. Each `resolveRef` creates a child context with the referenced file's variables, naturally scoping `_var` lookups without a separate pass.

Seven modules replaced by one walker and a shared `evaluateOperators` function. The build tests exercise nested refs, circular detection, vars, operators, and error provenance, so the new walker slots in at the same entry point with confidence. The rest of the build pipeline is unchanged.

## The numbers

The full build on our largest app (now grown to 26,727 refs):

| Metric | v4.5.2 (old) | v4.7.0 (new) | Change |
|---|---|---|---|
| Ref resolution | 54.8s | 42.8s | -22% |
| Build operators | 2.05s | 0.49s | -76% |
| Total build | 67.2s | 55.0s | -18% |
| Refs resolved | 23,728 | 26,727 | +12.6% |
| Per-ref cost | 2.31ms | 1.60ms | -31% |

An 18% speedup on the full build. The app grew 3,000 refs between versions, so the walker is doing more work in less time. Per-ref cost dropped 31%. Build operator evaluation, the worst offender in the old pipeline, dropped 76%.

We'd hoped for more. With the serialization overhead gone, file I/O and YAML parsing are now the dominant cost. There's room to improve there too (better caching of repeated files, parallelizing reads), and it's still on our radar. But the architectural change already paid for itself in a different way.

## What the walker unlocked

**Shallow builds that work.** The walker knows what it's walking. Instead of a regex guessing whether a JSON path is "inside page content," the walker tracks semantic context: am I inside a page's blocks? Did I enter through a `_build.array`? The stop condition is a function that understands the tree structure, not a pattern match on serialized paths. Shallow builds now correctly skip page content regardless of how pages are constructed.

**JIT page builds.** Because the walker can resolve any subtree independently, the dev server now builds pages on demand. The initial shallow build takes about 21 seconds for this app (resolving 13,451 refs for page metadata). After that, each page builds in 200ms to 1.4 seconds when you navigate to it, with most pages around 600 to 800 milliseconds. The developer gets sub-second feedback instead of waiting for a 55-second full rebuild.

| Build mode | Time |
|---|---|
| Full build | 55s |
| Initial shallow build (dev server) | ~21s |
| Per-page JIT build | 200ms – 1.4s |

That's the number that matters for day-to-day development. Not 67 seconds down to 55, but 67 seconds down to 800 milliseconds for the change you're working on.

**A module system.** We'd long wanted first-class modules for Lowdefy: packaged, reusable config that teams can share across projects. User admin pages, notification systems, CRM components, built once and imported with a few lines of YAML. The old architecture made that impractical. Module resolution needs its own operator family (`_module.var`, `_module.pageId`), its own context (module entry ID, scoped connections, variable scope), and the ability to carry that context through arbitrarily nested refs. Adding all of that as more JSON revivers, on top of five passes that already compounded with nesting depth, would have been both slow and unmaintainable. With the walker's context object, module support is a natural extension: create a module context, let it flow through the traversal.

The JSON reviver trick was genuinely clever. It worked for years. But it was never the right abstraction for async tree resolution. It was a shortcut that became load-bearing infrastructure. Each new feature added "one more pass," and no single pass was the problem. The accumulation was. Replacing it made the build faster, made the architecture simpler, and made features like JIT builds and modules possible for the first time. We're not done optimizing, but we're building on better foundations now.
