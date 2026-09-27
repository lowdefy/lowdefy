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

const optionalFields = ['size', 'width', 'height', 'attrs'];

// IconData as module source, for the app-wide icons module and each page types
// module. A semantic name and the set name it points at (and Lucide alias
// names) share one node array, which is written once as a constant. Returns the
// constant declarations and one object entry per name, in code point order.
function generateIconEntries({ iconData }) {
  const nodeConstants = new Map();
  const entries = Object.keys(iconData)
    .sort()
    .map((name) => {
      const data = iconData[name];
      const nodeJson = JSON.stringify(data.node);
      if (!nodeConstants.has(nodeJson)) {
        nodeConstants.set(nodeJson, `n${nodeConstants.size}`);
      }
      const fields = [`node: ${nodeConstants.get(nodeJson)}`];
      optionalFields.forEach((field) => {
        if (!type.isUndefined(data[field])) {
          fields.push(`${field}: ${JSON.stringify(data[field])}`);
        }
      });
      return `${JSON.stringify(name)}: { ${fields.join(', ')} },`;
    });
  const constants = [...nodeConstants.entries()].map(
    ([nodeJson, constant]) => `const ${constant} = ${nodeJson};`
  );
  return { constants, entries };
}

export default generateIconEntries;
