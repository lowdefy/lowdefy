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

function someEntry(entries, test) {
  return entries.some((entry) => {
    if (!type.isObject(entry)) return false;
    if (type.isArray(entry.children)) return someEntry(entry.children, test);
    return test(entry);
  });
}

// Whether the raw column config (`defaultColumn`, or any leaf column, header groups included)
// passes `test`: how the table decides which optional features a config needs before it
// normalizes the columns.
function someColumnConfig({ properties, test }) {
  if (type.isObject(properties.defaultColumn) && test(properties.defaultColumn)) return true;
  return type.isArray(properties.columns) && someEntry(properties.columns, test);
}

export default someColumnConfig;
