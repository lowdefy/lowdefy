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

import collectIconNames, { getIconNamePackages } from '../buildImports/collectIconNames.js';

// Returns the icons a JIT-built page needs that the dev client bundle does not
// have yet. react-icons names are compared with the bundled imports. Semantic
// names resolve through the full alias map and are delivered keyed by name, so
// dev bundles the same names prod does; each is extracted once per session.
function detectMissingIcons({ page, iconImports, iconAliases = {}, dynamicIconData = {} }) {
  const { aliasNames, packageIcons, unknownDataIcons } = collectIconNames({
    json: JSON.stringify(page),
    aliases: iconAliases,
  });
  const missingIcons = [];

  Object.entries(packageIcons).forEach(([iconPackage, icons]) => {
    const existing = iconImports.find((entry) => entry.package === iconPackage);
    const existingSet = new Set(existing?.icons ?? []);
    icons.forEach((icon) => {
      if (!existingSet.has(icon)) {
        missingIcons.push({ icon, package: iconPackage });
      }
    });
  });

  aliasNames.forEach((alias) => {
    if (Object.hasOwn(dynamicIconData, alias)) return;
    const icon = iconAliases[alias];
    getIconNamePackages(icon).forEach((iconPackage) => {
      missingIcons.push({ alias, icon, package: iconPackage });
    });
  });

  return { missingIcons, unknownDataIcons };
}

export default detectMissingIcons;
