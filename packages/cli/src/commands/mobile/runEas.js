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

import { spawn } from 'node:child_process';
import path from 'node:path';

import EAS_CLI_VERSION from './easCliVersion.js';

// Credentials EAS reads from the environment. They pass through from the
// caller's environment and are never written into the generated project.
const PASSED_THROUGH = ['EXPO_TOKEN', 'SENTRY_AUTH_TOKEN'];

function getCommand() {
  return process.platform === 'win32' ? 'npx.cmd' : 'npx';
}

function getEasEnv({ projectDirectory }) {
  // EAS_NO_VCS uploads the project folder as it is, without git: the folder is
  // generated and lives in the app's gitignored .lowdefy directory.
  // LOWDEFY_SHELL_CONFIG makes the app config eas reads on this machine the
  // shell's own (its EAS project, ids and runtime version), not Lowdefy Dev's;
  // a build profile's env in eas.json still wins inside eas build.
  return {
    EAS_NO_VCS: '1',
    EAS_PROJECT_ROOT: projectDirectory,
    LOWDEFY_SHELL_CONFIG: path.join(projectDirectory, 'shell.json'),
  };
}

function printDryRun({ context, commandArgs, projectDirectory, easEnv }) {
  const passedThrough = PASSED_THROUGH.filter((name) => process.env[name] !== undefined);
  context.logger.info(`[dry run] ${getCommand()} ${commandArgs.join(' ')}`);
  context.logger.info(`[dry run]   cwd: ${projectDirectory}`);
  context.logger.info(
    `[dry run]   env: ${Object.entries(easEnv)
      .map(([name, value]) => `${name}=${value}`)
      .join(' ')}`
  );
  if (passedThrough.length > 0) {
    context.logger.info(`[dry run]   passed through: ${passedThrough.join(', ')}`);
  }
}

function parseJson({ stdout, args }) {
  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`eas ${args[0]} did not print JSON. Received: ${stdout.slice(0, 500)}`, {
      cause: error,
    });
  }
}

// Runs one eas-cli command in the shell's generated project. Every EAS call
// goes through here, so tests stub this one module. With --json in args the
// parsed stdout is returned; otherwise eas talks to the terminal directly, so
// an interactive first build can ask for Apple and Google sign-in. dryRun
// prints the command line, cwd and the variables it sets, and runs nothing.
async function runEas({ context, args, projectDirectory, dryRun = false }) {
  const commandArgs = ['--yes', `eas-cli@${EAS_CLI_VERSION}`, ...args];
  const easEnv = getEasEnv({ projectDirectory });
  if (dryRun) {
    printDryRun({ context, commandArgs, projectDirectory, easEnv });
    return null;
  }
  const json = args.includes('--json');
  context.logger.debug(`Running ${getCommand()} ${commandArgs.join(' ')} in ${projectDirectory}.`);
  const stdout = await new Promise((resolve, reject) => {
    const child = spawn(getCommand(), commandArgs, {
      cwd: projectDirectory,
      env: { ...process.env, ...easEnv },
      // https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2#command-injection-via-args-parameter-of-child_processspawn-without-shell-option-enabled-on-windows-cve-2024-27980---high
      shell: process.platform === 'win32',
      stdio: ['inherit', json ? 'pipe' : 'inherit', 'inherit'],
    });
    const chunks = [];
    if (json) {
      child.stdout.on('data', (chunk) => chunks.push(chunk));
    }
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`eas ${args.join(' ')} failed with exit code ${code}.`));
        return;
      }
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
  });
  if (!json) {
    return null;
  }
  return parseJson({ stdout, args });
}

export default runEas;
