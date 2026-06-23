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

import React, { useMemo } from 'react';
import { ConfigProvider, Select, Tag } from 'antd';
import { renderHtml } from '@lowdefy/block-utils';
import { get, type } from '@lowdefy/helpers';
import getSelectorOptions from '@lowdefy/blocks-antd/getSelectorOptions.js';
import getSelectedIndex from '@lowdefy/blocks-antd/getSelectedIndex.js';
import getContrastTextColor from '@lowdefy/blocks-antd/getContrastTextColor.js';
import getOptionColorStyle from '@lowdefy/blocks-antd/getOptionColorStyle.js';

import NullCell from './NullCell.js';

const Option = Select.Option;

// Maps an option index (the antd value) back to the real option value, the same way the
// Selector / MultipleSelector blocks do.
function indexToValue(options, index) {
  const opt = options[index];
  return type.isPrimitive(opt) ? opt : opt.value;
}

// Keep the dropdown open when clicking a tag's close icon.
function preventMouseDown(e) {
  e.preventDefault();
  e.stopPropagation();
}

function SelectorCell(params) {
  const { value, data, cellConfig, methods } = params;
  const multiple = cellConfig?.type === 'multipleSelector';

  // Reuse the block option-normalisation util. Static options only (no per-cell `setData`),
  // so call the pure helper directly rather than the block's `useSelectorOptions` hook.
  const options = useMemo(() => getSelectorOptions({ properties: cellConfig ?? {} }), [cellConfig]);

  if (!type.isArray(options) || options.length === 0) return <NullCell />;

  // Display grid is one-way: drive the displayed value from the cell value. The chosen value is
  // written back into ag-grid's own row node (not the Lowdefy block value) for immediate feedback
  // that survives re-renders; the app persists via the event chain.
  const selected = getSelectedIndex(value, options, { properties: cellConfig, multiple });

  // Variant handling mirrors the Selector / MultipleSelector blocks: `solid` is not a real antd
  // Select variant — render an outlined frame and (for single-select) fill it via ConfigProvider;
  // `bordered: false` maps to the borderless variant.
  const isSolid = cellConfig.variant === 'solid';
  let antdVariant = cellConfig.variant;
  if (isSolid) antdVariant = 'outlined';
  if (cellConfig.bordered === false) antdVariant = 'borderless';
  const isOutline = antdVariant === 'outlined';

  // Single-select: tint the whole control with the selected option's colour.
  const selectedOption = multiple || type.isNone(selected) ? undefined : options[selected];
  const selectedColor = type.isObject(selectedOption) ? selectedOption.color : undefined;
  let selectTheme;
  if (selectedColor) {
    const token = { colorPrimary: selectedColor, colorBorder: selectedColor };
    if (isSolid) token.colorBgContainer = selectedColor;
    selectTheme = { token };
  }

  function onChange(index) {
    let newValue;
    if (multiple) {
      newValue = (type.isArray(index) ? index : []).map((i) => indexToValue(options, i));
    } else {
      newValue = type.isNone(index) ? undefined : indexToValue(options, index);
    }
    const colId = params.column?.getColId?.();
    if (params.node && colId) params.node.setDataValue(colId, newValue);
    if (type.isString(cellConfig.eventName)) {
      methods?.triggerEvent?.({
        name: cellConfig.eventName,
        event: { row: data, value, newValue },
      });
    }
  }

  // Colour the selected label (single-select), following the block: solid fill → contrast text.
  function labelRender(labelProps) {
    const opt = options[labelProps.value];
    const color = type.isPrimitive(opt) ? undefined : opt?.color;
    if (type.isNone(color)) return labelProps.label;
    const textColor = isSolid ? getContrastTextColor(color) ?? '#fff' : color;
    return <span style={{ color: textColor }}>{labelProps.label}</span>;
  }

  // Colour the selected tags (multi-select), following the block: a hex colour gets an explicit
  // solid/outlined style (dark-mode safe), an antd preset name is handed to antd's Tag `color`.
  function tagRender(tagProps) {
    const { label, value: idx, closable, onClose } = tagProps;
    const opt = options[idx];
    const color = type.isPrimitive(opt) ? undefined : opt?.color;
    const contrast = type.isNone(color) ? undefined : getContrastTextColor(color);
    const colorStyle = contrast ? getOptionColorStyle({ color, isOutline }) : {};
    return (
      <Tag
        closable={closable}
        onClose={onClose}
        onMouseDown={preventMouseDown}
        color={contrast || type.isNone(color) ? undefined : color}
        style={{ marginInlineEnd: 4, ...colorStyle }}
      >
        {label}
      </Tag>
    );
  }

  const hasColouredOptions = options.some((opt) => !type.isPrimitive(opt) && opt.color);

  return (
    // The wrapper must fill the cell — the antd cell layout is flex, so without an explicit width
    // the Select shrinks to its content instead of spanning the column. Synthetic stopPropagation
    // keeps a stray click from bubbling within React; ag-grid uses native listeners, so a grid that
    // also wires onCellClick / onRowClick may still see selector clicks (same as the buttons cell).
    <div style={{ width: '100%' }} onClick={(e) => e.stopPropagation()}>
      <ConfigProvider theme={selectTheme}>
        <Select
          style={{ width: '100%', minWidth: 'min(150px, 100%)' }}
          size={cellConfig.size ?? 'small'}
          variant={antdVariant}
          mode={multiple ? 'multiple' : undefined}
          value={selected}
          onChange={onChange}
          allowClear={cellConfig.allowClear !== false}
          showSearch={get(cellConfig, 'showSearch', { default: true })}
          showArrow={cellConfig.showArrow}
          autoFocus={cellConfig.autoFocus}
          maxTagCount={cellConfig.maxTagCount}
          autoClearSearchValue={cellConfig.autoClearSearchValue}
          placeholder={cellConfig.placeholder}
          disabled={cellConfig.disabled === true}
          labelRender={multiple ? undefined : labelRender}
          tagRender={multiple && hasColouredOptions ? tagRender : undefined}
          // Render the dropdown to the body so it is not clipped by the ag-grid cell.
          getPopupContainer={() => document.body}
          filterOption={(input, option) =>
            (option.filterstring || option.children.props.html || '')
              .toLowerCase()
              .indexOf(input.toLowerCase()) >= 0
          }
        >
          {options.map((opt, i) =>
            type.isPrimitive(opt) ? (
              <Option key={i} value={`${i}`}>
                {renderHtml({ html: `${opt}`, methods })}
              </Option>
            ) : (
              <Option
                key={i}
                value={`${i}`}
                disabled={opt.disabled}
                filterstring={opt.filterString}
                style={{ ...opt.style, ...(opt.color ? { color: opt.color } : {}) }}
              >
                {type.isNone(opt.label)
                  ? renderHtml({ html: `${opt.value}`, methods })
                  : renderHtml({ html: opt.label, methods })}
              </Option>
            )
          )}
        </Select>
      </ConfigProvider>
    </div>
  );
}

export default SelectorCell;
