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

import path from 'node:path';

// --app and --notifier take a value, so the parser consumes it rather than
// leaving it to be read as the build directory.
const valueFlags = ['--app', '--notifier'];

// AXIOM_NOTIFIERS is the CI form of --notifier: the deploy that pushes the
// monitors is the deploy that knows where its alerts go.
function notifiersFromEnv(env) {
  return (env.AXIOM_NOTIFIERS ?? '')
    .split(',')
    .map((notifier) => notifier.trim())
    .filter((notifier) => notifier !== '');
}

function parsePushArgs({ argv, env = {} }) {
  const parsed = {
    buildDirectory: null,
    dryRun: false,
    allowSilent: false,
    app: null,
    notifiers: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (valueFlags.includes(arg)) {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new Error(`${arg} needs a value.`);
      }
      if (arg === '--app') parsed.app = value;
      if (arg === '--notifier') parsed.notifiers.push(value);
      index += 1;
      continue;
    }
    if (arg === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }
    if (arg === '--allow-silent') {
      parsed.allowSilent = true;
      continue;
    }
    if (arg.startsWith('--')) {
      throw new Error(
        `Unknown option "${arg}". Valid options: --app <slug>, --notifier <name> (repeatable), --dry-run, --allow-silent.`
      );
    }
    if (parsed.buildDirectory === null) parsed.buildDirectory = arg;
  }
  return {
    ...parsed,
    buildDirectory: path.resolve(parsed.buildDirectory ?? '.lowdefy/build'),
    notifiers: parsed.notifiers.length > 0 ? parsed.notifiers : notifiersFromEnv(env),
  };
}

export default parsePushArgs;
