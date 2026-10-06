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

const MAX_TOP_TOKENS = 5;

function compareText(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function placeKey({ page, block_id: blockId, column }) {
  return JSON.stringify([page, blockId ?? '', column ?? '']);
}

// What a tokenised click can be read by without its text: per page, block
// and column, the clicks there, the distinct tokens that resolved to no config
// string, and the most-clicked of those tokens with how many distinct persons
// clicked each. One token clicked by many people on a button reads as a label
// built from values; hundreds of tokens on a grid column read as data. Only
// places with at least one unresolved token are listed. `segments` are
// compileSegments' segments; their `text_clicks` hold every click. Sorted by
// page, block and column, and top tokens by clicks, persons, then token, so
// the same segments give the same rows.
function countTextTokens({ segments }) {
  const places = new Map();
  segments.forEach((segment) => {
    (segment.text_clicks ?? []).forEach((click) => {
      const key = placeKey(click);
      if (!places.has(key)) {
        places.set(key, {
          key,
          page: click.page,
          block_id: click.block_id,
          column: click.column,
          clicks: 0,
          tokens: new Map(),
        });
      }
      const place = places.get(key);
      place.clicks += 1;
      if (click.config_text || !type.isString(click.text_token)) return;
      if (!place.tokens.has(click.text_token)) {
        place.tokens.set(click.text_token, { clicks: 0, persons: new Set() });
      }
      const token = place.tokens.get(click.text_token);
      token.clicks += 1;
      if (type.isString(click.person)) token.persons.add(click.person);
    });
  });
  return [...places.values()]
    .filter((place) => place.tokens.size > 0)
    .sort((a, b) => compareText(a.key, b.key))
    .map((place) => ({
      page: place.page,
      block_id: place.block_id,
      column: place.column,
      clicks: place.clicks,
      tokens: place.tokens.size,
      top: [...place.tokens.entries()]
        .map(([token, entry]) => ({ token, clicks: entry.clicks, persons: entry.persons.size }))
        .sort(
          (a, b) => b.clicks - a.clicks || b.persons - a.persons || compareText(a.token, b.token)
        )
        .slice(0, MAX_TOP_TOKENS),
    }));
}

export default countTextTokens;
