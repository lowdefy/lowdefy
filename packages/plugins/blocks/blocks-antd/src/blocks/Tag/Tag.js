/*
  Copyright 2020-2023 Lowdefy, Inc

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
import { Tag } from 'antd';
import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

const TagBlock = ({ blockId, events, components: { Icon }, methods, onClick, properties }) => {
  const additionalProps = {};
  if (properties.icon) {
    additionalProps.icon = (
      <Icon blockId={`${blockId}_icon`} events={events} properties={properties.icon} />
    );
  }
  if (onClick || events.onClick) {
    additionalProps.onClick = onClick || (() => methods.triggerEvent({ name: 'onClick' }));
  }

  return (
    <Tag
      closable={properties.closable}
      color={properties.color}
      {...additionalProps}
      onClose={() => methods.triggerEvent({ name: 'onClose' })}
      className={methods.makeCssClass(properties.style)}
    >
      {renderHtml({
        html: type.isNone(properties.title) ? blockId : properties.title,
        methods,
      })}
    </Tag>
  );
};

TagBlock.defaultProps = blockDefaultProps;
TagBlock.meta = {
  category: 'display',
  icons: [],
  styles: ['blocks/Tag/style.less'],
};

export default TagBlock;
