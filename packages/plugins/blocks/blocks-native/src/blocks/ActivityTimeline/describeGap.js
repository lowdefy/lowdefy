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

import getActor from './getActor.js';

/**
 * A gap's line: "14 earlier changes by A, B and 2 others". Up to three actors are named; past
 * three, the first two and a count of the rest. A gap's own `text` replaces the line.
 *
 * @param {Object} params
 * @param {{ count: number, actors?: Array, text?: string }} params.gap
 * @param {Array} [params.members]
 * @returns {Array} Line segments.
 */
function describeGap({ gap, members }) {
  if (type.isString(gap.text)) {
    return [{ kind: 'text', text: gap.text }];
  }
  const count = gap.count ?? 0;
  const actors = (gap.actors ?? []).map((by) => getActor({ by, members }));
  const segments = [
    { kind: 'text', text: `${count} earlier ${count === 1 ? 'change' : 'changes'}` },
  ];
  if (actors.length === 0) {
    return segments;
  }
  const named = actors.length > 3 ? actors.slice(0, 2) : actors;
  segments.push({ kind: 'text', text: ' by ' });
  named.forEach((actor, index) => {
    if (index > 0) {
      const last = index === named.length - 1 && actors.length <= 3;
      segments.push({ kind: 'text', text: last ? ' and ' : ', ' });
    }
    segments.push(actor);
  });
  if (actors.length > 3) {
    segments.push({ kind: 'text', text: ` and ${actors.length - 2} others` });
  }
  return segments;
}

export default describeGap;
