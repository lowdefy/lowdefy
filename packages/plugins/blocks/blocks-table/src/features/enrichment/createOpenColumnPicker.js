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
import COLUMN_KINDS from '@lowdefy/blocks-antd/table/columnKinds.js';

import createDraft from './createDraft.js';
import draftFromColumn from './draftFromColumn.js';
import getRawColumn from './getRawColumn.js';
import setUi from './setUi.js';

// Action and block method `openColumnPicker({ key?, position?, kind?, provider? })`: opens the
// add-column picker, or with `key` the edit picker for that column prefilled from its config.
// `position` is where a new column goes, `{ before: key }` or `{ after: key }` (insert left or
// right), or null for the end; it is passed on in onColumnAdd.
function createOpenColumnPicker(api) {
  return function openColumnPicker({ key, position = null, kind, provider } = {}) {
    const { enrichment: config } = api.config;
    if (type.isString(key)) {
      const column = api.config.columnsByKey.get(key);
      if (!column) return false;
      const draft = draftFromColumn({ raw: getRawColumn({ api, key }), column });
      setUi({
        api,
        patch: {
          picker: {
            mode: 'edit',
            key,
            position: null,
            kinds: [draft.kind],
            draft,
            status: 'idle',
            error: null,
          },
        },
      });
      return true;
    }
    const kinds = config.addColumn?.kinds ?? Object.keys(COLUMN_KINDS);
    const firstKind = kinds.includes(kind) ? kind : kinds[0];
    setUi({
      api,
      patch: {
        picker: {
          mode: 'add',
          key: null,
          position,
          kinds,
          draft: createDraft({ kind: firstKind, provider: provider ?? null }),
          status: 'idle',
          error: null,
        },
      },
    });
    return true;
  };
}

export default createOpenColumnPicker;
