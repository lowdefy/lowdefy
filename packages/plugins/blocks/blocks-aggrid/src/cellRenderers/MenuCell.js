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
import { Button, Dropdown } from 'antd';
import { type } from '@lowdefy/helpers';
import { renderHtml } from '@lowdefy/block-utils';
import NullCell from './NullCell.js';
import { resolvePath } from './resolveFieldRefs.js';

function resolveField(literalKey, fieldKey, item, data) {
  if (type.isString(item?.[fieldKey])) return resolvePath(item[fieldKey], data);
  return item?.[literalKey];
}

function MenuCell(params) {
  const { value, data, cellConfig, methods, components } = params;
  const Icon = components?.Icon;
  const items = type.isArray(cellConfig?.items) ? cellConfig.items : [];

  // Resolve every item against the row before antd sees it, and drop hidden items
  // rather than disabling them — so a row whose every item is hidden renders no
  // trigger at all, instead of a button that opens an empty menu.
  const resolved = items
    .map((item, idx) => {
      if (!type.isObject(item) || !type.isString(item.eventName)) return null;
      if (resolveField('hidden', 'hiddenField', item, data) === true) return null;
      return {
        idx,
        item,
        title: resolveField('title', 'titleField', item, data),
        iconConfig: resolveField('icon', 'iconField', item, data),
        disabled: resolveField('disabled', 'disabledField', item, data) === true,
      };
    })
    .filter(Boolean);

  if (resolved.length === 0) return <NullCell />;

  const menuItems = resolved.map(({ idx, item, title, iconConfig, disabled }) => ({
    // Keyed by the item's index in the AUTHORED array, not by its position in the
    // resolved one, so onClick can find it back after hidden items have shifted
    // everything.
    key: String(idx),
    label: type.isNone(title) ? undefined : renderHtml({ html: String(title), methods }),
    icon:
      iconConfig && Icon ? (
        <Icon blockId={`menucell_${idx}_icon`} events={{}} properties={iconConfig} />
      ) : undefined,
    disabled,
    danger: item.danger === true,
  }));

  function onClick({ key, domEvent }) {
    domEvent?.stopPropagation?.();
    const entry = resolved.find((r) => String(r.idx) === key);
    if (!entry) return;
    methods?.triggerEvent?.({
      name: entry.item.eventName,
      event: {
        row: data,
        value,
        item: { eventName: entry.item.eventName, title: entry.title },
        itemIndex: entry.idx,
      },
    });
  }

  // The trigger is icon-only: a row menu is an affordance, not a labelled action.
  const triggerIcon = Icon ? (
    <Icon
      blockId="menucell_trigger_icon"
      events={{}}
      properties={cellConfig.icon ?? 'AiOutlineMore'}
    />
  ) : undefined;

  return (
    // stopPropagation lives on a wrapper, not on the Button: antd's Dropdown clones its
    // child to attach the trigger handler, so an onClick of ours on the Button is the
    // one that gets shadowed. It keeps a stray click from bubbling within React;
    // ag-grid uses native listeners, so a grid that also wires onCellClick /
    // onRowClick may still see the click — the same as the buttons cell.
    <div onClick={(e) => e.stopPropagation()}>
      <Dropdown
        menu={{ items: menuItems, onClick }}
        trigger={['click']}
        placement={cellConfig.placement ?? 'bottomRight'}
        // Render the menu to the body so it is not clipped by the cell, which hides
        // its overflow — the same reason SelectorCell does it.
        getPopupContainer={() => document.body}
      >
        {/* `type` and `shape` are fixed rather than configurable: both keys are already
            taken at cell level (the renderer name, and the avatar shape), so exposing
            them here would collide. These match the ButtonsCell defaults, which is what
            a ⋯ sitting beside other cell buttons wants. */}
        <Button size="small" type="text" shape="square" icon={triggerIcon} />
      </Dropdown>
    </div>
  );
}

export default MenuCell;
