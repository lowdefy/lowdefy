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

import fs from 'node:fs';
import path from 'node:path';

// Patch next.config.js for the local monorepo dev environment.
//
// The isolated _server/ copy has its own pnpm-workspace.yaml and lockfile.
// Next.js 16 detects multiple lockfiles and warns about the workspace root.
// Setting outputFileTracingRoot tells Next.js where the real root is.
function patchNextConfig({ targetDir }) {
  const nextConfigPath = path.join(targetDir, 'next.config.js');
  let content = fs.readFileSync(nextConfigPath, 'utf8');

  // Silence the "multiple lockfiles" warning by telling Next.js the
  // monorepo root is the output file tracing root.
  if (content.includes('turbopack: {},')) {
    content = content.replace(
      'turbopack: {},',
      `outputFileTracingRoot: require('path').resolve(__dirname, '../..'),\n  turbopack: {},`
    );
  }

  fs.writeFileSync(nextConfigPath, content);
}

export default patchNextConfig;
