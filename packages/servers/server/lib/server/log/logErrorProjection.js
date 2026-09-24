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

import { lowdefyErrorNames, readErrorCodes } from '@lowdefy/errors';
import { serializer, type } from '@lowdefy/helpers';

// Kept only on nodes named as a Lowdefy error class: libraries reuse some of
// these names for their own data - axios's `config` carries auth, params and
// headers - so keying on the field alone would let a library's copy through.
const lowdefyErrorFields = [
  'configKey',
  'source',
  'config',
  'handled',
  'isLowdefyError',
  'received',
  'typeName',
  'location',
  'service',
  'hint',
  'methodName',
  'metaData',
  'blockId',
  'pageId',
  'isReject',
];

// `received` is the one kept field holding values fetched at runtime (a token
// from an earlier step sent as a header), which the by-value secret scrub
// cannot recognise, so credential-looking keys are masked by name instead.
const credentialKeyParts = ['authorization', 'token', 'secret', 'password', 'apikey', 'cookie'];

function isCredentialKey(key) {
  const normalized = key.toLowerCase().replace(/[-_]/g, '');
  return credentialKeyParts.some((part) => normalized.includes(part));
}

// type.isObject also accepts class instances; copying one into a plain object
// would hand the walk its internals instead of its '[Object: Name]' marker.
function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function maskValue(value, copies) {
  if (!type.isArray(value) && !isPlainObject(value)) return value;
  // Reusing the copy for an object already seen keeps shared references and
  // cycles intact, so the walk still marks them '[Circular]' instead of this
  // recursion overflowing the stack.
  if (copies.has(value)) return copies.get(value);
  if (type.isArray(value)) {
    const maskedArray = [];
    copies.set(value, maskedArray);
    value.forEach((item) => {
      maskedArray.push(maskValue(item, copies));
    });
    return maskedArray;
  }
  const maskedObject = {};
  copies.set(value, maskedObject);
  Object.entries(value).forEach(([key, item]) => {
    maskedObject[key] = isCredentialKey(key) ? '[REDACTED]' : maskValue(item, copies);
  });
  return maskedObject;
}

function maskCredentialKeys(value) {
  return maskValue(value, new Map());
}

function projectErrorForLog(err) {
  const { code, statusCode } = readErrorCodes(err);
  const props = { name: err.name, message: err.message, stack: err.stack, code, statusCode };
  if (lowdefyErrorNames.has(err.name)) {
    lowdefyErrorFields.forEach((field) => {
      props[field] = err[field];
    });
    props.received = maskCredentialKeys(err.received);
  }
  props.cause = err.cause;
  return props;
}

function serializeErrorForLog(error) {
  return serializer.serialize(error, { projectError: projectErrorForLog })?.['~e'] ?? error;
}

export { maskCredentialKeys, projectErrorForLog, serializeErrorForLog };
