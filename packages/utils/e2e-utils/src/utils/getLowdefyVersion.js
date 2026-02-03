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

import fs from 'fs';
import path from 'path';

function getLowdefyVersion(appDir) {
  // Try lowdefy.yaml first, then lowdefy.yml (matching CLI pattern from getLowdefyYaml.js)
  const yamlPath = path.join(appDir, 'lowdefy.yaml');
  const ymlPath = path.join(appDir, 'lowdefy.yml');

  let configPath = yamlPath;
  if (!fs.existsSync(yamlPath) && fs.existsSync(ymlPath)) {
    configPath = ymlPath;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf8');
    // Simple regex to extract version - avoids yaml parser dependency
    const match = content.match(/^lowdefy:\s*['"]?([^'"\n]+)['"]?/m);
    if (match) {
      return match[1].trim();
    }
  } catch {
    // Fall through to return null
  }
  return null;
}

function getLowdefyCommand(appDir) {
  const version = getLowdefyVersion(appDir);
  // For 'local' version, use plain npx lowdefy (monorepo development)
  if (!version || version === 'local') {
    return 'npx lowdefy';
  }
  return `npx lowdefy@${version}`;
}

export { getLowdefyVersion, getLowdefyCommand };
