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

const handleClose = async ({ methods, rename, setOpen }) => {
  const response = await methods.triggerEvent({
    name: get(rename, 'events.onClose', { default: 'onClose' }),
  });
  if (response.success === false || response.bounced === true) {
    return;
  }
  setOpen(false);
};

const handleOpen = ({ methods, rename, setOpen }) => {
  methods.triggerEvent({ name: get(rename, 'events.onOpen', { default: 'onOpen' }) });
  setOpen(true);
};

const handleToggle = ({ openState, methods, rename, setOpen }) => {
  methods.triggerEvent({ name: get(rename, 'events.onToggle', { default: 'onToggle' }) });
  if (openState) {
    handleClose({ methods, rename, setOpen });
  } else {
    handleOpen({ methods, rename, setOpen });
  }
};

const handleAfterOpenChange = ({ drawerOpen, methods, rename }) => {
  methods.triggerEvent({
    name: get(rename, 'events.afterOpenChange', { default: 'afterOpenChange' }),
    event: { drawerOpen },
  });
  if (!drawerOpen) {
    methods.triggerEvent({
      name: get(rename, 'events.afterClose', { default: 'afterClose' }),
    });
  }
};

const setOpenState = ({ open, methods, rename, setOpen }) => {
  if (open) {
    handleOpen({ methods, rename, setOpen });
  } else {
    handleClose({ methods, rename, setOpen });
  }
};

const DrawerBlock = ({ blockId, content, properties, methods, rename, onClose }) => {
  const [openState, setOpen] = useState(false);
  useEffect(() => {
    methods.registerMethod(get(rename, 'methods.toggleOpen', { default: 'toggleOpen' }), () =>
      handleToggle({ openState, methods, rename, setOpen })
    );
    methods.registerMethod(get(rename, 'methods.setOpen', { default: 'setOpen' }), ({ open }) =>
      setOpenState({ open: Boolean(open), methods, rename, setOpen })
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
      open={openState}
      width={properties.width}
      height={properties.height}
      zIndex={properties.zIndex}
      placement={properties.placement}
      keyboard={properties.keyboard}
      onClose={
        onClose ||
        (() =>
          handleClose({
            methods,
            rename,
            setOpen,
          }))
      }
      afterOpenChange={(drawerOpen) => handleAfterOpenChange({ drawerOpen, methods, rename })}
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
