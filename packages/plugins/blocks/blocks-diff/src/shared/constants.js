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

export const CHANGE_TYPES = {
  CREATE: 'CREATE',
  REMOVE: 'REMOVE',
  CHANGE: 'CHANGE',
  UNCHANGED: 'UNCHANGED',
};

// Sentinel for the synthetic group that holds top-level primitive changes when
// groupByRoot is enabled, and every change when groupByRoot is false. Leading
// underscores keep it from colliding with user keys in typical datasets.
export const GROUP_ROOT = '__root__';

export const DEFAULT_CHANGE_TYPE_LABELS = {
  added: 'Added',
  removed: 'Removed',
  changed: 'Changed',
  unchanged: 'Unchanged',
};

export const CHANGE_TYPE_TAG_COLORS = {
  [CHANGE_TYPES.CREATE]: 'success',
  [CHANGE_TYPES.REMOVE]: 'error',
  [CHANGE_TYPES.CHANGE]: 'warning',
  [CHANGE_TYPES.UNCHANGED]: 'default',
};
