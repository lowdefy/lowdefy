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

// The journeys-from-production skill: a thin workflow over the CLI that pulls
// production analytics, finds what real use no journey covers, and turns one
// uncovered item at a time into a proven journey with the developer. It never
// deletes a journey, or proposes deleting one, for lack of production use.
function journeysFromProduction({ appPath }) {
  const cd = appPath === '' ? '' : `cd ${appPath} && `;
  return `---
name: journeys-from-production
description: Use when the developer wants journeys (tests) for what real users do in production, asks which production flows or failures no journey covers, or wants journey evidence refreshed. Pulls production analytics, ranks what is uncovered and proves each new journey with the developer.
---

# Journeys from production

Apps that send analytics with the PostHog plugin can mine journeys (tests in \`tests/journeys/\`)
from what real users do. This skill runs that loop with the developer, one uncovered item at a
time. Run every command below from the app directory (\`${cd}…\`).

You edit candidates; you never write a step the compiler did not produce from production data.
Nothing in this loop deletes a journey, and you never propose deleting one because production
does not use it: a 30-day window cannot see quarterly or yearly work.

## 1. Pull production

Run \`${cd}lowdefy journeys pull posthog --since 30d\`. It writes one file per UTC day to
\`.lowdefy/traces/production/\` and fetches each finished day only once.

If it stops on a missing variable, tell the developer which one and where it comes from, then
wait:

- \`POSTHOG_PROJECT_ID\` and \`POSTHOG_API_HOST\` (an \`https://\` URL such as
  \`https://eu.posthog.com\`): the app's PostHog project, from the team's environment setup for
  local development.
- \`POSTHOG_PERSONAL_API_KEY\`: the developer's own personal API key, created in PostHog under
  personal API keys, scoped to the project with the Query Read scope. They export it in their shell
  or put it in the app's \`.env\`, which is not committed.

Never ask for the key in chat, and never write it to a file yourself.

## 2. Compile candidates

Run \`${cd}lowdefy journeys compile --source production --since 30d\`. It writes candidates to
\`tests/journeys/_candidates/production/\`, which \`lowdefy test\` does not run on its own.

## 3. Find what is uncovered

Run \`${cd}lowdefy journeys coverage --source production\`, then read
\`.lowdefy/test/coverage.json\`. Take uncovered failure paths first
(\`measures.failure.uncovered\`), then uncovered flows (\`measures.flow.uncovered\`), each in the
order the report ranks them. \`production\` holds the flows, failure paths, frustrated blocks, role
matrix and entry points behind them.

## 4. One item at a time

Show the developer the item in plain words: its entry page, its steps, and the sessions, people,
organisations, failures and role sets behind it. Then wait for them before you change anything.

- Name the journey after what the person did, and decide with the developer whether it is one
  journey or two.
- A production \`fill\` has \`value: null, from: shape\`, because typed values are never
  captured. Fill each value from the journey's data set \`fixtures\`; when none fits, add a
  fixture document for the journey rather than borrowing a value from a database snapshot.
- Pick the user from the role matrix: a user whose roles match a role set production shows on
  that page.
- A dead click on a block that should do nothing is a finding for the developer, not a test to
  write. Ask which it is.

## 5. Prove it: three runs

Run \`${cd}lowdefy test --repeat 3 tests/journeys/_candidates/production/<file>.yaml\`. It runs a
journey from any path and records nothing. (\`lowdefy test --filter "<name>"\` only reaches
journeys already in \`tests/journeys/\`.)

- **PASS** (three passes): move the file from \`tests/journeys/_candidates/production/\` to
  \`tests/journeys/\`.
- **FAIL** (three failures): production did this and it breaks now, so it is a finding: a bug or
  a behaviour change. Ask the developer which.
- **FLAKY** (one or two failures): fix the cause, a missing \`wait: { request }\` or a data
  dependency. Never add \`wait: { ms }\`. Then run it three more times.

## 6. Variants

If \`${cd}lowdefy journeys --help\` lists \`variants\`, run
\`${cd}lowdefy journeys variants <file>\` on each promoted journey.

## 7. Refresh evidence and report

Run \`${cd}lowdefy journeys evidence --refresh\`. Report to the developer: the journeys promoted,
the findings, the frustration items for them to look at, and the list of journeys with no
production backing exactly as the command prints it. Make no recommendation to delete any of them.

## PostHog MCP

Use the PostHog MCP only for questions the developer asks while curating: a funnel on one page,
the paths into a page, a heatmap of a block. Never use it to read rows in bulk; the pull does that.

## Leave it for the developer

Commit nothing. Leave the changes on the working branch and a short summary of what was promoted,
dropped and found.
`;
}

export default journeysFromProduction;
