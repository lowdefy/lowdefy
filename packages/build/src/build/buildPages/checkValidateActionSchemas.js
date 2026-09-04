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

import { getSchemaAtPath, nestSchemaPaths } from '@lowdefy/ajv';
import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import collectExceptions from '../../utils/collectExceptions.js';
import findSimilarString from '../../utils/findSimilarString.js';
import traverseConfig from '../../utils/traverseConfig.js';

const CHECK_SLUG = 'state-schema';

// A Validate action targeting the state contract fails for two reasons the
// build already knows: the page declares no contract, or the path it names is
// not in the one it declares. Both were runtime throws in the engine; neither
// needs the app to run to be found, and only here can they name the config
// line that is wrong.
function checkValidateActionSchemas({ page, context }) {
  const declared = type.isObject(page.stateSchema)
    ? Object.fromEntries(Object.entries(page.stateSchema).filter(([key]) => !key.startsWith('~')))
    : null;
  const schema = declared === null ? null : nestSchemaPaths({ paths: declared });

  traverseConfig({
    config: page,
    visitor: (obj) => {
      if (obj.type !== 'Validate' || !type.isObject(obj.params)) return;
      if (type.isUndefined(obj.params.schema)) return;
      const configKey = obj.params['~k'] ?? obj['~k'];
      if (schema === null) {
        collectExceptions(
          context,
          new ConfigError(
            `Action "${obj.id}" validates the state contract of page "${page.pageId}", which declares no "state".`,
            { configKey, checkSlug: CHECK_SLUG }
          )
        );
        return;
      }
      if (!type.isString(obj.params.schema)) return;
      if (getSchemaAtPath({ schema, path: obj.params.schema }) !== null) return;
      const candidates = Object.keys(declared);
      const suggestion = findSimilarString({ input: obj.params.schema, candidates });
      collectExceptions(
        context,
        new ConfigError(
          `Action "${obj.id}" validates "${
            obj.params.schema
          }", which is not part of the state contract of page "${
            page.pageId
          }". Declared paths: ${candidates.join(', ')}.` +
            (suggestion === null ? '' : ` Did you mean "${suggestion}"?`),
          { configKey, checkSlug: CHECK_SLUG }
        )
      );
    },
  });
}

export default checkValidateActionSchemas;
