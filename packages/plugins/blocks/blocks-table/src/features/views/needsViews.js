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

// Saved views load with `persist`, with a `views` property (views may arrive later from a
// request, so the key alone counts) and with the toolbar's view tabs.
function needsViews({ properties }) {
  if (!type.isNone(properties.persist)) return true;
  if (!type.isUndefined(properties.views)) return true;
  return properties.toolbar === true || properties.toolbar?.views === true;
}

export default needsViews;
