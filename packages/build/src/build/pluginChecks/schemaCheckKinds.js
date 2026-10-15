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

import { type } from '@lowdefy/helpers';

import getOperatorParams from '../../utils/getOperatorParams.js';

// A page is built from its root block, which carries pageId. The page's
// properties.title is not a property of that block: the client reads it for
// the HTML <title>, whatever the root block's type is.
function getBlockData(node) {
  if (!type.isObject(node.properties)) return undefined;
  const isPageRoot = type.isString(node.pageId) && node.id === `page:${node.pageId}`;
  if (isPageRoot && 'title' in node.properties) {
    const { title, ...properties } = node.properties; // eslint-disable-line no-unused-vars
    return properties;
  }
  return node.properties;
}

// What each kind's schema covers. Connections and requests are not checked:
// their schemas are statics on the connection classes, which load database
// drivers, and the server validates them on every call.
const schemaCheckKinds = {
  blocks: {
    // Block schemas cover the whole block; the plugin's properties schema
    // sits at schema.properties.properties.
    getSchema: (schema) => schema?.properties?.properties,
    // As dynamic pages check them: a block whose properties are not an object
    // literal is left to the runtime.
    getData: getBlockData,
    getDisplayName: ({ typeName }) => typeName,
    pluginLabel: 'Block',
    fieldLabel: 'property',
  },
  actions: {
    getSchema: (schema) => schema?.params,
    getData: (node) => node.params,
    getDisplayName: ({ typeName }) => typeName,
    pluginLabel: 'Action',
    fieldLabel: 'param',
  },
  operators: {
    getSchema: (schema) => schema?.params,
    getData: getOperatorParams,
    // The key as written, so a method operator reads _string.concat.
    getDisplayName: ({ node }) => Object.keys(node).find((key) => !key.startsWith('~')),
    pluginLabel: 'Operator',
    fieldLabel: 'param',
  },
};

export default schemaCheckKinds;
