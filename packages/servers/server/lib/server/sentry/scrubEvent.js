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

import scrubSecrets from '../scrubSecrets.js';

// type.isObject also accepts class instances, whose internals a plain copy
// would expose; Sentry normalizes those before beforeSend runs, so the event
// hook still reaches their strings.
function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function scrubValue(value, copies) {
  if (type.isString(value)) return scrubSecrets(value);
  if (!type.isArray(value) && !isPlainObject(value)) return value;
  // Breadcrumbs reach beforeBreadcrumb un-normalized - a console breadcrumb
  // holds the logged arguments as they are - so a cycle is possible, and
  // reusing the copy of an object already seen keeps the walk from recursing
  // forever.
  if (copies.has(value)) return copies.get(value);
  if (type.isArray(value)) {
    const scrubbedArray = [];
    copies.set(value, scrubbedArray);
    value.forEach((item) => {
      scrubbedArray.push(scrubValue(item, copies));
    });
    return scrubbedArray;
  }
  const scrubbedObject = {};
  copies.set(value, scrubbedObject);
  Object.entries(value).forEach(([key, item]) => {
    scrubbedObject[key] = scrubValue(item, copies);
  });
  return scrubbedObject;
}

function scrubEvent(value) {
  return scrubValue(value, new Map());
}

export default scrubEvent;
