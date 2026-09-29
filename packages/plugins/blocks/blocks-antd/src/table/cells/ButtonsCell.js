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
import { Button, Tooltip } from 'antd';
import { renderHtml } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import resolveControlField from '../resolveControlField.js';
import resolveControlFlag from '../resolveControlFlag.js';
import EmptyCell from './EmptyCell.js';

// An icon-only button still says what it does: its title becomes the tooltip
// unless the config names one. A button with a visible title gets a tooltip
// only when asked.
function getTooltip({ button, showTitle, title }) {
  if (type.isString(button.tooltip)) return button.tooltip;
  if (!showTitle && !type.isNone(title)) return String(title);
  return null;
}

// Row buttons, key-compatible with the ag-grid buttons cell. With
// `showOn: hover` they stay hidden until the row is hovered or focused (see
// tableCells.css for the row contract).
function ButtonsCell({ value, row, rowKey, column, methods, components, onEvent }) {
  const { cell, compiled } = column;
  const buttons = type.isArray(cell.buttons) ? cell.buttons : [];
  const { Icon } = components;
  const rendered = buttons.map((button, index) => {
    if (!type.isObject(button) || !type.isString(button.eventName)) return null;
    const conditions = compiled.buttons[index];
    const hidden = resolveControlFlag({
      control: button,
      name: 'hidden',
      compiled: conditions.hidden,
      row,
      value,
    });
    if (hidden === true) return null;
    const disabled = resolveControlFlag({
      control: button,
      name: 'disabled',
      compiled: conditions.disabled,
      row,
      value,
    });
    const title = resolveControlField({ control: button, name: 'title', row });
    const icon = resolveControlField({ control: button, name: 'icon', row });
    const showTitle = button.hideTitle !== true && !type.isNone(title);
    function onClick(event) {
      event.stopPropagation();
      onEvent({
        name: button.eventName,
        event: {
          row,
          rowKey,
          value,
          button: { eventName: button.eventName, title },
          buttonIndex: index,
        },
      });
    }
    const element = (
      <Button
        key={index}
        size={button.size ?? 'small'}
        type={button.type}
        variant={button.variant}
        color={button.color}
        shape={button.shape ?? 'square'}
        danger={button.danger === true}
        ghost={button.ghost === true}
        disabled={disabled}
        icon={
          type.isNone(icon) ? undefined : (
            <Icon blockId={`${column.key}_${index}_icon`} events={{}} properties={icon} />
          )
        }
        iconPlacement={button.iconPlacement}
        aria-label={showTitle || type.isNone(title) ? undefined : String(title)}
        onClick={onClick}
      >
        {showTitle && renderHtml({ html: String(title), methods })}
      </Button>
    );
    const tooltip = getTooltip({ button, showTitle, title });
    if (tooltip === null) return element;
    return (
      <Tooltip key={index} title={tooltip} mouseEnterDelay={0.3}>
        {element}
      </Tooltip>
    );
  });
  if (rendered.every((element) => element === null)) return <EmptyCell />;
  const className =
    cell.showOn === 'hover' ? 'lf-table-actions lf-table-actions-hover' : 'lf-table-actions';
  return <span className={className}>{rendered}</span>;
}

export default ButtonsCell;
