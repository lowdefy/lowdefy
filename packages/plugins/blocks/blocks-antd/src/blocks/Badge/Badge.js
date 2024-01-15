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
import { type } from '@lowdefy/helpers';
import { Badge } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-utils';

const BadgeBlock = ({ blockId, events, content, components: { Icon }, properties }) => (
  <Badge
    id={blockId}
    color={properties.color}
    dot={properties.dot}
    offset={properties.offset}
    overflowCount={type.isNumber(properties.overflowCount) ? properties.overflowCount : 100}
    showZero={properties.showZero}
    size={properties.size}
    status={properties.status}
    text={properties.text}
    title={properties.title}
    count={
      (properties.icon && (
        <Icon blockId={`${blockId}_icon`} events={events} properties={properties.icon} />
      )) ||
      properties.count
    }
  >
    {content.content && content.content()}
  </Badge>
);

BadgeBlock.defaultProps = blockDefaultProps;
BadgeBlock.meta = {
  category: 'container',
  icons: [],
  styles: ['blocks/Badge/style.less'],
};

export default BadgeBlock;
