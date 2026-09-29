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

import findActiveView from './findActiveView.js';
import normalizeViews from './normalizeViews.js';
import readMountPayload from './readMountPayload.js';

// `mountValue` for a table mounting without a value: the persisted view first (the user's last
// view), then the active saved view.
function mountViewValue({ config, properties }) {
  const persisted = readMountPayload({ config });
  if (persisted !== null) return { view: persisted.view };
  const active = findActiveView({
    views: normalizeViews(properties.views),
    id: properties.activeView,
  });
  if (active === null) return null;
  return { view: active.view };
}

export default mountViewValue;
