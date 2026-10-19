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

// The keys of the collapsed column groups, in config order: `view.collapsedColumnGroups` from the
// value, then `defaultView`, then each collapsible group's own `collapsed`. Keys that name no
// collapsible group are dropped.
function initCollapsedColumnGroups({ value, defaultView, config }) {
  const { groups } = config.columnGroups;
  const part = pickViewPart({ value, defaultView, key: 'collapsedColumnGroups' });
  if (!type.isArray(part)) {
    return groups.filter((group) => group.collapsed).map((group) => group.key);
  }
  const collapsed = new Set(part);
  return groups.filter((group) => collapsed.has(group.key)).map((group) => group.key);
}

export default initCollapsedColumnGroups;
