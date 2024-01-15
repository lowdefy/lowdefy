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
import { Avatar } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-utils';

const AvatarBlock = ({ blockId, events, components: { Icon }, methods, properties }) => (
  <Avatar
    id={blockId}
    alt={properties.alt}
    gap={properties.gap}
    shape={properties.shape}
    size={properties.size}
    src={properties.src}
    onClick={() => methods.triggerEvent({ name: 'onClick' })}
    className={methods.makeCssClass([
      {
        backgroundColor: !properties.src && properties.color,
        cursor: events.onClick && 'pointer',
      },
      properties.style,
    ])}
    icon={
      properties.icon && (
        <Icon blockId={`${blockId}_icon`} events={events} properties={properties.icon} />
      )
    }
  >
    {properties.content}
  </Avatar>
);

AvatarBlock.defaultProps = blockDefaultProps;
AvatarBlock.meta = {
  category: 'display',
  icons: [],
  styles: ['blocks/Avatar/style.less'],
};

export default AvatarBlock;
