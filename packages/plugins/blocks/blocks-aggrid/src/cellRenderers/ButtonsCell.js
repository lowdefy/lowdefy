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
import { Button, Space } from 'antd';
import { type } from '@lowdefy/helpers';
import { renderHtml } from '@lowdefy/block-utils';
import NullCell from './NullCell.js';
import { resolvePath } from './resolveFieldRefs.js';

function resolveField(literalKey, fieldKey, btn, data) {
  if (type.isString(btn?.[fieldKey])) return resolvePath(btn[fieldKey], data);
  return btn?.[literalKey];
}

function ButtonsCell(params) {
  const { value, data, cellConfig, methods, components } = params;
  const Icon = components?.Icon;
  const buttons = type.isArray(cellConfig?.buttons) ? cellConfig.buttons : [];
  if (buttons.length === 0) return <NullCell />;

  return (
    <Space size={4}>
      {buttons.map((btn, idx) => {
        if (!type.isObject(btn) || !type.isString(btn.event)) return null;
        if (resolveField('hidden', 'hiddenField', btn, data) === true) return null;

        const title = resolveField('title', 'titleField', btn, data);
        const iconConfig = resolveField('icon', 'iconField', btn, data);
        const disabled = resolveField('disabled', 'disabledField', btn, data) === true;

        function onClick(e) {
          e.stopPropagation();
          methods?.triggerEvent?.({
            name: btn.event,
            event: {
              row: data,
              value,
              button: { event: btn.event, title },
              buttonIndex: idx,
            },
          });
        }

        const iconNode =
          iconConfig && Icon ? (
            <Icon blockId={`btnscell_${idx}_icon`} events={{}} properties={iconConfig} />
          ) : undefined;

        const showTitle = btn.hideTitle !== true && !type.isNone(title);

        return (
          <Button
            key={idx}
            size={btn.size ?? 'small'}
            type={btn.type}
            variant={btn.variant}
            color={btn.color}
            shape={btn.shape ?? 'square'}
            danger={btn.danger === true}
            ghost={btn.ghost === true}
            disabled={disabled}
            icon={iconNode}
            onClick={onClick}
          >
            {showTitle && renderHtml({ html: String(title), methods })}
          </Button>
        );
      })}
    </Space>
  );
}

export default ButtonsCell;
