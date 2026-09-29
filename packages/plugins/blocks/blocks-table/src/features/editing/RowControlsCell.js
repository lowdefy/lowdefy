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

import React, { useSyncExternalStore } from 'react';

function GripIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" height="14" viewBox="0 0 10 16" width="9">
      <circle cx="2.5" cy="3" r="1.5" />
      <circle cx="7.5" cy="3" r="1.5" />
      <circle cx="2.5" cy="8" r="1.5" />
      <circle cx="7.5" cy="8" r="1.5" />
      <circle cx="2.5" cy="13" r="1.5" />
      <circle cx="7.5" cy="13" r="1.5" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="14"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

// The leading row controls: the drag handle (`rowDrag`, Table and TableInput) and TableInput's
// delete button (`rowActions.delete`). Plain DOM like every tier-0 cell; the delegated handlers
// do the work. Only the handle's disabled state is live (a sorted, filtered or grouped table
// cannot reorder; the tooltip says why), through a store, so a sort re-renders these cells and
// not the rows.
function RowControlsCell({ api }) {
  const { options, reorderBlock } = api.editing;
  const blocked = useSyncExternalStore(reorderBlock.subscribe, reorderBlock.get);
  return (
    <span className="lf-table-row-controls">
      {options.rowDrag ? (
        <span
          aria-disabled={blocked ? true : undefined}
          aria-label="Drag to reorder"
          className="lf-table-drag-handle"
          data-lf-drag-handle=""
          role="button"
          title={blocked ?? 'Drag to reorder (Alt+Shift+Arrow keys)'}
        >
          <GripIcon />
        </span>
      ) : null}
      {options.deleteButton ? (
        <button
          aria-label="Delete row"
          className="lf-table-row-delete"
          data-lf-row-delete=""
          tabIndex={-1}
          title="Delete row"
          type="button"
        >
          <DeleteIcon />
        </button>
      ) : null}
    </span>
  );
}

export default RowControlsCell;
