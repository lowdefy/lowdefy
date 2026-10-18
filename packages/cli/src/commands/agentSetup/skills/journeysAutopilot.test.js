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

import skills from './index.js';
import journeysAutopilot from './journeysAutopilot.js';

test('the skill list includes journeys-autopilot with its renderer and AGENTS.md line', () => {
  const entry = skills.find((skill) => skill.name === 'journeys-autopilot');
  expect(entry.render).toBe(journeysAutopilot);
  expect(entry.agentsMdLine).toContain('journeys-autopilot');
});

test('journeys-autopilot renders a frontmatter with its name and description', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill.startsWith('---\nname: journeys-autopilot\ndescription: Use when ')).toBe(true);
  expect(skill).toContain('never deletes or weakens a journey.\n---\n');
});

test('journeys-autopilot bootstraps with Lowdefy-native commands only', () => {
  const skill = journeysAutopilot({ appPath: '' });
  [
    'lowdefy data list',
    'lowdefy journeys scope --json',
    'tests/data/autopilot.yaml',
    'lowdefy test --lint tests/journeys/_candidates',
    'lowdefy test --repeat 3',
    'lowdefy journeys harden --list',
    'lowdefy journeys variants <file>',
    'lowdefy journeys coverage',
  ].forEach((command) => expect(skill).toContain(command));
});

test('journeys-autopilot keeps a ledger with every state and parks findings and flakes outside the suite', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain('tests/autopilot.yaml');
  ['todo', 'covered', 'quarantined', 'finding', 'skipped'].forEach((state) =>
    expect(skill).toContain(`\`${state}\``)
  );
  expect(skill).toContain('tests/journeys/_quarantine/');
  expect(skill).toContain('tests/journeys/_findings/');
});

test('journeys-autopilot is one light agent that never touches production or the default branch', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain('Spawn no sub-agents');
  expect(skill).toContain('kill a process by port or name');
  expect(skill).toContain('Never run anything against production');
  expect(skill).toContain('Never merge, never push to the default branch');
  expect(skill).toContain('Never ask a question mid-run');
  expect(skill).toContain('/loop /journeys-autopilot');
});

test('journeys-autopilot proves before keeping and never weakens or deletes a journey', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain('**PASS** (three in a row)');
  expect(skill).toContain('Assert a real fixture value');
  expect(skill).toContain('Never weaken or delete a journey');
  expect(skill).toContain('Never add `wait: { ms }`');
  expect(skill).not.toMatch(/^\s*(?:-\s*)?(?:\*\*)?(?:delete|remove)\b/im);
  expect(skill).not.toMatch(/\brm\b/);
});

test('journeys-autopilot names the traps and the blocked behaviour', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain('ENOENT on\n  `build/routes.json`');
  expect(skill).toContain('A green run means only that nothing written down broke');
  expect(skill).toContain('at least two rows');
  expect(skill).toContain('explicit `urlQuery` date');
  expect(skill).toContain('blocked: <what failed');
});

test('journeys-autopilot runs commands from the app directory in a monorepo', () => {
  expect(journeysAutopilot({ appPath: 'apps/crm' })).toContain(
    'cd apps/crm && lowdefy journeys scope --json'
  );
});

test('journeys-autopilot resumes one journeys branch from the remote and reads the pull request state', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain('git fetch origin --prune');
  expect(skill).toContain(
    'git worktree add --track -b\n  journeys-autopilot/main ../<repo>-journeys-autopilot origin/journeys-autopilot/main'
  );
  expect(skill).toContain('git merge --ff-only origin/journeys-autopilot/main');
  expect(skill).toContain('Only then is the branch made from the default branch.');
  expect(skill).toContain('Never `git worktree add -B` and never reset over an existing branch.');
  expect(skill).not.toMatch(/worktree add -B journeys-autopilot/);
  expect(skill).toContain('- **Merged**: start the branch afresh from the default branch');
  expect(skill).toContain('- **Closed unmerged**: Blocked. Never reset or re-bootstrap');
  expect(skill).toContain(
    '- **A rejected push** (any other): another runner moved the branch. Blocked, never forced.'
  );
  expect(skill).toContain('git merge-base --is-ancestor <tip> origin/<default branch>');
  expect(skill).toContain(
    '--force-with-lease=journeys-autopilot/main:<old tip> origin journeys-autopilot/main'
  );
});

test('journeys-autopilot caps the one journeys pull request instead of stacking branches', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).not.toContain('journeys-autopilot/<n>');
  expect(skill).not.toMatch(/stack/i);
  expect(skill).toContain('There is never a second journeys branch.');
  expect(skill).toContain("':(exclude)tests/journeys/_*'");
  expect(skill).toContain('only re-check quarantines (the last part of step 7');
  expect(skill).toContain(
    'cycles stop adding journeys: they re-check quarantines, keep the pull request body current,\nand wake rarely until a person merges it.'
  );
});

test('journeys-autopilot reports the pull request text when there is no GitHub remote', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain('With no GitHub remote or no `gh`: push the branch');
  expect(skill).toContain(
    'put\nthe pull request title and body you would have used in the cycle report.'
  );
});

test('journeys-autopilot fixes a finding only after the journeys pull request merged', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain('fix waits for the journeys pull request');
  expect(skill).toContain(
    '`git switch -c journeys-autopilot/fix-<slug>\n  origin/<default branch>`'
  );
  expect(skill).toContain('`git mv tests/journeys/_findings/<file>\n  tests/journeys/<area>/`');
  expect(skill).toContain('origin/<default branch>:tests/journeys/_findings/<file>');
  expect(skill).toContain('Before pushing, run `lowdefy test --repeat 3 <file>`');
  expect(skill).not.toContain('git checkout journeys-autopilot/main --');
  expect(skill).toContain(
    'with no `gh`, push the branch and put\n  that title and body in the cycle report'
  );
});

