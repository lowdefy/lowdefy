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

import { Option } from 'commander';

import mobileBuild from './build.js';
import mobileChecklist from './checklist.js';
import mobileConfig from './config.js';
import mobileRelease from './release.js';
import mobileSubmit from './submit.js';
import mobileUpdate from './update.js';
import runCommand from '../../utils/runCommand.js';

const MOBILE_COMMANDS = [
  {
    name: 'config',
    description:
      "Write the shell's Expo project to .lowdefy/mobile/<shell>/project: @lowdefy/shell at the app's Lowdefy version, shell.json, eas.json and the icon.",
    handler: mobileConfig,
  },
  {
    name: 'build',
    description:
      'Build the shell in the cloud with EAS for one environment, raising the store version.',
    handler: mobileBuild,
    options: ['platform', 'profile', 'nonInteractive', 'local'],
  },
  {
    name: 'submit',
    description: 'Upload the latest build to TestFlight and Google Play internal testing.',
    handler: mobileSubmit,
    options: ['platform', 'nonInteractive'],
  },
  {
    name: 'update',
    description: "Send the shell's JavaScript to installed binaries as an over-the-air update.",
    handler: mobileUpdate,
    options: ['platform', 'rollout', 'promote', 'rollback'],
  },
  {
    name: 'release',
    description:
      'Build and submit when the native code changed, send an update when only the JavaScript did, or do nothing.',
    handler: mobileRelease,
    options: ['platform', 'nonInteractive', 'noWait', 'autoSubmit', 'rollout'],
  },
  {
    name: 'checklist',
    description: 'Print the steps the stores still need a person for, filled in for this shell.',
    handler: mobileChecklist,
  },
];

function createMobileOptions() {
  return {
    autoSubmit: new Option(
      '--auto-submit',
      'Have EAS submit each build when it finishes (eas build --auto-submit), so the job need not wait.'
    ),
    dryRun: new Option(
      '--dry-run',
      'Print the EAS commands, with their environment, and run none.'
    ),
    env: new Option(
      '--env <environment>',
      'The environment the shell is built for, a key of config.environments. The binary opens its url and listens on its EAS channel.'
    ).default('production'),
    local: new Option(
      '--local',
      'Build on this machine with eas build --local (a Mac for iOS) instead of in the cloud.'
    ),
    nonInteractive: new Option(
      '--non-interactive',
      'Run EAS without prompts, as CI does, with the credentials stored in EAS. build then queues the build and does not wait for it. release always runs this way.'
    ),
    noWait: new Option(
      '--no-wait',
      'Queue builds and end without waiting for them. Needs --auto-submit.'
    ),
    platform: new Option('--platform <platform>', 'The store to work on.')
      .choices(['ios', 'android', 'all'])
      .default('all'),
    profile: new Option(
      '--profile <profile>',
      "development: a development client of the shell's dev variant, for internal distribution, that connects to lowdefy dev."
    ).choices(['development']),
    promote: new Option('--promote', 'Roll the latest update out to every device.'),
    rollback: new Option(
      '--rollback',
      'Republish the update before the latest one, for the same runtime version.'
    ),
    rollout: new Option(
      '--rollout <percent>',
      'Send the update to this percentage of devices; --promote sends it to the rest.'
    ),
    shell: new Option(
      '--shell <id>',
      'The shell (mobile.shells id) to work on. Needed when the app declares more than one.'
    ),
  };
}

// lowdefy mobile <command>: the program's shared options plus --shell, --env
// and --dry-run on every subcommand, and each subcommand's own options.
function addMobileCommands({ cliVersion, options, program }) {
  const mobileOptions = createMobileOptions();
  const mobile = program
    .command('mobile')
    .description(
      "Build, submit and update the app's phone shells with EAS, from the developer's own Expo, Apple and Google accounts."
    );
  MOBILE_COMMANDS.forEach(({ name, description, handler, options: commandOptions = [] }) => {
    const command = mobile
      .command(name)
      .description(description)
      .usage('[options]')
      .addOption(options.configDirectory)
      .addOption(options.disableTelemetry)
      .addOption(mobileOptions.dryRun)
      .addOption(mobileOptions.env)
      .addOption(options.logLevel)
      .addOption(options.refResolver)
      .addOption(options.serverDirectory)
      .addOption(mobileOptions.shell)
      .addOption(options.skipPluginChecks);
    commandOptions.forEach((key) => command.addOption(mobileOptions[key]));
    command.action(runCommand({ cliVersion, handler }));
  });
  return mobile;
}

export default addMobileCommands;
