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

import { createRequire } from 'module';
import path from 'path';

import findSimilarString from '../../utils/findSimilarString.js';

// Matches the JSON data argument inside GenIcon({...})(props) in react-icons source.
// react-icons icons are generated functions of the form:
//   function IconName(props) { return GenIcon({...})(props); }
// Tolerates optional whitespace around GenIcon call and props argument.
const genIconDataRegex = /GenIcon\s*\(([\s\S]*?)\)\s*\(\s*props\s*\)/;

function extractIconData({ icons, directories, logger }) {
  const serverRequire = createRequire(path.join(directories.server, 'package.json'));
  const iconDataMap = {};
  const moduleCache = {};

  for (const { icon, package: pkg } of icons) {
    if (!moduleCache[pkg]) {
      try {
        moduleCache[pkg] = serverRequire(pkg);
      } catch {
        if (logger) {
          logger.warn(`Could not load icon package "${pkg}" for dynamic icon extraction.`);
        }
        continue;
      }
    }
    const iconFn = moduleCache[pkg][icon];
    if (!iconFn) {
      if (logger) {
        let message = `Icon "${icon}" not found in "${pkg}".`;
        const suggestion = findSimilarString({
          input: icon,
          candidates: Object.keys(moduleCache[pkg]),
          maxDistance: Math.max(3, Math.ceil(icon.length * 0.4)),
        });
        if (suggestion) {
          message += ` Did you mean "${suggestion}"?`;
        }
        logger.warn(message);
      }
      continue;
    }

    const match = iconFn.toString().match(genIconDataRegex);
    if (match) {
      try {
        iconDataMap[icon] = JSON.parse(match[1]);
      } catch {
        if (logger) {
          logger.warn(`Could not parse icon data for "${icon}" from "${pkg}".`);
        }
      }
    } else if (logger) {
      logger.warn(`Could not extract icon data for "${icon}" from "${pkg}". The icon will show as a fallback.`);
    }
  }
  return iconDataMap;
}

export default extractIconData;
