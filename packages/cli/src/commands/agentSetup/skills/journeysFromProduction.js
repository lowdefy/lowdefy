/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

// The journeys-from-production skill: the coding agent mines journeys from
// production analytics. It picks the window, pulls and measures, then reads
// each session's log (or, at scale, the grouped flows) with the app's config
// and code to decide what it means and whether it deserves a journey, writes
// that journey and proves it. It never reads raw
// production text: the pull stores clicked text as tokens, and the CLI turns a
// token back into text only when it is the app's config text. It never
// deletes a journey, or proposes deleting one, for lack of production use.
// After refreshing evidence it compares the usage report before and after,
// and reports the old flows users still follow and how the tiers moved; it
// may suggest the developer delete an old flow that shows no use, and never
// deletes one itself.
function journeysFromProduction({ appPath }) {
  const cd = appPath === '' ? '' : `cd ${appPath} && `;
  return `---
name: journeys-from-production
description: Use when the developer wants journeys (tests) for what real users do in production, asks which production flows or failures no journey covers, or wants journey evidence refreshed. Pulls production analytics, reads each session's log with the app's config and code, and writes and proves the journeys that deserve one.
---

# Journeys from production

Apps that send analytics with the PostHog plugin can mine journeys (tests in \`tests/journeys/\`)
from what real users do. In this skill you, not a rule, decide what each recorded routine means
and which ones deserve a journey, by reading them next to the app's config and code. Run every
command below from the app directory (\`${cd}…\`).

You write the journeys, from what the sessions show; the runner decides whether they pass. Write
no interaction a session did not show. Nothing in this loop deletes a journey,
and you never propose deleting one because production does not use it: a 30-day window cannot
see quarterly or yearly work. Nothing in it deletes a journey's deprecated flows either.

## What you read, and what you never read

Production text never enters this conversation. The pull stores every clicked text as a token
(\`t_\` and 16 hex characters); the CLI turns a token back into text only when it is text from
the app's config (a button label, a menu item, an option label, a message). Everything else, a
customer's name in a grid cell or a label built from values, stays a token.

Read: the day files and manifests in \`.lowdefy/traces/production/\` (tokens), the session logs,
\`.lowdefy/test/coverage.json\`, command output, the app's config and code, and the dev server's
\`/lowdefy-docs\` routes when one is running.

Never:

- read \`.lowdefy/traces/production/salt\`, the app's \`.env\` or any credential;
- read \`.lowdefy/data/\` snapshots;
- call PostHog through its MCP, its API or a URL, or run HogQL;
- add text to the config to resolve a token, or write a guessed value into a journey to see what
  production showed.

## 1. Pick the window

A mining window is at most 30 UTC days; the commands refuse a longer one. Pick it for the
question you are answering, and say which and why in your report:

- everyday use: the last 30 days, \`--since 30d\`;
- a regression: from the first day of the deploy that changed it, \`--from <day> --to <day>\`;
- a periodic process (month-end, payroll): the days around it.

## 2. Pull and measure

Run, with your window:

1. \`${cd}lowdefy journeys pull posthog --since 30d\`: one file per UTC day in
   \`.lowdefy/traces/production/\`; each finished day is fetched once.
2. \`${cd}lowdefy journeys coverage --source production --since 30d\`: what no journey covers
   yet, in \`.lowdefy/test/coverage.json\`. Its \`flowGrouping\` says whether the window was
   large enough (100,000 rows or more) to group sessions into flows.

The session reader, coverage and evidence build the app once to collect its config text (cached until the
config changes): if they say to run \`lowdefy dev\` first, or list config errors, tell the
developer.

If the pull stops on a missing variable, tell the developer which one and where it comes from,
then wait:

- \`POSTHOG_PROJECT_ID\` and \`POSTHOG_API_HOST\` (an \`https://\` URL such as
  \`https://eu.posthog.com\`): the app's PostHog project, from the team's environment setup for
  local development.
- \`POSTHOG_PERSONAL_API_KEY\`: the developer's own personal API key, created in PostHog under
  personal API keys, scoped to the project with the Query Read scope. They export it in their shell
  or put it in the app's \`.env\`, which is not committed.

Never ask for the key in chat, and never write it to a file yourself.

## 3. Read the sessions

Below 100,000 rows, read the sessions one by one:

- \`${cd}lowdefy journeys session --source production --since 30d\` lists the window's sessions,
  newest first, with their pages, interactions and failures. Start with the ones that failed,
  then the uncovered failure paths in \`coverage.json\` (\`measures.failure.uncovered\`).
- \`${cd}lowdefy journeys session --source production --since 30d <id>\` prints one session as a
  log, one line per interaction with what the app did in response, for example
  \`click save → Validate failed [priority]\`. Production records no typed values, so a
  \`fill\` line names the control only; a click on text that is not config text reads
  \`(text not in config)\`; \`(dead click)\` and \`(rage click)\` mark frustrated clicks.

From 100,000 rows on, nobody can read them one by one: read the grouped flows instead, in
\`measures.flow.uncovered\` of \`coverage.json\` and the uncovered flows \`lowdefy journeys usage\`
lists, and print a session of a flow you need in detail. (\`--group\` and \`--no-group\` on
\`journeys coverage\` force grouping either way.)

For each session or flow, read the page's config, the requests and actions it runs, and the block
plugins' code, and work out:

- what the person was doing, in plain words;
- what each click without config text is. \`production.textTokens\` in \`coverage.json\` gives,
  per page, block and column, the clicks, the distinct tokens and the most-clicked tokens with how
  many people clicked each. One token clicked by many people on a button reads as a label built
  from values ("Open (3)"); hundreds of tokens on a grid column read as data rows;
- which steps are incidental (a stray click, a focus, a reopened menu).

## 4. Decide what deserves a journey

Take them in this order:

1. failures: uncovered failure paths and sessions that failed;
2. routines that write data, move money, change access or end a process;
3. the rest, by how often production showed them (how many sessions did the same, or a grouped
   flow's \`count\`).

Skip a routine that is incidental, duplicates a committed journey, or tests nothing the app does,
and note why.

## 5. Write the journeys

- Write each one in \`tests/journeys/\`, named after what the person did (\`name\`, at most 100
  characters), and decide whether it is one journey or two. Its steps follow the session: the
  same targets, in the same order.
- Typed values are never captured in production, so a \`fill\` line has no value. Take each value
  from the journey's data set \`fixtures\`; when none fits, add a fixture document for the
  journey rather than borrowing a value from a database snapshot.
- Re-target a click on a data row to a row of fixture data, and fill a tokenised option pick from
  the fixtures or the config's options.
- Write a label you read in the config where it tells two controls in one block apart. A click on
  a label built from values stays without text.
- A production click carries no \`nth\`: analytics cannot say which of several controls with the
  same label was clicked. Where a step's \`text\` or \`containing\` target can match more than
  one control (a grid's per-row Edit, a list's Delete), narrow it from what the routine did: the
  \`blockId\` it was in, the \`row\` of fixture data it worked on, or \`containing\` the text
  that row shows. Add \`nth\` only when the config shows which control it must be. A target that
  still matches several controls fails the run rather than clicking the first.
- Pick the user from the role matrix: a user whose roles match a role set production shows on
  that page.
- Add waits and expectations from the code: a \`wait: { request }\` for the request a step runs,
  an \`expect\` for what it changes.
- Never add an interaction the session did not show.

## 6. Prove it

Run \`${cd}lowdefy test --repeat 3 tests/journeys/<file>.yaml\`. It records nothing.

- **PASS** (three passes): keep it.
- **FAIL** (three failures): read the failure. A step you wrote wrong, fix and run again. A
  journey that does what production did and still fails is a finding (a bug or a behaviour
  change): show the developer the journey and its failing step, and let them decide whether it
  stays as a failing test until the bug is fixed.
- **FLAKY** (one or two failures): fix the cause, a missing \`wait: { request }\` or a data
  dependency. Never add \`wait: { ms }\`. Then run it three more times.

If \`${cd}lowdefy journeys --help\` lists \`variants\`, run
\`${cd}lowdefy journeys variants <file>\` on each journey you kept.

Then refresh evidence, with the usage report on either side of it:

1. \`${cd}lowdefy journeys usage --json\`: keep its \`rows\` as the tiers before the refresh.
2. \`${cd}lowdefy journeys evidence --refresh\`: counts each journey's production use by
   calendar month. When a journey's steps changed what it matches, its counted months move to a
   deprecated flow under \`evidence.production.deprecated\`, which is never run and is still
   counted.
3. \`${cd}lowdefy journeys usage --json\` again: the tiers after it.

Compare the two by \`file\` and \`journeyIndex\`. Each row has the journey's \`tier\`, \`rank\`,
\`rate\` (sessions a day over the usage window, the last \`windowMonths\`), \`unranked\` (no counts
for its current steps yet) and \`deprecatedFlows\`, each with \`replaced\`, \`counted\` and, when
counted, its \`rate\` and \`sessions\` over the same window. The report holds config text and
tokens only, like the rest of what you read.

## 7. Report

Tell the developer:

- the window and why you chose it;
- the journeys you wrote and what each covers;
- what you skipped and why;
- the findings: failures that reproduce, behaviour changes, and dead clicks. A dead click on a
  block that should do nothing is a finding for the developer, not a test to write;
- the deprecated flows still in use: each counted one with \`sessions\` above 0 in the window,
  with its \`rate\` and when it was \`replaced\`, naming the journey whose current steps
  replaced it (its row). Users still following an old flow after the change shipped is worth the
  developer's attention. A deprecated flow with no sessions in the window may be deleted by hand
  from the journey's evidence; you may suggest that, and leave it to the developer;
- how the tiers moved: the journeys whose \`tier\` changed, before and after (a journey unranked
  before the refresh and ranked after it counts), and the journeys still \`unranked\` after it,
  which have no counts for their current steps yet (the cache held no final day for them);
- the journeys with no production backing exactly as \`journeys evidence\` prints them.
  Make no recommendation to delete any of them.

The developer reviews the diff and the report; ask them only about findings and dead clicks.

## Leave it for the developer

Commit nothing. Leave the changes on the working branch.
`;
}

export default journeysFromProduction;
