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

import { ConfigWarning } from '@lowdefy/errors';

import findSimilarString from '../../utils/findSimilarString.js';

function validateIconImports({ iconImports, context }) {
  const serverRequire = createRequire(
    path.join(context.directories.server, 'package.json')
  );
  const moduleCache = {};

  return iconImports.map(({ icons, package: pkg }) => {
    if (icons.length === 0) {
      return { icons, package: pkg };
    }

    if (!moduleCache[pkg]) {
      try {
        moduleCache[pkg] = serverRequire(pkg);
      } catch {
        return { icons, package: pkg };
      }
    }

    const exports = Object.keys(moduleCache[pkg]);
    const validIcons = [];

    for (const icon of icons) {
      if (moduleCache[pkg][icon]) {
        validIcons.push(icon);
      } else {
        let message = `Icon "${icon}" not found in "${pkg}".`;
        const suggestion = findSimilarString({
          input: icon,
          candidates: exports,
          maxDistance: Math.max(3, Math.ceil(icon.length * 0.4)),
        });
        if (suggestion) {
          message += ` Did you mean "${suggestion}"?`;
        }
        context.handleWarning(new ConfigWarning(message, { checkSlug: 'icons' }));
      }
    }

    return { icons: validIcons, package: pkg };
  });
}

export default validateIconImports;
