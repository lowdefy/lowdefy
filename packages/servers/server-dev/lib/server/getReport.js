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

import blocksStatic from '../../build/plugins/blocksStatic.js';
import clientJsMap from '../../build/plugins/operators/clientJsMap.js';
import clientOperators from '../../build/plugins/operators/client.js';
import createJsMapLoader from './createJsMapLoader.js';
import { generateReport } from '../../build/plugins/reports.js';

const loadClientJsMap = createJsMapLoader({
  artifact: 'clientJsMap.js',
  staticJsMap: clientJsMap,
});

// Every dev rebuild rewrites the report artifacts, so — unlike the production
// server, which reads them once at startup — they are re-read whenever their
// mtime changes: blockMetas grows as JIT builds pull in new block types, and the
// compiled report stylesheet tracks page content and public/styles.css.
function createArtifactReader(parse) {
  let cachedMtime = null;
  let cached;
  return function readArtifact(filePath) {
    try {
      const stat = fs.statSync(filePath);
      if (cachedMtime === stat.mtimeMs) {
        return cached;
      }
      cachedMtime = stat.mtimeMs;
      cached = parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      // The stylesheet is optional and blockMetas only goes missing before the
      // first build, which cannot happen while the dev server is serving.
      cachedMtime = null;
      cached = undefined;
    }
    return cached;
  };
}

const readBlockMetas = createArtifactReader(JSON.parse);
const readReportStyles = createArtifactReader((css) => css);

// The `report` seam the report route consumes, matching what the production
// server assembles in src/middleware/apiContext.js. The Vite dev server serves
// user assets from public/, so relative image sources resolve there.
function getReport({ buildDirectory }) {
  return {
    blockMetas: readBlockMetas(path.join(buildDirectory, 'plugins', 'blockMetas.json')),
    generateReport,
    jsMap: loadClientJsMap(buildDirectory),
    operators: clientOperators,
    publicDir: path.join(process.cwd(), 'public'),
    registry: blocksStatic,
    stylesheets: readReportStyles(path.join(buildDirectory, 'reports', 'styles.css')),
  };
}

export default getReport;
