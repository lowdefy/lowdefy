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

import React, { useEffect, useRef, useState } from 'react';
import { Button, Checkbox, Input } from 'antd';

import applyManagerRegions from './applyManagerRegions.js';
import buildManagerSequence from './buildManagerSequence.js';
import DragHandleIcon from './DragHandleIcon.js';
import getManagerEntries from './getManagerEntries.js';
import getPlainTitle from '../filtering/getPlainTitle.js';
import moveSequenceEntry from './moveSequenceEntry.js';
import sequenceToRegions from './sequenceToRegions.js';

const BOUNDARY_LABELS = {
  start: 'Pinned to start above',
  end: 'Pinned to end below',
};

function commitSequence({ api, sequence }) {
  const next = applyManagerRegions({ state: api.state, regions: sequenceToRegions(sequence) });
  api.updateSlice('columnOrder', () => next.columnOrder);
  api.updateSlice('columnPinning', () => next.columnPinning);
}

function setVisible({ api, key, visible }) {
  api.updateSlice('columnVisibility', (visibility) => ({ ...visibility, [key]: visible }));
}

// The column manager list. Visible columns show in table order with the two pinned boundaries
// between them; drag a handle (or press Alt+ArrowUp / Alt+ArrowDown on it) to move a column or a
// boundary. Each drop, checkbox or reset is one `columns` change. Searching filters the list and
// turns reordering off, since positions in a filtered list are ambiguous.
function ColumnManager({ api }) {
  const [search, setSearch] = useState('');
  const [drag, setDrag] = useState(null);
  const [drop, setDrop] = useState(null);
  const focusAfterMove = useRef(null);
  const listRef = useRef(null);

  const columnsByKey = new Map(api.config.columns.map((column) => [column.key, column]));
  const entries = getManagerEntries({ state: api.state });
  const sequence = buildManagerSequence(entries);
  const visibleCount = entries.start.length + entries.center.length + entries.end.length;
  const term = search.trim().toLowerCase();
  const searching = term !== '';
  const matches = (key) => {
    const column = columnsByKey.get(key);
    return (
      getPlainTitle(column).toLowerCase().includes(term) || column.key.toLowerCase().includes(term)
    );
  };

  useEffect(() => {
    if (focusAfterMove.current === null) return;
    const handle = listRef.current?.querySelector(
      `[data-drag-id="${CSS.escape(focusAfterMove.current)}"]`
    );
    focusAfterMove.current = null;
    handle?.focus();
  });

  function move({ from, to }) {
    const next = moveSequenceEntry({ sequence, from, to });
    if (next !== sequence) commitSequence({ api, sequence: next });
  }

  function onHandleKeyDown(event, index) {
    if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
    event.preventDefault();
    const to = event.key === 'ArrowUp' ? index - 1 : index + 2;
    if (to < 0 || to > sequence.length) return;
    focusAfterMove.current = sequence[index].id;
    move({ from: index, to });
  }

  function onDragOver(event, index) {
    if (drag === null) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2;
    const position = after ? index + 1 : index;
    if (drop !== position) setDrop(position);
  }

  function onDrop(event) {
    event.preventDefault();
    if (drag !== null && drop !== null) move({ from: drag, to: drop });
    setDrag(null);
    setDrop(null);
  }

  function renderHandle({ entry, index, label }) {
    return (
      <button
        aria-label={`Move ${label}`}
        className="lf-table-manager-handle"
        data-drag-id={entry.id}
        draggable
        onDragEnd={() => {
          setDrag(null);
          setDrop(null);
        }}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', entry.id);
          setDrag(index);
        }}
        onKeyDown={(event) => onHandleKeyDown(event, index)}
        type="button"
      >
        <DragHandleIcon />
      </button>
    );
  }

  function dropSide(index) {
    if (drop === index) return 'before';
    if (drop === index + 1 && index === sequence.length - 1) return 'after';
    return undefined;
  }

  function renderVisible(entry, index) {
    if (entry.boundary) {
      if (searching) return null;
      return (
        <div
          className="lf-table-manager-boundary"
          data-boundary={entry.boundary}
          data-lf-manager-boundary=""
          key={entry.id}
          data-drop={dropSide(index)}
          onDragOver={(event) => onDragOver(event, index)}
          onDrop={onDrop}
        >
          {renderHandle({ entry, index, label: `${entry.boundary} pinned boundary` })}
          <span className="lf-table-manager-boundary-label">{BOUNDARY_LABELS[entry.boundary]}</span>
        </div>
      );
    }
    if (searching && !matches(entry.key)) return null;
    const column = columnsByKey.get(entry.key);
    const title = getPlainTitle(column);
    return (
      <div
        className="lf-table-manager-item"
        data-col-key={entry.key}
        data-lf-manager-item=""
        data-visible=""
        key={entry.id}
        data-drop={dropSide(index)}
        onDragOver={(event) => onDragOver(event, index)}
        onDrop={onDrop}
      >
        {searching ? null : renderHandle({ entry, index, label: title })}
        <Checkbox
          checked
          disabled={visibleCount <= 1}
          onChange={() => setVisible({ api, key: entry.key, visible: false })}
        >
          {title}
        </Checkbox>
      </div>
    );
  }

  const hidden = entries.hidden.filter((key) => !searching || matches(key));

  return (
    <div
      className="lf-table-column-manager"
      data-lf-column-manager=""
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        api.actions.closeColumnManager();
      }}
    >
      <div className="lf-table-overlay-title">Columns</div>
      <Input
        allowClear
        aria-label="Search columns"
        autoFocus
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search columns"
        size="small"
        value={search}
      />
      <div className="lf-table-manager-list" ref={listRef}>
        {sequence.map(renderVisible)}
        {hidden.length ? <div className="lf-table-manager-heading">Hidden</div> : null}
        {hidden.map((key) => (
          <div
            className="lf-table-manager-item"
            data-col-key={key}
            data-lf-manager-item=""
            key={`hidden:${key}`}
          >
            <span className="lf-table-manager-handle-spacer" />
            <Checkbox checked={false} onChange={() => setVisible({ api, key, visible: true })}>
              {getPlainTitle(columnsByKey.get(key))}
            </Checkbox>
          </div>
        ))}
      </div>
      <div className="lf-table-overlay-footer">
        <Button onClick={() => api.actions.resetColumns()} size="small">
          Reset to default
        </Button>
      </div>
    </div>
  );
}

export default ColumnManager;
