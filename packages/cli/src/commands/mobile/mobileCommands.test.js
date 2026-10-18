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

import { jest } from '@jest/globals';
import { Command, Option } from 'commander';

jest.unstable_mockModule('../../utils/runCommand.js', () => ({
  default: () => () => {},
}));
['build', 'checklist', 'config', 'release', 'submit', 'update'].forEach((name) => {
  jest.unstable_mockModule(`./${name}.js`, () => ({ default: () => {} }));
});

const { default: addMobileCommands } = await import('./addMobileCommands.js');

const options = Object.fromEntries(
  [
    ['configDirectory', '--config-directory <config-directory>'],
    ['disableTelemetry', '--disable-telemetry'],
    ['logLevel', '--log-level <level>'],
    ['refResolver', '--ref-resolver <path>'],
    ['serverDirectory', '--server-directory <server-directory>'],
    ['skipPluginChecks', '--skip-plugin-checks'],
  ].map(([key, flags]) => [key, new Option(flags)])
);

function createMobileCommand() {
  return addMobileCommands({ cliVersion: '7.1.0', options, program: new Command('lowdefy') });
}

test('lowdefy mobile --help lists the six subcommands', () => {
  const help = createMobileCommand().helpInformation();
  ['config', 'build', 'submit', 'update', 'release', 'checklist'].forEach((name) => {
    expect(help).toMatch(new RegExp(`^  ${name} \\[options\\]`, 'm'));
  });
});

test('every lowdefy mobile subcommand takes --shell, --env and --dry-run', () => {
  const mobile = createMobileCommand();
  expect(mobile.commands.map((command) => command.name())).toEqual([
    'config',
    'build',
    'submit',
    'update',
    'release',
    'checklist',
  ]);
  mobile.commands.forEach((command) => {
    const flags = command.options.map((option) => option.long);
    expect(flags).toEqual(expect.arrayContaining(['--shell', '--env', '--dry-run']));
    const env = command.options.find((option) => option.long === '--env');
    expect(env.defaultValue).toBe('production');
  });
});

test('lowdefy mobile config parses --shell, --env and --dry-run', () => {
  const mobile = createMobileCommand();
  const configCommand = mobile.commands.find((command) => command.name() === 'config');
  configCommand.action(() => {});
  configCommand.parse(['--shell', 'field', '--env', 'staging', '--dry-run'], { from: 'user' });
  expect(configCommand.opts()).toEqual(
    expect.objectContaining({ shell: 'field', env: 'staging', dryRun: true })
  );
});

function findCommand(name) {
  const command = createMobileCommand().commands.find((candidate) => candidate.name() === name);
  command.action(() => {});
  return command;
}

test('lowdefy mobile build parses --platform, --profile, --non-interactive and --local', () => {
  const build = findCommand('build');
  build.parse(
    [
      '--env',
      'staging',
      '--platform',
      'ios',
      '--profile',
      'development',
      '--non-interactive',
      '--local',
    ],
    { from: 'user' }
  );
  expect(build.opts()).toEqual(
    expect.objectContaining({
      env: 'staging',
      platform: 'ios',
      profile: 'development',
      nonInteractive: true,
      local: true,
    })
  );
});

test('lowdefy mobile build defaults --platform to all', () => {
  const build = findCommand('build');
  build.parse([], { from: 'user' });
  expect(build.opts().platform).toBe('all');
});

test('lowdefy mobile submit takes --platform and --non-interactive', () => {
  const flags = findCommand('submit').options.map((option) => option.long);
  expect(flags).toEqual(expect.arrayContaining(['--platform', '--non-interactive']));
  expect(flags).not.toContain('--profile');
});
