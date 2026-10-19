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

const ROW_PADDING = 16;
const GAP = 12;
const ICON_BOX = 28;
const STATUS_SIZE = 18;

function getLeading({ properties }) {
  const leading = {
    avatar: properties.avatar,
    icon: properties.icon,
    ...(properties.leading ?? {}),
  };
  if (!type.isNone(leading.status)) {
    const status = type.isString(leading.status) ? { name: leading.status } : leading.status;
    const size = status.size ?? STATUS_SIZE;
    return { kind: 'status', status: { ...status, size }, width: size };
  }
  if (type.isObject(leading.avatar)) {
    const size = leading.avatar.size ?? (type.isNone(getSubtitle({ properties })) ? 28 : 40);
    return { kind: 'avatar', avatar: leading.avatar, size, width: size };
  }
  if (!type.isNone(leading.icon)) {
    return { kind: 'icon', icon: leading.icon, width: ICON_BOX };
  }
  return null;
}

function getSubtitle({ properties }) {
  return properties.subtitle ?? properties.description;
}

function getTrailing({ properties }) {
  const trailing = properties.trailing ?? {};
  return {
    avatar: trailing.avatar,
    avatars: trailing.avatars,
    badges: trailing.badges ?? [],
    check: trailing.check === true,
    icon: trailing.icon,
    status: trailing.status,
    text: trailing.text ?? properties.extra,
    textColor: trailing.textColor,
  };
}

/**
 * What a ListItem draws from its properties: the leading glyph (a status glyph, else an avatar,
 * else an icon), the subtitle, the trailing parts, and where the row's separator starts (in line
 * with the title, as iOS insets it). The phase 1 `icon`, `avatar`, `description` and `extra`
 * properties stand for `leading.icon`, `leading.avatar`, `subtitle` and `trailing.text`.
 *
 * @param {Object} params
 * @param {Object} params.properties The ListItem's properties.
 * @returns {{ leading: Object|null, subtitle?: string, trailing: Object, separatorInset: number }}
 */
function getListItemParts({ properties }) {
  const leading = getLeading({ properties });
  return {
    leading,
    separatorInset: leading === null ? ROW_PADDING : ROW_PADDING + leading.width + GAP,
    subtitle: getSubtitle({ properties }),
    trailing: getTrailing({ properties }),
  };
}

export { GAP, ICON_BOX, ROW_PADDING };
export default getListItemParts;
