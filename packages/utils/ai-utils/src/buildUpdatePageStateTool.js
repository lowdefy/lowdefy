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

import { jsonSchema, tool } from 'ai';
import { type } from '@lowdefy/helpers';

function describeKey(key, value) {
  let kind = typeof value;
  if (value === null) kind = 'null';
  else if (Array.isArray(value)) kind = 'array';
  return `  - ${key} (${kind})`;
}

function buildDescription(sharedState) {
  const keys = Object.keys(sharedState);
  if (keys.length === 0) {
    return "Write values into the current page's shared state. No fields currently exposed.";
  }
  const lines = keys.map((k) => describeKey(k, sharedState[k]));
  return (
    "Write values into the current page's shared state. Available fields:\n" + lines.join('\n')
  );
}

function buildUpdatePageStateTool({ sharedState }) {
  if (!type.isObject(sharedState)) return null;
  return tool({
    description: buildDescription(sharedState),
    inputSchema: jsonSchema({
      type: 'object',
      properties: {
        updates: {
          type: 'object',
          description:
            'Field values to write. Keys must match field names visible in shared state.',
          additionalProperties: true,
        },
      },
      required: ['updates'],
    }),
  });
}

export default buildUpdatePageStateTool;
