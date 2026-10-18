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
 * The chip a link draws as, when its address uses one of the block's `linkChips` schemes: the
 * chip's config, its key and its title. The key is the part of the link text the address names
 * (`PEL-12` in `[PEL-12 Sign in](pelican:PEL-12)`), and the title the text after it. Text that
 * does not start with the address's value is all key, after the chip's `prefix` (`@` for a
 * mention) when it does not already start with it.
 *
 * @param {Object} params
 * @param {string} params.href The link's address.
 * @param {Object[]} [params.linkChips] The block's `linkChips`: `[{ scheme, icon, tone, color, prefix }]`.
 * @param {string} params.text The link's text.
 * @returns {{ chip: Object, key: string, title: string|null } | null} Null for a plain link.
 */
function getLinkChip({ href, linkChips = [], text }) {
  const address = String(href ?? '');
  const cut = address.indexOf(':');
  if (cut < 1) {
    return null;
  }
  const scheme = address.slice(0, cut).toLowerCase();
  const chip = linkChips.find((config) => String(config.scheme).toLowerCase() === scheme);
  if (type.isUndefined(chip)) {
    return null;
  }
  const value = address.slice(cut + 1).replace(/^\/\//, '');
  const label = text.trim();
  if (value !== '' && label.toLowerCase().startsWith(value.toLowerCase())) {
    const title = label.slice(value.length).trim();
    return { chip, key: label.slice(0, value.length), title: title === '' ? null : title };
  }
  const prefix = type.isString(chip.prefix) ? chip.prefix : '';
  const key = label.startsWith(prefix) ? label : `${prefix}${label}`;
  return { chip, key: key === '' ? value : key, title: null };
}

export default getLinkChip;
