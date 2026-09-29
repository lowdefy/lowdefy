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

import LazyColumnPicker from './LazyColumnPicker.js';

const RUN_MODES = [
  { mode: 'all', label: 'All rows' },
  { mode: 'empty', label: 'Empty cells' },
  { mode: 'errors', label: 'Errors' },
  { mode: 'stale', label: 'Stale cells' },
];

function runItem({ column, api }) {
  return {
    key: 'run',
    label: 'Run',
    section: 'column',
    children: RUN_MODES.map(({ mode, label }) => ({
      key: mode,
      label,
      onClick: () => api.actions.runColumn({ key: column.key, mode }),
    })),
  };
}

function manageItems({ column, api }) {
  const { events } = api;
  const { key } = column;
  const items = [];
  if (events.onColumnUpdate) {
    items.push(
      { key: 'rename', label: 'Rename', onClick: () => api.actions.startRename({ key }) },
      { key: 'edit', label: 'Edit column', onClick: () => api.actions.openColumnPicker({ key }) }
    );
  }
  if (events.onColumnAdd) {
    items.push(
      { key: 'duplicate', label: 'Duplicate', onClick: () => api.actions.duplicateColumn({ key }) },
      {
        key: 'insertLeft',
        label: 'Insert left',
        onClick: () => api.actions.openColumnPicker({ position: { before: key } }),
      },
      {
        key: 'insertRight',
        label: 'Insert right',
        onClick: () => api.actions.openColumnPicker({ position: { after: key } }),
      }
    );
  }
  if (events.onColumnDelete) {
    items.push({
      key: 'delete',
      label: 'Delete column',
      danger: true,
      onClick: () => api.actions.requestDelete({ key }),
    });
  }
  return items.map((item) => ({ ...item, section: 'column' }));
}

// The enrichment items of a column's header menu (section `column`): Run (all, empty cells,
// errors, stale cells) on enrichment and ai columns when the table has onColumnRun, and for
// user-defined columns (`userDefined: true`) Rename, Edit, Duplicate, Insert left / right and
// Delete, each shown when the table has the event it fires.
function getEnrichmentMenuItems({ column, api }) {
  const items = [];
  const runnable = column.kind === 'enrichment' || column.kind === 'ai';
  if (runnable && api.events.onColumnRun) items.push(runItem({ column, api }));
  if (column.userDefined) {
    // Edit and Insert open the picker: start loading it while the menu is open.
    LazyColumnPicker.preload();
    items.push(...manageItems({ column, api }));
  }
  return items;
}

export default getEnrichmentMenuItems;
