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

const KEYS = ['queued', 'running', 'ok', 'error', 'empty'];

// Server mode: a column's run state counts from the fetch response's `aggregates`, when the
// request returns them as `aggregates[columnKey] = { queued, running, error, ... }`. Null when it
// does not (the chip then counts the loaded rows).
function readServerRunCounts({ aggregates, key }) {
  const entry = aggregates?.[key];
  if (!type.isObject(entry) || !KEYS.some((name) => type.isNumber(entry[name]))) return null;
  return Object.fromEntries(
    KEYS.map((name) => [name, type.isNumber(entry[name]) ? entry[name] : 0])
  );
}

export default readServerRunCounts;
