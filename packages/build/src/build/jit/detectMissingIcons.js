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

import collectIconNames from '../buildImports/collectIconNames.js';
import resolveIconName from '../icons/resolveIconName.js';

// Returns the icon names a JIT-built page uses that the dev client bundle
// lacks and no earlier page delivered. The page is scanned before _js
// extraction, so names in _js code are found as they are in the full build.
function detectMissingIcons({ page, bundledIcons, dynamicIconData, icons }) {
  const missing = [];
  collectIconNames({ text: JSON.stringify(page) }).forEach((name) => {
    if (bundledIcons.has(name) || Object.hasOwn(dynamicIconData, name)) {
      return;
    }
    if (resolveIconName({ name, ...icons }) !== null) {
      missing.push(name);
    }
  });
  return missing.sort();
}

export default detectMissingIcons;
