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

// Area-level layout keys become the arrangement block's own properties where
// the block has one, and a class where it does not. The GAP tokens are the px
// values of the gap-* classes in blocks-basic/src/arrangement.js.
const GAP_TOKENS = [
  ['none', 0],
  ['xs', 4],
  ['sm', 8],
  ['md', 16],
  ['lg', 24],
  ['xl', 32],
];

const ALIGN = {
  top: 'start',
  middle: 'center',
  bottom: 'end',
  start: 'start',
  center: 'center',
  end: 'end',
  stretch: 'stretch',
  baseline: 'baseline',
};

const JUSTIFY = {
  start: 'start',
  center: 'center',
  end: 'end',
  'space-between': 'between',
  'space-around': 'around',
  'space-evenly': 'evenly',
};

const WRAP = { wrap: 'wrap', nowrap: 'nowrap', 'wrap-reverse': 'reverse' };

const OVERFLOW = ['auto', 'hidden', 'scroll', 'visible', 'clip'];

// Which arrangement block owns which property. Anything a block does not own
// becomes a utility class on the container, or a report entry when there is no
// faithful class.
const OWNED = {
  Grid: ['gap'],
  Row: ['gap', 'wrap', 'align', 'justify'],
  Stack: ['gap', 'align'],
};

function gapToToken(gap) {
  const px = typeof gap === 'string' ? Number.parseFloat(gap) : gap;
  if (typeof px !== 'number' || Number.isNaN(px)) return { token: null };
  const exact = GAP_TOKENS.find(([, value]) => value === px);
  if (exact) return { token: exact[0] };
  const nearest = GAP_TOKENS.reduce((best, entry) =>
    Math.abs(entry[1] - px) < Math.abs(best[1] - px) ? entry : best
  );
  return { token: nearest[0], approximated: `${px}px to gap: ${nearest[0]} (${nearest[1]}px)` };
}

function areaToContainer({ type, area }) {
  const properties = {};
  const classes = [];
  const notes = [];
  const owned = OWNED[type];

  if (area.gap !== undefined) {
    const { token, approximated } = gapToToken(area.gap);
    if (token === null) notes.push(`gap ${JSON.stringify(area.gap)} is not a length`);
    else {
      properties.gap = token;
      if (approximated) notes.push(`rounded gap ${approximated}`);
    }
  }

  if (area.align !== undefined) {
    const value = ALIGN[area.align];
    if (!value) notes.push(`align ${JSON.stringify(area.align)} has no equivalent`);
    else if (owned.includes('align')) properties.align = value;
    else classes.push(`items-${value}`);
  }

  if (area.justify !== undefined) {
    const value = JUSTIFY[area.justify];
    if (!value) notes.push(`justify ${JSON.stringify(area.justify)} has no equivalent`);
    else if (owned.includes('justify')) properties.justify = value;
    else classes.push(`justify-${value}`);
  }

  if (area.wrap !== undefined) {
    const value = WRAP[area.wrap];
    if (!value) notes.push(`wrap ${JSON.stringify(area.wrap)} has no equivalent`);
    else if (owned.includes('wrap')) properties.wrap = value;
    else notes.push(`wrap ${JSON.stringify(area.wrap)} does not apply to a ${type}`);
  }

  if (area.overflow !== undefined) {
    if (OVERFLOW.includes(area.overflow)) classes.push(`overflow-${area.overflow}`);
    else notes.push(`overflow ${JSON.stringify(area.overflow)} has no equivalent class`);
  }

  return { properties, classes, notes };
}

export { gapToToken };

export default areaToContainer;
