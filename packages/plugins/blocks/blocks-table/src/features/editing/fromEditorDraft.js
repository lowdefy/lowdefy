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

import toDateValue from './toDateValue.js';

// The cell value an editor's draft commits (the inverse of toEditorDraft).
function fromEditorDraft({ spec, draft, previous }) {
  switch (spec.kind) {
    case 'text':
      return type.isNone(draft) ? '' : String(draft);
    case 'number':
      if (type.isNone(draft) || draft === '') return null;
      if (spec.type === 'percent') return Math.round((Number(draft) / 100) * 1e10) / 1e10;
      return Number(draft);
    case 'date':
    case 'datetime':
      return toDateValue({ date: draft, kind: spec.kind, previous });
    case 'boolean':
      return draft === true;
    case 'select':
      return type.isNone(draft) ? null : draft;
    case 'multiSelect':
      return type.isArray(draft) ? draft : [];
    case 'rating':
      return type.isNone(draft) ? null : Number(draft);
    default:
      return draft;
  }
}

export default fromEditorDraft;
