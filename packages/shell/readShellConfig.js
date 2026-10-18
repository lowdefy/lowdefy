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

const fs = require('node:fs');
const path = require('node:path');

const checkShellConfig = require('./checkShellConfig.js');

// The shell's config comes from shell.json, written for each shell at build: LOWDEFY_SHELL_CONFIG
// is its path. Without it the shell is Lowdefy Dev (shell.dev.json), which opens `lowdefy dev`.
// app.config.ts, metro.config.js and scripts/checkReleaseBundle.mjs read it here.
function readShellConfig(env = process.env) {
  const configPath = env.LOWDEFY_SHELL_CONFIG
    ? path.resolve(env.LOWDEFY_SHELL_CONFIG)
    : path.join(__dirname, 'shell.dev.json');
  const shell = checkShellConfig({
    configPath,
    shell: JSON.parse(fs.readFileSync(configPath, 'utf8')),
  });
  return { configPath, shell };
}

module.exports = readShellConfig;
