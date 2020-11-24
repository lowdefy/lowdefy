/*
  Copyright 2020 Lowdefy, Inc

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
import { blockDefaultProps } from '@lowdefy/block-tools';
import { mergeObjects, get } from '@lowdefy/helpers';

import Button from '../Button/Button';
import Drawer from '../Drawer/Drawer';
import Menu from '../Menu/Menu';

const MobileMenu = ({ blockId, methods, menus, pageId, properties, rename }) => {
  const [openState, setOpen] = useState(false);
  useEffect(() => {
    methods.registerMethod(get(rename, 'methods.toggleOpen', { default: 'toggleOpen' }), () => {
      methods._setOpen({ open: !openState });
      setOpen(!openState);
    });
    methods.registerMethod(get(rename, 'methods.setOpen', { default: 'setOpen' }), ({ open }) => {
      methods._setOpen({ open });
      setOpen(open);
    });
  });
  return (
    <div id={blockId}>
      <Button
        blockId={`${blockId}_button`}
        properties={{
          title: '',
          type: 'primary',
          icon: {
            name: openState ? 'MenuUnfoldOutlined' : 'MenuFoldOutlined',
          },
          ...(properties.toggleMenuButton || {}),
        }}
        methods={methods}
        onClick={() => methods[get(rename, 'methods.toggleOpen', { default: 'toggleOpen' })]()}
        rename={{
          actions: {
            onClick: 'onToggleDrawer',
          },
        }}
      />
      <Drawer
        blockId={`${blockId}_drawer`}
        properties={mergeObjects([
          {
            bodyStyle: { padding: '3.1em 0 0 0', backgroundColor: properties.backgroundColor },
          },
          properties.drawer,
        ])}
        rename={{
          actions: {
            onToggle: 'onToggleDrawer',
          },
          methods: {
            setOpen: '_setOpen',
            toggleOpen: '_toggleOpen',
          },
        }}
        methods={methods}
        onClose={() => methods[get(rename, 'methods.toggleOpen', { default: 'toggleOpen' })]()}
        content={{
          content: () => (
            <>
              <Menu
                blockId={`${blockId}_menu`}
                methods={methods}
                menus={menus}
                pageId={pageId}
                properties={{
                  collapsed: false,
                  theme: 'light',
                  ...(mergeObjects(properties, { style: { marginTop: 24 } }) || {}),
                  mode: 'inline',
                }}
                rename={{
                  actions: {
                    onClick: 'onMenuItemClick',
                    onSelect: 'onMenuItemSelect',
                  },
                }}
              />
            </>
          ),
        }}
      />
    </div>
  );
};

MobileMenu.defaultProps = blockDefaultProps;

export default MobileMenu;
