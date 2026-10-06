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

import { createRequire } from 'module';
import { Command, InvalidArgumentError, Option } from 'commander';

import agentSetup from './commands/agentSetup/agentSetup.js';
import agentSetupUser from './commands/agentSetup/agentSetupUser.js';
import build from './commands/build/build.js';
import dataList from './commands/data/list.js';
import dataPull from './commands/data/pull.js';
import dev from './commands/dev/dev.js';
import dockerOutput from './commands/dockerOutput/dockerOutput.js';
import emails from './commands/emails/emails.js';
import hubLogs from './commands/hub/hubLogs.js';
import hubPrune from './commands/hub/hubPrune.js';
import hubPs from './commands/hub/hubPs.js';
import hubServe from './commands/hub/hubServe.js';
import hubStart from './commands/hub/hubStart.js';
import hubStatus from './commands/hub/hubStatus.js';
import hubStop from './commands/hub/hubStop.js';
import hubTrust from './commands/hub/hubTrust.js';
import hubTrusted from './commands/hub/hubTrusted.js';
import hubUntrust from './commands/hub/hubUntrust.js';
import init from './commands/init/init.js';
import initDocker from './commands/init-docker/initDocker.js';
import initVercel from './commands/init-vercel/initVercel.js';
import journeysCompile from './commands/journeys/journeysCompile.js';
import journeysHarden from './commands/journeys/harden/journeysHarden.js';
import journeysVariants from './commands/journeys/variants/journeysVariants.js';
import journeysRecordings from './commands/journeys/journeysRecordings.js';
import journeysCoverage from './commands/journeys/journeysCoverage.js';
import journeysEvidence from './commands/journeys/journeysEvidence.js';
import journeysUsage from './commands/journeys/journeysUsage.js';
import journeysExplore from './commands/journeys/explore/journeysExplore.js';
import journeysPullPosthog from './commands/journeys/pull/journeysPullPosthog.js';
import journeysScope from './commands/journeys/scope/journeysScope.js';
import mcp from './commands/mcp/mcp.js';
import start from './commands/start/start.js';
import test from './commands/test/test.js';
import upgrade from './commands/upgrade/upgrade.js';
import vercelOutput from './commands/vercelOutput/vercelOutput.js';
import runCommand from './utils/runCommand.js';
import runHubCommand from './utils/runHubCommand.js';

const require = createRequire(import.meta.url);

const packageJson = require('../package.json');
const { description, version: cliVersion } = packageJson;

function parsePid(value) {
  const pid = Number(value);
  if (!Number.isInteger(pid) || pid <= 0) {
    throw new InvalidArgumentError('Expected a process id.');
  }
  return pid;
}

// A repeatable option: each use adds its value to the list.
function collectValues(value, previous) {
  return [...(previous ?? []), value];
}

const program = new Command();

program.name('lowdefy').description(description).version(cliVersion, '-v, --version');