test('journeys-autopilot hardens with one worker, screenshots with the data set and keeps candidates with mv', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain('lowdefy journeys harden --workers 1');
  expect(skill).toContain('lowdefy_screenshot_page({ pageId, user, data, directory })');
  expect(skill).toContain('move it with plain `mv` into `tests/journeys/<area>/`');
  expect(skill).toContain('so `git mv` fails), then `git add` it');
});

test('journeys-autopilot skips signed-out visitors and never runs journeys as a public role', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain('the reason "signed-out runs stay on the auth harness"');
  expect(skill).toContain('`user: none` on a data set is refused');
  expect(skill).not.toContain('or public');
  expect(skill).toContain('role: admin               # a data set user name\n');
});

test('journeys-autopilot takes secrets from the shell it was started in', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain("start you from a shell that holds the app's secrets");
  expect(skill).toContain('`infisical run -- claude`');
  expect(skill).toContain('you never read, copy or\n  link `.env` and never invent a value');
  expect(skill).toContain('`env -u LOWDEFY_DEV_USER <command>`');
});

test('journeys-autopilot is blocked by a missing variable, a mock user, a closed pull request or a rejected push', () => {
  const skill = journeysAutopilot({ appPath: '' });
  const blocked = skill.slice(skill.indexOf('## Blocked'), skill.indexOf('## Traps'));
  expect(blocked).toContain(
    'a variable the build or server needs is missing from your environment: name it'
  );
  expect(blocked).toContain('say how to\n  start you with it');
  expect(blocked).toContain('a stale `.lowdefy/dev` that a restart does not cure');
  expect(blocked).toContain('(`auth.dev.mockUser`), which refuses every data set journey');
  expect(blocked).toContain('a closed journeys pull request (closed unmerged), or a rejected push');
});

test('journeys-autopilot names secrets by their environment variable and how a missing one shows', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain('`_secret: NAME` reads the variable\n  `LOWDEFY_SECRET_NAME`');
  expect(skill).toContain('"Development server was not ready"');
  expect(skill).toContain('(a `_secret` as\n  `LOWDEFY_SECRET_<NAME>`)');
});

test('journeys-autopilot never lets its branch track the default branch', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain('`git worktree add --no-track -b journeys-autopilot/main');
  expect(skill).toContain('`git switch --no-track -C journeys-autopilot/main');
  expect(skill).toContain('(commit only if that changed the ledger)');
  expect(skill).toContain('(`git push -u origin journeys-autopilot/main`)');
  expect(skill).not.toContain('git switch -C journeys-autopilot/main');
});

test('journeys-autopilot handles findings in a cycle with nothing left to do', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain(
    "When no `todo` items remain, go to step 6\n(a finding's fix may be ready), then step 7."
  );
  expect(skill).toContain('Then handle findings (step 6): their fixes may now go ahead.');
  expect(skill).toContain('fix pull request url (with no `gh`, the\n  fix branch)');
});

test('journeys-autopilot says where harden ids are and what to do with a duplicate variant', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain('`.lowdefy/test/mutation.json`');
  expect(skill).toContain('discard its candidate\nfile, which never joined the suite');
  expect(skill).toContain('wait on a request of the page it\n  lands on');
  expect(skill).toContain('the runner calls every 0/3 run a finding');
});

test('journeys-autopilot extends an existing data set and takes existing journeys into the ledger', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain('it starts `extends: [<name>]` and adds only what that set lacks');
  expect(skill).toContain('never edit\n   the existing file');
  expect(skill).toContain('**Journeys already in the suite**');
  expect(skill).toContain('Never rewrite, move, rename or duplicate one');
  expect(skill).toContain('A failing or flaky one stays where it is');
});

test('journeys-autopilot never edits a developer journey when a variant grants a role', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain("`note: developer's journey`");
  expect(skill).toContain("A developer's journey is never edited");
  expect(skill).toContain('its granted role becomes a journey of its own instead');
  expect(skill).toContain('gets no tenant variant');
});

test('journeys-autopilot runs the whole suite on a fix branch before pushing it', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain(
    'then the whole suite once\n  (`lowdefy test`: a fix can break a journey'
  );
});

test('journeys-autopilot picks the dev script when several run lowdefy dev, never a production one', () => {
  const skill = journeysAutopilot({ appPath: 'apps/crm' });
  expect(skill).toContain('2. **Pick the dev script.**');
  expect(skill).toContain(
    '### 2. Bootstrap\n\nOnly when there is no `tests/autopilot.yaml`, or it has no `items` yet because bootstrap stopped\nas Blocked.'
  );
  expect(skill).toContain('`Several package.json scripts run "lowdefy dev" (...)`');
  expect(skill).toContain(
    "choose one of the scripts that refusal lists\n   (the scripts in `apps/crm`'s `package.json`"
  );
  expect(skill).toContain("a wrapper's `--env=prod`). Never\n     pick one of these.");
  expect(skill).toContain('a `d` suffix such as `ldf:d` beside\n     `ldf:p`');
  expect(skill).toContain('`cli: { devScript: <script> }`. Commit it with the ledger');
  expect(skill).toContain('name the\n     script and why in the pull request');
  expect(skill).toContain(
    '7. Commit the data set, ledger, first journey and `cli.devScript` if you set one.'
  );
  const blocked = skill.slice(skill.indexOf('## Blocked'), skill.indexOf('## Traps'));
  expect(blocked).toContain(
    'several `package.json` scripts run `lowdefy dev` and none is clearly the development one'
  );
});
