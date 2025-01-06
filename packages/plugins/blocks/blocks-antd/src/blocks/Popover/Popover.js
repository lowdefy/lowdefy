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

import React, { useState } from 'react';
import { blockDefaultProps } from '@lowdefy/block-utils';
import { Popover } from 'antd';

const PopoverBlock = ({ blockId, content, methods, properties }) => {
  const [elementId] = useState((0 | (Math.random() * 9e2)) + 1e2);
  return (
    <Popover
      id={blockId}
      {...properties}
      content={content.popover && content.popover()}
      onOpenChange={() => methods.triggerEvent({ name: 'onOpenChange' })}
      getPopupContainer={() => document.getElementById(`${blockId}_${elementId}_popup`)}
    >
      {content.content && content.content()}
      <div id={`${blockId}_${elementId}_popup`} />
    </Popover>
  );
};

PopoverBlock.defaultProps = blockDefaultProps;
PopoverBlock.meta = {
  category: 'container',
  icons: [],
  styles: ['blocks/Popover/style.less'],
};

export default PopoverBlock;
