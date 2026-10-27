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

import matchLinkChip from './matchLinkChip.js';

// Brackets and separators an agent writes between a record's key and its title:
// `ACME-12 (Fix the menu)`, `ACME-12 - Fix the menu`, `ACME-12: Fix the menu`.
const titleWrapper = /^\((.*)\)$/s;
const titleSeparator = /^[-–—:·|]\s*/;

function tidyTitle(text) {
  const title = text.trim().replace(titleSeparator, '').replace(titleWrapper, '$1').trim();
  return title === '' ? null : title;
}

function withPrefix({ chip, label }) {
  const prefix = type.isString(chip.prefix) ? chip.prefix : '';
  return label.startsWith(prefix) ? label : `${prefix}${label}`;
}

/**
 * The chip a link draws as, when it matches one of the block's `linkChips` (matchLinkChip): the
 * chip's config, its key and its title.
 *
 * The key is the value the address names: after the scheme (`ACME-12` in `acme:ACME-12`), or
 * the pattern's `key` group, else its first group (`ACME-12` in `/ACME/tasks/ACME-12`). Link
 * text that starts with the key gives the key as written and the title after it, without the
 * brackets or separator between them (`ACME-12 (Fix the menu)` has the title `Fix the menu`).
 * Other link text is the title after a pattern's key, and all key after a scheme, whose value is
 * often an id (`[@Ada](mention:u_1)`): there the chip's `prefix` (`@` for a mention) goes before
 * text that does not start with it. A pattern without a group draws the text as a scheme does.
 *
 * The chip's `label` picks what shows: `keyAndTitle` (the default), `key` alone, or `text`, the
 * link text as written (after the prefix).
 *
 * @param {Object} params
 * @param {string} params.href The link's address.
 * @param {Object[]} [params.linkChips] The block's `linkChips` (schemas/linkChips).
 * @param {string} params.text The link's text.
 * @returns {{ chip: Object, key: string, title: string|null } | null} Null for a plain link.
 */
function getLinkChip({ href, linkChips = [], text }) {
  const match = matchLinkChip({ href, linkChips });
  if (match === null) {
    return null;
  }
  const { chip, fromPattern, value } = match;
  const label = text.trim();
  if (chip.label === 'text' || value === null || value === '') {
    const key = withPrefix({ chip, label });
    return { chip, key: key === '' ? value ?? '' : key, title: null };
  }
  let key;
  let title;
  if (label.toLowerCase().startsWith(value.toLowerCase())) {
    key = label.slice(0, value.length);
    title = tidyTitle(label.slice(value.length));
  } else if (fromPattern) {
    key = value;
    title = tidyTitle(label);
  } else {
    const whole = withPrefix({ chip, label });
    return { chip, key: whole === '' ? value : whole, title: null };
  }
  return { chip, key, title: chip.label === 'key' ? null : title };
}

export default getLinkChip;
