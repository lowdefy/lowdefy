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

import React from 'react';
import { Tooltip } from 'antd';
import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';

const TooltipBlock = ({ blockId, content, properties, methods }) => (
  <Tooltip
    id={blockId}
    title={renderHtml({ html: properties.title, methods })}
    overlayStyle={methods.makeCssClass(properties.overlayStyle, true)}
    arrowPointAtCenter={properties.arrowPointAtCenter}
    autoAdjustOverflow={properties.autoAdjustOverflow}
    color={properties.color}
    defaultVisible={properties.defaultVisible}
    destroyTooltipOnHide={properties.destroyTooltipOnHide}
    mouseEnterDelay={properties.mouseEnterDelay}
    mouseLeaveDelay={properties.mouseLeaveDelay}
    placement={properties.placement}
    trigger={properties.trigger ?? 'hover'}
    zIndex={properties.zIndex}
    onVisibleChange={() => methods.triggerEvent({ name: 'onVisibleChange' })}
  >
    {content.content && content.content()}
    {
      '' // required by antd to wrap element in span tag.
    }
  </Tooltip>
);

TooltipBlock.defaultProps = blockDefaultProps;
TooltipBlock.meta = {
  category: 'container',
  icons: [],
  styles: ['blocks/Tooltip/style.less'],
};

export default TooltipBlock;
