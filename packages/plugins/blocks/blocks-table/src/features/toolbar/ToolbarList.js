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

import React from 'react';
import { Button, Select } from 'antd';

import ColumnTitle from './ColumnTitle.js';
import moveItem from './moveItem.js';
import ToolbarIcon from './ToolbarIcon.js';

// An ordered list of columns (sort levels, group levels) with reorder and remove buttons, a slot
// for per-entry controls and a picker that appends a column. `onChange` receives the new keys.
function ToolbarList({ addLabel, api, available, emptyText, keys, name, onChange, renderExtra }) {
  const { columnsByKey } = api.config;
  return (
    <div className="lf-table-toolbar-list" data-lf-toolbar-list={name}>
      {keys.length === 0 ? <div className="lf-table-toolbar-list-empty">{emptyText}</div> : null}
      {keys.map((key, index) => (
        <div className="lf-table-toolbar-list-item" data-key={key} key={key}>
          <span className="lf-table-toolbar-list-title">
            <ColumnTitle api={api} column={columnsByKey.get(key)} />
          </span>
          {renderExtra ? renderExtra({ key, index }) : null}
          <Button
            aria-label="Move up"
            data-lf-action="up"
            disabled={index === 0}
            icon={<ToolbarIcon api={api} name="chevron-up" />}
            onClick={() => onChange(moveItem({ items: keys, from: index, to: index - 1 }))}
            size="small"
            type="text"
          />
          <Button
            aria-label="Move down"
            data-lf-action="down"
            disabled={index === keys.length - 1}
            icon={<ToolbarIcon api={api} name="chevron-down" />}
            onClick={() => onChange(moveItem({ items: keys, from: index, to: index + 1 }))}
            size="small"
            type="text"
          />
          <Button
            aria-label="Remove"
            data-lf-action="remove"
            icon={<ToolbarIcon api={api} name="close" />}
            onClick={() => onChange(keys.filter((_, i) => i !== index))}
            size="small"
            type="text"
          />
        </div>
      ))}
      {available.length > 0 ? (
        <Select
          className="lf-table-toolbar-list-add"
          data-lf-toolbar-add={name}
          onChange={(key) => onChange([...keys, key])}
          options={available.map((column) => ({
            value: column.key,
            label: <ColumnTitle api={api} column={column} />,
          }))}
          placeholder={addLabel}
          size="small"
          value={null}
        />
      ) : null}
    </div>
  );
}

export default ToolbarList;
