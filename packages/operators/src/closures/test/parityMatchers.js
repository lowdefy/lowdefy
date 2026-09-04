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

import { type } from '@lowdefy/helpers';

import { MARKER_KEYS } from '../emitOperatorClosures.js';

// toEqual ignores non-enumerable properties, so the provenance markers the
// parsers restore through serializer.copy have to be compared explicitly: they
// carry the ~k that build-check suppression and error location resolution walk.
function collectMarkers(value, path = '', collected = []) {
  if (type.isArray(value) || type.isObject(value)) {
    MARKER_KEYS.forEach((marker) => {
      if (value[marker] !== undefined) {
        collected.push(`${path}:${marker}=${value[marker]}`);
      }
    });
  }
  if (type.isArray(value)) {
    value.forEach((item, index) => collectMarkers(item, `${path}[${index}]`, collected));
  } else if (type.isObject(value)) {
    Object.keys(value).forEach((key) => collectMarkers(value[key], `${path}.${key}`, collected));
  }
  return collected;
}

function describeErrors(errors) {
  return errors.map((error) => ({
    name: error.name,
    message: error.message,
    received: error.received,
    location: error.location,
    configKey: error.configKey,
    checkSlug: error.checkSlug,
    typeName: error.typeName,
    methodName: error.methodName,
  }));
}

export { collectMarkers, describeErrors };
