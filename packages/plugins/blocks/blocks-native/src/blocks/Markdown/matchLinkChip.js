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

// Every link of every message is matched, so each pattern is compiled once.
const patterns = new Map();

function getPattern(source) {
  if (!patterns.has(source)) {
    patterns.set(source, new RegExp(source));
  }
  return patterns.get(source);
}

function matchScheme({ address, scheme }) {
  const cut = address.indexOf(':');
  if (cut < 1 || address.slice(0, cut).toLowerCase() !== scheme.toLowerCase()) {
    return null;
  }
  return address.slice(cut + 1).replace(/^\/\//, '');
}

function matchPattern({ address, pattern }) {
  const match = getPattern(pattern).exec(address);
  if (match === null) {
    return null;
  }
  return { value: match.groups?.key ?? match[1] ?? null };
}

/**
 * The first of the block's `linkChips` a link's address matches, with the value it names: a
 * chip with a `scheme` matches `scheme:value` in any case (`pelican:PEL-12`, value `PEL-12`); a
 * chip with a `pattern` matches when the regular expression finds the address
 * (`^/ACME/tasks/(?<key>ACME-\d+)$` and `/ACME/tasks/ACME-12`), its value the `key` group, else
 * its first group, else null.
 *
 * @param {Object} params
 * @param {string} params.href The link's address.
 * @param {Object[]} params.linkChips The block's `linkChips` (schemas/linkChips).
 * @returns {{ chip: Object, fromPattern: boolean, value: string|null } | null} Null when no chip matches.
 */
function matchLinkChip({ href, linkChips }) {
  const address = String(href ?? '');
  for (const chip of linkChips) {
    if (type.isString(chip.scheme)) {
      const value = matchScheme({ address, scheme: chip.scheme });
      if (value !== null) {
        return { chip, fromPattern: false, value };
      }
    } else if (type.isString(chip.pattern)) {
      const match = matchPattern({ address, pattern: chip.pattern });
      if (match !== null) {
        return { chip, fromPattern: true, value: match.value };
      }
    }
  }
  return null;
}

export default matchLinkChip;
