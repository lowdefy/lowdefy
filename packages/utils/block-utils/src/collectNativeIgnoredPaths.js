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

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function walk({ schema, prefix, paths }) {
  if (!isObject(schema)) {
    return;
  }
  Object.entries(schema.properties ?? {}).forEach(([key, property]) => {
    const path = `${prefix}${key}`;
    if (isObject(property) && property.nativeIgnored === true) {
      paths.add(path);
      return;
    }
    walk({ schema: property, prefix: `${path}.`, paths });
  });
  [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])].forEach((branch) =>
    walk({ schema: branch, prefix, paths })
  );
  if (isObject(schema.items)) {
    walk({ schema: schema.items, prefix: `${prefix}$.`, paths });
  }
}

// The property paths a native block's meta marks `nativeIgnored: true`: properties the block
// accepts, so a page shared with the web stays valid, but a phone cannot honour. A nested
// property is a dotted path, and `$` stands for any index of an array (`options.$.style`).
// The build warns when a mobile page sets one.
function collectNativeIgnoredPaths(propertiesSchema) {
  const paths = new Set();
  walk({ schema: propertiesSchema, prefix: '', paths });
  return [...paths].sort();
}

export default collectNativeIgnoredPaths;
