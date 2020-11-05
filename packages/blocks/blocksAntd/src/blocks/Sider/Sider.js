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

import React from 'react';
import { Layout } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-tools';

const Sider = Layout.Sider;

const SiderBlock = ({ blockId, properties, content, methods }) => {
  const additionalProps = {};
  if (properties.collapsed === true || properties.collapsed === false) {
    additionalProps.collapsed = properties.collapsed;
  }
  return (
    <Sider
      id={blockId}
      className={`${methods.makeCssClass([
        { overflow: 'auto', backgroundColor: properties.color && `${properties.color} !important` },
        properties.style,
      ])} hide-on-print`}
      breakpoint={properties.breakpoint}
      collapsed={properties.collapsed}
      collapsedWidth={properties.collapsedWidth}
      collapsible={properties.collapsible}
      defaultCollapsed={properties.defaultCollapsed}
      reverseArrow={properties.reverseArrow}
      theme={properties.theme}
      trigger={properties.trigger}
      width={properties.width}
      onCollapse={() => methods.callAction({ action: 'onCollapse' })}
      onBreakpoint={() => methods.callAction({ action: 'onBreakpoint' })}
      zeroWidthTriggerStyle={methods.makeCssClass(properties.zeroWidthTriggerStyle, {
        styleObjectOnly: true,
        react: true,
      })}
      {...additionalProps}
    >
      {content.content && content.content()}
    </Sider>
  );
};

SiderBlock.defaultProps = blockDefaultProps;

export default SiderBlock;
