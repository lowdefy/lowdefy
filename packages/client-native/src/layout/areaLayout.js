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

const CONTENT_KEYS = ['gap', 'align', 'justify', 'direction', 'wrap', 'overflow'];

// A block's content slot takes the block's layout settings it does not set itself, as on the web
// (@lowdefy/layout layoutParamsToArea). Other slots use only their own settings.
function areaLayout({ area = {}, areaKey, layout = {} }) {
  if (areaKey !== 'content') {
    return area;
  }
  const merged = { ...area };
  CONTENT_KEYS.forEach((key) => {
    if (type.isNone(merged[key]) && !type.isNone(layout[key])) {
      merged[key] = layout[key];
    }
  });
  return merged;
}

export default areaLayout;
