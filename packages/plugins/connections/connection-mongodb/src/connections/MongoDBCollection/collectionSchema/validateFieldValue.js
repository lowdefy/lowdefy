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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import getFieldValidator from './getFieldValidator.js';
import toContractShape from './toContractShape.js';

// ajv's own wording is kept for the common cases (must be string, must be
// equal to one of the allowed values); the one it leaves opaque is spelled out:
// the allowed values of an enum.
function describeViolation({ error }) {
  if (error.keyword === 'enum') {
    return `${error.message} (${error.params.allowedValues.join(', ')})`;
  }
  return error.message;
}

// ajv reports the offending item as a JSON pointer (/0, /1/x); the message
// names it in the dotted path form MongoDB uses (evidence_ids.0).
function fieldPath({ fieldName, instancePath }) {
  if (!instancePath) {
    return fieldName;
  }
  return `${fieldName}${instancePath.replace(/\//g, '.')}`;
}

function describeReceived(value) {
  if (type.isUndefined(value)) {
    return 'undefined';
  }
  return JSON.stringify(value);
}

// Validates one declared field's written value. A value of null is a cleared
// field, not a shape: JSON Schema's `type: string` would reject it, but the
// shorthand cannot express `[string, null]`, and `$set: { closed_at: null }`
// is how a field is emptied. Presence (`required`) is a document-level check
// made by validateDocFields, so null passes here for every field.
function validateFieldValue({ collectionName, fieldName, fieldSchema, position, value }) {
  if (value === null) {
    return;
  }
  const validator = getFieldValidator({ fieldSchema });
  const { valid, errors } = validator(toContractShape({ value }));
  if (valid) {
    return;
  }
  const [error] = errors;
  throw new ConfigError(
    `Field "${fieldPath({
      fieldName,
      instancePath: error.instancePath,
    })}" in ${position} for collection "${collectionName}" does not match the declared contract: ${describeViolation(
      { error }
    )}. Received ${describeReceived(value)}.`
  );
}

export default validateFieldValue;
