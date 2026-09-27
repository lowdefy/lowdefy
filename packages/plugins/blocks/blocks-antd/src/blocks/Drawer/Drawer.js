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

import React, { useEffect, useRef, useState } from 'react';
import { Drawer } from 'antd';
import { get, type } from '@lowdefy/helpers';

import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';
import getMask from '../getMask.js';
import withTheme from '../withTheme.js';

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
    event: { drawerOpen, open: drawerOpen },
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

// antd resolves the named sizes for `size`, but not for `defaultSize`.
const namedDrawerSizes = {
  default: 378,
  large: 736,
};

// antd v6 replaced the separate `width`/`height` Drawer props with a single `size` prop
// whose meaning depends on `placement`: width for left/right, height for top/bottom.
const getDrawerSize = ({ placement, size, width, height }) => {
  if (!type.isNone(size)) {
    return size;
  }
  if (placement === 'top' || placement === 'bottom') {
    return height;
  }
  return width;
};

const DrawerBlock = ({
  blockId,
  classNames = {},
  content,
  properties,
  methods,
  rename,
  onClose,
  styles = {},
}) => {
  const [openState, setOpen] = useState(false);
  const resizedSize = useRef();
  useEffect(() => {
    methods.registerMethod(get(rename, 'methods.toggleOpen', { default: 'toggleOpen' }), () =>
      handleToggle({ openState, methods, rename, setOpen })
    );
    methods.registerMethod(get(rename, 'methods.setOpen', { default: 'setOpen' }), ({ open }) =>
      setOpenState({ open: Boolean(open), methods, rename, setOpen })
    );
  });

  const drawerSize = getDrawerSize({
    placement: properties.placement,
    size: properties.size,
    width: properties.width,
    height: properties.height,
  });
  // A controlled `size` would pin a resizable drawer, so it becomes the starting size instead.
  const sizeProps = properties.resizable
    ? {
        defaultSize: namedDrawerSizes[drawerSize] ?? drawerSize,
        maxSize: properties.maxSize,
        resizable: {
          onResizeStart: () => {
            resizedSize.current = undefined;
          },
          onResize: (size) => {
            resizedSize.current = size;
          },
          // antd calls onResizeEnd on every mouseup of the handle, so a click without a
          // drag would report no size. Only a drag that moved the edge is a resize.
          onResizeEnd: () => {
            if (type.isNone(resizedSize.current)) {
              return;
            }
            methods.triggerEvent({
              name: get(rename, 'events.onResizeEnd', { default: 'onResizeEnd' }),
              event: { size: resizedSize.current },
            });
          },
        },
      }
    : { size: drawerSize };

  return (
    <Drawer
      id={blockId}
      closable={properties.closable}
      destroyOnHidden={properties.destroyOnHidden}
      extra={content.extra && content.extra()}
      focusable={properties.focusable}
      footer={content.footer && content.footer()}
      forceRender={properties.forceRender}
      getContainer={properties.getContainer}
      loading={properties.loading}
      mask={getMask({ mask: properties.mask, maskClosable: properties.maskClosable })}
      title={renderHtml({ html: properties.title, methods })}
      open={openState}
      {...sizeProps}
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
      className={classNames.element}
      classNames={{
        header: classNames.header,
        title: classNames.title,
        body: classNames.body,
        footer: classNames.footer,
        mask: classNames.mask,
        wrapper: classNames.wrapper,
        // antd v6 renamed the Drawer content area from `content` to `section`.
        section: classNames.content,
      }}
      style={styles.element}
      styles={{
        header: styles.header,
        title: styles.title,
        body: styles.body,
        footer: styles.footer,
        mask: styles.mask,
        wrapper: styles.wrapper,
        section: styles.content,
      }}
    >
      {content.content && content.content()}
    </Drawer>
  );
};

export default withTheme('Drawer', withBlockDefaults(DrawerBlock));
