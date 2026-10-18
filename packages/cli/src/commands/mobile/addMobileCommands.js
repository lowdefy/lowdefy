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
    description: 'Build the shell in the cloud with EAS for one environment.',
    handler: mobileBuild,
  },
  {
    name: 'submit',
    description: 'Upload the latest build to TestFlight and Google Play internal testing.',
    handler: mobileSubmit,
  },
  {
    name: 'update',
    description: "Send the shell's JavaScript to installed binaries as an over-the-air update.",
    handler: mobileUpdate,
  },
  {
    name: 'release',
    description:
      'Build and submit when the native code changed, send an update when only the JavaScript did, or do nothing.',
    handler: mobileRelease,
  },
  {
    name: 'checklist',
    description: 'Print the steps the stores still need a person for, filled in for this shell.',
    handler: mobileChecklist,
  },
];

function createMobileOptions() {
  return {
    dryRun: new Option(
      '--dry-run',
      'Print the EAS commands, with their environment, and run none.'
    ),
    env: new Option(
      '--env <environment>',
      'The environment the shell is built for, a key of config.environments. The binary opens its url and listens on its EAS channel.'
    ).default('production'),
    shell: new Option(
      '--shell <id>',
      'The shell (mobile.shells id) to work on. Needed when the app declares more than one.'
    ),
  };
}

// lowdefy mobile <command>: the program's shared options plus --shell, --env
// and --dry-run on every subcommand.
function addMobileCommands({ cliVersion, options, program }) {
  const mobileOptions = createMobileOptions();
  const mobile = program
    .command('mobile')
    .description(
      "Build, submit and update the app's phone shells with EAS, from the developer's own Expo, Apple and Google accounts."
    );
  MOBILE_COMMANDS.forEach(({ name, description, handler }) => {
    mobile
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
      .addOption(options.skipPluginChecks)
      .action(runCommand({ cliVersion, handler }));
  });
  return mobile;
}

export default addMobileCommands;
