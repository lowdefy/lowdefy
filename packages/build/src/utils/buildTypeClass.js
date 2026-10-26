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

import { ConfigError, ConfigWarning } from '@lowdefy/errors';

import findSimilarString from './findSimilarString.js';

function buildTypeClass(
  context,
  { counter, definitions, store, typeClass, warnIfMissing = false }
) {
  const counts = counter.getCounts();
  const definedTypes = Object.keys(definitions);
  Object.keys(counts).forEach((typeName) => {
    if (!definitions[typeName]) {
      const configKey = counter.getLocation(typeName);

      let message = `${typeClass} type "${typeName}" was used but is not defined.`;
      const suggestion = findSimilarString({ input: typeName, candidates: definedTypes });
      if (suggestion) {
        message += ` Did you mean "${suggestion}"?`;
      }
      if (warnIfMissing) {
        context.handleWarning(new ConfigWarning(message, { configKey, checkSlug: 'types' }));
        return;
      }
      throw new ConfigError(message, { configKey, checkSlug: 'types' });
    }
    store[typeName] = {
      originalTypeName: definitions[typeName].originalTypeName ?? typeName,
      package: definitions[typeName].package,
      version: definitions[typeName].version,
      count: counts[typeName],
    };
  });
}

export default buildTypeClass;