const options = {
  configDirectory: new Option(
    '--config-directory <config-directory>',
    'Change config directory. Default is the current working directory.'
  ).env('LOWDEFY_DIRECTORY_CONFIG'),
  devDirectory: new Option(
    '--dev-directory <dev-directory>',
    'Change the development server directory. Default is "<config-directory>/.lowdefy/dev".'
  ).env('LOWDEFY_DIRECTORY_DEV'),
  disableTelemetry: new Option('--disable-telemetry', 'Disable telemetry.').env(
    'LOWDEFY_DISABLE_TELEMETRY'
  ),
  exitWithPid: new Option(
    '--exit-with-pid <pid>',
    'Stop the server when the process with this id exits. For test runners and scripts that start the server.'
  ).argParser(parsePid),
  logLevel: new Option(
    '--log-level <level>',
    'The minimum severity of logs to show in the CLI output.'
  )
    .choices(['error', 'warn', 'info', 'debug'])
    .default('info')
    .env('LOWDEFY_LOG_LEVEL'),
  mockUser: new Option(
    '--mock-user [user]',
    'Start the dev server authenticated as a mock user (auth.dev.mockUser). Pass a JSON user object to set identity/roles, e.g. \'{"sub":"dev","roles":["admin"]}\'. Bare flag uses a default roleless user. Dev only.'
  ).env('LOWDEFY_DEV_USER'),
  port: new Option(
    '--port <port>',
    'Change the port the development server is hosted at. Default is 3000.'
  ).env('PORT'),
  projectDirectory: new Option(
    '--project-directory <project-directory>',
    'Change the directory where agent files (.mcp.json, AGENTS.md, Claude Code skill) are written. Default is the nearest ancestor directory containing .git, falling back to the config directory.'
  ).env('LOWDEFY_DIRECTORY_PROJECT'),
  refResolver: new Option(
    '--ref-resolver <ref-resolver-function-path>',
    'Path to a JavaScript file containing a _ref resolver function to be used as the app default _ref resolver.'
  ),
  serverDirectory: new Option(
    '--server-directory <server-directory>',
    'Change the server directory. Default is "<config-directory>/.lowdefy/server".'
  ).env('LOWDEFY_DIRECTORY_SERVER'),
  watch: new Option(
    '--watch <paths...>',
    'A list of paths to files or directories that should be watched for changes. Globs are supported. Specify each path to watch separated by spaces.'
  ),
  watchIgnore: new Option(
    '--watch-ignore <paths...>',
    'A list of paths to files or directories that should be ignored by the file watcher. Globs are supported. Specify each path to watch separated by spaces.'
  ),
};

program
  .command('agent-setup')
  .description(
    'Set up this project for AI coding agents (.mcp.json, AGENTS.md, Claude Code skill).'
  )
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(options.projectDirectory)
  .option(
    '--user',
    'Register lowdefy mcp for every Claude Code session of this user instead of setting up this project. Needs no app.'
  )
  .action(function runAgentSetup(options, command) {
    // --user works outside any app, so it skips runCommand's app start-up.
    if (options.user) {
      return runHubCommand({ cliVersion, handler: agentSetupUser })(command);
    }
    return runCommand({ cliVersion, handler: agentSetup })(options, command);
  });

