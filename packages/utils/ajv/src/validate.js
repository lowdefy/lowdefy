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

import compile from './compile.js';
import createErrorMessage from './createErrorMessage.js';

// A schema object that stays the same (a plugin schema, a cached artifact)
// compiles once; a fresh object compiles again and is released with it.
const validators = new WeakMap();

function getValidator(schema) {
  if (typeof schema !== 'object') {
    return compile({ schema });
  }
  let validator = validators.get(schema);
  if (!validator) {
    validator = compile({ schema });
    validators.set(schema, validator);
  }
  return validator;
}

function validate({ schema, data, returnErrors = false }) {
  const { valid, errors } = getValidator(schema)(data);
  if (!valid) {
    if (returnErrors) {
      return {
        valid: false,
        errors,
      };
    }
    throw new Error(createErrorMessage(errors));
  }
  return { valid: true };
}

export default validate;
