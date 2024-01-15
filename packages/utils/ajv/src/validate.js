/*
  Copyright 2020-2024 Lowdefy, Inc

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

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import createErrorMessage from './createErrorMessage.js';

const ajv = new Ajv({
  allErrors: true,
  strict: false,
});

ajvErrors(ajv);

function validate({ schema, data, returnErrors = false }) {
  const valid = ajv.validate(schema, data);
  if (!valid) {
    if (returnErrors) {
      return {
        valid: false,
        errors: ajv.errors,
      };
    }
    throw new Error(createErrorMessage(ajv.errors));
  }
  return { valid: true };
}

export default validate;
