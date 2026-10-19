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

import { compile } from '@lowdefy/ajv';
import { LRUCache, serializer } from '@lowdefy/helpers';

// A ValidateSchema step evaluates its schema property on every call, so each
// call hands over a new object, and operators in it can change the schema from
// one call to the next. Validators are cached by the schema's content: the same
// schema compiles once, a different one gets its own validator, and the cache
// stays bounded.
const validators = new LRUCache({ maxSize: 100 });

function getSchemaValidator({ schema }) {
  const key = serializer.serializeToString(schema, { stable: true, skipMarkers: true });
  let validator = validators.get(key);
  if (!validator) {
    validator = compile({ schema });
    validators.set(key, validator);
  }
  return validator;
}

export default getSchemaValidator;
