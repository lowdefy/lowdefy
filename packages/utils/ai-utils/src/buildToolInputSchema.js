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

const COMBINATORS = [
  { keyword: 'oneOf', quantifier: 'exactly one of', joiner: ' or ' },
  { keyword: 'anyOf', quantifier: 'at least one of', joiner: ' or ' },
  { keyword: 'allOf', quantifier: 'all of', joiner: ' and ' },
];

function describeBranch(branch) {
  if (type.isArray(branch?.required) && branch.required.length > 0) {
    return `(${branch.required.join(', ')})`;
  }
  return JSON.stringify(branch);
}

// Anthropic (and OpenAI) refuse a tool whose input schema has oneOf, anyOf or allOf at the top
// level, and fail the whole request. The model gets the schema without them, the constraint as a
// line at the head of the description, and the properties the branches define. The endpoint still
// validates the payload against the full payloadSchema, so a payload that breaks the constraint
// comes back to the model as an error to correct.
function buildToolInputSchema({ schema, description }) {
  const inputSchema = { ...schema };
  const constraints = [];

  for (const { keyword, quantifier, joiner } of COMBINATORS) {
    const branches = inputSchema[keyword];
    if (type.isUndefined(branches)) continue;
    delete inputSchema[keyword];
    const properties = { ...(inputSchema.properties ?? {}) };
    for (const branch of branches) {
      for (const [name, property] of Object.entries(branch?.properties ?? {})) {
        properties[name] = properties[name] ?? property;
      }
    }
    if (Object.keys(properties).length > 0) {
      inputSchema.properties = properties;
    }
    constraints.push(
      `Input constraint: Provide parameters for ${quantifier}: ${branches
        .map(describeBranch)
        .join(joiner)}.`
    );
  }

  if (constraints.length === 0) {
    return { inputSchema, description };
  }
  return {
    inputSchema,
    description: [...constraints, description].filter((line) => !type.isNone(line)).join('\n\n'),
  };
}

export default buildToolInputSchema;
