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
import isEmptyValue from '@lowdefy/blocks-antd/table/isEmptyValue.js';

function buildNumber({ key, min, max }) {
  const hasMin = !isEmptyValue(min);
  const hasMax = !isEmptyValue(max);
  if (hasMin && hasMax) return { key, op: 'between', value: [min, max] };
  if (hasMin) return { key, op: 'gte', value: min };
  if (hasMax) return { key, op: 'lte', value: max };
  return null;
}

function buildDate({ key, state }) {
  if (state.mode === 'relative') return { key, op: 'within', value: state.relative };
  if (isEmptyValue(state.from) && isEmptyValue(state.to)) return null;
  // An open end stays null: `between` treats a missing bound as unbounded.
  return { key, op: 'between', value: [state.from ?? null, state.to ?? null] };
}

// The condition the simple column filter writes for its state, or null for "no filter".
function buildColumnFilter({ kind, key, state }) {
  switch (kind) {
    case 'options':
      return state.selected.length ? { key, op: 'in', value: state.selected } : null;
    case 'text':
      if (state.op === 'empty' || state.op === 'notEmpty') return { key, op: state.op };
      return isEmptyValue(state.value) ? null : { key, op: state.op, value: state.value };
    case 'number':
      return buildNumber({ key, min: state.min, max: state.max });
    case 'date':
      return buildDate({ key, state });
    default:
      if (!type.isString(state.choice) || state.choice === 'any') return null;
      return { key, op: state.choice };
  }
}

export default buildColumnFilter;
