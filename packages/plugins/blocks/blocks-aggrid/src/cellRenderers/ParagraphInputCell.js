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

import React, { useState } from 'react';
import { Typography } from 'antd';
import { type } from '@lowdefy/helpers';

const Paragraph = Typography.Paragraph;

function ParagraphInputCell(params) {
  const { value, data, cellConfig, methods } = params;
  const [editing, setEditing] = useState(false);

  function commit(newValue) {
    setEditing(false);
    if ((value ?? '') === newValue) return;
    const colId = params.column?.getColId?.();
    if (params.node && colId) params.node.setDataValue(colId, newValue);
    if (type.isString(cellConfig.eventName)) {
      methods?.triggerEvent?.({
        name: cellConfig.eventName,
        event: { row: data, value, newValue },
      });
    }
  }

  const editable =
    cellConfig.editable === false
      ? false
      : {
          editing,
          maxLength: cellConfig.maxLength,
          // Fit the editor to its content (one line for short text) so the row does not jump to a
          // tall, top-aligned textarea on edit. Caller can override.
          autoSize: cellConfig.autoSize ?? { minRows: 1, maxRows: 6 },
          tooltip: cellConfig.editTooltip,
          onStart: () => setEditing(true),
          onChange: commit,
        };

  return (
    // Width fills the cell so the inline edit textarea spans the column instead of shrinking to the
    // text. Synthetic stopPropagation keeps a stray click from bubbling within React (see SelectorCell).
    <div style={{ width: '100%' }} onClick={(e) => e.stopPropagation()}>
      <Paragraph
        style={{ marginBottom: 0, width: '100%' }}
        code={cellConfig.code}
        strong={cellConfig.strong}
        italic={cellConfig.italic}
        underline={cellConfig.underline}
        delete={cellConfig.delete}
        mark={cellConfig.mark}
        type={cellConfig.textType}
        copyable={cellConfig.copyable}
        ellipsis={cellConfig.ellipsis}
        disabled={cellConfig.disabled === true}
        editable={editable}
      >
        {type.isNone(value) ? '' : value.toString()}
      </Paragraph>
    </div>
  );
}

export default ParagraphInputCell;
