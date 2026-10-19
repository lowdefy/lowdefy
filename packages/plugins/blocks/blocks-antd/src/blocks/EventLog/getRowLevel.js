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

import { get } from '@lowdefy/helpers';

import levels from './levels.js';

// Severity is explicit: the level field on the row wins, then the level on the type config,
// otherwise the row is informational.
function getRowLevel({ fields, row, typeConfig }) {
  const rowLevel = get(row, fields.level, { default: null });
  if (levels.includes(rowLevel)) return rowLevel;
  if (levels.includes(typeConfig.level)) return typeConfig.level;
  return 'info';
}

export default getRowLevel;
