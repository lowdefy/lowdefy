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
import { Dropdown, Modal } from 'antd';

import ToolbarIcon from './ToolbarIcon.js';

// The active tab's menu: the app's `viewMenu` items (firing onViewMenu) or Delete view. An item
// with `confirm` asks first. Its trigger stops the click so the tab bar does not handle it.
function ViewTabMenu({ api, view }) {
  const [confirming, setConfirming] = useState(null);
  const menuItems = api.views.menuItems(view);
  if (menuItems.length === 0) return null;
  const items = menuItems.map(({ key, label, danger, disabled }) => ({
    key,
    label,
    danger,
    disabled,
  }));
  function onClick({ key, domEvent }) {
    domEvent?.stopPropagation();
    const item = menuItems.find((entry) => entry.key === key);
    if (item?.confirm) {
      setConfirming(item);
      return;
    }
    api.views.selectMenuItem({ key, view });
  }
  return (
    <>
      <ViewMenuTrigger api={api} items={items} onClick={onClick} />
      {confirming ? (
        // The dialog renders in a portal, but React events still bubble to the tab, whose key and
        // focus handlers would take Enter and focus away from the dialog.
        <span
          onClick={stopPropagation}
          onFocus={stopPropagation}
          onKeyDown={stopPropagation}
          onMouseDown={stopPropagation}
        >
          <Modal
            okButtonProps={{ danger: confirming.danger, 'data-lf-view-menu-confirm': '' }}
            okText={confirming.label}
            onCancel={() => setConfirming(null)}
            onOk={() => {
              setConfirming(null);
              api.views.selectMenuItem({ key: confirming.key, view });
            }}
            open
            title={confirming.label}
            width={420}
          >
            <p data-lf-view-menu-confirm-message="">
              {confirming.confirm === true ? 'Are you sure?' : confirming.confirm}
            </p>
          </Modal>
        </span>
      ) : null}
    </>
  );
}

function stopPropagation(event) {
  event.stopPropagation();
}

function ViewMenuTrigger({ api, items, onClick }) {
  return (
    <Dropdown menu={{ items, onClick }} placement="bottomLeft" trigger={['click']}>
      <button
        aria-label="View options"
        className="lf-table-view-menu"
        data-lf-view-menu=""
        onClick={(event) => event.stopPropagation()}
        type="button"
      >
        <ToolbarIcon api={api} name="more" />
      </button>
    </Dropdown>
  );
}

export default ViewTabMenu;
