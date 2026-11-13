# Linting and formatting

How ESLint and Prettier are set up in the monorepo, and why. Most code here is written by
coding agents, so the setup is built for them: every rule is an `error` or `off` (no
warnings, which agents and CI both learn to ignore), every report should be a real problem,
and the messages of the repository's own rules say what to write instead.

## Commands

```bash
pnpm exec eslint <files>        # the files you changed, under a second
pnpm exec eslint --fix <files>  # also applies the fixable rules
pnpm lint                       # the whole repository, about 10 seconds
pnpm lint:fix                   # the whole repository, with fixes
pnpm format                     # Prettier, writing every JS file
pnpm format:check               # Prettier, checking only
pnpm test:lint-rules            # tests of the local rules in scripts/eslint-rules/
```

The repository is not lint clean yet, and CI runs neither lint nor the format check. Lint the
files you change and fix what it reports in them. Prettier is clean: keep it that way.

When a rule is wrong for one line, disable it for that line and say why after `--`:

```javascript
// eslint-disable-next-line playwright/no-wait-for-timeout -- nothing to wait on: checks that no menu opens
await page.waitForTimeout(500);
```

A disable comment that no longer suppresses anything is itself an error
(`reportUnusedDisableDirectives`), so stale ones get removed.

## Files

| File                                 | What                                                                  |
| ------------------------------------ | --------------------------------------------------------------------- |
| `eslint.config.mjs`                  | The root flat config: ignores, rules, globals per runtime, Playwright |
| `packages/website/eslint.config.mjs` | Spreads the root config and adds `@next/eslint-plugin-next`           |
| `scripts/eslint-rules/`              | Local rules for this repository's conventions, with RuleTester tests  |
| `.prettierrc`                        | Prettier options (100 columns, single quotes, ES5 trailing commas)    |
| `package.json` (root)                | `lint`, `lint:fix`, `format`, `format:check`, `test:lint-rules`       |

ESLint 10 looks up the config from each linted file's directory, so files under
`packages/website/` get the website config whether ESLint runs from the root or from the
website (`npm run lint` there). The website is in the pnpm workspace and also keeps its own
`package-lock.json` for its deploy: update both when its ESLint version changes.

Prettier runs on its own, not through ESLint, and formats `**/*.{js,jsx,mjs,cjs}` (it skips
what `.gitignore` lists). None of the ESLint rules in use conflict with it, so there is no
`eslint-config-prettier`.

## Rules

The base is ESLint's `recommended` set. On top of it:

- **Bugs**: `array-callback-return` (a `map` callback that returns nothing), `eqeqeq` (except
  against `null`, see below), `no-self-compare`, `no-template-curly-in-string` (`'${x}'` in a
  plain string), `no-throw-literal`, `no-unreachable-loop`, `no-unused-expressions`,
  `no-use-before-define` (same-scope use before a `let`/`const`, which throws),
  `prefer-promise-reject-errors`, `no-eval`, `no-implied-eval`.
- **CLAUDE.md conventions**: `no-nested-ternary`, `prefer-const`, `no-var`, top-level
  functions as declarations (`no-restricted-syntax`), `type.isNone()` instead of `== null`
  (`no-restricted-syntax`; plain `eqeqeq` would push `!== null`, which stops catching
  `undefined`), the license header and `.js` extensions on relative imports (local rules).
- **`no-console`**: `console.log` and friends are errors in library code, where they are
  usually leftover debugging; `console.warn` and `console.error` are allowed. Off in scripts,
  `.mjs` tooling, the servers' `lowdefy/` build scripts, the logger, tests and e2e.
- **`no-unused-vars`**: names starting with `_` are ignored; unused `catch` bindings are
  reported (write `catch {}`); rest siblings are ignored, so `const { drop, ...rest } = obj`
  is fine.
- **React hooks**: `rules-of-hooks`, plus the React Compiler rules that report real bugs here:
  `set-state-in-render`, `error-boundaries`, `void-use-memo` and `globals` (a component writing
  module state). `exhaustive-deps` is off: most of what it reports in this codebase are
  deliberate dependency lists (mount-only effects, the stable `methods` object), and adding
  the "missing" dependencies changes behaviour. The other compiler rules (`refs`,
  `immutability`, `set-state-in-effect`, `purity`, `static-components`, the memoization
  diagnostics) are off: they check what the React Compiler needs, which this repository does
  not use, and they report hundreds of working patterns (the latest-value ref, the table's
  mutable `api` object).
