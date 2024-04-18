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
import { blockDefaultProps } from '@lowdefy/block-utils';
import { get } from '@lowdefy/helpers';
import { Layout } from 'antd';

const Sider = Layout.Sider;

const triggerSetOpen = async ({ state, setOpen, methods, rename }) => {
  if (!state) {
    await methods.triggerEvent({ name: get(rename, 'events.onClose', { default: 'onClose' }) });
  }
  if (state) {
    await methods.triggerEvent({ name: get(rename, 'events.onOpen', { default: 'onOpen' }) });
  }
  setOpen(state);
};

const SiderBlock = ({ blockId, properties, content, methods, rename }) => {
  const [openState, setOpen] = useState(!properties.initialCollapsed);
  useEffect(() => {
    methods.registerMethod(get(rename, 'methods.toggleOpen', { default: 'toggleOpen' }), () =>
      triggerSetOpen({ state: !openState, setOpen, methods, rename })
    );
    methods.registerMethod(get(rename, 'methods.setOpen', { default: 'setOpen' }), ({ open }) =>
      triggerSetOpen({ state: !!open, setOpen, methods, rename })
    );
  });
  return (
    <Sider
      id={blockId}
      className={`${methods.makeCssClass([{ overflow: 'auto' }, properties.style])} hide-on-print`}
      breakpoint={properties.breakpoint}
      collapsed={!openState}
      collapsedWidth={properties.collapsedWidth}
      collapsible={properties.collapsible}
      reverseArrow={properties.reverseArrow}
      theme={properties.theme}
      width={properties.width}
      onBreakpoint={() => methods.triggerEvent({ name: 'onBreakpoint' })}
    >
      {content.content && content.content()}
    </Sider>
  );
};

SiderBlock.defaultProps = blockDefaultProps;
SiderBlock.meta = {
  category: 'container',
  icons: [],
  styles: ['blocks/Sider/style.less'],
};

export default SiderBlock;
