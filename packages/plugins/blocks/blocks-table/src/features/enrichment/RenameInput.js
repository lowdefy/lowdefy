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

import React, { useEffect, useRef } from 'react';
import htmlToText from '@lowdefy/blocks-antd/table/htmlToText.js';

import setUi from './setUi.js';

function stop(event) {
  event.stopPropagation();
}

// Header part: the inline rename of a user-defined column (header menu Rename), an input over
// the header's title. Enter or leaving it saves (onColumnUpdate), Esc cancels. While the event
// runs it shows saving; a failure keeps it open, marked invalid, with the message as its title.
// Its pointer and key events stop at the input, so they never sort, drag or navigate.
function RenameInput({ api, col }) {
  const renaming = api.enrichment?.ui?.renaming;
  const inputRef = useRef(null);
  const active = renaming?.key === col.key;
  useEffect(() => {
    if (!active) return;
    inputRef.current?.focus({ preventScroll: true });
    inputRef.current?.select();
  }, [active]);
  if (!active) return null;
  const saving = renaming.status === 'saving';
  const submit = () => api.actions.submitRename({ key: col.key, title: inputRef.current.value });
  function onKeyDown(event) {
    event.stopPropagation();
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setUi({ api, patch: { renaming: null } });
      event.currentTarget.closest('[data-lf-header]')?.focus({ preventScroll: true });
    }
  }
  return (
    <input
      aria-invalid={renaming.error ? true : undefined}
      aria-label="Column title"
      className="lf-enrich-rename"
      data-lf-enrich-rename=""
      data-saving={saving ? '' : undefined}
      defaultValue={htmlToText(col.column.title)}
      onBlur={() => {
        if (!saving && !renaming.error) submit();
      }}
      onClick={stop}
      onDoubleClick={stop}
      onKeyDown={onKeyDown}
      onPointerDown={stop}
      readOnly={saving}
      ref={inputRef}
      title={renaming.error ?? undefined}
    />
  );
}

export default RenameInput;