program
  .command('build')
  .description('Build a Lowdefy production app.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .option('--no-client-build', 'Do not run the Vite client build.')
  .addOption(new Option('--no-next-build', 'Deprecated alias of --no-client-build.').hideHelp())
  .addOption(options.refResolver)
  .addOption(
    new Option(
      '--server <server>',
      'Server package variant. Use "e2e" for @lowdefy/server-e2e.'
    ).choices(['e2e'])
  )
  .addOption(options.serverDirectory)
  .action(runCommand({ cliVersion, handler: build }));

const data = program
  .command('data')
  .description('Manage journey data sets (tests/data/<name>.yaml).');

data
  .command('pull')
  .description(
    "Copy a snapshot of a data set's listed connections from a pre-production environment into .lowdefy/data/<name>, guarded by that environment's guards.secrets pins. Run it with the environment's secrets, e.g. infisical run --env=staging -- lowdefy data pull staging-sample."
  )
  .argument('<name>', 'The data set name (tests/data/<name>.yaml).')
  .usage('<name> [options]')
  .addOption(options.configDirectory)
  .addOption(options.devDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(options.refResolver)
  .action((name, commandOptions, command) =>
    runCommand({
      cliVersion,
      handler: ({ context }) => dataPull({ context, name }),
    })(commandOptions, command)
  );

data
  .command('list')
  .description('List the data sets in tests/data and the age of each pulled snapshot.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .action(runCommand({ cliVersion, handler: dataList }));

program
  .command('dev')
  .description('Start a Lowdefy development server.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.devDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.exitWithPid)
  .addOption(options.logLevel)
  .addOption(options.mockUser)
  .option('--no-open', 'Do not open a new tab in the default browser.')
  .addOption(options.port)
  .addOption(options.refResolver)
  .addOption(options.watch)
  .addOption(options.watchIgnore)
  .action(runCommand({ cliVersion, handler: dev }));

program
  .command('emails')
  .description('Preview notification emails with the React Email preview server.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(
    new Option(
      '--port <port>',
      'Change the port the email preview server is hosted at. Default is 3001.'
    ).env('PORT')
  )
  .addOption(options.refResolver)
  .addOption(options.serverDirectory)
  .action(runCommand({ cliVersion, handler: emails }));

program
  .command('docker-output')
  .description('Assemble a minimal Docker runtime (.lowdefy/docker) from a built app.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(options.serverDirectory)
  .action(runCommand({ cliVersion, handler: dockerOutput }));

const hub = program
  .command('hub')
  .description(
    'Manage the Lowdefy hub, the per-user process that runs dev servers for coding agents.'
  );

hub
  .command('status')
  .description('List the dev servers the hub runs.')
  .action(runHubCommand({ cliVersion, handler: hubStatus }));

hub
  .command('start')
  .description('Start (or return) the dev server for an app, run by the hub.')
  .argument('[directory]', 'The app directory. Default is the current working directory.')
  .option('--restart', 'Restart the dev server if it is running.')
  .option('--clean', 'Delete the build directory before starting.')
  .action(runHubCommand({ cliVersion, handler: hubStart }));

hub
  .command('stop')
  .description('Stop a dev server the hub runs. Servers started in a terminal are never stopped.')
  .argument('[directory]', 'The app directory. Default is the current working directory.')
  .option('--all', 'Stop every dev server the hub runs.')
  .action(runHubCommand({ cliVersion, handler: hubStop }));

hub
  .command('logs')
  .description('Print the recent output of a dev server the hub runs.')
  .argument('[directory]', 'The app directory. Default is the current working directory.')
  .option('--lines <lines>', 'How many lines.', '100')
  .option('--grep <text>', 'Only lines containing this text.')
  .action(runHubCommand({ cliVersion, handler: hubLogs }));

hub
  .command('ps')
  .description('List the Lowdefy servers running on this machine, with the process that owns each.')
  .action(runHubCommand({ cliVersion, handler: hubPs }));

hub
  .command('prune')
  .description(
    'Stop Lowdefy servers whose owner is gone. Lists them only, unless --kill is passed.'
  )
  .option('--kill', 'Stop the servers instead of listing them.')
  .action(runHubCommand({ cliVersion, handler: hubPrune }));

hub
  .command('trust')
  .description(
    "Let lowdefy mcp start and query this repository's dev servers from any agent session, not only sessions started in it. Covers all of its git worktrees."
  )
  .argument(
    '[directory]',
    'A directory in the repository. Default is the current working directory.'
  )
  .action(runHubCommand({ cliVersion, handler: hubTrust }));

hub
  .command('untrust')
  .description('Remove a repository from the list hub trust adds to.')
  .argument(
    '[directory]',
    'A directory in the repository. Default is the current working directory.'
  )
  .action(runHubCommand({ cliVersion, handler: hubUntrust }));

hub
  .command('trusted')
  .description('List the repositories any agent session may use.')
  .action(runHubCommand({ cliVersion, handler: hubTrusted }));

hub
  .command('serve', { hidden: true })
  .description('Run the hub in the foreground. Started automatically when needed.')
  .action(runHubCommand({ cliVersion, handler: hubServe }));

const journeys = program
  .command('journeys')
  .description(
    'Compile candidate journeys from recorded traces, report how real use backs them, harden journeys and write their variants.'
  );

journeys
  .command('compile')
  .description(
    'Compile recorded traces into candidate journeys under tests/journeys/_candidates/<source>/.'
  )
  .usage('[options] [traceFiles...]')
  .argument('[traceFiles...]', 'Trace files (JSONL) to compile, wherever they are.')
  .addOption(options.configDirectory)
  .addOption(options.devDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(
    new Option(
      '--source <source>',
      'The trace source: production, dev or explorer. Required unless trace files are given; with files, compiles only records of this source.'
    )
  )
  .addOption(
    new Option(
      '--since <since>',
      'Records at or after this time: a duration back from now (30m, 2h, 7d) or an ISO date. Production default: 30d.'
    )
  )
  .addOption(
    new Option('--from <date>', 'Production only: the first UTC day of the window, YYYY-MM-DD.')
  )
  .addOption(
    new Option('--to <date>', 'Production only: the last UTC day of the window, YYYY-MM-DD.')
  )
  .addOption(
    new Option(
      '--build <build>',
      'Only segments whose records all ran on this build; "current" is the build the running dev server serves.'
    )
  )
  .addOption(new Option('--page <pageId>', 'Only segments that visit this page.'))
  .addOption(
    new Option(
      '--out <directory>',
      'The candidates directory; the source is appended. Default is "tests/journeys/_candidates".'
    )
  )
  .action(runCommand({ cliVersion, handler: journeysCompile }));

journeys
  .command('harden')
  .description(
    "Break the config on purpose, one change at a time and only in the journeys' own browsers, and report each change no journey noticed."
  )
  .usage('[options] [paths...]')
  .argument(
    '[paths...]',
    'Journey files, directories or quoted globs to harden instead of the whole suite, anywhere under the config directory.'
  )
  .addOption(options.configDirectory)
  .addOption(options.devDirectory)
  .addOption(options.disableTelemetry)
  .addOption(new Option('--filter <name>', 'Only journeys whose name contains this string.'))
  .addOption(options.logLevel)
  .addOption(
    new Option(
      '--page <pageId...>',
      'Only mutants on these pages, and endpoint mutants a journey touching them called.'
    )
  )
  .addOption(
    new Option(
      '--operators <operators>',
      'Only these operators, comma separated: drop-action, skip-validate, flip-visible, swap-if, drop-payload, retarget-link, drop-block, drop-step.'
    )
  )
  .addOption(new Option('--max <n>', 'Run at most n mutants (0: no cap). Default 200.'))
  .addOption(
    new Option('--seed <n>', 'The sample seed: another seed draws another sample. Default 0.')
  )
  .addOption(new Option('--workers <n>', 'Journey runs at once (1 to 16). Default 4.'))
  .addOption(new Option('--mutant <id>', 'Run only this mutant, against the journeys on its path.'))
  .addOption(new Option('--list', 'List the sampled mutants and the time estimate, run nothing.'))
  .addOption(new Option('--json', 'Print the report as JSON.'))
  .addOption(options.port)
  .addOption(options.refResolver)
  .addOption(
    new Option(
      '--url <url>',
      'Run against an already running dev server instead of starting one, e.g. http://localhost:3000.'
    )
  )
  .action((paths, commandOptions, command) =>
    runCommand({ cliVersion, handler: journeysHarden })({ ...commandOptions, paths }, command)
  );

journeys
  .command('variants')
  .description(
    'Write edge-case candidates of a journey (other roles, another organization, empty and large data, bad input, a reload mid-flow, a double click) to tests/journeys/_candidates/variants/ and replay each three times.'
  )
  .usage('[options] <file>')
  .argument('<file>', 'The journey file to vary.')
  .addOption(options.configDirectory)
  .addOption(options.devDirectory)
  .addOption(options.disableTelemetry)
  .addOption(new Option('--name <journey>', 'The journey to vary, when the file holds several.'))
  .addOption(
    new Option(
      '--kinds <kinds>',
      'Only these kinds, comma separated: role, tenant, empty, volume, negative, interrupt, double-submit.'
    )
  )
  .addOption(new Option('--empty-data <name>', 'The data set an empty variant runs on.'))
  .addOption(new Option('--volume-data <name>', 'The data set a volume variant runs on.'))
  .addOption(new Option('--no-run', 'Write the variants without replaying them.'))
  .addOption(options.logLevel)
  .addOption(options.port)
  .addOption(options.refResolver)
  .addOption(
    new Option(
      '--url <url>',
      'Run against an already running dev server instead of starting one, e.g. http://localhost:3000.'
    )
  )
  .action((file, commandOptions, command) =>
    runCommand({ cliVersion, handler: journeysVariants })({ ...commandOptions, file }, command)
  );

journeys
  .command('recordings')
  .description(
    'List the dev sessions the dev server recorded, with what the newest test run already covers.'
  )
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(
    new Option(
      '--since <since>',
      'Sessions at or after this time: a duration back from now (30m, 2h, 7d) or an ISO date.'
    )
  )
  .addOption(new Option('--page <pageId>', 'Only sessions that visited this page.'))
  .addOption(
    new Option(
      '--build <build>',
      'Only sessions recorded against this build; "current" is the build the running dev server serves.'
    )
  )
  .addOption(new Option('--json', 'Print the sessions as JSON on stdout.'))
  .action(runCommand({ cliVersion, handler: journeysRecordings }));

journeys
  .command('pull')
  .description(
    'Pull production analytics into .lowdefy/traces/production/, one UTC day per file. The adapter is posthog.'
  )
  .usage('<adapter> [options]')
  .argument('<adapter>', 'Where production analytics are read from: posthog.')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(
    new Option(
      '--since <since>',
      'The days to pull, ending today: a number of days such as 30d (the default), or a start date.'
    )
  )
  .addOption(new Option('--from <date>', 'The first UTC day to pull, YYYY-MM-DD.'))
  .addOption(new Option('--to <date>', 'The last UTC day to pull, YYYY-MM-DD.'))
  .addOption(
    new Option(
      '--environment <name>',
      'Only events whose environment super property is this, for a project shared by several environments.'
    )
  )
  .addOption(
    new Option(
      '--include-test-accounts',
      "Include events the project's test-account filter leaves out."
    )
  )
  .addOption(
    new Option('--org-property <name>', 'The person property holding the org id. Default: org_id.')
  )
  .addOption(
    new Option('--roles-property <name>', 'The person property holding the roles. Default: roles.')
  )
  .addOption(new Option('--page-size <rows>', 'Rows per query, at most 50000. Default: 10000.'))
  .addOption(
    new Option(
      '--max-rows <rows>',
      'Stop before a pull would read more rows than this. Default: 500000.'
    )
  )
  .addOption(new Option('--refetch', 'Pull final days again (days older than yesterday).'))
  .action(runCommand({ cliVersion, handler: journeysPullPosthog }));

journeys
  .command('scope')
  .description(
    'Build the merge base with --base and the working tree, and print the pages the change touched, with why and the roles and data set users that can open each. Without --base, every page.'
  )
  .usage('[--base <ref>] [options]')
  .addOption(
    new Option(
      '--base <ref>',
      'Compare with the merge base of this branch or commit, such as the pull request base branch.'
    )
  )
  .addOption(new Option('--json', 'Print the scope as JSON instead of the summary.'))
  .addOption(options.configDirectory)
  .addOption(options.devDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(options.refResolver)
  .action(runCommand({ cliVersion, handler: journeysScope }));

journeys
  .command('explore')
  .description(
    'Walk the pages a pull request changed as each role on a journey data set, report what broke, and write candidate journeys to tests/journeys/_candidates/explorer/<run>/.'
  )
  .usage('(--pr <n> | --against <ref> | --charter <text> | --charters <file>) [options]')
  .addOption(
    new Option('--pr <n>', 'The pull request to explore; this checkout must be at its head.')
  )
  .addOption(
    new Option(
      '--against <ref>',
      'Explore the changes since the merge base with this branch or commit.'
    )
  )
  .addOption(
    new Option(
      '--charter <text>',
      'A one-sentence goal that steers which options the model picks, such as "try edge input on the invoice form". Needs a model. Without --pr or --against, walks the head: --page pages, else the entry pages.'
    )
  )
  .addOption(
    new Option(
      '--charters <file>',
      'A bug bash: a YAML list of charters, each { goal, pages?, roles? }, walked as one run under one budget, with one report. Needs a model.'
    )
  )
  .addOption(
    new Option(
      '--data <name>',
      'The data set walks run on. Default tests/data/default.yaml, else the only data set.'
    )
  )
  .addOption(
    new Option(
      '--live-data',
      'Run without a data set, writing to what the connections point at. Needs cli.agentTools.allowWriteRequests.'
    )
  )
  .addOption(new Option('--page <pageId...>', 'Also walk these pages.'))
  .addOption(new Option('--role <name...>', 'Walk only as these data set users.'))
  .addOption(new Option('--walks <n>', 'Walks per (page, role). Default 5.'))
  .addOption(new Option('--steps <n>', 'Interactions per walk. Default 15.'))
  .addOption(new Option('--budget <duration>', 'Wall-clock budget for the walks. Default 20m.'))
  .addOption(
    new Option('--policy <policy>', 'What chooses each step: model, jev or seeded.').choices([
      'model',
      'jev',
      'seeded',
    ])
  )
  .addOption(new Option('--model <id>', 'The AI Gateway model for --policy model.'))
  .addOption(
    new Option(
      '--max-cost <usd>',
      'Stop once the reported (or estimated) model cost passes this. Default 1.00.'
    )
  )
  .addOption(
    new Option(
      '--allow-external <id...>',
      'Let walks click controls that reach these non-MongoDB connections. Needs cli.agentTools.allowWriteRequests.'
    )
  )
  .addOption(new Option('--seed <n>', 'Seed for the seeded policy and tie-breaks. Default 0.'))
  .addOption(new Option('--scope-only', 'Build, diff and print the scope; run no walks.'))
  .addOption(new Option('--json', 'Print report.json instead of the summary.'))
  .addOption(options.configDirectory)
  .addOption(options.devDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(options.port)
  .addOption(options.refResolver)
  .addOption(
    new Option(
      '--url <url>',
      "Walk against an already running dev server instead of the app's own, e.g. http://localhost:3111."
    )
  )
  .action(runCommand({ cliVersion, handler: journeysExplore }));

const productionWindowOptions = [
  new Option(
    '--since <since>',
    'The production window ending today: a number of days such as 30d (the default), or a start date.'
  ),
  new Option('--from <date>', 'The first UTC day of the production window, YYYY-MM-DD.'),
  new Option('--to <date>', 'The last UTC day of the production window, YYYY-MM-DD.'),
];

const journeysEvidenceCommand = journeys
  .command('evidence')
  .description(
    "Report how much production use backs each journey in tests/journeys/, by calendar month, from every final day of the production cache; --refresh writes it into each journey's evidence key."
  )
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.devDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(new Option('--source <source>', 'Where use is read from: production (the default).'))
  .addOption(
    new Option(
      '--refresh',
      'Write the evidence key of every journey whose numbers changed, and nothing else in the file.'
    )
  );
journeysEvidenceCommand.action(runCommand({ cliVersion, handler: journeysEvidence }));

journeys
  .command('usage')
  .description(
    "Rank the journeys in tests/journeys/ by their recent production use, with each one's popularity tier, months and old flows, then list the production flows no journey covers."
  )
  .usage('[options] [paths...]')
  .argument(
    '[paths...]',
    'Journey files, directories or quoted globs to report on instead of the whole suite, as for lowdefy test.'
  )
  .addOption(options.configDirectory)
  .addOption(options.devDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(
    new Option(
      '--filter <name>',
      'Only journeys whose name contains this string (case-insensitive). Repeat it to match any of the strings.'
    ).argParser(collectValues)
  )
  .addOption(
    new Option(
      '--tag <tag>',
      'Only journeys whose tags include this tag. Repeat it to match any of the tags.'
    ).argParser(collectValues)
  )
  .addOption(
    new Option(
      '--tier <tier>',
      'Only the journeys in this popularity tier of the selection: common (p50), wide (p80), edge (p95) or full (every journey, the default).'
    )
  )
  .addOption(
    new Option(
      '--usage-window <months>',
      'The calendar months recent use is ranked over, ending at the newest month any selected journey holds, such as 3m (the default).'
    )
  )
  .addOption(new Option('--json', 'Print the report as JSON instead of text.'))
  .action((paths, commandOptions, command) =>
    runCommand({ cliVersion, handler: journeysUsage })({ ...commandOptions, paths }, command)
  );

const journeysCoverageCommand = journeys
  .command('coverage')
  .description(
    'Report which production flows, failures, frustrated clicks and role sets no journey covers, and write .lowdefy/test/coverage.json.'
  )
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.devDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(new Option('--source <source>', 'Where use is read from: production (the default).'))
  .addOption(new Option('--json', 'Print the coverage report as JSON instead of the summary.'));
productionWindowOptions.forEach((option) => journeysCoverageCommand.addOption(option));
journeysCoverageCommand.action(runCommand({ cliVersion, handler: journeysCoverage }));

program
  .command('init')
  .description('Initialize a Lowdefy project.')
  .usage('[options]')
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .action(runCommand({ cliVersion, handler: init }));

program
  .command('init-docker')
  .description('Initialize Dockerfile.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .action(runCommand({ cliVersion, handler: initDocker }));

program
  .command('init-vercel')
  .description('Initialize Vercel deployment installation scripts.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .action(runCommand({ cliVersion, handler: initVercel }));

program
  .command('mcp')
  .description(
    'Run the Lowdefy MCP server for coding agents over stdio. Agent clients start it from .mcp.json (see `lowdefy agent-setup`).'
  )
  .action(runHubCommand({ cliVersion, handler: mcp }));

program
  .command('vercel-output')
  .description('Assemble a Vercel Build Output (.vercel/output) from a built app.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(options.serverDirectory)
  .action(runCommand({ cliVersion, handler: vercelOutput }));

program
  .command('start')
  .description('Start a Lowdefy production app.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.exitWithPid)
  .addOption(options.logLevel)
  .addOption(options.port)
  .addOption(options.serverDirectory)
  .action(runCommand({ cliVersion, handler: start }));

program
  .command('test')
  .description(
    'Run the app\'s config tests: every journey under tests/journeys/, sub-folders included, except folders starting with "_".'
  )
  .usage('[options] [paths...]')
  .argument(
    '[paths...]',
    'Journey files, directories or quoted globs (e.g. "tests/journeys/review/**") to run instead of the whole suite, anywhere under the config directory (tests/journeys/_candidates included).'
  )
  .addOption(options.configDirectory)
  .addOption(options.devDirectory)
  .addOption(options.disableTelemetry)
  .addOption(
    new Option(
      '--filter <name>',
      'Only run tests whose name contains this string (case-insensitive). Repeat it to run tests matching any of the strings.'
    ).argParser(collectValues)
  )
  .addOption(
    new Option(
      '--tag <tag>',
      'Only run journeys whose tags include this tag. Repeat it to run journeys carrying any of the tags.'
    ).argParser(collectValues)
  )
  .addOption(
    new Option(
      '--journeys-directory <journeys-directory>',
      'Change the directory journeys are read from. Default is "<config-directory>/tests/journeys". Fails when the directory holds no journeys.'
    )
  )
  .addOption(
    new Option(
      '--tier <tier>',
      'Only run the journeys in this popularity tier of the selection, ranked by recent production use: common (p50, the happy paths), wide (p80), edge (p95) or full (every journey, the default). Journeys with no counts for their current steps run in every tier.'
    )
  )
  .addOption(
    new Option(
      '--usage-window <months>',
      'The calendar months recent use is ranked over for --tier and the PASS line, ending at the newest month any selected journey holds, such as 6m. Default 3m.'
    )
  )
  .addOption(
    new Option(
      '--lint',
      'Lint the journeys (L1 placeholders, L2 unasserted actions, L3 fixed waits, L4 writes without data, L5 named data set users, L6 final assertion, L7 no snapshot values) and run nothing.'
    )
  )
  .addOption(options.logLevel)
  .addOption(options.port)
  .addOption(options.refResolver)
  .addOption(
    new Option(
      '--repeat <n>',
      'Run each journey n times (1 to 10) and classify it PASS, FLAKY or FAIL. Default 1.'
    )
  )
  .addOption(
    new Option(
      '--url <url>',
      'Run tests against an already running dev server instead of starting one, e.g. http://localhost:3000.'
    )
  )
  .action((paths, commandOptions, command) =>
    runCommand({ cliVersion, handler: test })({ ...commandOptions, paths }, command)
  );

program
  .command('upgrade')
  .description('Upgrade a Lowdefy app to a newer version, applying codemods.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(new Option('--to <version>', 'Target version. Default: latest stable.'))
  .addOption(new Option('--plan', 'Show upgrade plan without executing.'))
  .addOption(new Option('--resume', 'Resume a previously interrupted upgrade.'))
  .action(runCommand({ cliVersion, handler: upgrade }));

export default program;
