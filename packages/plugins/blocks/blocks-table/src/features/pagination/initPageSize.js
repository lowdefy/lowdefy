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

// `view.pageSize`, else the `pageSize` property (normalised with `pagination`). Without
// pagination a view's pageSize is kept as it is, for when pagination is turned on.
function initPageSize({ value, defaultView, config }) {
  const pageSize = pickViewPart({ value, defaultView, key: 'pageSize' });
  if (type.isInt(pageSize) && pageSize > 0) return pageSize;
  return config.pagination?.pageSize;
}

export default initPageSize;
