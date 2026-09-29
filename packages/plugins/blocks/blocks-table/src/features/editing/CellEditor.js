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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DatePicker, Input, InputNumber, Rate, Select, Switch, Tooltip } from 'antd';

import SelectedTag from './SelectedTag.js';
import toEditorDraft from './toEditorDraft.js';
import toSelectOptions from './toSelectOptions.js';

const POPUP_CLASS = 'lf-table-editor-popup';
const POPUP_KINDS = new Set(['date', 'datetime', 'select', 'multiSelect']);
const FOCUS_SELECTOR = 'input, [role="switch"], [role="radiogroup"], .ant-rate';

function filterOption(search, option) {
  return String(option?.text ?? '')
    .toLowerCase()
    .includes(search.toLowerCase());
}

// The count of picked values that do not fit the tags editor, as the cell shows it.
function renderMoreTags(omitted) {
  return <span className="lf-table-more">+{omitted.length}</span>;
}

// A select column without options has nothing to pick from: it edits as text.
function getKind(spec) {
  if (spec.kind === 'select' && !spec.options) return 'text';
  return spec.kind;
}

function focusControl({ wrapper, seeded }) {
  const control = wrapper?.querySelector(FOCUS_SELECTOR);
  if (!control) return;
  control.focus({ preventScroll: true });
  if (control.tagName !== 'INPUT' || control.type === 'hidden') return;
  if (seeded) {
    const end = control.value.length;
    control.setSelectionRange?.(end, end);
  } else {
    control.select?.();
  }
}

