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

import pickViewPart from '../../core/pickViewPart.js';
import toGroupKeys from './toGroupKeys.js';

// The group levels as column keys. Keys of unknown or non-groupable columns (a stale saved view)
// are dropped, as are repeats.
function initGrouping({ value, defaultView, config }) {
  const group = pickViewPart({ value, defaultView, key: 'group' });
  if (!type.isArray(group)) return [];
  const keys = [];
  toGroupKeys(group).forEach((key) => {
    if (config.columnsByKey.get(key)?.groupable !== true || keys.includes(key)) return;
    keys.push(key);
  });
  return keys;
}

export default initGrouping;
