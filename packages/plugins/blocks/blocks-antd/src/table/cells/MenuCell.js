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
import { Dropdown } from 'antd';
import { renderHtml } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import resolveControlField from '../resolveControlField.js';
import resolveControlFlag from '../resolveControlFlag.js';
import EmptyCell from './EmptyCell.js';

// A row menu, key-compatible with the ag-grid menu cell. The cell renders a
// plain trigger button; the antd Dropdown mounts on the first click, so a
// table of menus costs one button per row until a menu is opened.
function MenuCell({ value, row, rowKey, column, methods, components, onEvent }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const { cell, compiled } = column;
  const { Icon } = components;
  const items = type.isArray(cell.items) ? cell.items : [];

  // Hidden items are dropped rather than disabled, so a row whose items are
  // all hidden shows no trigger instead of one that opens an empty menu.
  const resolved = [];
  items.forEach((item, index) => {
    if (!type.isObject(item) || !type.isString(item.eventName)) return;
    const conditions = compiled.items[index];
    const hidden = resolveControlFlag({
      control: item,
      name: 'hidden',
      compiled: conditions.hidden,
      row,
      value,
    });
    if (hidden === true) return;
    resolved.push({
      index,
      item,
      title: resolveControlField({ control: item, name: 'title', row }),
      icon: resolveControlField({ control: item, name: 'icon', row }),
      disabled:
        resolveControlFlag({
          control: item,
          name: 'disabled',
          compiled: conditions.disabled,
          row,
          value,
        }) === true,
    });
  });
  if (resolved.length === 0) return <EmptyCell />;

  const trigger = (
    <button
      type="button"
      className="lf-table-menu-trigger"
      aria-label={cell.title ?? 'Actions'}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={
        mounted
          ? undefined
          : () => {
              setMounted(true);
              setOpen(true);
            }
      }
    >
      <Icon
        blockId={`${column.key}_menu_icon`}
        events={{}}
        properties={cell.icon ?? 'more-vertical'}
      />
    </button>
  );

  function onClick({ key, domEvent }) {
    domEvent.stopPropagation();
    // Items are keyed by their index in the authored list, so a click finds
    // its item even after hidden items have shifted the rest.
    const entry = resolved.find((candidate) => String(candidate.index) === key);
    onEvent({
      name: entry.item.eventName,
      event: {
        row,
        rowKey,
        value,
        item: { eventName: entry.item.eventName, title: entry.title },
        itemIndex: entry.index,
      },
    });
  }

  return (
    // The wrapper keeps the trigger click and menu item clicks, which bubble
    // through React from the portal, away from the row.
    <span className="lf-table-menu" onClick={(event) => event.stopPropagation()}>
      {mounted ? (
        <Dropdown
          open={open}
          onOpenChange={(nextOpen) => setOpen(nextOpen)}
          trigger={['click']}
          placement={cell.placement ?? 'bottomRight'}
          getPopupContainer={() => document.body}
          menu={{
            items: resolved.map(({ index, item, title, icon, disabled }) => ({
              key: String(index),
              label: type.isNone(title) ? undefined : renderHtml({ html: String(title), methods }),
              icon: type.isNone(icon) ? undefined : (
                <Icon blockId={`${column.key}_${index}_icon`} events={{}} properties={icon} />
              ),
              disabled,
              danger: item.danger === true,
            })),
            onClick,
          }}
        >
          {trigger}
        </Dropdown>
      ) : (
        trigger
      )}
    </span>
  );
}

export default MenuCell;
