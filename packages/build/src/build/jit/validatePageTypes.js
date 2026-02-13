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

import { ConfigError } from '@lowdefy/errors/build';

import findSimilarString from '../../utils/findSimilarString.js';

function validateTypeClass({ context, counter, definitions, typeClass }) {
  const counts = counter.getCounts();
  const definedTypes = Object.keys(definitions);
  for (const typeName of Object.keys(counts)) {
    if (!definitions[typeName]) {
      const configKey = counter.getLocation(typeName);
      let message = `${typeClass} type "${typeName}" was used but is not defined.`;
      const suggestion = findSimilarString({ input: typeName, candidates: definedTypes });
      if (suggestion) {
        message += ` Did you mean "${suggestion}"?`;
      }
      throw new ConfigError({ message, configKey, context });
    }
  }
}

function validatePageTypes({ context }) {
  const { typeCounters, typesMap } = context;

  validateTypeClass({
    context,
    counter: typeCounters.blocks,
    definitions: typesMap.blocks,
    typeClass: 'Block',
  });

  validateTypeClass({
    context,
    counter: typeCounters.actions,
    definitions: typesMap.actions,
    typeClass: 'Action',
  });

  validateTypeClass({
    context,
    counter: typeCounters.operators.client,
    definitions: typesMap.operators.client,
    typeClass: 'Operator',
  });

  validateTypeClass({
    context,
    counter: typeCounters.operators.server,
    definitions: typesMap.operators.server,
    typeClass: 'Operator',
  });
}

export default validatePageTypes;
