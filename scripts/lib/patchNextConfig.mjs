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

// Pin react/react-dom to the target dir's copies so linked @lowdefy/*
// packages share a single instance (prevents "invalid hook call" errors).
//
// Two strategies depending on the next.config.js shape:
// - Webpack configs: inject alias into the webpack callback
// - Turbopack configs: inject resolveAlias into the turbopack config
function patchNextConfig({ targetDir }) {
  const nextConfigPath = path.join(targetDir, 'next.config.js');
  const content = fs.readFileSync(nextConfigPath, 'utf8');

  // Strategy 1: Webpack-based config (production server)
  if (content.includes('webpack: (config, { isServer }) => {')) {
    fs.writeFileSync(
      nextConfigPath,
      content.replace(
        'webpack: (config, { isServer }) => {',
        [
          'webpack: (config, { isServer }) => {',
          `    const reactDir = require('path').dirname(require.resolve('react/package.json'));`,
          `    const reactDomDir = require('path').dirname(require.resolve('react-dom/package.json'));`,
          `    config.resolve.alias = {`,
          `      ...config.resolve.alias,`,
          `      react: reactDir,`,
          `      'react-dom': reactDomDir,`,
          `    };`,
        ].join('\n')
      )
    );
    return;
  }

  // Strategy 2: Turbopack-based config (dev server)
  if (content.includes('turbopack: {},')) {
    fs.writeFileSync(
      nextConfigPath,
      content.replace(
        'turbopack: {},',
        [
          `turbopack: {`,
          `    resolveAlias: {`,
          `      react: require('path').dirname(require.resolve('react/package.json')),`,
          `      'react-dom': require('path').dirname(require.resolve('react-dom/package.json')),`,
          `    },`,
          `  },`,
        ].join('\n')
      )
    );
    return;
  }
}

export default patchNextConfig;