// The one mounted cell editor (loaded on first edit). The control comes from the column type
// (D8): Input, InputNumber, DatePicker, Switch, Select (single or multiple) or Rate. Keys are the
// editor's: Enter commits, Tab commits and moves on, Esc cancels. While a picker or dropdown is
// open, Enter and Esc belong to it (pick, close). Picking in a select, date picker, switch or
// rating commits at once. Leaving the editor (a click elsewhere) commits. A failed `validate`
// keeps the editor open with the message under it.
function CellEditor({ api, session }) {
  const { editing } = api;
  const spec = editing.specs.get(session.colKey);
  const kind = getKind(spec);
  const [row] = useState(() => api.table.getRow(session.rowId, true)?.original);
  const [initial] = useState(() => {
    const saved = editing.layer.getDraft(session.id);
    if (saved.has) return saved.value;
    const col = api.layout.byKey.get(session.colKey);
    return toEditorDraft({
      spec: kind === spec.kind ? spec : { ...spec, kind },
      value: col.accessor(row),
      seed: session.seed,
    });
  });
  const [draft, setDraftState] = useState(initial);
  const [search, setSearch] = useState(() =>
    kind === 'select' || kind === 'multiSelect' ? session.seed ?? '' : ''
  );
  const wrapperRef = useRef(null);
  const seedPending = useRef(session.seed !== undefined);
  const popupOpen = useRef(POPUP_KINDS.has(kind));
  const openAtKeyDown = useRef(false);
  const options = useMemo(
    () => toSelectOptions({ components: api.components, spec, row }),
    [spec, row]
  );

  function setDraft(value) {
    setDraftState(value);
    editing.layer.setDraft(session.id, value);
  }

  function commitValue(value) {
    setDraft(value);
    api.actions.commitEdit({});
  }

  useEffect(() => {
    // A printable key that opened the editor is already the edit.
    if (kind !== 'select' && kind !== 'multiSelect' && session.seed !== undefined) {
      editing.layer.setDraft(session.id, initial);
    }
    focusControl({ wrapper: wrapperRef.current, seeded: session.seed !== undefined });
  }, []);

  useEffect(() => {
    if (session.error) focusControl({ wrapper: wrapperRef.current, seeded: true });
  }, [session.error]);

  function handleSearch(value) {
    // The select clears its search as it opens; the typed character that opened it must stay.
    if (value === '' && seedPending.current) {
      seedPending.current = false;
      return;
    }
    seedPending.current = false;
    setSearch(value);
  }

  function handleKeyDownCapture(event) {
    openAtKeyDown.current = popupOpen.current;
    // Tab is the table's, before a select can treat it as picking the active option.
    if (event.key !== 'Tab') return;
    event.preventDefault();
    event.stopPropagation();
    api.actions.commitEdit({ move: event.shiftKey ? -1 : 1 });
  }

  function handleKeyDown(event) {
    // Keys typed into the editor never reach the grid's navigation.
    event.stopPropagation();
    if (event.key === 'Escape') {
      if (openAtKeyDown.current) return;
      event.preventDefault();
      api.actions.cancelEdit();
      return;
    }
    if (event.key === 'Enter') {
      if (openAtKeyDown.current) return;
      event.preventDefault();
      api.actions.commitEdit({});
    }
  }

  function handleBlur() {
    const { id } = session;
    // Focus moves after blur: wait for it to land before deciding the editor was left.
    setTimeout(() => {
      if (editing.layer?.getSession()?.id !== id) return;
      const active = document.activeElement;
      if (wrapperRef.current?.contains(active)) return;
      if (active?.closest?.(`.${POPUP_CLASS}`)) return;
      api.actions.commitEdit({});
    }, 0);
  }

  const size = api.rowHeight < 40 ? 'small' : 'middle';
  const status = session.error ? 'error' : undefined;
  const onOpenChange = (open) => {
    popupOpen.current = open;
  };

  let control;
  switch (kind) {
    case 'number':
      control = (
        <InputNumber
          onChange={(value) => setDraft(value)}
          size={size}
          status={status}
          style={{ width: '100%' }}
          suffix={spec.type === 'percent' ? '%' : undefined}
          value={draft}
        />
      );
      break;
    case 'date':
    case 'datetime':
      control = (
        <DatePicker
          classNames={{ popup: { root: POPUP_CLASS } }}
          defaultOpen
          onChange={(date) => commitValue(date)}
          onOpenChange={onOpenChange}
          showTime={kind === 'datetime'}
          size={size}
          status={status}
          style={{ width: '100%' }}
          value={draft}
        />
      );
      break;
    case 'boolean':
      control = (
        <Switch
          checked={draft === true}
          onChange={(checked) => commitValue(checked)}
          size={size === 'small' ? 'small' : 'default'}
        />
      );
      break;
    case 'select':
    case 'multiSelect': {
      const multiple = kind === 'multiSelect';
      let mode;
      if (multiple) mode = spec.options ? 'multiple' : 'tags';
      control = (
        <Select
          allowClear
          classNames={{ popup: { root: POPUP_CLASS } }}
          defaultOpen
          maxTagCount="responsive"
          mode={mode}
          onChange={(value) => {
            if (multiple) {
              setDraft(value ?? []);
            } else {
              commitValue(value ?? null);
            }
          }}
          onOpenChange={onOpenChange}
          options={options}
          showSearch={{ filterOption, onSearch: handleSearch, searchValue: search }}
          size={size}
          status={status}
          style={{ width: '100%' }}
          maxTagPlaceholder={renderMoreTags}
          tagRender={mode === 'multiple' ? SelectedTag : undefined}
          value={draft}
        />
      );
      break;
    }
    case 'rating':
      control = <Rate count={spec.max} onChange={(value) => commitValue(value)} value={draft} />;
      break;
    default:
      control = (
        <Input
          autoComplete="off"
          onChange={(event) => setDraft(event.target.value)}
          size={size}
          status={status}
          value={draft ?? ''}
        />
      );
  }

  return (
    <Tooltip open={Boolean(session.error)} placement="bottom" title={session.error}>
      <div
        className="lf-table-editor"
        data-lf-control=""
        data-lf-editor=""
        data-lf-editor-error={session.error ?? undefined}
        data-lf-editor-kind={kind}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onKeyDownCapture={handleKeyDownCapture}
        ref={wrapperRef}
      >
        {control}
      </div>
    </Tooltip>
  );
}

export default CellEditor;
