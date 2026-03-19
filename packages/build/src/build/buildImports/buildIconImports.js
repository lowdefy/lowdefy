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

function getConfigIcons({ components, icons, regex }) {
  [...JSON.stringify(components.global || {}).matchAll(regex)].map((match) => icons.add(match[1]));
  [...JSON.stringify(components.menus || []).matchAll(regex)].map((match) => icons.add(match[1]));
  [...JSON.stringify(components.pages || []).matchAll(regex)].map((match) => icons.add(match[1]));
}

function getBlockDefaultIcons({ blocks, context, icons, regex }) {
  blocks.forEach((block) => {
    (context.typesMap.icons[block.typeName] || []).forEach((icon) => {
      [...JSON.stringify(icon).matchAll(regex)].map((match) => icons.add(match[1]));
    });
  });
}

function buildIconImports({ blocks, components, context, defaults = {} }) {
  const iconImports = [];
  Object.entries(iconPackages).forEach(([iconPackage, regex]) => {
    const icons = new Set(defaults[iconPackage]);
    getConfigIcons({ components, icons, regex });
    getBlockDefaultIcons({ blocks, context, icons, regex });
    iconImports.push({ icons: [...icons], package: iconPackage });
  });
  return iconImports;
}

export default buildIconImports;
