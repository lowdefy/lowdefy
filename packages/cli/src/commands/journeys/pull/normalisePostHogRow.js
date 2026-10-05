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

const ZONE = /(Z|[+-]\d{2}:?\d{2})$/;

// HogQL hands back property values as JSON scalars or, for a property it has
// no type for, as the raw JSON text ('["a","b"]', 'true', '300'). The pull
// reads either form into the type the record needs.
function readString(value) {
  if (!type.isString(value)) return null;
  return value === '' ? null : value;
}

function readJson(value) {
  if (!type.isString(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function readStringArray(value) {
  const parsed = readJson(value);
  if (!type.isArray(parsed)) return null;
  return parsed.filter((entry) => type.isString(entry) && entry !== '');
}

function readStringObject(value) {
  const parsed = readJson(value);
  if (!type.isObject(parsed) || !Object.values(parsed).every(type.isString)) return null;
  return parsed;
}

function readInt(value) {
  const parsed = type.isString(value) && value !== '' ? Number(value) : value;
  return type.isInt(parsed) ? parsed : null;
}

function readBoolean(value) {
  return value === true || value === 'true';
}

// ClickHouse may answer `2026-10-01 10:00:00.123456` with no zone; every
// PostHog timestamp is UTC.
function readTimestamp(value) {
  if (!type.isString(value) || value === '') return null;
  const iso = value.replace(' ', 'T');
  const time = Date.parse(ZONE.test(iso) ? iso : `${iso}Z`);
  return Number.isNaN(time) ? null : time;
}

function normaliseText(value) {
  if (!type.isString(value)) return null;
  const text = value.replace(/\s+/g, ' ').trim();
  return text === '' ? null : text;
}

// One row of the pull query, read into the types the record mapping uses.
function normalisePostHogRow({ row }) {
  return {
    uuid: readString(row.uuid),
    time: readTimestamp(row.timestamp),
    event: readString(row.event),
    sessionId: readString(row.session_id),
    windowId: readString(row.window_id),
    personId: readString(row.person_id),
    orgId: type.isNone(row.org_id) || row.org_id === '' ? null : String(row.org_id),
    roles: readStringArray(row.roles),
    pathname: readString(row.pathname),
    currentUrl: readString(row.current_url),
    eventType: readString(row.event_type),
    elText: normaliseText(row.el_text),
    buildId: readString(row.lowdefy_build_id),
    pageId: readString(row.lowdefy_page_id),
    pathParams: readStringObject(row.lowdefy_path_params),
    blockId: readString(row.lowdefy_block_id),
    blockIds: readStringArray(row.lowdefy_block_ids),
    blockType: readString(row.lowdefy_block_type),
    row: readInt(row.lowdefy_row),
    column: readString(row.lowdefy_column),
    option: readBoolean(row.lowdefy_option),
    eventScope: readString(row.lowdefy_event_scope),
    eventName: readString(row.lowdefy_event_name),
    debounceMs: readInt(row.lowdefy_debounce_ms),
    actionId: readString(row.lowdefy_action_id),
    actionType: readString(row.lowdefy_action_type),
    errorName: readString(row.lowdefy_error_name),
    configKey: readString(row.lowdefy_config_key),
    invalidBlocks: readStringArray(row.lowdefy_invalid_blocks),
    elementsChain: readString(row.elements_chain),
  };
}

export default normalisePostHogRow;
