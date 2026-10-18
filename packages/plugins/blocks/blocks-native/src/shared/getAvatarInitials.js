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

// The theme's preset colours an initials avatar is drawn on, all dark enough for white text.
const PALETTE = ['blue', 'purple', 'cyan', 'green', 'magenta', 'volcano', 'geekblue', 'orange'];

/**
 * The initials and colour of an initials avatar. The colour comes from the name, so a person
 * keeps one colour everywhere, unless the avatar sets its own.
 *
 * @param {Object} params
 * @param {Object} params.avatar `{ name, color }`.
 * @param {Object} params.tokens The block's antd tokens.
 * @returns {{ initials: string, color: string }}
 */
function getAvatarInitials({ avatar, tokens }) {
  const name = type.isString(avatar.name) ? avatar.name.trim() : '';
  const words = name.split(/\s+/).filter((word) => word !== '');
  const initials = words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
  if (type.isString(avatar.color)) {
    return { initials, color: avatar.color };
  }
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.codePointAt(0)) % 997;
  }
  return { initials, color: tokens[PALETTE[hash % PALETTE.length]] ?? tokens.colorPrimary };
}

export default getAvatarInitials;
