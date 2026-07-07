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

import iconPackages from './iconPackages.js';
import validateIconImports from './validateIconImports.js';

function getBlockDefaultIcons({ blocks, iconsMap, icons, regex }) {
  blocks.forEach((block) => {
    (iconsMap[block.typeName] ?? []).forEach((icon) => {
      [...JSON.stringify(icon).matchAll(regex)].map((match) => icons.add(match[1]));
    });
  });
}

// scan and iconsMap default to the web config surfaces; the mobile imports
// pass mobile pages/menus and the mobile types map.
function buildIconImports({ blocks, components, context, defaults = {}, scan, iconsMap }) {
  const scanRoots = scan ?? {
    global: components.global,
    menus: components.menus,
    pages: components.pages,
  };
  const blockIconsMap = iconsMap ?? context.typesMap.icons;
  // Serialize each scan root once — the pages tree can be large and the regex
  // loop below runs once per icon package.
  const scanStrings = [
    JSON.stringify(scanRoots.global ?? {}),
    JSON.stringify(scanRoots.menus ?? []),
    JSON.stringify(scanRoots.pages ?? []),
  ];
  const iconImports = [];
  Object.entries(iconPackages).forEach(([iconPackage, regex]) => {
    const icons = new Set(defaults[iconPackage]);
    scanStrings.forEach((scanString) => {
      [...scanString.matchAll(regex)].map((match) => icons.add(match[1]));
    });
    getBlockDefaultIcons({ blocks, iconsMap: blockIconsMap, icons, regex });
    iconImports.push({ icons: [...icons], package: iconPackage });
  });
  return validateIconImports({ iconImports, context });
}

export default buildIconImports;
