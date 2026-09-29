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

import getViewKey from './getViewKey.js';

// The active saved view: the requested id when it is still in the list, else the first (leftmost)
// view, as tabbed index pages default to their first tab.
function findActiveView({ views, id }) {
  const key = type.isNone(id) ? null : getViewKey(id);
  return views.find((view) => view.key === key) ?? views[0] ?? null;
}

export default findActiveView;
