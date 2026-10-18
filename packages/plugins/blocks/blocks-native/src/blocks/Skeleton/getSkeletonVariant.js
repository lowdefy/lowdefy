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

/**
 * What a Skeleton draws: its `variant`; loading list rows when it sets only the row properties
 * (`count`, `rows` or `avatar`), as before variants; otherwise one shape of its width and height.
 *
 * @param {Object} properties The Skeleton's properties.
 * @returns {'shape'|'listRow'|'insetGroup'|'hero'|'paragraph'|'card'|'timeline'}
 */
function getSkeletonVariant(properties) {
  if (type.isString(properties.variant)) return properties.variant;
  const setsRows =
    !type.isNone(properties.count) ||
    !type.isNone(properties.rows) ||
    !type.isNone(properties.avatar);
  return setsRows ? 'listRow' : 'shape';
}

export default getSkeletonVariant;
