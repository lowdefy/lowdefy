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

import React, { useState } from 'react';
import { blockDefaultProps } from '@lowdefy/block-tools';
import { mergeObjects } from '@lowdefy/helpers';
import Button from '../Button/Button';
import Drawer from '../Drawer/Drawer';
import Menu from '../Menu/Menu';
import UserAvatar from '../UserAvatar/UserAvatar';

const MobileMenu = ({ blockId, methods, menus, pageId, properties, user }) => {
  const [open, setOpen] = useState(false);
  return (
    <div id={blockId}>
      <Button
        properties={{
          title: '',
          type: 'primary',
          icon: { name: open ? 'MenuUnfoldOutlined' : 'MenuFoldOutlined' },
          ...(properties.toggleMenuButton || {}),
        }}
        methods={methods}
        onClick={() => {
          setOpen(!open);
          methods.callAction({ action: 'toggleMenu', hideLoading: true });
        }}
      />
      <Drawer
        properties={mergeObjects([
          {
            open,
            bodyStyle: { padding: 0 },
          },
          properties.drawer,
        ])}
        methods={{
          ...methods,
          callAction: (op) => {
            if (op.action === 'onClose') setOpen(!open);
            methods.callAction(op);
          },
        }}
        content={{
          content: () => (
            <>
              <UserAvatar
                blockId={`${blockId}_UserAvatar`}
                methods={methods}
                properties={mergeObjects([
                  { showName: 'right', theme: 'light', style: { padding: 16 } },
                  properties.userAvatar,
                ])}
                user={user}
              />
              <Menu
                methods={methods}
                menus={menus}
                pageId={pageId}
                properties={{
                  collapsed: false,
                  mode: 'inline',
                  theme: 'light',
                  ...(mergeObjects(properties, { style: { marginTop: 24 } }) || {}),
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
