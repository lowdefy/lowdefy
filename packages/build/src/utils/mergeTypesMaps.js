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

import { mergeObjects, type } from '@lowdefy/helpers';

// The packages a types map takes its types from: every type entry names its
// package.
function collectPackageNames({ node, packageNames }) {
  if (!type.isObject(node)) {
    return packageNames;
  }
  if (type.isString(node.package)) {
    packageNames.add(node.package);
    return packageNames;
  }
  Object.values(node).forEach((child) => collectPackageNames({ node: child, packageNames }));
  return packageNames;
}

// The build's types map: the default types with the app's custom types merged
// over them. mergeObjects copies every plain object, so the default packages'
// schemas (about 1 MB) are left out of the merge and added by reference: a
// build does not copy them, and the rebuilds of one dev server hand
// @lowdefy/ajv the same schema objects, so its validators, cached by schema
// object, compile once.
//
// The default schemas and the hasChecks flags describe the version of each
// default package this build was generated with. An app that lists a default
// package under plugins installs its own version, so that package's shipped
// schemas and flag are left out, and its schemas and checks load from the
// installed package, as a custom plugin's do.
function mergeTypesMaps({ defaultTypesMap, customTypesMap }) {
  const { schemas: defaultSchemas, hasChecks: defaultHasChecks, ...defaultTypes } = defaultTypesMap;
  const typesMap = mergeObjects([defaultTypes, customTypesMap]);
  const customPackages = collectPackageNames({ node: customTypesMap, packageNames: new Set() });
  const customHasChecks = typesMap.hasChecks ?? {};
  typesMap.hasChecks = {};
  for (const [packageName, hasChecks] of Object.entries(defaultHasChecks)) {
    if (!customPackages.has(packageName)) {
      typesMap.hasChecks[packageName] = hasChecks;
    }
  }
  Object.assign(typesMap.hasChecks, customHasChecks);
  const customSchemas = typesMap.schemas ?? {};
  typesMap.schemas = { ...customSchemas };
  for (const [kind, schemas] of Object.entries(defaultSchemas)) {
    const shipped = {};
    for (const [typeName, entry] of Object.entries(schemas)) {
      if (!customPackages.has(entry.package)) {
        shipped[typeName] = entry;
      }
    }
    typesMap.schemas[kind] = { ...shipped, ...customSchemas[kind] };
  }
  return typesMap;
}

export default mergeTypesMaps;
