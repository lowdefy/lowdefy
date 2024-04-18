/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { Drawer } from 'antd';
import { get } from '@lowdefy/helpers';
import { blockDefaultProps } from '@lowdefy/block-utils';

const triggerSetOpen = ({ state, setOpen, methods, rename }) => {
  if (!state) {
    methods.triggerEvent({ name: get(rename, 'events.onClose', { default: 'onClose' }) });
  }
  if (state) {
    methods.triggerEvent({ name: get(rename, 'events.onOpen', { default: 'onOpen' }) });
  }
  methods.triggerEvent({ name: get(rename, 'events.onToggle', { default: 'onToggle' }) });
  setOpen(state);
};

const DrawerBlock = ({ blockId, content, properties, methods, rename, onClose }) => {
  const [openState, setOpen] = useState(false);
  useEffect(() => {
    methods.registerMethod(get(rename, 'methods.toggleOpen', { default: 'toggleOpen' }), () =>
      triggerSetOpen({ state: !openState, setOpen, methods, rename })
    );
    methods.registerMethod(get(rename, 'methods.setOpen', { default: 'setOpen' }), ({ open }) =>
      triggerSetOpen({ state: !!open, setOpen, methods, rename })
    );
  });
  return (
    <Drawer
      id={blockId}
      closable={properties.closable}
      extra={content.extra && content.extra()}
      getContainer={properties.getContainer}
      mask={properties.mask}
      maskClosable={properties.maskClosable}
      title={properties.title}
      visible={openState}
      width={properties.width}
      height={properties.height}
      zIndex={properties.zIndex}
      placement={properties.placement}
      keyboard={properties.keyboard}
      onClose={
        onClose ||
        (async () => {
          const response = await methods.triggerEvent({ name: 'onClose' });
          if (response.success === false) return;
          if (response.bounced !== true) {
            triggerSetOpen({ state: false, setOpen, methods, rename });
          }
        })
      }
      drawerStyle={methods.makeCssClass(properties.drawerStyle, true)}
      headerStyle={methods.makeCssClass(properties.headerStyle, true)}
      bodyStyle={methods.makeCssClass(properties.bodyStyle, true)}
      maskStyle={methods.makeCssClass(properties.maskStyle, true)}
      contentWrapperStyle={methods.makeCssClass(properties.contentWrapperStyle, true)}
    >
      {content.content && content.content()}
    </Drawer>
  );
};

DrawerBlock.defaultProps = blockDefaultProps;
DrawerBlock.meta = {
  category: 'container',
  icons: [],
  styles: ['blocks/Drawer/style.less'],
};

export default DrawerBlock;
