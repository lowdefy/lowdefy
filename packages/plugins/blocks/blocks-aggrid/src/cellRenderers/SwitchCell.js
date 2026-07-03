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
import { ConfigProvider, Switch } from 'antd';
import { serializer, type } from '@lowdefy/helpers';

function normaliseIcon(icon) {
  const copy = serializer.copy(icon);
  return type.isString(copy) ? { name: copy } : copy;
}

function SwitchCell(params) {
  const { value, data, cellConfig, methods, components } = params;
  const Icon = components?.Icon;

  function onChange(newValue) {
    const colId = params.column?.getColId?.();
    if (params.node && colId) params.node.setDataValue(colId, newValue);
    if (type.isString(cellConfig.eventName)) {
      methods?.triggerEvent?.({
        name: cellConfig.eventName,
        event: { row: data, value, newValue },
      });
    }
  }

  const checkedIcon = normaliseIcon(cellConfig.checkedIcon);
  const uncheckedIcon = normaliseIcon(cellConfig.uncheckedIcon);

  function children(text, icon, key) {
    if (!type.isNone(text)) return <span>{text}</span>;
    if (icon && Icon) return <Icon blockId={`switchcell_${key}`} events={{}} properties={icon} />;
    return undefined;
  }

  const switchEl = (
    <Switch
      checked={!!value}
      size={cellConfig.size ?? 'small'}
      disabled={cellConfig.disabled === true}
      autoFocus={cellConfig.autoFocus}
      checkedChildren={children(cellConfig.checkedText, checkedIcon, 'checked')}
      unCheckedChildren={children(cellConfig.uncheckedText, uncheckedIcon, 'unchecked')}
      onChange={onChange}
    />
  );

  return (
    // Synthetic stopPropagation keeps a stray click from bubbling within React (see SelectorCell).
    <div onClick={(e) => e.stopPropagation()}>
      {cellConfig.color ? (
        <ConfigProvider theme={{ components: { Switch: { colorPrimary: cellConfig.color } } }}>
          {switchEl}
        </ConfigProvider>
      ) : (
        switchEl
      )}
    </div>
  );
}

export default SwitchCell;
