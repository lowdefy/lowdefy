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

// Collapses or expands one group (`collapsed` omitted toggles it).
function createToggleGroup(api) {
  return function toggleGroup({ key, collapsed }) {
    const current = api.state.collapsedGroups;
    const isCollapsed = current.includes(key);
    const next = type.isBoolean(collapsed) ? collapsed : !isCollapsed;
    if (next === isCollapsed) return false;
    return api.actions.setCollapsedGroups(
      next ? [...current, key] : current.filter((entry) => entry !== key)
    );
  };
}

export default createToggleGroup;
