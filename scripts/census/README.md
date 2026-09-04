# Config census

`scripts/census/census.mjs` counts the shape of a Lowdefy config corpus: how much of it is
JavaScript or HTML inside YAML, how many files are longer than a screen, how much of the comment
budget is spent stating rules the config cannot state, and which `_js` helpers have been
hand-copied for want of a module system.

These are the numbers the v2 design's §6 metrics table reports and Appendix A took by hand on
2026-08-30. Hand-run numbers go stale, so the scan is committed here and run per release in the
canary.

```
pnpm census examples/canary-app
pnpm census packages/docs --json
node scripts/census/census.mjs /path/to/app
```

`--json` prints the same result as a JSON object and nothing else. The script has no dependencies
and reads nothing but the YAML files in the directory it is given.

## Definitions

Every number is produced by a line scan, not a YAML parse. That is deliberate: the census measures
the text an author writes and an agent reads, and a parse would erase exactly the thing being
measured (a 40-line block scalar parses to one string).

**YAML files.** Every `*.yaml` and `*.yml` file under the directory, recursively, except those
under a directory named `build`, `coverage`, `dist`, `node_modules`, `snapshots` or `test-results`,
or any directory whose name starts with `.`. Those hold generated or installed files; counting them
would make the census a measure of the toolchain.

**YAML lines.** Every line of those files, including blank lines and comments. A trailing newline
does not add a line, so the count agrees with `wc -l`.

**Blocks.** Several counters need the extent of a mapping key. A key's block is its own line plus
every line below it indented past the key's column, stopping at the first line indented to or past
that column. `- _js: |` puts the key two columns right of the dash, so the column that matters is
the key's, not the line's indentation. A blank line belongs to a block only when a deeper-indented
line follows it.

**`_js` lines.** The lines of every `_js` block, as a set of line numbers rather than a sum of block
lengths — an `_js` nested inside another (an `args:` containing one) is charged once. A `_js` whose
value sits on the key line (`_js: state('a')`, a module reference) counts as one line.

**`_nunjucks` lines.** The same, for `_nunjucks`.

**`Html` blocks / template lines.** `htmlBlocks` counts lines matching `type: Html`. `htmlLines`
counts the lines of every `html:` block — the Html block's template property, and in practice the
only use of that key in Lowdefy config.

**Escape-hatch share.** `(_js lines + Html template lines) / YAML lines`. This is Appendix A's
definition, and its 11.80% is this ratio. `_nunjucks` is reported beside it, and again folded in as
`shareWithNunjucks`, rather than inside the headline number, so the headline stays comparable with
the census that set the target.

**Files over 80 lines.** Files whose line count is greater than 80, and that count as a share of all
YAML files. Appendix A's 41.3% is this ratio.

**Comment lines.** Lines matching `^\s*#` — whole-line comments only; a trailing `# ...` on a config
line is not counted. Note that a repository that puts a licence header on every config file (this
one does) will report a comment density that is mostly header.

**Comment lines saying never/must/because.** Comment lines that also match
`\b(never|must|because|otherwise|so that)\b`, case-insensitively. Appendix A's 682 is this count. It
is the metric that matters: a comment reaching for those words is carrying a rule the framework
did not make expressible.

**`_js` bodies.** The body of every `_js` block that has one (the key line excluded). Normalized
before comparison: the common indentation the YAML nesting imposed is removed, trailing whitespace
per line is removed, and leading and trailing blank lines are dropped. So the same code at two
different nesting depths is one body.

**Duplicated helpers.** Two views of the same absence of a module system, both reporting only what
spans more than one file — a body repeated within one file is a local pattern, not a missing import.

- `duplicateBodies` — normalized `_js` bodies that are identical across files.
- `duplicateHelpers` — names declared inside `_js` bodies (`const NAME = (`, `const NAME = function`,
  `function NAME(`, and the `let`/`var`/`async` variants) that appear in more than one file. This is
  the counter that finds Appendix A's `const esc = (s)`, 47 copies in 36 files: the helper was
  retyped inside otherwise different bodies, so identical-body matching alone would miss it.

Both lists are sorted by copies and truncated to the ten largest.

## Known limits

A line scan cannot tell a config line from a line of documentation about config. An app whose YAML
embeds markdown examples of Lowdefy config in block scalars — `packages/docs` is entirely this —
has those examples counted as if they were its own `_js`, `_nunjucks` and `html`. The census is
still reproducible and still comparable with itself over time; it is a corpus measure of an app, and
the docs app is an app whose corpus happens to be documentation.

## Tests

`pnpm census:test` runs `scripts/census/census.test.mjs` against `scripts/census/fixture/`, a
four-file app carrying one Html template, one `_nunjucks` template, three `_js` blocks (two of which
declare the same `esc` helper in different files), one file over 80 lines, and one YAML file under
`snapshots/` that must not be counted.