- **Playwright** (`*.e2e.spec.js`): the plugin's recommended set, every rule an error, so new
  `waitForTimeout`, `{ force: true }` and conditional assertions are caught.
  `expect-expect` knows the block helpers' assertion names, `no-skipped-test` allows a
  conditional `test.skip(condition, reason)`, and `prefer-locator` is off (it reports any
  variable named `page*`).
- **Directives**: unused `eslint-disable` comments and unused inline config are errors.

Considered and left out, with what they reported when tried: `no-await-in-loop` (500+, mostly
deliberate sequential work), `no-promise-executor-return` (230+, the
`new Promise((resolve) => setTimeout(resolve, ms))` idiom), `require-atomic-updates` (140+,
property writes after an `await` that are not races), `func-style` (only flags function
expressions; the top-level rule above covers the convention), `no-loop-func` and
`no-unmodified-loop-condition` (closures and flags changed by other code, not bugs),
`default-param-last`, `no-new-func` (the build evaluates generated modules on purpose),
`no-param-reassign` (build functions mutate `components` by design) and typed linting with
typescript-eslint (see below).

### Local rules

`scripts/eslint-rules/` holds three rules, exported as the `lowdefy-repo` plugin:

- `license-header`: the Apache header must be the file's first comment, after any shebang.
  The end year is not checked, since every file's year is bumped together each January and a
  current-year check would fail the whole repository on 1 January. `--fix` inserts the header
  with the current year. Off for tool config files, `__mocks__` and the website.
- `relative-import-extension`: a relative import, export or `import()` needs a file
  extension, which Node's ES module loader requires (a bundler or vitest hides the mistake
  until the package is published). `--fix` adds `.js`, `.jsx`, `.mjs`, `.cjs` or `/index.js`
  when exactly one exists on disk. Off for the website (Next.js resolves without one).
- `react-in-jsx-scope`: packages build with swc and test with vitest using the classic JSX
  runtime (`.swcrc`, the vitest `oxc` options), where `<Foo />` compiles to
  `React.createElement`, so `React` must be imported wherever there is JSX. ESLint 10 tracks
  JSX element names but not the classic runtime's `React`, so the rule also marks `React` as
  used; without it `no-unused-vars` reports the import, and removing it breaks the package.
  `{ runtime: 'automatic' }` (the Expo shell, the Vite-built servers, the website) only marks
  it as used.

## Globals per runtime

Each file gets the globals of where it runs, so `no-undef` catches `window` in server code,
`__dirname` or `require` in an ES module, and a vitest function used without importing it.
The groups are lists of globs at the top of `eslint.config.mjs`:

| Group                                                                                 | Globals                                         |
| ------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Browser source (client, layout, web blocks, actions, block-utils, servers' `client/`) | browser, `process.env.NODE_ENV` only            |
| Node source (api, build, cli, connections, node-utils, servers' `src/` and others)    | Node's ES module globals (`nodeBuiltin`)        |
| React Native (shell, client-native, layout-native, blocks-native, style-native)       | `react-native`                                  |
| Shared (engine, operators, helpers, servers' `lib/`, anything not listed)             | browser and Node's ES module globals            |
| CommonJS (`*.cjs`, the shell's root files and `native/`)                              | Node with `require`, `module`, `__dirname`      |
| Vitest tests (`*.test.*`, `test/`, `tests/`, `test-utils/`, `__mocks__/`)             | browser and Node; vitest functions are imported |
| Jest tests (the five React Native packages)                                           | Jest and Node                                   |
| Playwright e2e (`e2e/`, `*.e2e.spec.js`, e2e-utils, the table bench)                  | browser and Node (`page.evaluate` callbacks)    |

Browser code may read `process.env.NODE_ENV`, which Vite replaces at build time; any other
`process` access is reported. A new package belongs in one of the lists; one that is in none
gets the shared globals.

## Typed linting

typescript-eslint can lint JavaScript with type information (`allowJs`), which enables rules
such as `no-floating-promises` and `no-misused-promises`. Tried on api, engine, build and
client (1,400 files, about 6 seconds), it reported 20 problems: deliberate fire-and-forget calls
(background endpoint scheduling, script entry points, index creation at start-up) and async
callbacks passed to timers and click handlers. Those checked handle their errors inside the
called function, so none was an unhandled rejection. It would need TypeScript and a
`tsconfig` covering the workspace, `void` on every deliberate fire-and-forget call, and it
still sees `any` across most module boundaries of an untyped JavaScript codebase. It is left
out.
