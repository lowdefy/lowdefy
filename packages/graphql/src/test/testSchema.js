/*
  Copyright 2020 Lowdefy, Inc

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
import { nunjucksFunction } from '@lowdefy/nunjucks';
import { ConfigurationError } from '../context/errors';

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
});
ajvErrors(ajv);

function testSchema({ schema, object }) {
  const valid = ajv.validate(schema, object);
  if (!valid) {
    let message;
    if (ajv.errors.length > 1) {
      const firstMessage = ajv.errors[0].message;
      const lastMessage = ajv.errors[ajv.errors.length - 1].message;
      const firstTemplate = nunjucksFunction(firstMessage);
      const lastTemplate = nunjucksFunction(lastMessage);
      message = `${firstTemplate(ajv.errors[0])}; ${lastTemplate(
        ajv.errors[ajv.errors.length - 1]
      )}`;
    } else {
      const template = nunjucksFunction(ajv.errors[0].message);
      message = template(ajv.errors[0]);
    }
    throw new ConfigurationError(message);
  }
  return true;
}

export default testSchema;
