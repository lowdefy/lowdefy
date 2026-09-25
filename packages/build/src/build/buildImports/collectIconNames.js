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

// A semantic name used as a whole JSON string value. The negative lookahead
// skips object keys, so a "user": key does not count as the "user" icon.
const aliasValueRegex = /"([a-z][a-z0-9]*(?:-[a-z0-9]+)*)"(?!:)/g;

// data-icon attribute values inside HTML strings or JS sources: any case,
// optional whitespace around =, quoted or unquoted. In JSON text a double quote
// inside a string is escaped (data-icon=\"edit\"). The value must end at a
// quote, whitespace or > so a templated value ("edit-{{ n }}") is skipped
// rather than read as a name; dynamic names belong in theme.icons.include.
const dataIconRegex = /data-icon\s*=\s*(?:\\?["'])?([A-Za-z][A-Za-z0-9-]*)(?=\\?["']|[\s>]|$)/gi;

const packageMatchers = Object.entries(iconPackages).map(([iconPackage, regex]) => ({
  iconPackage,
  regex: new RegExp(`^${regex.source}$`),
}));

function getIconNamePackages(name) {
  return packageMatchers
    .filter(({ regex }) => regex.test(`"${name}"`))
    .map(({ iconPackage }) => iconPackage);
}

function collectIconNames({ json, aliases }) {
  const packageIcons = {};
  const aliasNames = new Set();
  const unknownDataIcons = new Set();

  function addPackageIcon(iconPackage, icon) {
    packageIcons[iconPackage] = packageIcons[iconPackage] ?? new Set();
    packageIcons[iconPackage].add(icon);
  }

  Object.entries(iconPackages).forEach(([iconPackage, regex]) => {
    for (const match of json.matchAll(regex)) {
      addPackageIcon(iconPackage, match[1]);
    }
  });

  for (const match of json.matchAll(aliasValueRegex)) {
    if (Object.hasOwn(aliases, match[1])) {
      aliasNames.add(match[1]);
    }
  }

  for (const match of json.matchAll(dataIconRegex)) {
    const name = match[1];
    const namePackages = getIconNamePackages(name);
    if (namePackages.length > 0) {
      namePackages.forEach((iconPackage) => addPackageIcon(iconPackage, name));
    } else if (Object.hasOwn(aliases, name)) {
      aliasNames.add(name);
    } else {
      unknownDataIcons.add(name);
    }
  }

  return { aliasNames, packageIcons, unknownDataIcons };
}

export { getIconNamePackages };
export default collectIconNames;
