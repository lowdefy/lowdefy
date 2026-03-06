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

import fs from 'fs';
import path from 'path';

function scanDirectory(dir, basePath) {
  const apps = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const appPath = path.join(dir, entry.name);
      const lowdefyPath = path.join(appPath, 'lowdefy.yaml');

      if (fs.existsSync(lowdefyPath)) {
        apps.push({
          name: entry.name,
          path: path.join(basePath, entry.name),
        });
      }
    }
  }

  return apps;
}

function detectApps(cwd) {
  const apps = [];

  // Check for lowdefy.yaml in current directory (single app at root)
  const rootLowdefyPath = path.join(cwd, 'lowdefy.yaml');
  if (fs.existsSync(rootLowdefyPath)) {
    apps.push({
      name: path.basename(cwd),
      path: '.',
      isRoot: true,
    });
  }

  // Check for app/ directory (singular) with lowdefy.yaml
  const appDir = path.join(cwd, 'app');
  if (fs.existsSync(appDir) && fs.statSync(appDir).isDirectory()) {
    const appLowdefyPath = path.join(appDir, 'lowdefy.yaml');
    if (fs.existsSync(appLowdefyPath)) {
      apps.push({
        name: 'app',
        path: 'app',
      });
    }
  }

  // Check for apps/ directory (plural) and scan subdirectories
  const appsDir = path.join(cwd, 'apps');
  if (fs.existsSync(appsDir) && fs.statSync(appsDir).isDirectory()) {
    const subApps = scanDirectory(appsDir, 'apps');
    apps.push(...subApps);
  }

  return apps;
}

export default detectApps;
