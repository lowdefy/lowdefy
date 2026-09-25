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

import hashSeed from './hashSeed.js';

const AVATAR_COLORS = [
  'var(--ant-color-info)',
  'var(--ant-color-success)',
  'var(--ant-color-warning)',
  'var(--ant-color-error)',
  'var(--ant-color-purple, var(--ant-color-info))',
  'var(--ant-color-cyan, var(--ant-color-info))',
  'var(--ant-color-magenta, var(--ant-color-error))',
];

// An avatar background picked from a stable seed (an id or a name).
function avatarColor(seed) {
  return AVATAR_COLORS[hashSeed(seed) % AVATAR_COLORS.length];
}

export default avatarColor;
