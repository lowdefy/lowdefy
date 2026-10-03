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

import crypto from 'node:crypto';

// The state shape a walk's progress rules are keyed by: the first 8 hex of a
// sha1 over the page id, the open dialogs, drawers and menus, the sorted
// identities of the listed candidates (kind, block id, and text when it is
// known text) and the sorted top-level state keys with their value types. It
// holds no values: typing a different title keeps the shape, opening a modal
// changes it. Listed candidates are those left after the static exclusions,
// before the within-walk rule, so taking an action never changes the shape by
// itself.
function computeShape({ pageId, layers = [], candidates = [], stateShape = [], knownText }) {
  const identities = candidates
    .map((candidate) => {
      const text = candidate.target?.text;
      const knownTextPart = typeof text === 'string' && knownText?.has(text) ? text : '';
      return [candidate.kind, candidate.target?.blockId ?? '', knownTextPart].join('\u0000');
    })
    .sort();
  const state = [...stateShape].map(([key, valueType]) => `${key}:${valueType}`).sort();
  const hash = crypto.createHash('sha1');
  hash.update(JSON.stringify({ pageId, layers: [...layers].sort(), identities, state }));
  return hash.digest('hex').slice(0, 8);
}

export default computeShape;
