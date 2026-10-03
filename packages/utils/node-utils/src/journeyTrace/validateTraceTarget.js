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

function isIndexOrNone(value) {
  return type.isNone(value) || (type.isInt(value) && value >= 0);
}

function isStringOrNone(value) {
  return type.isNone(value) || type.isString(value);
}

function isNonEmptyString(value) {
  return type.isString(value) && value !== '';
}

// The DOM target of an interaction, as the describe functions produce it. The
// page and the enclosing block ids belong elsewhere: `page_id` is on the record
// and `block_ids` only feeds the pairing rule, so a target carrying either was
// built by a record builder that skipped that split.
function validateTraceTarget({ target }) {
  if (!type.isObject(target)) {
    return `Trace record "target" should be an object. Received ${JSON.stringify(target)}.`;
  }
  if ('page_id' in target || 'block_ids' in target) {
    return `Trace record "target" should not carry "page_id" or "block_ids": the page is on the record and block ids feed pairing only. Received ${JSON.stringify(
      target
    )}.`;
  }
  if (!isNonEmptyString(target.block_id) && !isNonEmptyString(target.text)) {
    return `Trace record "target" requires a "block_id" or a "text". Received ${JSON.stringify(
      target
    )}.`;
  }
  if (!isStringOrNone(target.block_id)) {
    return `Trace record "target.block_id" should be a string or null. Received ${JSON.stringify(
      target.block_id
    )}.`;
  }
  if (!isStringOrNone(target.text)) {
    return `Trace record "target.text" should be a string or null. Received ${JSON.stringify(
      target.text
    )}.`;
  }
  if (!isStringOrNone(target.block_type)) {
    return `Trace record "target.block_type" should be a string or null. Received ${JSON.stringify(
      target.block_type
    )}.`;
  }
  if (!isStringOrNone(target.column)) {
    return `Trace record "target.column" should be a string or null. Received ${JSON.stringify(
      target.column
    )}.`;
  }
  if (!isIndexOrNone(target.row)) {
    return `Trace record "target.row" should be a zero-based integer or null. Received ${JSON.stringify(
      target.row
    )}.`;
  }
  if (!isIndexOrNone(target.nth)) {
    return `Trace record "target.nth" should be a zero-based integer or null. Received ${JSON.stringify(
      target.nth
    )}.`;
  }
  if (!type.isUndefined(target.option) && !type.isBoolean(target.option)) {
    return `Trace record "target.option" should be a boolean. Received ${JSON.stringify(
      target.option
    )}.`;
  }
  return undefined;
}

export default validateTraceTarget;
