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

// A declared confirm fails closed: only false, or no confirm key, lets the event fire without
// asking. A string is the message; an empty one (an operator that found no text) still asks,
// with the element's or the default message.
function toRule(confirm) {
  if (type.isUndefined(confirm) || confirm === false) {
    return { confirm: false, message: null };
  }
  if (type.isString(confirm) && confirm !== '') {
    return { confirm: true, message: confirm };
  }
  return { confirm: true, message: null };
}

// dataEvents lists the events a block's HTML may fire, as names or { name, confirm }. Returns
// the listed event's rule, or null when the HTML may not fire it.
function findDataEventRule({ dataEvents, name }) {
  if (!type.isArray(dataEvents)) return null;
  for (const entry of dataEvents) {
    if (entry === name) return toRule(undefined);
    if (type.isObject(entry) && entry.name === name) {
      return toRule(entry.confirm);
    }
  }
  return null;
}

export default findDataEventRule;
