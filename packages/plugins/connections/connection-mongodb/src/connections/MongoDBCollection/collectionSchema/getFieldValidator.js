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

// One compiled validator per declared field, keyed by the field's schema
// object. context.readConfigFile caches build/collections.json, so the same
// schema objects arrive on every request of a server process and each field
// compiles once; a rebuild in dev hands out new objects and recompiles. The
// build writes valid JSON Schema, so nothing is preprocessed here.
const validators = new WeakMap();

function getFieldValidator({ fieldSchema }) {
  let validator = validators.get(fieldSchema);
  if (!validator) {
    validator = compile({ schema: fieldSchema });
    validators.set(fieldSchema, validator);
  }
  return validator;
}

export default getFieldValidator;
