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

import React, { useRef } from 'react';
import { Input } from 'antd';

import insertAtCursor from './insertAtCursor.js';

// A template or prompt editor with a chip per column: a chip inserts `{{ key }}` at the caret,
// the reference formula and ai columns resolve to that column's value.
function TemplateEditor({ columns, name, onChange, placeholder, value }) {
  const wrapperRef = useRef(null);
  function insert(key) {
    const element = wrapperRef.current?.querySelector('textarea');
    const next = insertAtCursor({ element, value, text: `{{ ${key} }}` });
    onChange(next.value);
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(next.caret, next.caret);
    });
  }
  return (
    <div className="lf-enrich-template" data-lf-picker-template={name} ref={wrapperRef}>
      <Input.TextArea
        autoSize={{ minRows: 3, maxRows: 10 }}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      <div aria-label="Insert a column" className="lf-enrich-chips" role="group">
        {columns.map((column) => (
          <button
            className="lf-enrich-chip"
            data-lf-picker-chip={column.key}
            key={column.key}
            onClick={() => insert(column.key)}
            type="button"
          >
            {column.title}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TemplateEditor;
