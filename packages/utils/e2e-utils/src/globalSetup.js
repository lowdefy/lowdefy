/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { execSync } from 'child_process';
import path from 'path';

import { generateManifest } from './testPrep/generateManifest.js';
import { getLowdefyCommand } from './utils/getLowdefyVersion.js';

async function globalSetup(config) {
  // Get app directory from webServer config or use current directory
  const appDir = config.webServer?.cwd || process.cwd();
  const buildDir = process.env.LOWDEFY_BUILD_DIR || path.join(appDir, '.lowdefy/server/build');

  // Use the same lowdefy version specified in lowdefy.yaml
  const lowdefyCmd = getLowdefyCommand(appDir);

  console.log('[e2e-utils] Building Lowdefy app...');
  execSync(`NEXT_PUBLIC_LOWDEFY_E2E=true ${lowdefyCmd} build`, {
    cwd: appDir,
    stdio: 'inherit',
  });
  console.log('[e2e-utils] Build complete.');

  console.log('[e2e-utils] Generating manifest...');

  // Generate manifest from build artifacts
  generateManifest({ buildDir });

  console.log(`[e2e-utils] Manifest generated at ${buildDir}/e2e-manifest.json`);
}

export default globalSetup;
