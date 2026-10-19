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

import getRawRowKey from './getRawRowKey.js';
import getSelectAllExcept from './getSelectAllExcept.js';

function selectionToValue({ state, api }) {
  const selection = state.rowSelection;
  const rowsById = api.table.getCoreRowModel().rowsById;
  // An all selection describes itself, so it can be resolved on the server from the value alone:
  // every row the filter and search match, except `except`.
  if (state.selectionMode === 'all') {
    return {
      selected: {
        all: true,
        except: getSelectAllExcept({ api }),
        filter: state.selectionView?.filter ?? null,
        search: state.selectionView?.search ?? null,
      },
    };
  }
  const preserve = api.config.rowSelection?.preserve === true;
  const selected = [];
  Object.keys(selection).forEach((id) => {
    if (selection[id] !== true) return;
    if (!preserve && !rowsById[id]) return;
    selected.push(getRawRowKey({ id, api }));
  });
  return { selected };
}

export default selectionToValue;
