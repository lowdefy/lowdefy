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

import React, { useState, useEffect } from 'react';
import { Input } from 'antd';
import { type } from '@lowdefy/helpers';

function TextInputCell(params) {
  const { value, data, cellConfig, methods } = params;

  // Keep the typed text local: firing the change event per keystroke would re-render the grid,
  // remount the cell and lose focus. Commit once on blur / Enter instead. Resync when the row
  // value changes externally (e.g. after the app persists).
  const [text, setText] = useState(value ?? '');
  useEffect(() => setText(value ?? ''), [value]);

  function commit() {
    if ((value ?? '') === text) return;
    const colId = params.column?.getColId?.();
    if (params.node && colId) params.node.setDataValue(colId, text);
    if (type.isString(cellConfig.eventName)) {
      methods?.triggerEvent?.({
        name: cellConfig.eventName,
        event: { row: data, value, newValue: text },
      });
    }
  }

  return (
    // Width fills the cell; synthetic stopPropagation keeps clicks from bubbling (see SelectorCell).
    <div style={{ width: '100%' }} onClick={(e) => e.stopPropagation()}>
      <Input
        style={{ width: '100%' }}
        size={cellConfig.size ?? 'small'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onPressEnter={commit}
        allowClear={cellConfig.allowClear}
        placeholder={cellConfig.placeholder}
        maxLength={cellConfig.maxLength}
        showCount={cellConfig.showCount}
        variant={cellConfig.bordered === false ? 'borderless' : cellConfig.variant}
        type={cellConfig.inputType}
        disabled={cellConfig.disabled === true}
      />
    </div>
  );
}

export default TextInputCell;
