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

import { useEffect, useMemo, useRef, useState } from 'react';

import applyChanges from './applyChanges.js';
import applyMoveOverlay from './applyMoveOverlay.js';
import applyOverlay from './applyOverlay.js';
import createEditSpecs from './createEditSpecs.js';
import createUndoStack from './createUndoStack.js';
import createValueStore from './createValueStore.js';
import findInvalidCells from './findInvalidCells.js';
import getEditOptions from './getEditOptions.js';
import getKeyField from './getKeyField.js';
import pruneOverlay from './pruneOverlay.js';

const EMPTY_MAP = new Map();
const UNDO_LIMIT = 100;

function createEditingState() {
  const editing = {
    changeCache: new WeakMap(),
    changes: null,
    dataIndex: null,
    layer: null,
    pendingStart: null,
    reorderBlock: createValueStore(null),
    seenChanges: null,
    sources: new WeakMap(),
    undo: createUndoStack({ limit: UNDO_LIMIT }),
    warned: new Set(),
  };
  // The unchanged data rows by key (as a string), built on the first write after a data change.
  editing.getDataByKey = () => {
    if (editing.dataIndex?.data !== editing.data) {
      const map = new Map(editing.data.map((row) => [String(editing.getKey(row)), row]));
      editing.dataIndex = { data: editing.data, map };
    }
    return editing.dataIndex.map;
  };
  return editing;
}

// Rows the user changed in TableInput (updated or added); inline validation checks these only,
// since rows as they came from `data` are the app's, and a large table stays cheap to edit.
function getTouchedRows({ rows, changes, getKey }) {
  const touched = new Set([
    ...Object.keys(changes.updated),
    ...changes.added.map((entry) => String(entry.rowKey)),
  ]);
  if (touched.size === 0) return [];
  return rows.filter((row) => touched.has(String(getKey(row))));
}

// The editing feature's data hook (runs before TanStack sees the rows). It compiles the edit
// specs, and then per block:
// - Table: lays the optimistic overlays over `data` (cell edits and a row move that are saving,
//   or saved and not yet replaced by new data) and prunes them once `data` catches up.
// - TableInput: shows `data` with its value (the changeset) applied, and finds the touched cells
//   that fail inline validation.
// `data` is never written. The per-table editing state lives on `api.editing` for handlers,
// actions and the editing layer.
function useEditingData({ api, config, data, input, properties }) {
  const specs = useMemo(
    () =>
      createEditSpecs({
        columns: config.columns,
        rawColumns: properties.columns,
        defaultColumn: properties.defaultColumn,
      }),
    [config]
  );
  const options = getEditOptions({ input, properties });
  const { positionField } = options;
  const [overlay, setOverlay] = useState(EMPTY_MAP);
  const [moveOverlay, setMoveOverlay] = useState(null);
  const stateRef = useRef(null);
  if (stateRef.current === null) stateRef.current = createEditingState();
  const editing = stateRef.current;
  const { getKey } = config;

  const changes = input?.changes ?? null;
  if (changes !== editing.seenChanges) {
    editing.seenChanges = changes;
    editing.changes = changes;
  }
  // Only TableInput adds rows, so only it needs the key field (and the scan of `data` for it).
  const keyField = useMemo(
    () => (input ? getKeyField({ rowKey: properties.rowKey, rows: data }) : null),
    [Boolean(input), data, properties.rowKey]
  );

  const rows = useMemo(() => {
    if (changes) {
      return applyChanges({
        rows: data,
        changes,
        getKey,
        keyField,
        positionField,
        cache: editing.changeCache,
      });
    }
    const edited = applyOverlay({ rows: data, overlay, getKey, sources: editing.sources });
    return applyMoveOverlay({
      rows: edited,
      move: moveOverlay,
      data,
      getKey,
      positionField,
      sources: editing.sources,
    });
  }, [data, changes, overlay, moveOverlay, getKey, keyField, positionField]);

  const invalid = useMemo(() => {
    if (!changes) return EMPTY_MAP;
    return findInvalidCells({ rows: getTouchedRows({ rows, changes, getKey }), specs, getKey });
  }, [rows, changes, specs, getKey]);

  useEffect(() => {
    if (changes) return;
    setOverlay((previous) => pruneOverlay({ overlay: previous, rows: data, getKey }));
    setMoveOverlay((previous) => {
      if (!previous || previous.status === 'saving' || previous.source === data) return previous;
      return null;
    });
  }, [data]);

  const anyEditable = useMemo(() => [...specs.values()].some((spec) => spec.editable), [specs]);
  Object.assign(editing, {
    data,
    enabled: Boolean(input) || anyEditable || options.rowDrag,
    getKey,
    input: input ?? null,
    invalid,
    keyField,
    moveOverlay,
    options,
    overlay,
    setMoveOverlay,
    setOverlay,
    specs,
  });
  api.editing = editing;
  return rows;
}

export default useEditingData;
